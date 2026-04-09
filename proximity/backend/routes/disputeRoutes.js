const express = require('express');
const { check, validationResult } = require('express-validator');
const Dispute = require('../models/Dispute');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { sendDisputeStatusEmail } = require('../utils/emailService');

const router = express.Router();

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.get('/', protect, async (req, res) => {
  try {
    const disputes = await Dispute.findByUserId(req.user._id);
    res.json({ success: true, count: disputes.length, disputes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const disputes = await Dispute.findAll();
    res.json({ success: true, count: disputes.length, disputes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/', protect, [
  check('bureau', 'Bureau must be Equifax, Experian, or TransUnion').isIn(['Equifax', 'Experian', 'TransUnion']),
  check('accountName', 'Account name is required').notEmpty(),
  check('reason', 'Reason must be at least 10 characters').isLength({ min: 10 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { bureau, accountName, accountNumber, reason } = req.body;
    const dispute = await Dispute.create({ userId: req.user._id, bureau, accountName, accountNumber, reason });
    res.status(201).json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  if (!uuidRegex.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid dispute ID' });
  }
  try {
    const { status, notes } = req.body;
    const dispute = await Dispute.updateById(req.params.id, { status, notes });
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const disputeOwner = await User.findById(dispute.userId);
    if (disputeOwner) {
      sendDisputeStatusEmail(disputeOwner, dispute).catch(err =>
        console.error('[Email] Dispute status email failed:', err.message)
      );
    }

    res.json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.delete('/:id', protect, adminOnly, async (req, res) => {
  if (!uuidRegex.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid dispute ID' });
  }
  try {
    const deleted = await Dispute.deleteById(req.params.id);
    if (!deleted) return res.status(404).json({ success: false, message: 'Dispute not found' });
    res.json({ success: true, message: 'Dispute deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

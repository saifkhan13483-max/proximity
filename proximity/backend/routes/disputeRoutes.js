const express = require('express');
const { check, validationResult } = require('express-validator');
const Dispute = require('../models/Dispute');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { sendDisputeStatusEmail } = require('../utils/emailService');

const router = express.Router();

router.get('/', protect, async (req, res) => {
  try {
    const disputes = await Dispute.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: disputes.length, disputes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/all', protect, adminOnly, async (req, res) => {
  try {
    const disputes = await Dispute.find().populate('userId', 'name email').sort({ createdAt: -1 });
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

    const userPlan = req.user.plan || 'none';
    if (userPlan === 'none') {
      return res.status(403).json({ success: false, message: 'You need an active plan to submit disputes. Please contact us to get started.' });
    }

    if (userPlan === 'basic') {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyCount = await Dispute.countDocuments({
        userId: req.user._id,
        createdAt: { $gte: startOfMonth }
      });
      if (monthlyCount >= 5) {
        return res.status(403).json({ success: false, message: 'You have reached the 5 dispute limit for the Basic plan this month. Upgrade to Standard or Premium for unlimited disputes.' });
      }
    }

    const dispute = new Dispute({ userId: req.user._id, bureau, accountName, accountNumber, reason });
    await dispute.save();
    res.status(201).json({ success: true, dispute });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id', protect, adminOnly, async (req, res) => {
  try {
    const { status, notes } = req.body;
    const dispute = await Dispute.findByIdAndUpdate(
      req.params.id,
      { status, notes, updatedAt: Date.now() },
      { new: true }
    );
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });

    const disputeOwner = await User.findById(dispute.userId).select('name email');
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
  try {
    const dispute = await Dispute.findByIdAndDelete(req.params.id);
    if (!dispute) return res.status(404).json({ success: false, message: 'Dispute not found' });
    res.json({ success: true, message: 'Dispute deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

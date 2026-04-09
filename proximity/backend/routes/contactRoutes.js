const express = require('express');
const { check, validationResult } = require('express-validator');
const ContactMessage = require('../models/ContactMessage');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');
const { sendAdminContactAlert } = require('../utils/emailService');

const router = express.Router();

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

router.post('/', [
  check('name', 'Name is required').notEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('message', 'Message must be at least 10 characters').isLength({ min: 10 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ success: false, errors: errors.array() });

  try {
    const { name, email, phone, message } = req.body;
    await ContactMessage.create({ name, email, phone, message });

    sendAdminContactAlert({ name, email, phone, message }).catch(err =>
      console.error('[Email] Admin contact alert failed:', err.message)
    );

    res.status(201).json({ success: true, message: 'Message sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/', protect, adminOnly, async (req, res) => {
  try {
    const messages = await ContactMessage.findAll();
    res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/:id/read', protect, adminOnly, async (req, res) => {
  if (!uuidRegex.test(req.params.id)) {
    return res.status(400).json({ success: false, message: 'Invalid message ID' });
  }
  try {
    const msg = await ContactMessage.markRead(req.params.id);
    if (!msg) return res.status(404).json({ success: false, message: 'Message not found' });
    res.json({ success: true, message: msg });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

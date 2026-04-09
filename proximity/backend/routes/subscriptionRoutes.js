const express = require('express');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const { adminOnly } = require('../middleware/adminMiddleware');

const router = express.Router();

router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('plan planStartDate advisorName advisorEmail advisorPhone creditScores identityAlerts coachingSessions');
    res.json({ success: true, subscription: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/assign/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { plan, advisorName, advisorEmail, advisorPhone } = req.body;
    const validPlans = ['none', 'basic', 'standard', 'premium'];
    if (plan && !validPlans.includes(plan)) {
      return res.status(400).json({ success: false, message: 'Invalid plan' });
    }

    const updateData = {};
    if (plan !== undefined) {
      updateData.plan = plan;
      if (plan !== 'none') {
        updateData.planStartDate = new Date();
      }
    }
    if (advisorName !== undefined) updateData.advisorName = advisorName;
    if (advisorEmail !== undefined) updateData.advisorEmail = advisorEmail;
    if (advisorPhone !== undefined) updateData.advisorPhone = advisorPhone;

    const user = await User.findByIdAndUpdate(req.params.userId, updateData, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/scores/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { score, bureau, note } = req.body;
    if (!score || score < 300 || score > 850) {
      return res.status(400).json({ success: false, message: 'Score must be between 300 and 850' });
    }
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.creditScores.push({ score, bureau: bureau || 'Overall', note, recordedAt: new Date() });
    await user.save();

    res.status(201).json({ success: true, creditScores: user.creditScores });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/alerts/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { type, description, severity } = req.body;
    if (!type || !description) {
      return res.status(400).json({ success: false, message: 'Type and description are required' });
    }
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.identityAlerts.push({ type, description, severity: severity || 'low' });
    await user.save();

    res.status(201).json({ success: true, identityAlerts: user.identityAlerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/alerts/:userId/:alertId/resolve', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const alert = user.identityAlerts.id(req.params.alertId);
    if (!alert) return res.status(404).json({ success: false, message: 'Alert not found' });

    alert.resolved = true;
    await user.save();

    res.json({ success: true, identityAlerts: user.identityAlerts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/coaching/:userId', protect, adminOnly, async (req, res) => {
  try {
    const { title, scheduledDate, notes } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.coachingSessions.push({ title, scheduledDate, notes });
    await user.save();

    res.status(201).json({ success: true, coachingSessions: user.coachingSessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.put('/coaching/:userId/:sessionId/complete', protect, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    const session = user.coachingSessions.id(req.params.sessionId);
    if (!session) return res.status(404).json({ success: false, message: 'Session not found' });

    session.completed = true;
    await user.save();

    res.json({ success: true, coachingSessions: user.coachingSessions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

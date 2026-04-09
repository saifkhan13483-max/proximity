const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  bureau: { type: String, enum: ['Equifax', 'Experian', 'TransUnion'], required: true },
  accountName: { type: String, required: true, trim: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Dispute', disputeSchema);

const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  bureau: { type: String, enum: ['Equifax', 'Experian', 'TransUnion'], required: true },
  accountName: { type: String, required: true, trim: true },
  accountNumber: { type: String, trim: true },
  reason: { type: String, required: true, minlength: 10, maxlength: 1000 },
  status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
  notes: { type: String, maxlength: 2000 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

disputeSchema.index({ userId: 1, createdAt: -1 });
disputeSchema.index({ status: 1 });
disputeSchema.index({ bureau: 1 });

disputeSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Dispute', disputeSchema);

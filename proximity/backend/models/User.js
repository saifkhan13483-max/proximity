const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const creditScoreEntrySchema = new mongoose.Schema({
  score: { type: Number, required: true, min: 300, max: 850 },
  bureau: { type: String, enum: ['Equifax', 'Experian', 'TransUnion', 'Overall'], default: 'Overall' },
  note: { type: String, maxlength: 500 },
  recordedAt: { type: Date, default: Date.now }
}, { _id: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 50 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6, select: false },
  role: { type: String, enum: ['client', 'admin'], default: 'client' },
  phone: { type: String, trim: true },
  avatar: { type: String },
  plan: { type: String, enum: ['none', 'basic', 'standard', 'premium'], default: 'none' },
  planStartDate: { type: Date },
  advisorName: { type: String, trim: true },
  advisorEmail: { type: String, trim: true, lowercase: true },
  advisorPhone: { type: String, trim: true },
  creditScores: [creditScoreEntrySchema],
  identityAlerts: [{
    type: { type: String },
    description: { type: String },
    severity: { type: String, enum: ['low', 'medium', 'high'], default: 'low' },
    createdAt: { type: Date, default: Date.now },
    resolved: { type: Boolean, default: false }
  }],
  coachingSessions: [{
    title: { type: String },
    scheduledDate: { type: Date },
    notes: { type: String },
    completed: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  createdAt: { type: Date, default: Date.now }
});

userSchema.index({ createdAt: -1 });

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);

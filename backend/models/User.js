// models/User.js
const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, select: false }, // hashed, not returned by default
    role:     { type: String, enum: ['Admin', 'Editor', 'Viewer'], default: 'Viewer' },
    team:     { type: String, default: '' },
    initials: { type: String, default: '' },
    color:    { type: String, default: '#3b82f6' },

    // Performance tracking
    reels:  { type: Number, default: 0 },
    shoots: { type: Number, default: 0 },
    edits:  { type: Number, default: 0 },
    score:  { type: Number, default: 0 },

    isActive:    { type: Boolean, default: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('User', UserSchema);

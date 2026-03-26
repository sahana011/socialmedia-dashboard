// models/Metric.js
const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema(
  {
    page:           { type: String, required: true, trim: true },   // 'Main' | 'Offer' | 'Custom' | 'Gifts'
    month:          { type: String, required: true },                // 'Mar 2025'
    date:           { type: Date,   required: true, index: true },
    type:           { type: String, enum: ['Organic', 'Paid'], required: true },
    views:          { type: Number, default: 0 },
    reach:          { type: Number, default: 0 },
    linkClicks:     { type: Number, default: 0 },
    profileVisits:  { type: Number, default: 0 },
    follows:        { type: Number, default: 0 },
    unfollows:      { type: Number, default: 0 },
    netFollowers:   { type: Number, default: 0 },
    messages:       { type: Number, default: 0 },
    adsSpent:       { type: Number, default: 0 },
    // Instagram API native fields (for reference/audit)
    igInsights: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Which Instagram account this belongs to (matches DB.conns)
    igAccountId:    { type: String, default: '' },
    syncedAt:       { type: Date },
  },
  { timestamps: true }
);

// Compound unique: one doc per page+month+type
MetricSchema.index({ page: 1, month: 1, type: 1 }, { unique: true });

// Virtual: cost per follower
MetricSchema.virtual('costPerFollower').get(function () {
  return this.follows > 0 ? +(this.adsSpent / this.follows).toFixed(2) : 0;
});

MetricSchema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('Metric', MetricSchema);

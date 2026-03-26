// models/Account.js
const mongoose = require('mongoose');

const AccountSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },      // 'Main Instagram'
    handle:   { type: String, default: '' },          // '@kingofcards.in'
    platform: { type: String, default: 'Instagram' },
    icon:     { type: String, default: '📸' },
    isActive: { type: Boolean, default: false },
    syncedAt: { type: String, default: 'Never' },

    // Instagram / Meta Graph API credentials per account
    igPageId:     { type: String, default: '' },
    igAccessToken:{ type: String, default: '', select: false }, // not returned in lists

    // DB page key — maps to Metric.page (e.g. 'Main')
    dbKey: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Account', AccountSchema);

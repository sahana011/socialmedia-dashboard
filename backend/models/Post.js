// models/Post.js
const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema(
  {
    sku:       { type: String, required: true, trim: true, index: true },
    page:      { type: String, required: true },       // 'Main' | 'Offer' | 'Custom' | 'Gifts' | 'YouTube'
    shootType: {
      type: String,
      enum: ['Store', 'Studio', 'Making', 'Content', 'Carousel',
             'Outdoor', 'Influencer', 'Concept', 'Customized Card'],
    },
    shootDate:   { type: Date },
    editedDate:  { type: Date },
    postDate:    { type: Date, index: true },
    assignedTo:  { type: String },
    desc:        { type: String },
    status:      {
      type:    String,
      enum:    ['Planned', 'Shooting', 'Edited', 'Scheduled', 'Posted', 'Repost'],
      default: 'Planned',
      index:   true
    },
    igUrl:     { type: String, default: '' },
    workFile:  { type: String, default: '' },
    remarks:   { type: String, default: '' },
    thumb:     { type: String, default: '🎬' },

    // Media metrics (filled from Instagram Graph API)
    views:    { type: Number, default: 0 },
    reach:    { type: Number, default: 0 },
    likes:    { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    shares:   { type: Number, default: 0 },
    saves:    { type: Number, default: 0 },
    engRate:  { type: Number, default: 0 },

    // Instagram media ID for API calls
    igMediaId:  { type: String, default: '' },
    syncedAt:   { type: Date },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Post', PostSchema);

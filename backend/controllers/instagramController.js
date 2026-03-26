// controllers/instagramController.js
const instagramService = require('../services/instagramService');
const Metric  = require('../models/Metric');
const Post    = require('../models/Post');
const Account = require('../models/Account');

// POST /api/instagram/sync-insights
// Syncs page insights for all active accounts (or a specific one)
async function syncPageInsights(req, res, next) {
  try {
    const { accountId, daysBack = 28 } = req.body;

    // Find accounts to sync
    const filter = { isActive: true };
    if (accountId) filter._id = accountId;
    const accounts = await Account.find(filter).select('+igAccessToken').lean();

    if (accounts.length === 0)
      return res.status(404).json({ success: false, message: 'No active accounts found' });

    const results = [];

    for (const acc of accounts) {
      try {
        const igAccountId  = acc.igPageId  || process.env.INSTAGRAM_PAGE_ID;
        const accessToken  = acc.igAccessToken || process.env.META_ACCESS_TOKEN;

        const insights = await instagramService.fetchPageInsights(
          igAccountId, accessToken, daysBack
        );

        // Build a month label from current date
        const now = new Date();
        const month = now.toLocaleString('en-US', { month: 'short' }) + ' ' + now.getFullYear();
        const dateStr = new Date(now.getFullYear(), now.getMonth(), 1);

        // Upsert Organic row (API returns blended; Paid must be manual or from Ads Insights)
        const metric = await Metric.findOneAndUpdate(
          { page: acc.dbKey || acc.name, month, type: 'Organic' },
          {
            $set: {
              page:    acc.dbKey || acc.name,
              month,
              date:    dateStr,
              type:    'Organic',
              ...insights,
              igAccountId: igAccountId,
              syncedAt:    new Date(),
            },
          },
          { upsert: true, new: true }
        );

        // Update account's last sync time
        await Account.findByIdAndUpdate(acc._id, {
          syncedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
        });

        results.push({ account: acc.name, metric: metric._id, status: 'ok' });
      } catch (err) {
        results.push({ account: acc.name, status: 'error', message: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
}

// POST /api/instagram/sync-media
// Syncs recent media and their insights for a given account
async function syncMediaInsights(req, res, next) {
  try {
    const { accountId, limit = 20 } = req.body;
    const filter = { isActive: true };
    if (accountId) filter._id = accountId;

    const accounts = await Account.find(filter).select('+igAccessToken').lean();
    if (accounts.length === 0)
      return res.status(404).json({ success: false, message: 'No active accounts found' });

    const results = [];

    for (const acc of accounts) {
      const igAccountId = acc.igPageId  || process.env.INSTAGRAM_PAGE_ID;
      const accessToken = acc.igAccessToken || process.env.META_ACCESS_TOKEN;

      try {
        // 1. Fetch recent media list
        const mediaList = await instagramService.fetchRecentMedia(
          igAccountId, accessToken, limit
        );

        for (const media of mediaList) {
          // 2. Fetch per-media insights
          const insights = await instagramService.fetchMediaInsights(media.igMediaId, accessToken);

          // 3. Upsert into Posts collection (match by igMediaId if exists, else create)
          await Post.findOneAndUpdate(
            { igMediaId: media.igMediaId },
            {
              $set: {
                igMediaId: media.igMediaId,
                igUrl:     media.igUrl,
                desc:      media.desc,
                postDate:  media.postDate,
                page:      acc.dbKey || 'Main',
                status:    'Posted',
                syncedAt:  new Date(),
                ...insights,
              },
            },
            { upsert: true, new: true }
          );
        }

        results.push({ account: acc.name, synced: mediaList.length, status: 'ok' });
      } catch (err) {
        results.push({ account: acc.name, status: 'error', message: err.message });
      }
    }

    res.json({ success: true, results });
  } catch (err) {
    next(err);
  }
}

// GET /api/instagram/demographics
async function getDemographics(req, res, next) {
  try {
    const igAccountId = req.query.igAccountId || process.env.INSTAGRAM_PAGE_ID;
    const accessToken = process.env.META_ACCESS_TOKEN;
    const data = await instagramService.fetchFollowerDemographics(igAccountId, accessToken);
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
}

module.exports = { syncPageInsights, syncMediaInsights, getDemographics };

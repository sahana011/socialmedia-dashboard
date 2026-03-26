// jobs/syncInstagram.js
// ─────────────────────────────────────────────────────────────────────────────
// Daily cron: syncs Instagram page insights + recent media for all active
// accounts.  Runs at 02:00 AM IST (20:30 UTC) every day.
// ─────────────────────────────────────────────────────────────────────────────
const cron = require('node-cron');
const axios = require('axios');

const instagramService = require('../services/instagramService');
const Metric  = require('../models/Metric');
const Post    = require('../models/Post');
const Account = require('../models/Account');

async function runSync() {
  console.log(`🔄  [${new Date().toISOString()}] Starting scheduled Instagram sync…`);

  let accounts = [];
  try {
    accounts = await Account.find({ isActive: true }).select('+igAccessToken').lean();
  } catch (err) {
    console.error('❌  Could not fetch accounts:', err.message);
    return;
  }

  if (accounts.length === 0) {
    console.log('ℹ️   No active accounts to sync.');
    return;
  }

  for (const acc of accounts) {
    const igAccountId = acc.igPageId       || process.env.INSTAGRAM_PAGE_ID;
    const accessToken = acc.igAccessToken  || process.env.META_ACCESS_TOKEN;

    if (!igAccountId || !accessToken) {
      console.warn(`⚠️   Skipping "${acc.name}" — missing credentials`);
      continue;
    }

    // ── Page Insights ──────────────────────────────────────────────────────
    try {
      const insights = await instagramService.fetchPageInsights(igAccountId, accessToken, 28);

      const now    = new Date();
      const month  = now.toLocaleString('en-US', { month: 'short' }) + ' ' + now.getFullYear();
      const dateMs = new Date(now.getFullYear(), now.getMonth(), 1);

      await Metric.findOneAndUpdate(
        { page: acc.dbKey || acc.name, month, type: 'Organic' },
        {
          $set: {
            page: acc.dbKey || acc.name, month, date: dateMs,
            type: 'Organic', ...insights,
            igAccountId, syncedAt: new Date(),
          },
        },
        { upsert: true }
      );

      console.log(`   ✅  Page insights synced — ${acc.name}`);
    } catch (err) {
      console.error(`   ❌  Page insights failed — ${acc.name}:`, err.message);
    }

    // ── Media Insights (last 20 posts) ─────────────────────────────────────
    try {
      const mediaList = await instagramService.fetchRecentMedia(igAccountId, accessToken, 20);

      for (const media of mediaList) {
        const insights = await instagramService.fetchMediaInsights(media.igMediaId, accessToken);

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
          { upsert: true }
        );
      }

      console.log(`   ✅  Media synced (${mediaList.length} posts) — ${acc.name}`);
    } catch (err) {
      console.error(`   ❌  Media sync failed — ${acc.name}:`, err.message);
    }

    // Update last sync timestamp on the account document
    await Account.findByIdAndUpdate(acc._id, {
      syncedAt: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }) + ' IST',
    }).catch(() => {});
  }

  console.log(`✅  Scheduled sync complete — ${new Date().toISOString()}`);
}

function startCronJobs() {
  // Run daily at 02:00 AM IST = 20:30 UTC
  cron.schedule('30 20 * * *', () => {
    runSync().catch(err => console.error('Cron sync error:', err));
  }, { timezone: 'UTC' });

  console.log('⏰  Instagram sync cron registered (daily 02:00 AM IST)');
}

module.exports = { startCronJobs, runSync };

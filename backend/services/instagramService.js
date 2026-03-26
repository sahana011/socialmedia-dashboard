// services/instagramService.js
// ─────────────────────────────────────────────────────────────────────────────
// Wraps Meta Graph API calls and normalises data into our Metric / Post shapes.
//
// ENV required (per account or global fallback):
//   META_ACCESS_TOKEN   – long-lived Page / Business token
//   INSTAGRAM_PAGE_ID   – Instagram Business Account ID (not IG username)
// ─────────────────────────────────────────────────────────────────────────────
const axios = require('axios');

const BASE   = 'https://graph.facebook.com/v20.0';
const TOKEN  = process.env.META_ACCESS_TOKEN;
const PAGE_ID= process.env.INSTAGRAM_PAGE_ID;

// ── Helpers ──────────────────────────────────────────────────────────────────
function apiGet(endpoint, params = {}) {
  return axios.get(`${BASE}/${endpoint}`, {
    params: { access_token: TOKEN, ...params },
    timeout: 12000,
  });
}

function range(daysBack) {
  const until = Math.floor(Date.now() / 1000);
  const since = until - daysBack * 86400;
  return { since, until };
}

// ── Page Insights ─────────────────────────────────────────────────────────────
/**
 * Fetch page-level insights for a given account.
 *
 * @param {string} igAccountId  – Instagram Business Account ID
 * @param {string} accessToken  – long-lived token for this account
 * @param {number} daysBack     – e.g. 28 for last 28 days
 *
 * @returns {Object} normalised metric fields matching our Metric schema
 */
async function fetchPageInsights(igAccountId = PAGE_ID, accessToken = TOKEN, daysBack = 28) {
  if (!igAccountId || !accessToken) {
    throw new Error('Missing Instagram credentials');
  }

  const metrics = [
    'impressions',        // maps to → views
    'reach',
    'profile_views',      // maps to → profileVisits
    'follower_count',     // maps to → follows (delta)
    'website_clicks',     // maps to → linkClicks
    'get_directions_clicks',
  ].join(',');

  const { since, until } = range(daysBack);

  const { data } = await axios.get(`${BASE}/${igAccountId}/insights`, {
    params: {
      metric:       metrics,
      period:       'day',
      since,
      until,
      access_token: accessToken,
    },
    timeout: 15000,
  });

  return normalisePageInsights(data.data || []);
}

/**
 * Turn the raw Graph API array into our flat Metric shape.
 */
function normalisePageInsights(rawMetrics) {
  const map = {};
  for (const m of rawMetrics) {
    // Sum all day-level values into a single total
    const total = (m.values || []).reduce((s, v) => s + (v.value || 0), 0);
    map[m.name] = total;
  }

  return {
    views:           map.impressions            || 0,
    reach:           map.reach                  || 0,
    profileVisits:   map.profile_views          || 0,
    follows:         map.follower_count         || 0,
    linkClicks:      map.website_clicks         || 0,
    // Paid / adsSpent cannot be derived from Graph API alone;
    // those come from Facebook Ads Insights (separate call or manual entry)
    adsSpent:        0,
    igInsights:      map,   // raw reference
  };
}

// ── Media Insights ────────────────────────────────────────────────────────────
/**
 * Fetch insights for a single media object (reel / post).
 *
 * @param {string} mediaId    – IG Media ID
 * @param {string} accessToken
 * @returns {Object} normalised post-level metrics
 */
async function fetchMediaInsights(mediaId, accessToken = TOKEN) {
  const metricNames = [
    'impressions', 'reach', 'likes', 'comments',
    'shares', 'saved', 'plays',
  ].join(',');

  try {
    const { data } = await axios.get(`${BASE}/${mediaId}/insights`, {
      params: { metric: metricNames, access_token: accessToken },
      timeout: 10000,
    });
    return normaliseMediaInsights(mediaId, data.data || []);
  } catch (err) {
    // Some older media types don't support all metrics — return partial
    console.warn(`⚠️  Media insights unavailable for ${mediaId}:`, err.response?.data?.error?.message);
    return { igMediaId: mediaId };
  }
}

function normaliseMediaInsights(mediaId, rawMetrics) {
  const map = {};
  for (const m of rawMetrics) {
    map[m.name] = m.values?.[0]?.value ?? m.value ?? 0;
  }
  const views    = map.plays        || map.impressions || 0;
  const reach    = map.reach        || 0;
  const likes    = map.likes        || 0;
  const comments = map.comments     || 0;
  const shares   = map.shares       || 0;
  const saves    = map.saved        || 0;
  const total    = likes + comments + shares + saves;
  const engRate  = reach > 0 ? +((total / reach) * 100).toFixed(2) : 0;

  return { igMediaId: mediaId, views, reach, likes, comments, shares, saves, engRate };
}

// ── Recent Media ──────────────────────────────────────────────────────────────
/**
 * List most-recent media objects for an IG Business account.
 *
 * @param {string} igAccountId
 * @param {string} accessToken
 * @param {number} limit
 * @returns {Array} array of { igMediaId, igUrl, thumb, desc, postDate, mediaType }
 */
async function fetchRecentMedia(igAccountId = PAGE_ID, accessToken = TOKEN, limit = 20) {
  const { data } = await axios.get(`${BASE}/${igAccountId}/media`, {
    params: {
      fields:       'id,caption,media_type,media_url,permalink,thumbnail_url,timestamp',
      limit,
      access_token: accessToken,
    },
    timeout: 12000,
  });

  return (data.data || []).map(m => ({
    igMediaId: m.id,
    igUrl:     m.permalink    || '',
    thumb:     m.thumbnail_url || m.media_url || '',
    desc:      (m.caption || '').substring(0, 120),
    postDate:  m.timestamp ? new Date(m.timestamp) : null,
    mediaType: m.media_type,
  }));
}

// ── Follower Demographics (optional bonus) ────────────────────────────────────
async function fetchFollowerDemographics(igAccountId = PAGE_ID, accessToken = TOKEN) {
  const { data } = await axios.get(`${BASE}/${igAccountId}/insights`, {
    params: {
      metric:       'audience_city,audience_gender_age,audience_country',
      period:       'lifetime',
      access_token: accessToken,
    },
    timeout: 12000,
  });
  return data.data || [];
}

module.exports = {
  fetchPageInsights,
  fetchMediaInsights,
  fetchRecentMedia,
  fetchFollowerDemographics,
  normalisePageInsights,
  normaliseMediaInsights,
};

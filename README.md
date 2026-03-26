# King of Cards — Command Centre v4
## Full-Stack Migration Guide

---

## Table of Contents
1. [Architecture Overview](#architecture)
2. [Folder Structure](#folder-structure)
3. [MongoDB Schemas](#mongodb-schemas)
4. [REST API Reference](#rest-api-reference)
5. [Instagram Integration](#instagram-integration)
6. [Frontend Changes (DB → API)](#frontend-changes)
7. [Data Flow](#data-flow)
8. [Step-by-Step Setup](#setup-instructions)
9. [Environment Variables](#environment-variables)
10. [Cron Job](#cron-job)
11. [Production Checklist](#production-checklist)

---

## Architecture

```
Browser (index.html)
     │
     │  fetch('/api/...')
     ▼
Express Server  (backend/server.js :3000)
     │
     ├── /api/metrics    ──► Metric  (MongoDB)
     ├── /api/posts      ──► Post    (MongoDB)
     ├── /api/users      ──► User    (MongoDB)
     ├── /api/accounts   ──► Account (MongoDB)
     └── /api/instagram  ──► Meta Graph API v20.0
                                  │
                              (synced back to MongoDB)
                              (cron: daily 2 AM IST)
```

---

## Folder Structure

```
koc-dashboard/
├── .env.example              ← copy to .env, fill in values
├── package.json
│
├── backend/
│   ├── server.js             ← Express entry point
│   ├── models/
│   │   ├── Metric.js         ← Analytics rows schema
│   │   ├── Post.js           ← Posts/Reels schema
│   │   ├── User.js           ← Team members schema
│   │   └── Account.js        ← Instagram/social accounts schema
│   ├── controllers/
│   │   ├── metricsController.js
│   │   ├── postsController.js
│   │   ├── usersController.js
│   │   ├── accountsController.js
│   │   └── instagramController.js
│   ├── routes/
│   │   ├── metrics.js
│   │   ├── posts.js
│   │   ├── users.js
│   │   ├── accounts.js
│   │   └── instagram.js
│   ├── services/
│   │   └── instagramService.js  ← Meta Graph API wrapper
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── jobs/
│   │   └── syncInstagram.js     ← Daily cron
│   └── scripts/
│       └── seed.js              ← One-time DB seed from dummy data
│
└── frontend/
    ├── index.html            ← Your existing file (minor patches only)
    ├── FRONTEND_PATCHES.html ← All JS snippets to copy in
    └── js/
        ├── api.js            ← fetch() wrapper (replaces DB reads)
        └── state.js          ← In-memory cache + write-through mutations
```

---

## MongoDB Schemas

### Metric
| Field         | Type    | Notes                                      |
|---------------|---------|--------------------------------------------|
| page          | String  | 'Main' \| 'Offer' \| 'Custom' \| 'Gifts'  |
| month         | String  | 'Mar 2025'                                 |
| date          | Date    | First day of month, indexed                |
| type          | String  | 'Organic' \| 'Paid'                        |
| views         | Number  | Impressions                                |
| reach         | Number  |                                            |
| linkClicks    | Number  |                                            |
| profileVisits | Number  |                                            |
| follows       | Number  |                                            |
| unfollows     | Number  |                                            |
| netFollowers  | Number  |                                            |
| messages      | Number  |                                            |
| adsSpent      | Number  | ₹ amount; 0 for Organic                    |
| igInsights    | Mixed   | Raw API response stored for audit          |
| igAccountId   | String  | IG Business Account ID                     |
| syncedAt      | Date    | Last API sync timestamp                    |

**Unique index:** `{ page, month, type }` — one document per combination.

### Post
| Field      | Type   | Notes                                          |
|------------|--------|------------------------------------------------|
| sku        | String | e.g. KPC33820, indexed                         |
| page       | String | 'Main' \| 'Offer' \| 'Custom' \| 'Gifts'       |
| shootType  | String | Store / Studio / Making / Content / etc.       |
| shootDate  | Date   |                                                |
| editedDate | Date   |                                                |
| postDate   | Date   | indexed                                        |
| assignedTo | String | Team member name                               |
| desc       | String |                                                |
| status     | String | Planned / Shooting / Edited / Scheduled / Posted |
| igUrl      | String | Instagram permalink                            |
| workFile   | String | Drive/Dropbox link                             |
| views      | Number |                                                |
| reach      | Number |                                                |
| likes      | Number |                                                |
| comments   | Number |                                                |
| shares     | Number |                                                |
| saves      | Number |                                                |
| engRate    | Number | Calculated: (likes+comments+shares+saves)/reach*100 |
| igMediaId  | String | IG Media ID for API sync                       |

### User
| Field      | Type    | Notes                          |
|------------|---------|--------------------------------|
| name       | String  |                                |
| email      | String  | unique, lowercase              |
| password   | String  | bcrypt hashed, never returned  |
| role       | String  | Admin \| Editor \| Viewer      |
| team       | String  | Strategy / Video / Editing     |
| initials   | String  | e.g. 'GP'                      |
| color      | String  | hex color for avatar           |
| reels      | Number  | total reels count              |
| shoots     | Number  |                                |
| edits      | Number  |                                |
| score      | Number  | 0–100 productivity score       |

### Account
| Field          | Type    | Notes                              |
|----------------|---------|------------------------------------|
| name           | String  | 'Main Instagram'                   |
| handle         | String  | '@kingofcards.in'                  |
| platform       | String  | Instagram / YouTube / Facebook     |
| icon           | String  | Emoji                              |
| isActive       | Boolean |                                    |
| syncedAt       | String  | 'Just now' / '2 mins ago'          |
| igPageId       | String  | IG Business Account ID             |
| igAccessToken  | String  | Per-account token (not returned)   |
| dbKey          | String  | Maps to Metric.page ('Main', etc.) |

---

## REST API Reference

### Metrics
```
GET    /api/metrics                    → list all (supports ?page=Main&type=Organic&from=&to=)
POST   /api/metrics                    → upsert one row (body: {page, month, type, ...fields})
POST   /api/metrics/bulk               → upsert array of rows
DELETE /api/metrics/:id                → delete one
```

### Posts
```
GET    /api/posts                      → list (supports ?page=&status=&assignedTo=&from=&to=&search=)
GET    /api/posts/:id                  → single post
POST   /api/posts                      → create new post
PUT    /api/posts/:id                  → update (any subset of fields)
DELETE /api/posts/:id                  → delete one
POST   /api/posts/bulk-delete          → body: { ids: [...] }
```

### Users
```
GET    /api/users                      → list active users
GET    /api/users/:id
POST   /api/users                      → create (password auto-hashed)
PUT    /api/users/:id
DELETE /api/users/:id                  → soft-delete (sets isActive: false)
```

### Accounts
```
GET    /api/accounts                   → list all accounts
PUT    /api/accounts/:id               → update (e.g. set igPageId, toggle isActive)
```

### Instagram
```
POST   /api/instagram/sync-insights    → body: { accountId?, daysBack? }
POST   /api/instagram/sync-media       → body: { accountId?, limit? }
GET    /api/instagram/demographics     → ?igAccountId=
```

### Health
```
GET    /api/health                     → { status: 'ok', db: 'connected' }
```

---

## Instagram Integration

### How It Works

```
Meta Graph API
   └── /{ig-account-id}/insights   → views, reach, profileVisits, follows
   └── /{ig-account-id}/media      → list of recent posts
       └── /{media-id}/insights    → likes, comments, shares, saves, plays
```

### Getting Credentials

1. Go to **[developers.facebook.com](https://developers.facebook.com)**
2. Create an app → **Business** type
3. Add **Instagram Graph API** product
4. Connect your Instagram Business Account
5. Generate a long-lived **Page Access Token** (valid 60 days; use Token Debugger to extend)
6. Find your **Instagram Business Account ID**:
   - Graph API Explorer → `GET /me/accounts` → pick page → note `instagram_business_account.id`

### Field Mapping (API → DB)

| Graph API Field      | Our DB Field    |
|----------------------|-----------------|
| impressions          | views           |
| reach                | reach           |
| profile_views        | profileVisits   |
| follower_count       | follows         |
| website_clicks       | linkClicks      |
| plays (media)        | views           |
| likes (media)        | likes           |
| comments (media)     | comments        |
| shares (media)       | shares          |
| saved (media)        | saves           |

> **Note:** `adsSpent` (Paid metrics) cannot be pulled from Graph API basic endpoints.
> It requires Facebook **Ads Insights API** which needs `ads_read` permission — or continue
> entering it manually in the MIS table as before.

---

## Frontend Changes (DB → API)

### What Changed

The old `var DB = { ... }` object is replaced by two files:

| Old                          | New                                     |
|------------------------------|-----------------------------------------|
| `DB.metrics`                 | Populated via `API.getMetrics()` → stored in `STATE` → exposed as `window.DB.metrics` |
| `DB.posts`                   | `API.getPosts()` → `window.DB.posts`    |
| `DB.people`                  | `API.getUsers()` → `window.DB.people`   |
| `DB.accounts`/`DB.conns`     | `API.getAccounts()` → `window.DB.accounts` |
| `DB.posts = DB.posts.filter(...)` | `STATE.removePost(id)` → API DELETE |
| `DB.metrics.push(row)`       | `STATE.saveMetricCell(...)` → API POST  |
| `DB.posts.push(newPost)`     | `STATE.addPost(data)` → API POST        |

### How to Apply Patches

1. Copy `frontend/js/api.js` and `frontend/js/state.js` to your server
2. In `index.html`, in `<head>`, add **before your inline `<script>`**:
   ```html
   <script src="/js/api.js"></script>
   <script src="/js/state.js"></script>
   ```
3. At the **bottom of your inline `<script>`**, replace the two init lines:
   ```js
   // REMOVE these two lines:
   updatePillText();
   renderOverview();

   // REPLACE with the boot block from FRONTEND_PATCHES.html section ②
   ```
4. Copy and replace each function from `FRONTEND_PATCHES.html` sections ③–⑪:
   - `saveP()` — inline edit persistence
   - `delRow()` — delete with API call
   - `bulkDel()` — bulk delete via API
   - `doAddPost()` — create post via API
   - `doAddMonth()` — upsert metric month via API
   - `saveAdsCell()` — save single metric cell
   - `delPerson()` — remove user via API
   - `doAddMember()` — create user via API

All existing **render functions, chart code, CSS, and HTML structure remain unchanged**.
The `window.DB` proxy makes `DB.metrics`, `DB.posts`, etc. still work in the render code.

---

## Data Flow

```
1. User opens browser
      │
2. STATE.init() fires
      │
3. Parallel API calls:
      ├── GET /api/metrics  → populates DB.metrics
      ├── GET /api/posts    → populates DB.posts
      ├── GET /api/users    → populates DB.people
      └── GET /api/accounts → populates DB.conns
      │
4. renderOverview() runs with real data
      │
5. User edits a cell in MIS table
      │
6. saveAdsCell() → STATE.saveMetricCell()
      │               → POST /api/metrics (upsert)
      │               → MongoDB updated
      │
7. Cron runs nightly at 2 AM IST
      │
8. instagramService.fetchPageInsights() → Meta Graph API
      │
9. Upserts Metric documents in MongoDB
      │
10. Next browser load shows real API data
```

---

## Setup Instructions

### Prerequisites
- Node.js 18+
- MongoDB 6+ (local) or MongoDB Atlas (free tier works)
- Meta Developer account with Instagram Business API access

### Step 1: Clone & Install

```bash
git clone <your-repo>
cd koc-dashboard
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
MONGO_URI=mongodb://localhost:27017/koc_dashboard
META_ACCESS_TOKEN=EAAxxxxxxxxxxxxxxx
INSTAGRAM_PAGE_ID=17841400000000000
PORT=3000
```

### Step 3: Seed Database

Run this **once** to migrate all dummy DB data into MongoDB:

```bash
npm run seed
```

You should see:
```
✅  Connected to MongoDB
🗑   Cleared existing data
✅  Inserted 38 metrics
✅  Inserted 18 posts
✅  Inserted 11 users
✅  Inserted 8 accounts
🎉  Seed complete!
```

### Step 4: Copy Frontend Files

Copy `frontend/js/api.js` and `frontend/js/state.js` to your web server folder.

Apply the patches from `frontend/FRONTEND_PATCHES.html` to your `index.html`:
- Add the two `<script src>` tags in `<head>`
- Replace `saveP`, `delRow`, `bulkDel`, `doAddPost`, `doAddMonth`, `saveAdsCell`, `delPerson`, `doAddMember`
- Replace the two init lines at the bottom with the boot block

### Step 5: Run the Server

```bash
# Development (auto-restart on changes)
npm run dev

# Production
npm start
```

Visit: **http://localhost:3000**

### Step 6: Verify

```bash
curl http://localhost:3000/api/health
# → {"status":"ok","db":"connected"}

curl http://localhost:3000/api/metrics | python3 -m json.tool
# → { success: true, data: [...38 rows...] }

curl http://localhost:3000/api/posts
# → { success: true, data: [...18 posts...] }
```

### Step 7: Connect Instagram

1. Update your Main account's credentials in MongoDB:
   ```bash
   # Via MongoDB shell or Compass:
   db.accounts.updateOne(
     { name: "Main Instagram" },
     { $set: { igPageId: "YOUR_IG_ACCOUNT_ID", isActive: true } }
   )
   ```
2. Trigger a manual sync to test:
   ```bash
   curl -X POST http://localhost:3000/api/instagram/sync-insights \
     -H "Content-Type: application/json" \
     -d '{"daysBack": 28}'
   ```

---

## Environment Variables

| Variable           | Required | Description                                         |
|--------------------|----------|-----------------------------------------------------|
| `PORT`             | No       | Server port (default: 3000)                         |
| `MONGO_URI`        | Yes      | MongoDB connection string                           |
| `META_ACCESS_TOKEN`| Yes*     | Long-lived Meta Page Access Token                   |
| `INSTAGRAM_PAGE_ID`| Yes*     | Instagram Business Account ID (numeric)             |
| `NODE_ENV`         | No       | 'development' or 'production'                       |
| `CLIENT_ORIGIN`    | No       | CORS origin (default: *)                            |
| `ANTHROPIC_API_KEY`| No       | For AI Content Lab (Claude API)                     |

\* Required only for Instagram sync features.

---

## Cron Job

The daily sync is registered automatically when the server starts.

- **Schedule:** 02:00 AM IST (20:30 UTC) every day
- **What it does:**
  1. Loops all active Instagram accounts
  2. Calls `fetchPageInsights()` (last 28 days)
  3. Upserts current month's Organic metric row
  4. Calls `fetchRecentMedia()` (last 20 posts)
  5. For each post calls `fetchMediaInsights()` and upserts the Post document
  6. Updates `account.syncedAt` timestamp

**Manual trigger (without waiting for cron):**
```bash
npm run sync
```

---

## Production Checklist

- [ ] Set `NODE_ENV=production` in `.env`
- [ ] Use MongoDB Atlas (not local) for persistence
- [ ] Restrict `CLIENT_ORIGIN` to your actual domain
- [ ] Change all seed passwords (`changeme123`) immediately
- [ ] Enable HTTPS (use nginx reverse proxy or Caddy)
- [ ] Set up Meta token refresh before 60-day expiry
- [ ] Run `npm run seed` only once (add a guard flag after initial seed)
- [ ] Monitor cron job logs for Instagram API errors
- [ ] Add rate limiting middleware (`express-rate-limit`) if exposing publicly
- [ ] Backup MongoDB daily (Atlas has automated backups)

---

## Common Issues

**"Could not connect to backend"**
→ Make sure `npm run dev` is running and MONGO_URI is correct.

**"Instagram sync failed — Missing credentials"**
→ Check that `META_ACCESS_TOKEN` and `INSTAGRAM_PAGE_ID` are set in `.env`, or that the Account document has `igPageId` and `igAccessToken`.

**"Duplicate entry" error on seed**
→ The seed script clears data before inserting. If it partially ran, drop the collections manually:
```bash
# In MongoDB shell:
use koc_dashboard
db.metrics.drop(); db.posts.drop(); db.users.drop(); db.accounts.drop();
```
Then re-run `npm run seed`.

**Frontend shows old dummy data**
→ Hard-refresh the browser (Ctrl+Shift+R). Verify the `<script src="/js/api.js">` tags were added.

**Meta token expired (after 60 days)**
→ Use the [Token Debugger](https://developers.facebook.com/tools/debug/accesstoken/) to extend, or set up a refresh cron using `POST /oauth/access_token?grant_type=fb_exchange_token`.

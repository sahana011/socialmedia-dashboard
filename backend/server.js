// ═══════════════════════════════════════════════
// King of Cards — Command Centre
// Backend Server  (Node.js + Express)
// ═══════════════════════════════════════════════
require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const path       = require('path');

const metricsRouter  = require('./routes/metrics');
const postsRouter    = require('./routes/posts');
const usersRouter    = require('./routes/users');
const accountsRouter = require('./routes/accounts');
const instagramRouter= require('./routes/instagram');

const { startCronJobs } = require('./jobs/syncInstagram');
const { errorHandler }  = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }));
app.use(morgan('dev'));
app.use(express.json({ limit: '2mb' }));

// ── Static frontend ───────────────────────────
app.use(express.static(path.join(__dirname, '../frontend')));

// ── API Routes ────────────────────────────────
app.use('/api/metrics',   metricsRouter);
app.use('/api/posts',     postsRouter);
app.use('/api/users',     usersRouter);
app.use('/api/accounts',  accountsRouter);
app.use('/api/instagram', instagramRouter);

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    time:   new Date().toISOString(),
    db:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ── SPA fallback ──────────────────────────────
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// ── Error handler (must be last) ─────────────
app.use(errorHandler);

// ── MongoDB + Server boot ────────────────────
(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log('✅  MongoDB connected');

    app.listen(PORT, () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
    });

    // Start scheduled Instagram sync (runs daily at 2 AM)
    startCronJobs();
  } catch (err) {
    console.error('❌  Startup error:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
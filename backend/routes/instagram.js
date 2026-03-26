// routes/instagram.js
const router = require('express').Router();
const c = require('../controllers/instagramController');
router.post('/sync-insights', c.syncPageInsights);
router.post('/sync-media',    c.syncMediaInsights);
router.get('/demographics',   c.getDemographics);
module.exports = router;

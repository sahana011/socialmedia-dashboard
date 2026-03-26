// routes/instagram.js
const router = require('express').Router();
const c = require('../controllers/instagramController');
router.get('/test',           c.testConnection); 
router.post('/sync-insights', c.syncPageInsights);
router.post('/sync-media',    c.syncMediaInsights);
router.get('/demographics',   c.getDemographics);
module.exports = router;

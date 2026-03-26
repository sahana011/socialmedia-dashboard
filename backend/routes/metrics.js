// routes/metrics.js
const router = require('express').Router();
const c = require('../controllers/metricsController');

router.get('/',       c.getMetrics);
router.post('/',      c.createOrUpdateMetric);
router.post('/bulk',  c.bulkUpsert);
router.delete('/:id', c.deleteMetric);

module.exports = router;

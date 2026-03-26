// controllers/metricsController.js
const Metric = require('../models/Metric');

// GET /api/metrics?page=Main&type=Organic&from=2025-03-01&to=2026-02-28
async function getMetrics(req, res, next) {
  try {
    const query = {};
    if (req.query.page)  query.page = req.query.page;
    if (req.query.type)  query.type = req.query.type;
    if (req.query.month) query.month = req.query.month;

    if (req.query.from || req.query.to) {
      query.date = {};
      if (req.query.from) query.date.$gte = new Date(req.query.from);
      if (req.query.to)   query.date.$lte = new Date(req.query.to);
    }

    const metrics = await Metric.find(query).sort({ date: 1 }).lean();
    res.json({ success: true, data: metrics });
  } catch (err) {
    next(err);
  }
}

// POST /api/metrics  — upsert a single metric row
async function createOrUpdateMetric(req, res, next) {
  try {
    const { page, month, type, date, ...fields } = req.body;
    if (!page || !month || !type) {
      return res.status(400).json({ success: false, message: 'page, month, type required' });
    }

    const metric = await Metric.findOneAndUpdate(
      { page, month, type },
      { $set: { page, month, type, date: date || new Date(), ...fields } },
      { upsert: true, new: true, runValidators: true }
    );
    res.status(201).json({ success: true, data: metric });
  } catch (err) {
    next(err);
  }
}

// POST /api/metrics/bulk  — replace multiple rows (e.g. seeding)
async function bulkUpsert(req, res, next) {
  try {
    const rows = req.body; // array
    if (!Array.isArray(rows)) return res.status(400).json({ success: false, message: 'Array expected' });

    const ops = rows.map(row => ({
      updateOne: {
        filter: { page: row.page, month: row.month, type: row.type },
        update: { $set: row },
        upsert: true,
      },
    }));

    const result = await Metric.bulkWrite(ops);
    res.json({ success: true, upserted: result.upsertedCount, modified: result.modifiedCount });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/metrics/:id
async function deleteMetric(req, res, next) {
  try {
    await Metric.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { getMetrics, createOrUpdateMetric, bulkUpsert, deleteMetric };

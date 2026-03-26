// middleware/errorHandler.js

function errorHandler(err, req, res, next) {
  console.error('❌ ', err.stack || err.message);

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: Object.values(err.errors).map(e => e.message),
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      message: 'Duplicate entry — record already exists',
      keyValue: err.keyValue,
    });
  }

  // Mongoose cast (invalid ObjectId, etc.)
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid ${err.path}: ${err.value}` });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
}

module.exports = { errorHandler };

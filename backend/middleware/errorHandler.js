/**
 * Error Handling Middleware
 * ─────────────────────────
 * Centralised error handler — catches anything passed via next(err).
 */

function errorHandler(err, req, res, next) {
  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ error: 'Validation failed.', details: messages });
  }

  // Mongoose duplicate key (e.g. unique email)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `Duplicate value for field: ${field}` });
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({ error: `Invalid value for field: ${err.path}` });
  }

  const status = err.status || 500;
  console.error(`[${new Date().toISOString()}] ${status} — ${err.message}`);

  res.status(status).json({
    error: process.env.NODE_ENV === 'production' ? 'An error occurred.' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

function notFound(req, res) {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { errorHandler, notFound };

// =====================================================================
// Central error handling
// ---------------------------------------------------------------------
//  - asyncHandler: wraps async route handlers so thrown errors are passed
//    to Express's error middleware (no try/catch boilerplate).
//  - errorHandler: formats every error into a consistent JSON response.
// =====================================================================

// Wrap an async controller so rejected promises reach the error handler.
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// 404 for unknown API routes.
const notFound = (req, res, next) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
};

// Central JSON error handler.
const errorHandler = (err, req, res, next) => {
  // Multer / validation errors carry a status; fall back to 500.
  const status = err.status || err.statusCode || 500;

  // Log unexpected errors on the server but hide internals from clients.
  if (status >= 500) {
    console.error('[ERROR]', err);
  }

  res.status(status).json({
    error: err.expose || status < 500 ? err.message : 'Internal server error',
    details: err.details || undefined,
  });
};

module.exports = { asyncHandler, notFound, errorHandler };

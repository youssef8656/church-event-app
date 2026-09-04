const env = require('../config/env');

function notFoundHandler(req, res, next) {
  res.status(404).json({ error: { message: `Route not found: ${req.method} ${req.originalUrl}` } });
}

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // Map known Prisma errors to sane HTTP responses instead of leaking 500s.
  if (err.code === 'P2002') {
    err = { isApiError: true, statusCode: 409, message: 'This record already exists (duplicate).' };
  } else if (err.code === 'P2025') {
    err = { isApiError: true, statusCode: 404, message: 'Record not found.' };
  } else if (err.name === 'MulterError' || /Unsupported file type/.test(err.message || '')) {
    err = { isApiError: true, statusCode: 400, message: err.message };
  }

  const statusCode = err.isApiError ? err.statusCode : (err.statusCode || 500);
  const message = err.isApiError || statusCode < 500 ? err.message : 'Internal server error';

  if (statusCode >= 500) {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(statusCode).json({
    error: {
      message,
      details: err.details,
      stack: env.nodeEnv === 'development' ? err.stack : undefined,
    },
  });
}

module.exports = { notFoundHandler, errorHandler };

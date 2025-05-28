/**
 * Global error handling middleware for Express
 * @param {Error} err - Error object
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function errorHandler(err, req, res, next) {
  // Log error details
  console.error('❌ Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  // Default error response
  let status = 500;
  let message = 'Internal Server Error';
  let details = null;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation Error';
    details = err.details || err.message;
  } else if (err.name === 'UnauthorizedError') {
    status = 401;
    message = 'Unauthorized';
  } else if (err.name === 'ForbiddenError') {
    status = 403;
    message = 'Forbidden';
  } else if (err.name === 'NotFoundError') {
    status = 404;
    message = 'Not Found';
  } else if (err.name === 'ConflictError') {
    status = 409;
    message = 'Conflict';
  } else if (err.name === 'TooManyRequestsError') {
    status = 429;
    message = 'Too Many Requests';
  } else if (err.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Service Unavailable';
    details = 'Database or external service connection failed';
  } else if (err.code === 'ETIMEDOUT') {
    status = 504;
    message = 'Gateway Timeout';
    details = 'Request timeout';
  }

  // In development, include stack trace
  const errorResponse = {
    success: false,
    error: {
      message,
      status,
      timestamp: new Date().toISOString(),
      requestId: req.id || 'unknown'
    }
  };

  // Add details if available
  if (details) {
    errorResponse.error.details = details;
  }

  // Include stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
  }

  // Send error response
  res.status(status).json(errorResponse);
}

/**
 * Async error wrapper for route handlers
 * @param {Function} fn - Async route handler function
 * @returns {Function} Wrapped function that catches async errors
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(message, details = null) {
    super(message);
    this.name = 'ValidationError';
    this.details = details;
  }
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends Error {
  constructor(message = 'Forbidden') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Not Found') {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends Error {
  constructor(message = 'Conflict') {
    super(message);
    this.name = 'ConflictError';
  }
}

export class TooManyRequestsError extends Error {
  constructor(message = 'Too Many Requests') {
    super(message);
    this.name = 'TooManyRequestsError';
  }
}

/**
 * Handle 404 errors for unmatched routes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
export function notFoundHandler(req, res, next) {
  const error = new NotFoundError(`Route not found: ${req.method} ${req.path}`);
  next(error);
}
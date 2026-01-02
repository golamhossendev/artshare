const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error
  let statusCode = 500;
  let message = 'Internal server error';

  // Handle specific error types
  if (err.message) {
    message = err.message;
  }

  if (err.message.includes('not found')) {
    statusCode = 404;
  } else if (err.message.includes('already exists') || err.message.includes('already flagged')) {
    statusCode = 409;
  } else if (err.message.includes('Invalid') || err.message.includes('Unauthorized')) {
    statusCode = 401;
  } else if (err.message.includes('Forbidden')) {
    statusCode = 403;
  } else if (err.message.includes('validation') || err.message.includes('required')) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { errorHandler };


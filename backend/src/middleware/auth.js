const { verifyToken } = require('../utils/jwt');
const { AppError } = require('./errorHandler');

const auth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(
        new AppError(
          'You are not logged in! Please log in to get access.',
          401,
          'NO_TOKEN'
        )
      );
    }

    // Verify token
    const decoded = await verifyToken(token);

    // Grant access to protected route
    // Ensure the decoded token has the required user fields
    if (!decoded || !decoded.id) {
      return next(
        new AppError('Invalid user data in token', 401, 'INVALID_TOKEN')
      );
    }

    // Set user info on request
    req.user = {
      id: decoded.id,
      email: decoded.email,
    };
    next();
  } catch (error) {
    // Helpful debug logging for CI and local failures
    try {
      console.error('[auth] Middleware error:', {
        name: error.name,
        message: error.message,
      });
    } catch (logErr) {
      // swallow logging errors
    }
    if (error.name === 'JsonWebTokenError') {
      return next(
        new AppError(
          'Invalid token. Please log in again.',
          401,
          'INVALID_TOKEN'
        )
      );
    } else if (error.name === 'TokenExpiredError') {
      return next(
        new AppError(
          'Your token has expired! Please log in again.',
          401,
          'TOKEN_EXPIRED'
        )
      );
    }
    return next(error);
  }
};

// TODO: Middleware to restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          'You do not have permission to perform this action',
          403,
          'INSUFFICIENT_PERMISSIONS'
        )
      );
    }
    next();
  };
};

module.exports = auth;
module.exports.restrictTo = restrictTo;

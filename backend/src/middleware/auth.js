// JWT authentication middleware with refresh-token support
const { AppError } = require('./errorHandler');
const authService = require('../services/authService');
const jwtUtils = require('../utils/jwt');

const tryRefreshWithCookie = async (req, res) => {
  const refreshToken =
    req.cookies?.refreshToken ||
    req.headers['x-refresh-token'] ||
    req.body?.refreshToken;
  if (!refreshToken) return null;

  const result = await authService.refreshToken(refreshToken);
  if (result && result.data && result.data.accessToken) {
    // attach new access token in response header for frontend to pick up if needed
    res.setHeader('X-Access-Token', result.data.accessToken);
    return result.data.accessToken;
  }

  return null;
};

const auth = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    // If token missing, try to refresh using cookie
    if (!token) {
      try {
        const newAccess = await tryRefreshWithCookie(req, res);
        if (newAccess) {
          const decoded = jwtUtils.verifyToken(newAccess);
          req.user = decoded;
          req.accessToken = newAccess;
          return next();
        }
      } catch (err) {
        // fall through to not authorized
      }

      return next(
        new AppError(
          'You are not logged in! Please log in to get access.',
          401,
          'NO_TOKEN'
        )
      );
    }

    try {
      const decoded = jwtUtils.verifyToken(token);
      req.user = decoded;
      return next();
    } catch (err) {
      // Token might be expired - attempt refresh using cookie
      if (err.name === 'TokenExpiredError') {
        try {
          const newAccess = await tryRefreshWithCookie(req, res);
          if (newAccess) {
            const decoded = jwtUtils.verifyToken(newAccess);
            req.user = decoded;
            req.accessToken = newAccess;
            return next();
          }
          return next(
            new AppError(
              'Your token has expired! Please log in again.',
              401,
              'TOKEN_EXPIRED'
            )
          );
        } catch (refreshErr) {
          return next(
            new AppError(
              'Your token has expired! Please log in again.',
              401,
              'TOKEN_EXPIRED'
            )
          );
        }
      }

      if (err.name === 'JsonWebTokenError') {
        return next(
          new AppError(
            'Invalid token. Please log in again.',
            401,
            'INVALID_TOKEN'
          )
        );
      }

      return next(err);
    }
  } catch (error) {
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

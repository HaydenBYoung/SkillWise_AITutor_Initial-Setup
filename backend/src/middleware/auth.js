// JWT authentication middleware with automatic refresh using httpOnly refresh cookie
const { AppError } = require('./errorHandler');
const jwtUtils = require('../utils/jwt');
const authService = require('../services/authService');

// Helper to read refresh token from cookie/header/body/query
function getRefreshTokenFromRequest(req) {
  // Prefer cookie
  const cookieHeader = req.headers && req.headers.cookie;
  if (cookieHeader) {
    const match = cookieHeader
      .split(';')
      .map((c) => c.trim())
      .find((c) => c.startsWith('refreshToken='));
    if (match) return match.split('=')[1];
  }

  // Fallback to body
  if (req.body && req.body.refreshToken) return req.body.refreshToken;

  // Fallback to query
  if (req.query && req.query.refreshToken) return req.query.refreshToken;

  return null;
}

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
      // No access token present; try to restore session via refresh token
      const refresh = getRefreshTokenFromRequest(req);
      if (!refresh) {
        return next(
          new AppError(
            'You are not logged in! Please log in to get access.',
            401,
            'NO_TOKEN'
          )
        );
      }

      try {
        const refreshed = await authService.refreshToken(refresh);
        // Attach new access token to response header so client-side interceptor can persist it
        if (refreshed && refreshed.accessToken) {
          res.setHeader('x-access-token', refreshed.accessToken);
          // Attach user info to req.user for downstream handlers
          const decoded = jwtUtils.decodeToken(refreshed.accessToken) || {};
          req.user = { id: decoded.sub || decoded.id, role: decoded.role };
          return next();
        }
      } catch (e) {
        // Fall through to error handling below
        return next(
          new AppError(
            'Session could not be restored. Please log in again.',
            401,
            'REFRESH_FAILED'
          )
        );
      }
    }

    // Verify access token
    const decoded = jwtUtils.verifyToken(token);

    // Optionally, additional checks (exists in DB, password change) can be done here
    req.user = { id: decoded.sub || decoded.id, role: decoded.role };
    next();
  } catch (error) {
    // If token expired try to refresh using httpOnly refresh cookie
    if (error.name === 'TokenExpiredError') {
      const refreshToken = getRefreshTokenFromRequest(req);
      if (!refreshToken)
        return next(
          new AppError(
            'Your token has expired! Please log in again.',
            401,
            'TOKEN_EXPIRED'
          )
        );

      try {
        const refreshed = await authService.refreshToken(refreshToken);
        if (refreshed && refreshed.accessToken) {
          // Send new access token back in header for client to persist
          res.setHeader('x-access-token', refreshed.accessToken);
          const decoded = jwtUtils.decodeToken(refreshed.accessToken) || {};
          req.user = { id: decoded.sub || decoded.id, role: decoded.role };
          return next();
        }
        return next(
          new AppError(
            'Unable to refresh token. Please log in again.',
            401,
            'REFRESH_FAILED'
          )
        );
      } catch (e) {
        return next(
          new AppError(
            'Unable to refresh token. Please log in again.',
            401,
            'REFRESH_FAILED'
          )
        );
      }
    }

    if (error.name === 'JsonWebTokenError') {
      return next(
        new AppError(
          'Invalid token. Please log in again.',
          401,
          'INVALID_TOKEN'
        )
      );
    }

    return next(error);
  }
};

// Middleware to restrict access to specific roles
const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
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

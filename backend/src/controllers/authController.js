// Authentication controller with login, register, logout, refresh token endpoints
const authService = require('../services/authService');
const jwtUtils = require('../utils/jwt');

// Helper to read refresh token from cookie header or body
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

const setRefreshCookie = (res, token) => {
  const decoded = jwtUtils.decodeToken(token) || {};
  const maxAge = decoded.exp
    ? decoded.exp * 1000 - Date.now()
    : 7 * 24 * 3600 * 1000;
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge,
  });
};

const clearRefreshCookie = (res) => {
  res.clearCookie('refreshToken');
};

const authController = {
  // POST /auth/login
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);

      // Set httpOnly refresh cookie
      if (result.refreshToken) setRefreshCookie(res, result.refreshToken);

      return res
        .status(200)
        .json({ user: result.user, accessToken: result.accessToken });
    } catch (err) {
      // Map errors
      if (err.code === 'INVALID_CREDENTIALS')
        return res.status(401).json({ message: err.message });
      if (err.code === 'ACCOUNT_INACTIVE')
        return res.status(403).json({ message: err.message });
      return next(err);
    }
  },

  // POST /auth/register
  register: async (req, res, next) => {
    try {
      const { email, password, first_name, last_name } = req.body;
      const result = await authService.register({
        email,
        password,
        first_name,
        last_name,
      });

      if (result.refreshToken) setRefreshCookie(res, result.refreshToken);

      return res
        .status(201)
        .json({ user: result.user, accessToken: result.accessToken });
    } catch (err) {
      if (err.code === 'EMAIL_CONFLICT')
        return res.status(409).json({ message: err.message });
      return next(err);
    }
  },

  // POST /auth/logout
  logout: async (req, res, next) => {
    try {
      const token = getRefreshTokenFromRequest(req);
      if (token) await authService.revokeRefreshToken(token);
      clearRefreshCookie(res);
      return res.status(200).json({ message: 'Logged out' });
    } catch (err) {
      return next(err);
    }
  },

  // POST /auth/refresh
  refreshToken: async (req, res, next) => {
    try {
      const token = getRefreshTokenFromRequest(req);
      if (!token)
        return res.status(400).json({ message: 'Refresh token missing' });

      const result = await authService.refreshToken(token);
      // Optionally rotate tokens here; for now we return new access token
      return res.status(200).json({ accessToken: result.accessToken });
    } catch (err) {
      if (
        err.code &&
        (err.code.startsWith('REFRESH') || err.code === 'INVALID_REFRESH')
      ) {
        // Clear cookie on invalid/expired
        clearRefreshCookie(res);
        return res.status(401).json({ message: err.message });
      }
      return next(err);
    }
  },
};

module.exports = authController;

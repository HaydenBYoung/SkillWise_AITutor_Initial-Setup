// Authentication controller
const authService = require('../services/authService');
const jwtUtils = require('../utils/jwt');

const parseCookie = (cookieHeader) => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(';').map((p) => p.trim());
  for (const part of parts) {
    if (part.startsWith('refreshToken=')) {
      return decodeURIComponent(part.split('=')[1]);
    }
  }
  return null;
};

const setRefreshCookie = (res, token) => {
  try {
    const decoded = jwtUtils.decodeToken(token) || {};
    const expiresAt = decoded.exp ? decoded.exp * 1000 : undefined;
    const maxAge = expiresAt ? Math.max(0, expiresAt - Date.now()) : undefined;

    const cookieOptions = {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Strict',
    };

    if (maxAge) cookieOptions.maxAge = maxAge;

    // Set cookie on root path
    res.cookie('refreshToken', token, cookieOptions);
  } catch (err) {
    // Fail silently — cookie is optional
  }
};

const authController = {
  login: async (req, res, next) => {
    try {
      const body = req.validated?.body || req.body;
      const { email, password } = body;

      const result = await authService.login(email, password);

      // Set refresh token cookie
      if (result?.data?.refreshToken) {
        setRefreshCookie(res, result.data.refreshToken);
      }

      return res.status(200).json({
        success: true,
        data: {
          user: result.data.user,
          accessToken: result.data.accessToken,
        },
        message: result.message || 'Login successful',
      });
    } catch (err) {
      next(err);
    }
  },

  register: async (req, res, next) => {
    try {
      const body = req.validated?.body || req.body;
      const result = await authService.register(body);

      if (result?.data?.refreshToken) {
        setRefreshCookie(res, result.data.refreshToken);
      }

      return res.status(201).json({
        success: true,
        data: {
          user: result.data.user,
          accessToken: result.data.accessToken,
        },
        message: result.message || 'Account created successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      // Try cookie first
      const cookieToken = parseCookie(req.headers?.cookie || '');
      const token =
        cookieToken || req.body?.refreshToken || req.headers['x-refresh-token'];

      if (token) {
        await authService.revokeRefreshToken(token);
      }

      // Clear cookie
      res.clearCookie('refreshToken', { path: '/' });

      return res.status(200).json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (err) {
      next(err);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const cookieToken = parseCookie(req.headers?.cookie || '');
      const token =
        cookieToken || req.body?.refreshToken || req.headers['x-refresh-token'];

      const result = await authService.refreshToken(token);

      return res.status(200).json({
        success: true,
        data: result.data,
        message: result.message || 'Token refreshed',
      });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;

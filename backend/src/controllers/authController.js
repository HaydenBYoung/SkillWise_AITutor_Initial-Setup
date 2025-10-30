const authService = require('../services/authService');

// small helper to parse refreshToken from cookie header if cookie-parser isn't used
function parseCookie (req, name) {
  const header = req.headers && req.headers.cookie;
  if (!header) return null;
  const pairs = header.split(';').map(p => p.trim());
  for (const p of pairs) {
    const [k, ...v] = p.split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

const COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken';
const COOKIE_MAX_AGE = (() => {
  const d = process.env.REFRESH_COOKIE_MAX_AGE || (7 * 24 * 60 * 60 * 1000).toString();
  // if it's numeric string, return as int
  if (/^\d+$/.test(d)) return parseInt(d, 10);
  return parseInt(d, 10) || 7 * 24 * 60 * 60 * 1000;
})();

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: COOKIE_MAX_AGE,
};

const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.validated;
      const result = await authService.login(email, password);

      // set refresh cookie
      res.cookie(COOKIE_NAME, result.refreshToken, cookieOptions);

      return res.json({ user: result.user, accessToken: result.accessToken });
    } catch (err) {
      if (err.code === 'INVALID_CREDENTIALS') {
        err.status = 401;
      }
      return next(err);
    }
  },

  register: async (req, res, next) => {
    try {
      // Get validated data from validation middleware
      const { email, password, firstName, lastName } = req.validated;
      const result = await authService.register({ email, password, firstName, lastName });

      // set refresh cookie
      res.cookie(COOKIE_NAME, result.refreshToken, cookieOptions);

      return res.status(201).json({ user: result.user, accessToken: result.accessToken });
    } catch (err) {
      if (err.code === 'EMAIL_EXISTS') {
        err.status = 400;
        err.message = 'Email already registered';
      }
      return next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      const token = parseCookie(req, COOKIE_NAME) || (req.body && req.body.refreshToken);
      if (token) {
        await authService.revokeRefreshToken(token);
      }
      // clear cookie in client
      res.clearCookie(COOKIE_NAME, cookieOptions);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const token = parseCookie(req, COOKIE_NAME) || (req.body && req.body.refreshToken);
      const result = await authService.refreshToken(token);
      return res.json({ accessToken: result.accessToken });
    } catch (err) {
      if (['NO_REFRESH_TOKEN', 'INVALID_REFRESH', 'REVOKED_REFRESH', 'EXPIRED_REFRESH'].includes(err.code)) {
        err.status = 401;
      }
      return next(err);
    }
  },
};

module.exports = authController;

const authService = require('../services/authService');

// small helper to parse refreshToken from cookie header if cookie-parser isn't used
function parseCookie(req, name) {
  const header = req.headers && req.headers.cookie;
  if (!header) return null;
  const pairs = header.split(';').map((p) => p.trim());
  for (const p of pairs) {
    const [k, ...v] = p.split('=');
    if (k === name) return decodeURIComponent(v.join('='));
  }
  return null;
}

const COOKIE_NAME = process.env.REFRESH_COOKIE_NAME || 'refreshToken';
const COOKIE_MAX_AGE = (() => {
  const d =
    process.env.REFRESH_COOKIE_MAX_AGE || (7 * 24 * 60 * 60 * 1000).toString();
  // if it's numeric string, return as int
  if (/^\d+$/.test(d)) return parseInt(d, 10);
  return parseInt(d, 10) || 7 * 24 * 60 * 60 * 1000;
})();

// Allow SameSite to be configured via env var; default to 'none' so httpOnly refresh
// cookies are sent on cross-origin XHR (frontend on localhost:3000 -> API on 3001).
// In production the secure flag will be true, and browsers require SameSite=None to be Secure.
const COOKIE_SAMESITE = process.env.REFRESH_COOKIE_SAMESITE || 'none';

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: COOKIE_SAMESITE,
  maxAge: COOKIE_MAX_AGE,
};

const authController = {
  login: async (req, res, next) => {
    try {
      // Support validated payload from validation middleware, but fall back to raw body
      const { email, password } = req.validated || req.body || {};

      // Minimal request logging for debugging login failures (do not log full password)
      try {
        const masked = password
          ? '*'.repeat(Math.min(3, password.length))
          : '(no password)';
        console.log(
          `[auth] Login attempt for email=${email} password_mask=${masked}`
        );
      } catch (e) {
        console.log('[auth] Login attempt (unable to log details)');
      }

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
      const result = await authService.register({
        email,
        password,
        firstName,
        lastName,
      });

      // set refresh cookie
      res.cookie(COOKIE_NAME, result.refreshToken, cookieOptions);

      return res
        .status(201)
        .json({ user: result.user, accessToken: result.accessToken });
    } catch (err) {
      // Log for diagnostics in CI and local runs
      try {
        console.error('[auth] Registration error:', err && err.message);
      } catch (logErr) {
        // ignore logging failures
      }
      if (err.code === 'EMAIL_EXISTS') {
        err.status = 400;
        err.message = 'Email already registered';
      }
      return next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      const token =
        parseCookie(req, COOKIE_NAME) || (req.body && req.body.refreshToken);
      if (token) {
        await authService.revokeRefreshToken(token);
      }
      // clear cookie in client
      // res.clearCookie should not need options; passing options.maxAge is deprecated
      res.clearCookie(COOKIE_NAME);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      const token =
        parseCookie(req, COOKIE_NAME) || (req.body && req.body.refreshToken);
      const result = await authService.refreshToken(token);
      return res.json({ accessToken: result.accessToken });
    } catch (err) {
      if (
        [
          'NO_REFRESH_TOKEN',
          'INVALID_REFRESH',
          'REVOKED_REFRESH',
          'EXPIRED_REFRESH',
        ].includes(err.code)
      ) {
        err.status = 401;
      }
      return next(err);
    }
  },
};

module.exports = authController;

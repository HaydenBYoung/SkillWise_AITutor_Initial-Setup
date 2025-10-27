const jwt = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

const authService = {
  // User login: verifies credentials, returns { user, accessToken, refreshToken }
  login: async (email, password) => {
    const { rows } = await db.query('SELECT id, email, password_hash, first_name, last_name, role FROM users WHERE email = $1', [email]);
    const user = rows[0];
    if (!user) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      throw new AppError('Invalid credentials', 401, 'INVALID_CREDENTIALS');
    }

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.generateToken(payload);
    const refreshToken = jwt.generateRefreshToken(payload);

    // Store refresh token in DB with expiry
    const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    // Compute expiry timestamp approx (support days '7d')
    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // default 7 days
    // If env uses numeric seconds, try parseInt
    if (/^\d+$/.test(expiresIn)) {
      expiresAt = new Date(Date.now() + parseInt(expiresIn) * 1000);
    } else if (/^(\d+)d$/.test(expiresIn)) {
      const days = parseInt(expiresIn.match(/^(\d+)d$/)[1]);
      expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    }

    await db.query(
      'INSERT INTO refresh_tokens(token, user_id, expires_at, is_revoked) VALUES($1, $2, $3, false)',
      [refreshToken, user.id, expiresAt]
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  },

  // User registration: creates user and returns tokens
  register: async (userData) => {
    const { email, password, firstName, lastName } = userData;

    // check existing
    const { rows: existing } = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.length > 0) {
      throw new AppError('Email already registered', 400, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const insert = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, role`,
      [email, passwordHash, firstName, lastName]
    );

    const user = insert.rows[0];

    const payload = { id: user.id, email: user.email, role: user.role };
    const accessToken = jwt.generateToken(payload);
    const refreshToken = jwt.generateRefreshToken(payload);

    // Store refresh token
    let expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await db.query('INSERT INTO refresh_tokens(token, user_id, expires_at, is_revoked) VALUES($1,$2,$3,false)', [refreshToken, user.id, expiresAt]);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role
      },
      accessToken,
      refreshToken
    };
  },

  // Refresh access token using a valid refresh token
  refreshToken: async (token) => {
    if (!token) {
      throw new AppError('Refresh token not found', 401, 'NO_REFRESH_TOKEN');
    }

    // Check token in DB
    const { rows } = await db.query('SELECT id, token, user_id, expires_at, is_revoked FROM refresh_tokens WHERE token = $1', [token]);
    const record = rows[0];
    if (!record) {
      throw new AppError('Refresh token not found', 401, 'INVALID_REFRESH');
    }

    if (record.is_revoked) {
      throw new AppError('Refresh token revoked', 401, 'REVOKED_REFRESH');
    }

    if (new Date(record.expires_at) < new Date()) {
      throw new AppError('Refresh token expired', 401, 'EXPIRED_REFRESH');
    }

    // Verify signature
    let payload;
    try {
      payload = jwt.verifyRefreshToken(token);
    } catch (err) {
      const e = new Error('Invalid refresh token');
      e.code = 'INVALID_REFRESH';
      throw e;
    }

    // Issue new access token
    const accessToken = jwt.generateToken({ id: payload.id, email: payload.email, role: payload.role });
    return { accessToken };
  },

  // Revoke refresh token (logout)
  revokeRefreshToken: async (token) => {
    if (!token) return;
    await db.query('UPDATE refresh_tokens SET is_revoked = true WHERE token = $1', [token]);
  },

  // Password reset placeholder
  resetPassword: async (email) => {
    // Implementation would generate token and email user
    return true;
  }
};

module.exports = authService;
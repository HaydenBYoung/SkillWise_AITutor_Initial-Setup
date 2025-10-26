// Authentication business logic
const db = require('../database/connection');
const jwtUtils = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const { AppError } = require('../middleware/errorHandler');

const parseDurationToMs = (str) => {
  // support formats like '7d', '15m', '3600s', '2h'
  if (!str) return 7 * 24 * 60 * 60 * 1000; // default 7 days
  const num = parseInt(str.slice(0, -1), 10);
  const unit = str.slice(-1);
  if (Number.isNaN(num)) return 7 * 24 * 60 * 60 * 1000;
  switch (unit) {
    case 'd':
      return num * 24 * 60 * 60 * 1000;
    case 'h':
      return num * 60 * 60 * 1000;
    case 'm':
      return num * 60 * 1000;
    case 's':
      return num * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
};

const authService = {
  // User login: verify credentials, generate tokens and store refresh token
  login: async (email, password) => {
    const { rows } = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, is_active FROM users WHERE email = $1',
      [email]
    );
    const user = rows[0];

    if (!user) {
      throw new AppError(
        'Invalid credentials',
        401,
        'AUTH_INVALID_CREDENTIALS'
      );
    }

    if (!user.is_active) {
      throw new AppError(
        'User account is deactivated',
        403,
        'AUTH_USER_INACTIVE'
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      throw new AppError(
        'Invalid credentials',
        401,
        'AUTH_INVALID_CREDENTIALS'
      );
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Generate tokens
    const accessToken = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = jwtUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token with expiry
    const refreshTtlMs = parseDurationToMs(
      process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    );
    const expiresAt = new Date(Date.now() + refreshTtlMs);

    await db.query(
      'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [refreshToken, user.id, expiresAt]
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
    };

    return {
      success: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
      message: 'Login successful',
    };
  },

  // User registration: create user, hash password, generate tokens
  register: async (userData) => {
    const { email, password, firstName, lastName } = userData;

    // Check duplicate
    const { rows: existing } = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    if (existing[0]) {
      throw new AppError('Email already in use', 400, 'AUTH_EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const { rows } = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name)
       VALUES ($1, $2, $3, $4) RETURNING id, email, first_name, last_name, created_at`,
      [
        email,
        passwordHash,
        firstName || userData.first_name,
        lastName || userData.last_name,
      ]
    );

    const user = rows[0];

    // Generate tokens
    const accessToken = jwtUtils.generateToken({
      userId: user.id,
      email: user.email,
    });
    const refreshToken = jwtUtils.generateRefreshToken({
      userId: user.id,
      email: user.email,
    });

    // Store refresh token
    const refreshTtlMs = parseDurationToMs(
      process.env.JWT_REFRESH_EXPIRES_IN || '7d'
    );
    const expiresAt = new Date(Date.now() + refreshTtlMs);

    await db.query(
      'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [refreshToken, user.id, expiresAt]
    );

    const safeUser = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      createdAt: user.created_at,
    };

    return {
      success: true,
      data: {
        user: safeUser,
        accessToken,
        refreshToken,
      },
      message: 'Account created successfully',
    };
  },

  // Refresh: validate refresh token and issue new access token
  refreshToken: async (token) => {
    if (!token) {
      throw new AppError(
        'No refresh token provided',
        401,
        'AUTH_TOKEN_MISSING'
      );
    }

    // Verify signature
    let payload;
    try {
      payload = jwtUtils.verifyRefreshToken(token);
    } catch (err) {
      throw new AppError('Invalid refresh token', 401, 'AUTH_TOKEN_INVALID');
    }

    // Check DB for token and not revoked
    const { rows } = await db.query(
      'SELECT id, user_id, is_revoked, expires_at FROM refresh_tokens WHERE token = $1',
      [token]
    );
    const row = rows[0];
    if (!row || row.is_revoked) {
      throw new AppError(
        'Refresh token revoked or not found',
        401,
        'AUTH_TOKEN_INVALID'
      );
    }

    if (new Date(row.expires_at) < new Date()) {
      throw new AppError('Refresh token expired', 401, 'AUTH_TOKEN_EXPIRED');
    }

    // Issue new access token
    const accessToken = jwtUtils.generateToken({
      userId: payload.userId,
      email: payload.email,
    });

    return {
      success: true,
      data: {
        accessToken,
      },
      message: 'Token refreshed',
    };
  },

  // Revoke or remove a refresh token (logout)
  revokeRefreshToken: async (token) => {
    if (!token) return;
    await db.query(
      'UPDATE refresh_tokens SET is_revoked = true, updated_at = CURRENT_TIMESTAMP WHERE token = $1',
      [token]
    );
  },
};

module.exports = authService;

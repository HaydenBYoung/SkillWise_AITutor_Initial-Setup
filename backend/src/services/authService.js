// Authentication business logic
//make sure logic matches other files
const jwtUtils = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const db = require('../database/connection');

const DEFAULT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

const authService = {
  // Login: validate credentials, return { user, accessToken, refreshToken }
  login: async (email, password) => {
    // Fetch user by email
    const { rows } = await db.query(
      'SELECT id, email, password_hash, first_name, last_name, is_active, is_verified, role FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    const user = rows[0];

    if (!user) {
      const err = new Error('Invalid email or password');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (!user.is_active) {
      const err = new Error('Account is deactivated');
      err.code = 'ACCOUNT_INACTIVE';
      throw err;
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      const err = new Error('Invalid email or password');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    // Build user payload to return (omit password)
    const userPayload = {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
      is_verified: user.is_verified,
    };

    // Generate tokens
    const accessToken = jwtUtils.generateToken({
      sub: user.id,
      role: user.role,
    });
    const refreshToken = jwtUtils.generateRefreshToken({ sub: user.id });

    // Decode refresh token to get expiry
    const decoded = jwtUtils.decodeToken(refreshToken);
    const expiresAt =
      decoded && decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 3600 * 1000);

    // Store refresh token in DB
    await db.query(
      'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
      [refreshToken, user.id, expiresAt]
    );

    // Update last_login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    return { user: userPayload, accessToken, refreshToken };
  },

  // Register: create user and return tokens
  register: async (userData) => {
    const email = (userData.email || '').toLowerCase();

    // Ensure email not already used
    const exists = await db.query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);
    if (exists.rows.length > 0) {
      const err = new Error('Email already in use');
      err.code = 'EMAIL_CONFLICT';
      throw err;
    }

    const passwordHash = await bcrypt.hash(
      userData.password,
      DEFAULT_SALT_ROUNDS
    );

    // Insert user and generate tokens within a transaction
    return await db.withTransaction(async (tx) => {
      const insertUser = await tx(
        'INSERT INTO users (email, password_hash, first_name, last_name, is_verified, role) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email, first_name, last_name, role, is_verified',
        [
          email,
          passwordHash,
          userData.first_name || userData.name || '',
          userData.last_name || '',
          false,
          userData.role || 'student',
        ]
      );

      const user = insertUser.rows[0];

      const accessToken = jwtUtils.generateToken({
        sub: user.id,
        role: user.role,
      });
      const refreshToken = jwtUtils.generateRefreshToken({ sub: user.id });
      const decoded = jwtUtils.decodeToken(refreshToken);
      const expiresAt =
        decoded && decoded.exp
          ? new Date(decoded.exp * 1000)
          : new Date(Date.now() + 7 * 24 * 3600 * 1000);

      await tx(
        'INSERT INTO refresh_tokens (token, user_id, expires_at) VALUES ($1, $2, $3)',
        [refreshToken, user.id, expiresAt]
      );

      const userPayload = {
        id: user.id,
        email: user.email,
        first_name: user.first_name,
        last_name: user.last_name,
        role: user.role,
        is_verified: user.is_verified,
      };

      return { user: userPayload, accessToken, refreshToken };
    });
  },

  // Refresh: validate refresh token and return new access token (and optionally rotate refresh token)
  refreshToken: async (token) => {
    if (!token) {
      const err = new Error('Refresh token missing');
      err.code = 'NO_REFRESH_TOKEN';
      throw err;
    }

    try {
      jwtUtils.verifyRefreshToken(token);
    } catch (e) {
      const err = new Error('Invalid refresh token');
      err.code = 'INVALID_REFRESH';
      throw err;
    }

    // Check DB for token
    const { rows } = await db.query(
      'SELECT id, user_id, expires_at, is_revoked FROM refresh_tokens WHERE token = $1',
      [token]
    );
    const record = rows[0];
    if (!record) {
      const err = new Error('Refresh token not found');
      err.code = 'REFRESH_NOT_FOUND';
      throw err;
    }

    if (record.is_revoked) {
      const err = new Error('Refresh token revoked');
      err.code = 'REFRESH_REVOKED';
      throw err;
    }

    if (new Date(record.expires_at) < new Date()) {
      const err = new Error('Refresh token expired');
      err.code = 'REFRESH_EXPIRED';
      throw err;
    }

    // Issue new access token
    const accessToken = jwtUtils.generateToken({ sub: record.user_id });
    return { accessToken };
  },

  // Logout: revoke refresh token
  revokeRefreshToken: async (token) => {
    if (!token) return;
    await db.query(
      'UPDATE refresh_tokens SET is_revoked = true WHERE token = $1',
      [token]
    );
  },
};

module.exports = authService;

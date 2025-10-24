// TODO: Implement authentication business logic
const jwt = require('../utils/jwt');
const bcrypt = require('bcryptjs');

// Parse simple duration strings like '7d', '1h', '15m' into milliseconds
function parseDuration(str) {
  if (!str) return 0;
  const match = /^([0-9]+)([smhd])$/.exec(str);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value * 1000;
    case 'm': return value * 60 * 1000;
    case 'h': return value * 60 * 60 * 1000;
    case 'd': return value * 24 * 60 * 60 * 1000;
    default: return 0;
  }
}

const authService = {
  // Implement user login logic
  login: async (email, password) => {
    const User = require('../models/User');
    if (!email || !password) throw new Error('Email and password are required');

    const user = await User.findByEmail(email);
    if (!user) throw new Error('Invalid email or password');

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) throw new Error('Invalid email or password');

    // Delete old refresh tokens for this user to prevent duplicates
    const RefreshTokenModel = require('../models/RefreshToken');
    await RefreshTokenModel.deleteByUserId(user.id);

    // generate tokens with timestamp to ensure uniqueness
    const token = jwt.generateToken({ id: user.id, email: user.email, timestamp: Date.now() });
    const refreshToken = jwt.generateRefreshToken({ id: user.id, email: user.email, timestamp: Date.now() });

    // Persist refresh token
    const expiresIn = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
    const expiresAt = new Date(Date.now() + expiresIn);
    await RefreshTokenModel.create({ token: refreshToken, userId: user.id, expiresAt });

    return {
      token,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name
      }
    };
  },

  // Register a new user
  register: async (userData) => {
    try {
      const { firstName, lastName, email, password, confirmPassword } = userData;

      if (!firstName || !lastName || !email || !password || !confirmPassword) {
        throw new Error('Missing required fields');
      }

      if (password !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      const User = require('../models/User');

      const existing = await User.findByEmail(email);
      if (existing) {
        throw new Error('Email already registered');
      }

      const user = await User.create({ email, password, firstName, lastName });

      const token = jwt.generateToken({ id: user.id, email: user.email, timestamp: Date.now() });
      const refreshToken = jwt.generateRefreshToken({ id: user.id, email: user.email, timestamp: Date.now() });

      // Persist refresh token
      const RefreshTokenModel = require('../models/RefreshToken');
      const expiresIn = parseDuration(process.env.JWT_REFRESH_EXPIRES_IN || '7d');
      const expiresAt = new Date(Date.now() + expiresIn);
      await RefreshTokenModel.create({ token: refreshToken, userId: user.id, expiresAt });

      return {
        token,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
        },
      };
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error('Registration failed');
    }
  },

  // TODO: Implement token refresh
  refreshToken: async (refreshToken) => {
    const RefreshTokenModel = require('../models/RefreshToken');
    if (!refreshToken) throw new Error('Refresh token required');

    // Find token in DB
    const stored = await RefreshTokenModel.findByToken(refreshToken);
    if (!stored || stored.is_revoked) throw new Error('Invalid refresh token');

    // Verify JWT
    let payload;
    try {
      payload = jwt.verifyRefreshToken(refreshToken);
    } catch (err) {
      throw new Error('Invalid refresh token');
    }

    // Issue new access token
    const newAccessToken = jwt.generateToken({ id: payload.id, email: payload.email });
    return { accessToken: newAccessToken };
  },

  // Revoke a refresh token (logout)
  revokeRefreshToken: async (refreshToken) => {
    const RefreshTokenModel = require('../models/RefreshToken');
    if (!refreshToken) throw new Error('Refresh token required');
    const revoked = await RefreshTokenModel.revoke(refreshToken);
    return revoked;
  },

  // TODO: Implement password reset
  resetPassword: async (email) => {
    // Implementation needed
    throw new Error('Not implemented');
  }
};

module.exports = authService;
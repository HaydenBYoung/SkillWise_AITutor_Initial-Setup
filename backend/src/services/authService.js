// Authentication business logic (MongoDB implementation)
const jwtUtils = require('../utils/jwt');
const bcrypt = require('bcryptjs');
const mongo = require('../database/mongoClient');

const DEFAULT_SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;

const authService = {
  // Login: validate credentials, return { user, accessToken, refreshToken }
  login: async (email, password) => {
    await mongo.connect();
    const usersCol = mongo.getCollection('users');
    const tokensCol = mongo.getCollection('refresh_tokens');

    const normalizedEmail = (email || '').toLowerCase();
    const user = await usersCol.findOne({ email: normalizedEmail });

    if (!user) {
      const err = new Error('Invalid email or password');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    if (user.is_active === false) {
      const err = new Error('Account is deactivated');
      err.code = 'ACCOUNT_INACTIVE';
      throw err;
    }

    const match = await bcrypt.compare(password, user.password_hash || '');
    if (!match) {
      const err = new Error('Invalid email or password');
      err.code = 'INVALID_CREDENTIALS';
      throw err;
    }

    const userPayload = {
      id: user._id.toString(),
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || 'student',
      is_verified: !!user.is_verified,
    };

    const accessToken = jwtUtils.generateToken({
      sub: user._id.toString(),
      role: userPayload.role,
    });
    const refreshToken = jwtUtils.generateRefreshToken({
      sub: user._id.toString(),
    });

    const decoded = jwtUtils.decodeToken(refreshToken);
    const expiresAt =
      decoded && decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 3600 * 1000);

    await tokensCol.insertOne({
      token: refreshToken,
      user_id: user._id,
      expires_at: expiresAt,
      is_revoked: false,
      createdAt: new Date(),
    });

    await usersCol.updateOne(
      { _id: user._id },
      { $set: { last_login: new Date(), updatedAt: new Date() } }
    );

    return { user: userPayload, accessToken, refreshToken };
  },

  // Register: create user and return tokens
  register: async (userData) => {
    await mongo.connect();
    const usersCol = mongo.getCollection('users');
    const tokensCol = mongo.getCollection('refresh_tokens');

    const email = (userData.email || '').toLowerCase();

    const exists = await usersCol.findOne({ email });
    if (exists) {
      const err = new Error('Email already in use');
      err.code = 'EMAIL_CONFLICT';
      throw err;
    }

    const passwordHash = await bcrypt.hash(
      userData.password,
      DEFAULT_SALT_ROUNDS
    );

    const now = new Date();
    const newUser = {
      email,
      password_hash: passwordHash,
      first_name: userData.first_name || userData.name || '',
      last_name: userData.last_name || '',
      is_verified: false,
      is_active: true,
      role: userData.role || 'student',
      createdAt: now,
      updatedAt: now,
    };

    const insertResult = await usersCol.insertOne(newUser);
    const createdUser = await usersCol.findOne({
      _id: insertResult.insertedId,
    });

    const accessToken = jwtUtils.generateToken({
      sub: createdUser._id.toString(),
      role: createdUser.role,
    });
    const refreshToken = jwtUtils.generateRefreshToken({
      sub: createdUser._id.toString(),
    });
    const decoded = jwtUtils.decodeToken(refreshToken);
    const expiresAt =
      decoded && decoded.exp
        ? new Date(decoded.exp * 1000)
        : new Date(Date.now() + 7 * 24 * 3600 * 1000);

    await tokensCol.insertOne({
      token: refreshToken,
      user_id: createdUser._id,
      expires_at: expiresAt,
      is_revoked: false,
      createdAt: new Date(),
    });

    const userPayload = {
      id: createdUser._id.toString(),
      email: createdUser.email,
      first_name: createdUser.first_name || '',
      last_name: createdUser.last_name || '',
      role: createdUser.role || 'student',
      is_verified: !!createdUser.is_verified,
    };

    return { user: userPayload, accessToken, refreshToken };
  },

  // Refresh: validate refresh token and return new access token
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

    await mongo.connect();
    const tokensCol = mongo.getCollection('refresh_tokens');
    const record = await tokensCol.findOne({ token });
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

    if (record.expires_at && new Date(record.expires_at) < new Date()) {
      const err = new Error('Refresh token expired');
      err.code = 'REFRESH_EXPIRED';
      throw err;
    }

    const accessToken = jwtUtils.generateToken({
      sub: record.user_id.toString(),
    });
    return { accessToken };
  },

  // Logout: revoke refresh token
  revokeRefreshToken: async (token) => {
    if (!token) return;
    await mongo.connect();
    const tokensCol = mongo.getCollection('refresh_tokens');
    await tokensCol.updateOne(
      { token },
      { $set: { is_revoked: true, revokedAt: new Date() } }
    );
  },
};

module.exports = authService;

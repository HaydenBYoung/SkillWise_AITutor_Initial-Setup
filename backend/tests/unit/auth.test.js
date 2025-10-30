const authService = require('../../src/services/authService');
const db = require('../../src/database/connection');
const jwt = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

jest.mock('../../src/database/connection');
jest.mock('bcryptjs');
jest.mock('../../src/utils/jwt');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const mockUser = {
      id: 1,
      email: 'test@example.com',
      password_hash: 'hashedPassword123',
      first_name: 'Test',
      last_name: 'User',
      role: 'student',
    };

    it('should successfully login with valid credentials', async () => {
      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(true);
      jwt.generateToken.mockReturnValueOnce('accessToken123');
      jwt.generateRefreshToken.mockReturnValueOnce('refreshToken123');
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // refresh token insert

      const result = await authService.login('test@example.com', 'password123');

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBe('accessToken123');
      expect(result.refreshToken).toBe('refreshToken123');
      expect(db.query).toHaveBeenCalledTimes(2);
      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashedPassword123');
    });

    it('should throw error for non-existent user', async () => {
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(authService.login('nonexistent@example.com', 'password123'))
        .rejects.toThrow('Invalid credentials');
    });

    it('should throw error for invalid password', async () => {
      db.query.mockResolvedValueOnce({ rows: [mockUser] });
      bcrypt.compare.mockResolvedValueOnce(false);

      await expect(authService.login('test@example.com', 'wrongpassword'))
        .rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    const mockUserData = {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    it('should successfully register new user', async () => {
      db.query.mockResolvedValueOnce({ rows: [] }); // no existing user
      bcrypt.hash.mockResolvedValueOnce('hashedPassword123');
      db.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: mockUserData.email, first_name: mockUserData.firstName, last_name: mockUserData.lastName, role: 'student' }],
      });
      jwt.generateToken.mockReturnValueOnce('accessToken123');
      jwt.generateRefreshToken.mockReturnValueOnce('refreshToken123');
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // refresh token insert

      const result = await authService.register(mockUserData);

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
      expect(db.query).toHaveBeenCalledTimes(3);
      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserData.password, expect.any(Number));
    });

    it('should throw error for existing email', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }); // existing user

      await expect(authService.register(mockUserData))
        .rejects.toThrow('Email already registered');
    });
  });

  describe('refreshToken', () => {
    const mockToken = 'refreshToken123';
    const mockTokenRecord = {
      id: 1,
      token: mockToken,
      user_id: 1,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000), // tomorrow
      is_revoked: false,
    };

    it('should refresh token successfully', async () => {
      db.query.mockResolvedValueOnce({ rows: [mockTokenRecord] });
      jwt.verifyRefreshToken.mockReturnValueOnce({ id: 1, email: 'test@example.com', role: 'student' });
      jwt.generateToken.mockReturnValueOnce('newAccessToken123');

      const result = await authService.refreshToken(mockToken);

      expect(result.accessToken).toBe('newAccessToken123');
      expect(jwt.verifyRefreshToken).toHaveBeenCalledWith(mockToken);
    });

    it('should throw error for revoked token', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ ...mockTokenRecord, is_revoked: true }],
      });

      await expect(authService.refreshToken(mockToken))
        .rejects.toThrow('Refresh token revoked');
    });

    it('should throw error for expired token', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{ ...mockTokenRecord, expires_at: new Date(Date.now() - 1000) }],
      });

      await expect(authService.refreshToken(mockToken))
        .rejects.toThrow('Refresh token expired');
    });
  });

  describe('revokeRefreshToken', () => {
    it('should revoke token successfully', async () => {
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      await authService.revokeRefreshToken('token123');

      expect(db.query).toHaveBeenCalledWith(
        'UPDATE refresh_tokens SET is_revoked = true WHERE token = $1',
        ['token123'],
      );
    });

    it('should do nothing if no token provided', async () => {
      await authService.revokeRefreshToken();
      expect(db.query).not.toHaveBeenCalled();
    });
  });
});

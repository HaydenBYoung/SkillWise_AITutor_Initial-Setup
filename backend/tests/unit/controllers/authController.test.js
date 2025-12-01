const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/authService');

describe('AuthController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {}, user: null, cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      cookie: jest.fn(),
      send: jest.fn(),
      clearCookie: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('should login with valid credentials', async () => {
      req.body = { email: 'test@test.com', password: 'Password123!' };
      const loginResult = {
        user: { id: 1, email: 'test@test.com' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      jest.spyOn(authService, 'login').mockResolvedValue(loginResult);

      await authController.login(req, res, next);

      expect(authService.login).toHaveBeenCalledWith('test@test.com', 'Password123!');
      expect(res.json).toHaveBeenCalledWith({
        user: loginResult.user,
        accessToken: loginResult.accessToken,
      });
    });

    test('should reject invalid credentials', async () => {
      req.body = { email: 'bad@test.com', password: 'wrong' };
      const error = new Error('Invalid credentials');
      jest.spyOn(authService, 'login').mockRejectedValue(error);

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });

    test('should return 400 if email missing', async () => {
      req.body = { password: 'Password123!' };
      const error = Object.assign(new Error('Email and password required'), { code: 'VALIDATION_ERROR' });
      jest.spyOn(authService, 'login').mockRejectedValue(error);

      await authController.login(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('register', () => {
    test('should register new user with valid data', async () => {
      req.body = {
        email: 'new@test.com',
        password: 'Password123!',
        firstName: 'New',
        lastName: 'User',
      };
      req.validated = req.body; // Set validated data
      const registerResult = {
        user: { id: 2, email: 'new@test.com', firstName: 'New' },
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };
      jest.spyOn(authService, 'register').mockResolvedValue(registerResult);

      await authController.register(req, res, next);

      expect(authService.register).toHaveBeenCalledWith({
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
      });
      expect(res.json).toHaveBeenCalledWith({
        user: registerResult.user,
        accessToken: registerResult.accessToken,
      });
    });

    test('should reject duplicate email', async () => {
      req.body = {
        email: 'existing@test.com',
        password: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };
      req.validated = req.body; // Set validated data
      const error = new Error('Email already registered');
      jest.spyOn(authService, 'register').mockRejectedValue(error);

      await authController.register(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('refreshToken', () => {
    test('should refresh token with valid refresh token', async () => {
      req.body = { refreshToken: 'valid-refresh-token' };
      const result = { accessToken: 'new-access-token' };
      jest.spyOn(authService, 'refreshToken').mockResolvedValue(result);

      await authController.refreshToken(req, res, next);

      expect(authService.refreshToken).toHaveBeenCalledWith('valid-refresh-token');
      expect(res.json).toHaveBeenCalledWith(result);
    });

    test('should return 400 if refresh token missing', async () => {
      req.body = {};
      jest.spyOn(authService, 'refreshToken').mockRejectedValue(
        Object.assign(new Error('No refresh token'), { code: 'NO_REFRESH_TOKEN' })
      );

      await authController.refreshToken(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        code: 'NO_REFRESH_TOKEN'
      }));
    });
  });

  describe('logout', () => {
    test('should logout and revoke refresh token', async () => {
      req.body = { refreshToken: 'token-to-revoke' };
      jest.spyOn(authService, 'revokeRefreshToken').mockResolvedValue(true);

      await authController.logout(req, res, next);

      expect(authService.revokeRefreshToken).toHaveBeenCalledWith('token-to-revoke');
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    test('should send password reset email', async () => {
      req.body = { email: 'user@test.com' };
      jest.spyOn(authService, 'forgotPassword').mockResolvedValue({ message: 'Reset link sent' });

      await authController.forgotPassword(req, res, next);

      expect(authService.forgotPassword).toHaveBeenCalledWith('user@test.com');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 if email missing', async () => {
      req.body = {};

      await authController.forgotPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('resetPassword', () => {
    test('should reset password with valid token', async () => {
      req.body = { token: 'valid-token', password: 'NewPassword123!' };
      jest.spyOn(authService, 'resetPassword').mockResolvedValue({ message: 'Password reset successful' });

      await authController.resetPassword(req, res, next);

      expect(authService.resetPassword).toHaveBeenCalledWith('valid-token', 'NewPassword123!');
      expect(res.status).toHaveBeenCalledWith(200);
    });

    test('should return 400 if token or password missing', async () => {
      req.body = { token: 'valid-token' };

      await authController.resetPassword(req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });
});

module.exports = {};

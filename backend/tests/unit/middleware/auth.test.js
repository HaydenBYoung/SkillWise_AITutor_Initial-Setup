const jwt = require('../../../src/utils/jwt');
const auth = require('../../../src/middleware/auth');

describe('Auth Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null,
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    test('should authenticate valid JWT token', async () => {
      const payload = { id: 1, email: 'test@test.com', role: 'student' };
      const token = jwt.generateToken(payload);
      req.headers.authorization = `Bearer ${token}`;

      await auth.authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(1);
      expect(req.user.email).toBe('test@test.com');
      expect(next).toHaveBeenCalledWith();
    });

    test('should reject invalid token', async () => {
      req.headers.authorization = 'Bearer invalid-token';

      await auth.authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'INVALID_TOKEN',
        })
      );
    });

    test('should reject expired token', async () => {
      // Mock jwt.verifyToken at the module level before it's called
      const error = new Error('jwt expired');
      error.name = 'TokenExpiredError';
      
      const originalVerify = jwt.verifyToken;
      jwt.verifyToken = jest.fn().mockRejectedValue(error);

      req.headers.authorization = 'Bearer expired-token';

      await auth.authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'TOKEN_EXPIRED',
        })
      );

      // Restore original
      jwt.verifyToken = originalVerify;
    });

    test('should reject missing token', () => {
      // No authorization header
      auth.authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'NO_TOKEN',
        })
      );
    });

    test('should reject malformed authorization header', () => {
      req.headers.authorization = 'InvalidFormat';

      auth.authenticateToken(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'NO_TOKEN',
        })
      );
    });
  });

  describe('restrictTo', () => {
    test('should allow user with correct role', () => {
      req.user = { id: 1, email: 'admin@test.com', role: 'admin' };
      const middleware = auth.restrictTo('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should reject user with wrong role', () => {
      req.user = { id: 1, email: 'student@test.com', role: 'student' };
      const middleware = auth.restrictTo('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 403,
          code: 'INSUFFICIENT_PERMISSIONS',
        })
      );
    });

    test('should reject if user not authenticated', () => {
      req.user = null;
      const middleware = auth.restrictTo('admin');

      middleware(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 401,
          code: 'AUTHENTICATION_REQUIRED',
        })
      );
    });
  });
});

module.exports = {};

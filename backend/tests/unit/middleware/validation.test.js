const validation = require('../../../src/middleware/validation');
const { schemas } = validation;

describe('Validation Middleware', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('loginValidation', () => {
    test('should validate correct login data', () => {
      req.body = { email: 'test@test.com', password: 'password123' };

      validation.loginValidation(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    test('should reject invalid email format', () => {
      req.body = { email: 'invalid-email', password: 'password123' };

      validation.loginValidation(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('Invalid email format'),
      }));
    });

    test('should reject missing password', () => {
      req.body = { email: 'test@test.com' };

      validation.loginValidation(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('required'),
      }));
    });
  });

  describe('registerValidation', () => {
    test('should validate registration data', () => {
      req.body = {
        email: 'test@test.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'Test',
        lastName: 'User',
      };

      validation.registerValidation(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.validated).toBeDefined();
    });

    test('should enforce password requirements', () => {
      req.body = {
        email: 'test@test.com',
        password: 'weak',
        confirmPassword: 'weak',
        firstName: 'Test',
        lastName: 'User',
      };

      validation.registerValidation(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('password'),
      }));
    });

    test('should reject password mismatch', () => {
      req.body = {
        email: 'test@test.com',
        password: 'Password123!',
        confirmPassword: 'DifferentPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      validation.registerValidation(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.objectContaining({
        message: expect.stringContaining('match'),
      }));
    });

    test('should require all fields', () => {
      req.body = {
        email: 'test@test.com',
        password: 'Password123!',
      };

      validation.registerValidation(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('goalValidation', () => {
    test('should validate goal data', () => {
      req.body = {
        title: 'Learn JavaScript',
        description: 'Master JS fundamentals',
        difficulty: 'medium',
      };

      validation.goalValidation(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should reject missing title', () => {
      req.body = {
        description: 'Description',
      };

      validation.goalValidation(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });

    test('should accept valid difficulty levels', () => {
      req.body = {
        title: 'Goal',
        difficulty: 'hard',
      };

      validation.goalValidation(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });
  });

  describe('challengeValidation', () => {
    test('should validate challenge data', () => {
      req.body = {
        title: 'Test Challenge',
        description: 'Challenge description',
        instructions: 'Do this task',
        category: 'JavaScript',
        difficulty: 'easy',
      };

      validation.challengeValidation(req, res, next);

      expect(next).toHaveBeenCalledWith();
    });

    test('should reject missing required fields', () => {
      req.body = {
        title: 'Test Challenge',
      };

      validation.challengeValidation(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });
});

module.exports = {};

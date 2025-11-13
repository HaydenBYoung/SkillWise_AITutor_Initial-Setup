// Implemented authentication service unit tests
const authService = require('../../../src/services/authService');
const db = require('../../../src/database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('../../../src/utils/jwt');

describe('AuthService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('login', () => {
    test('should authenticate valid user', async () => {
      const userRow = {
        id: 'u1',
        email: 'a@b.com',
        password_hash: 'hashedpw',
        first_name: 'First',
        last_name: 'Last',
        role: 'member',
      };

      jest.spyOn(db, 'query').mockImplementation((query, params) => {
        if (query.startsWith('SELECT id, email'))
          return Promise.resolve({ rows: [userRow] });
        if (query.startsWith('INSERT INTO refresh_tokens'))
          return Promise.resolve({});
        return Promise.resolve({ rows: [] });
      });

      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwt, 'generateToken').mockReturnValue('access-token');
      jest.spyOn(jwt, 'generateRefreshToken').mockReturnValue('refresh-token');

      const res = await authService.login('a@b.com', 'password');
      expect(res).toBeDefined();
      expect(res.user.email).toBe('a@b.com');
      expect(res.accessToken).toBe('access-token');
      expect(res.refreshToken).toBe('refresh-token');
    });

    test('should reject invalid password', async () => {
      const userRow = { id: 'u1', email: 'a@b.com', password_hash: 'hashedpw' };
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [userRow] });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(authService.login('a@b.com', 'bad')).rejects.toThrow(
        'Invalid credentials',
      );
    });

    test('should reject when user not found', async () => {
      jest.spyOn(db, 'query').mockResolvedValue({ rows: [] });
      await expect(authService.login('no@exist', 'x')).rejects.toThrow(
        'Invalid credentials',
      );
    });
  });

  describe('register', () => {
    test('should create new user account', async () => {
      jest.spyOn(db, 'query').mockImplementation((query, params) => {
        if (query.startsWith('SELECT id FROM users'))
          return Promise.resolve({ rows: [] });
        if (query.trim().startsWith('INSERT INTO users'))
          return Promise.resolve({
            rows: [
              {
                id: 'u2',
                email: 'n@e.com',
                first_name: 'F',
                last_name: 'L',
                role: 'member',
              },
            ],
          });
        if (query.startsWith('INSERT INTO refresh_tokens'))
          return Promise.resolve({});
        return Promise.resolve({ rows: [] });
      });

      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashedpw');
      jest.spyOn(jwt, 'generateToken').mockReturnValue('access');
      jest.spyOn(jwt, 'generateRefreshToken').mockReturnValue('refresh');

      const payload = {
        email: 'n@e.com',
        password: 'P@ssw0rd',
        firstName: 'F',
        lastName: 'L',
      };
      const res = await authService.register(payload);
      expect(res).toBeDefined();
      expect(res.user.email).toBe('n@e.com');
      expect(res.accessToken).toBe('access');
      expect(res.refreshToken).toBe('refresh');
    });

    test('should hash password securely', async () => {
      jest.spyOn(db, 'query').mockImplementation((query, params) => {
        if (query.startsWith('SELECT id FROM users'))
          return Promise.resolve({ rows: [] });
        if (query.trim().startsWith('INSERT INTO users'))
          return Promise.resolve({
            rows: [
              {
                id: 'u3',
                email: 'h@e.com',
                first_name: 'F',
                last_name: 'L',
                role: 'member',
              },
            ],
          });
        if (query.startsWith('INSERT INTO refresh_tokens'))
          return Promise.resolve({});
        return Promise.resolve({ rows: [] });
      });

      const hashSpy = jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue('hashed-value');
      jest.spyOn(jwt, 'generateToken').mockReturnValue('at');
      jest.spyOn(jwt, 'generateRefreshToken').mockReturnValue('rt');

      const payload = {
        email: 'h@e.com',
        password: 'secret',
        firstName: 'F',
        lastName: 'L',
      };
      await authService.register(payload);
      expect(hashSpy).toHaveBeenCalledWith('secret', expect.any(Number));
    });

    test('should reject when email already registered', async () => {
      jest.spyOn(db, 'query').mockImplementation((query, params) => {
        if (query.startsWith('SELECT id FROM users'))
          return Promise.resolve({ rows: [{ id: 'existing' }] });
        return Promise.resolve({ rows: [] });
      });

      await expect(
        authService.register({ email: 'e@e.com', password: 'p' }),
      ).rejects.toThrow('Email already registered');
    });
  });

  // Extra related test: ensure refresh token inserted on login
  test('stores refresh token in DB on login', async () => {
    const userRow = {
      id: 'u1',
      email: 'a@b.com',
      password_hash: 'hashedpw',
      first_name: 'F',
      last_name: 'L',
      role: 'member',
    };
    const queries = [];
    jest.spyOn(db, 'query').mockImplementation((query, params) => {
      queries.push(query);
      if (query.startsWith('SELECT id, email'))
        return Promise.resolve({ rows: [userRow] });
      return Promise.resolve({ rows: [] });
    });
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
    jest.spyOn(jwt, 'generateToken').mockReturnValue('at');
    jest.spyOn(jwt, 'generateRefreshToken').mockReturnValue('rtok');

    await authService.login('a@b.com', 'pass');
    expect(
      queries.some((q) => q.startsWith('INSERT INTO refresh_tokens')),
    ).toBe(true);
  });
});

module.exports = {};

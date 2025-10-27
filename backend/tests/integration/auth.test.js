const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database/connection');
const jwt = require('../../src/utils/jwt');
const bcrypt = require('bcryptjs');

// Mock database and JWT modules
jest.mock('../../src/database/connection');
jest.mock('../../src/utils/jwt');
jest.mock('bcryptjs');

describe('Auth API', () => {
  const baseUrl = '/api/auth';
  
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /register', () => {
    const validUser = {
      email: 'test@example.com',
      password: 'Password123!',
      confirmPassword: 'Password123!',
      firstName: 'Test',
      lastName: 'User'
    };

    beforeEach(() => {
      // Mock bcrypt hash
      bcrypt.hash.mockResolvedValue('hashedPassword123');
      // Mock JWT generation
      jwt.generateToken.mockReturnValue('mockAccessToken');
      jwt.generateRefreshToken.mockReturnValue('mockRefreshToken');
    });

    it('should register a new user successfully', async () => {
      // Mock DB responses
      db.query
        .mockResolvedValueOnce({ rows: [] }) // No existing user
        .mockResolvedValueOnce({ rows: [{ id: 1, ...validUser, role: 'student' }] }) // Insert user
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert refresh token

      const res = await request(app)
        .post(`${baseUrl}/register`)
        .send(validUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid email format', async () => {
      const res = await request(app)
        .post(`${baseUrl}/register`)
        .send({ ...validUser, email: 'invalid-email' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('email');
    });

    it('should reject weak password', async () => {
      const res = await request(app)
        .post(`${baseUrl}/register`)
        .send({ ...validUser, password: 'weak' });

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('password');
    });

    it('should reject duplicate email', async () => {
      // Mock existing user
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const res = await request(app)
        .post(`${baseUrl}/register`)
        .send(validUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Email already registered');
    });
  });

  describe('POST /login', () => {
    const credentials = {
      email: 'test@example.com',
      password: 'Password123!'
    };

    const mockUser = {
      id: 1,
      email: credentials.email,
      password_hash: 'hashedPassword123',
      first_name: 'Test',
      last_name: 'User',
      role: 'student'
    };

    beforeEach(() => {
      jwt.generateToken.mockReturnValue('mockAccessToken');
      jwt.generateRefreshToken.mockReturnValue('mockRefreshToken');
    });

    it('should login successfully with valid credentials', async () => {
      // Mock successful password check
      bcrypt.compare.mockResolvedValue(true);
      // Mock DB responses
      db.query
        .mockResolvedValueOnce({ rows: [mockUser] }) // Find user
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert refresh token

      const res = await request(app)
        .post(`${baseUrl}/login`)
        .send(credentials);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body).toHaveProperty('accessToken');
      expect(res.headers['set-cookie']).toBeDefined();
    });

    it('should reject invalid credentials', async () => {
      // Mock failed password check
      bcrypt.compare.mockResolvedValue(false);
      // Mock user found
      db.query.mockResolvedValueOnce({ rows: [mockUser] });

      const res = await request(app)
        .post(`${baseUrl}/login`)
        .send(credentials);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid credentials');
    });

    it('should reject non-existent user', async () => {
      // Mock no user found
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post(`${baseUrl}/login`)
        .send(credentials);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Invalid credentials');
    });
  });

  describe('POST /refresh', () => {
    it('should refresh token successfully', async () => {
      const mockRefreshToken = 'validRefreshToken123';
      const mockTokenRecord = {
        id: 1,
        token: mockRefreshToken,
        user_id: 1,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
        is_revoked: false
      };

      // Mock token verification
      jwt.verifyRefreshToken.mockReturnValue({ id: 1, email: 'test@example.com', role: 'student' });
      jwt.generateToken.mockReturnValue('newAccessToken123');
      
      // Mock DB response
      db.query.mockResolvedValueOnce({ rows: [mockTokenRecord] });

      const res = await request(app)
        .post(`${baseUrl}/refresh`)
        .set('Cookie', [`refreshToken=${mockRefreshToken}`]);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('accessToken', 'newAccessToken123');
    });

    it('should reject invalid refresh token', async () => {
      // Mock no token found in DB
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post(`${baseUrl}/refresh`)
        .set('Cookie', ['refreshToken=invalidToken123']);

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('Refresh token not found');
    });
  });

  describe('POST /logout', () => {
    it('should logout successfully', async () => {
      const mockRefreshToken = 'validRefreshToken123';
      
      // Mock DB update
      db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const res = await request(app)
        .post(`${baseUrl}/logout`)
        .set('Cookie', [`refreshToken=${mockRefreshToken}`]);

      expect(res.status).toBe(204);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('refreshToken=;'); // Cookie cleared
    });

    it('should succeed even without refresh token', async () => {
      const res = await request(app)
        .post(`${baseUrl}/logout`);

      expect(res.status).toBe(204);
    });
  });
});
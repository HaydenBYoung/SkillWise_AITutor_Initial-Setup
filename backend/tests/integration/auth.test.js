// TODO: Implement authentication flow integration tests
const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../../src/database/connection');
const { clearTestData } = require('../setup');

describe('Authentication Integration', () => {
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    email: 'testuser@example.com',
    password: 'Password123',
    confirmPassword: 'Password123',
  };

  let refreshToken;

  describe('POST /api/auth/register', () => {
    test('should register new user successfully', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect('Content-type', /json/)
        .expect(201);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body).toHaveProperty('token');
      expect(true).toBe(true);
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login registered user', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password,
        })
        .expect('Content-type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body).toHaveProperty('token');
      expect(true).toBe(true);

      refreshToken = res.body.refreshToken;
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh valid token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken })
        .expect('Content-type', /json/)
        .expect(200);

      expect(res.body).toHaveProperty('token');
      expect(res.body.token).not.toBeNull();
      expect(true).toBe(true);
    });
  });

  // TODO: Add more integration test cases(1 so far)
  describe('POST /api/auth/login (invalid credentials)', () => {
    test('should reject invalid login', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(res.body).toHaveProperty('error');
    });
  });
});

module.exports = {};

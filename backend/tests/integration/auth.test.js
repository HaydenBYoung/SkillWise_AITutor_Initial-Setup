// Authentication Integration (Mongo-first test expectations)
const request = require('supertest');
const app = require('../../src/app'); // app is at backend/src/app.js
const { clearTestData, usingMongoForTests } = require('../setup');

describe('Authentication Integration', () => {
  const testUser = {
    firstName: 'Test',
    lastName: 'User',
    // email will be set fresh per-test in beforeEach to avoid cross-test collisions
    email: null,
    password: 'Password123',
    confirmPassword: 'Password123',
  };

  let cookieHeader; // will hold set-cookie array from server (includes refreshToken)
  let accessToken;

  // Clear test data before each test to ensure isolation
  beforeEach(async () => {
    await clearTestData();
    // Use a unique email per test run to avoid collisions when Jest runs suites in parallel
    testUser.email = `testuser+${Date.now()}_${Math.floor(
      Math.random() * 10000
    )}@example.com`;
  });

  afterEach(async () => {
    // optional per-test cleanup
    // await clearTestData();
  });

  describe('POST /api/auth/register', () => {
    test('should register new user successfully and set refresh cookie', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect('Content-type', /json/)
        .expect(201);

      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);

      // controller returns accessToken in body and sets refreshToken cookie (httpOnly)
      expect(res.body).toHaveProperty('accessToken');
      accessToken = res.body.accessToken;

      // Supertest exposes set-cookie header
      const setCookie = res.headers['set-cookie'];
      expect(Array.isArray(setCookie)).toBe(true);
      // Expect a cookie named refreshToken to be present
      const hasRefresh = setCookie.some(
        (c) => c && c.startsWith('refreshToken=')
      );
      expect(hasRefresh).toBe(true);

      cookieHeader = setCookie;
    });
  });

  describe('POST /api/auth/login', () => {
    test('should login registered user and set refresh cookie', async () => {
      // First register the user (ensure it exists)
      await request(app).post('/api/auth/register').send(testUser).expect(201);

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

      // accessToken in body
      expect(res.body).toHaveProperty('accessToken');
      accessToken = res.body.accessToken;

      // Refresh cookie set
      const setCookie = res.headers['set-cookie'];
      expect(Array.isArray(setCookie)).toBe(true);
      const hasRefresh = setCookie.some(
        (c) => c && c.startsWith('refreshToken=')
      );
      expect(hasRefresh).toBe(true);

      cookieHeader = setCookie;
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('should refresh valid token when cookie is provided', async () => {
      // Register + login to obtain cookie
      const reg = await request(app)
        .post('/api/auth/register')
        .send(testUser)
        .expect(201);

      const setCookie = reg.headers['set-cookie'];
      expect(setCookie && setCookie.length > 0).toBe(true);

      // Call /refresh sending the cookie back
      const res = await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', setCookie) // send back cookies from registration/login
        .expect('Content-type', /json/)
        .expect(200);

      // Controller returns an accessToken on refresh
      expect(res.body).toHaveProperty('accessToken');
      expect(res.body.accessToken).not.toBeNull();
    });
  });

  describe('POST /api/auth/login (invalid credentials)', () => {
    test('should reject invalid login', async () => {
      // Ensure the user exists by registering
      await request(app).post('/api/auth/register').send(testUser).expect(201);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword',
        })
        .expect('Content-Type', /json/)
        .expect(401);

      // Controller returns a JSON error body on invalid credentials
      expect(res.body).toHaveProperty('message');
    });
  });
});

module.exports = {};

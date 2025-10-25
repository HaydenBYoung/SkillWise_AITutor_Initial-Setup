const request = require('supertest');

// Mock the authService so tests run without a real database
jest.mock('../../src/services/authService');
const authService = require('../../src/services/authService');

// Load app after mocking
let app;
beforeAll(() => {
  // Clear module cache and require fresh app
  jest.resetModules();
  app = require('../../src/app');
});

describe('Auth endpoints (unit tests with mocked service)', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/auth/register - success', async () => {
    const fakeUser = {
      id: 1,
      email: 'dev@example.com',
      first_name: 'Dev',
      last_name: 'User',
    };
    authService.register.mockResolvedValue({
      user: fakeUser,
      accessToken: 'access-token-123',
      refreshToken: 'refresh-token-abc',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'dev@example.com',
        password: 'Password1!',
        confirmPassword: 'Password1!',
        firstName: 'Dev',
        lastName: 'User',
      })
      .expect(201);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('dev@example.com');
    expect(res.body).toHaveProperty('accessToken', 'access-token-123');
    // Server should set httpOnly refresh cookie
    const setCookie = res.headers['set-cookie'];
    expect(Array.isArray(setCookie)).toBe(true);
    expect(setCookie.join(';')).toMatch(/refreshToken=/);
    expect(authService.register).toHaveBeenCalledTimes(1);
  });

  test('POST /api/auth/login - success', async () => {
    const fakeUser = { id: 2, email: 'user@example.com', first_name: 'User' };
    authService.login.mockResolvedValue({
      user: fakeUser,
      accessToken: 'access-xyz',
      refreshToken: 'refresh-xyz',
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'Password1!' })
      .expect(200);

    expect(res.body).toHaveProperty('user');
    expect(res.body.user.email).toBe('user@example.com');
    expect(res.body).toHaveProperty('accessToken', 'access-xyz');
    const setCookie = res.headers['set-cookie'];
    expect(Array.isArray(setCookie)).toBe(true);
    expect(setCookie.join(';')).toMatch(/refreshToken=/);
    expect(authService.login).toHaveBeenCalledTimes(1);
  });

  test('POST /api/auth/login - invalid credentials', async () => {
    const err = new Error('Invalid email or password');
    err.code = 'INVALID_CREDENTIALS';
    authService.login.mockRejectedValue(err);

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'wrong@example.com', password: 'badpw' })
      .expect(401);

    expect(res.body).toHaveProperty('message', 'Invalid email or password');
    expect(authService.login).toHaveBeenCalledTimes(1);
  });

  test('POST /api/auth/logout - revokes refresh token and clears cookie', async () => {
    authService.revokeRefreshToken.mockResolvedValue();

    const res = await request(app)
      .post('/api/auth/logout')
      .set('Cookie', ['refreshToken=refresh-xyz'])
      .expect(200);

    expect(res.body).toHaveProperty('message', 'Logged out');
    // Response should clear the refreshToken cookie
    const setCookie = res.headers['set-cookie'];
    expect(Array.isArray(setCookie)).toBe(true);
    expect(setCookie.join(';')).toMatch(/refreshToken=;/);
    expect(authService.revokeRefreshToken).toHaveBeenCalledTimes(1);
  });
});

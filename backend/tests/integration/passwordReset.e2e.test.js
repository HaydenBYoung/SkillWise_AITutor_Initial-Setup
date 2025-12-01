const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database/connection');

describe('Password Reset E2E', () => {
  let testUser;

  beforeAll(async () => {
    // Create test user
    const result = await db.query(
      `INSERT INTO users (email, password_hash, first_name, last_name) 
       VALUES ($1, $2, $3, $4) RETURNING id, email, first_name`,
      ['reset-test@example.com', '$2a$12$hashedpassword', 'Reset', 'Test']
    );
    testUser = result.rows[0];
  });

  afterAll(async () => {
    // Clean up
    await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [testUser.id]);
    await db.query('DELETE FROM users WHERE id = $1', [testUser.id]);
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should accept valid email and return success message', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'reset-test@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('reset link');
    });

    it('should accept non-existent email without revealing it', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'nonexistent@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/forgot-password')
        .send({});
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let validToken;

    beforeEach(async () => {
      // Create valid reset token
      const crypto = require('crypto');
      validToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await db.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at, used) VALUES ($1, $2, $3, false)',
        [testUser.id, validToken, expiresAt]
      );
    });

    afterEach(async () => {
      await db.query('DELETE FROM password_reset_tokens WHERE user_id = $1', [testUser.id]);
    });

    it('should reset password with valid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: validToken, password: 'NewPassword123!' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toContain('successful');
    });

    it('should return 400 for invalid token', async () => {
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: 'invalid-token-xyz', password: 'NewPassword123!' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('Invalid');
    });

    it('should return 400 if token already used', async () => {
      // Mark token as used
      await db.query('UPDATE password_reset_tokens SET used = true WHERE token = $1', [validToken]);
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: validToken, password: 'NewPassword123!' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('used');
    });

    it('should return 400 for expired token', async () => {
      // Create expired token
      const expiredToken = require('crypto').randomBytes(32).toString('hex');
      const pastTime = new Date(Date.now() - 60 * 60 * 1000);
      await db.query(
        'INSERT INTO password_reset_tokens (user_id, token, expires_at, used) VALUES ($1, $2, $3, false)',
        [testUser.id, expiredToken, pastTime]
      );
      const res = await request(app)
        .post('/api/auth/reset-password')
        .send({ token: expiredToken, password: 'NewPassword123!' });
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('expired');
    });
  });
});

const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database/connection');

describe('Auth registration persistence (integration test)', () => {
  const baseUrl = '/api/auth';

  const testUser = {
    email: `inttest-${Date.now()}@example.com`,
    password: 'Password123!',
    confirmPassword: 'Password123!',
    firstName: 'Integration',
    lastName: 'Tester',
  };

  afterAll(async () => {
    // Clean up created user if exists
    try {
      await db.query('DELETE FROM refresh_tokens WHERE user_id IN (SELECT id FROM users WHERE email = $1)', [testUser.email]);
      await db.query('DELETE FROM users WHERE email = $1', [testUser.email]);
    } catch (err) {
      console.warn('Cleanup failed for integration registration test', err && err.message);
    }
  });

  it('registers a user via API and persists to DB', async () => {
    const res = await request(app).post(`${baseUrl}/register`).send(testUser);
    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('user');

    // Query DB to confirm user exists
    const { rows } = await db.query('SELECT id, email, first_name, last_name FROM users WHERE email = $1', [testUser.email]);
    expect(rows.length).toBeGreaterThan(0);
    const userRow = rows[0];
    expect(userRow.email).toBe(testUser.email);
    expect(userRow.first_name).toBe(testUser.firstName);
    expect(userRow.last_name).toBe(testUser.lastName);
  });
});

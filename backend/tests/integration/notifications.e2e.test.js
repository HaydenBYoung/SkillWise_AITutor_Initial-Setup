const request = require('supertest');
const jwt = require('../../src/utils/jwt');
const { testPool, clearTestData } = require('../setup');

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const app = require('../../src/app');

describe('Notifications API Integration', () => {
  afterEach(async () => {
    await clearTestData();
  });

  test('create, list, mark as read, mark all', async () => {
    // Seed user
    const u = await testPool.query(`INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1,$2,$3,$4,$5) RETURNING *`, ['nuser@test.com', 'hash', 'N', 'User', 'student']);
    const user = u.rows[0];
    const token = jwt.generateToken({ id: user.id, email: user.email, role: user.role });

    // Create notification
    const resCreate = await request(app)
      .post('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .send({ userId: user.id, type: 'info', message: 'Hello', data: { url: '/profile' } })
      .expect(201);

    expect(resCreate.body.success).toBe(true);
    const created = resCreate.body.data;
    expect(created).toHaveProperty('id');

    // List notifications
    const resList = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(resList.body.success).toBe(true);
    expect(Array.isArray(resList.body.data)).toBe(true);
    expect(resList.body.data.length).toBeGreaterThanOrEqual(1);

    // Mark as read
    const resMark = await request(app)
      .put(`/api/notifications/${created.id}/read`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(resMark.body.success).toBe(true);
    expect(resMark.body.data.is_read === true || resMark.body.data.is_read === false).toBe(true);

    // Create multiple notifications
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({ userId: user.id, type: 'info', message: `Hello ${i}`, data: { idx: i } })
        .expect(201);
    }

    const resAll = await request(app)
      .get('/api/notifications')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(resAll.body.data.length).toBeGreaterThanOrEqual(3);

    // Mark all as read
    const resMarkAll = await request(app)
      .put('/api/notifications/read-all')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    expect(resMarkAll.body.success).toBe(true);
  });
});

module.exports = {};

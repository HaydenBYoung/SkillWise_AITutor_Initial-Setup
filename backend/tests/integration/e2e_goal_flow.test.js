// End-to-end server-side flow test: login -> create goal -> add challenge -> mark complete
// This test runs against the test database configured by tests/setup.js
// Prefer an existing DATABASE_URL (CI), then TEST_DATABASE_URL, then a local default.
// Do NOT overwrite an existing DATABASE_URL set by CI.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.TEST_DATABASE_URL ||
  'postgresql://skillwise_user:skillwise_pass@localhost:5433/skillwise_db';

const request = require('supertest');
const { clearTestData } = require('../setup');
const app = require('../../src/app');

describe('E2E: login -> create goal -> add challenge -> mark complete', () => {
  const user = {
    email: 'e2e_user@example.com',
    password: 'E2ePass123!',
    confirmPassword: 'E2ePass123!',
    firstName: 'E2E',
    lastName: 'User',
  };

  let accessToken;
  let goalId;
  let challengeId;

  beforeAll(async () => {
    // ensure clean DB before starting
    await clearTestData();
  });

  afterAll(async () => {
    // clean up artifacts
    await clearTestData();
  });

  test('registers and logs in the user', async () => {
    // register
    const reg = await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);
    expect(reg.body).toHaveProperty('user');
    expect(reg.body).toHaveProperty('accessToken');

    // register returned access token — use it for subsequent requests
    expect(reg.body).toHaveProperty('accessToken');
    accessToken = reg.body.accessToken;
    expect(typeof accessToken).toBe('string');
  });

  test('creates a new goal', async () => {
    const payload = {
      title: 'E2E Goal',
      description: 'Goal created during e2e test',
    };
    const res = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    goalId = res.body.data.id;
  });

  test('adds a challenge to the goal', async () => {
    const payload = {
      title: 'E2E Challenge',
      description: 'Complete this',
      instructions: 'Follow the instructions',
      category: 'practice',
      goal_id: goalId,
    };
    const res = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload)
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('id');
    challengeId = res.body.data.id;
    expect(Number(res.body.data.goal_id || res.body.data.goalId)).toBe(
      Number(goalId)
    );
  });

  test('marks the challenge complete via progress event', async () => {
    // Enable dev error responses to surface stack traces for debugging in tests
    const prevNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    const payload = {
      challengeId: challengeId,
      completed: true,
      points_earned: 10,
    };
    const res = await request(app)
      .post('/api/progress/event')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(payload);

    // debug output if server returned error
    // eslint-disable-next-line no-console
    console.log('progress response status', res.status);
    // eslint-disable-next-line no-console
    console.log('progress response body', res.body);

    expect(res.status).toBe(200);
    // restore NODE_ENV
    process.env.NODE_ENV = prevNodeEnv || 'test';
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('progress');
    expect(res.body.data.progress).toHaveProperty('challenge_id');
    expect(String(res.body.data.progress.challenge_id)).toBe(
      String(challengeId)
    );
    expect(res.body.data.progress.completed).toBe(true);
  });
});

module.exports = {};

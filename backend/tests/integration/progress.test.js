// Integration test for progress endpoints (DB-backed)
// Prefer an existing DATABASE_URL (CI), then TEST_DATABASE_URL, then a local default.
// Do NOT overwrite an existing DATABASE_URL set by CI.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.TEST_DATABASE_URL ||
  'postgresql://skillwise_user:skillwise_pass@localhost:5433/skillwise_db';

const request = require('supertest');
const { clearTestData } = require('../setup');
const app = require('../../src/app');

describe('Progress integration (track event + overview)', () => {
  const user = {
    email: 'progress_user@example.com',
    password: 'ProgPass123!',
    confirmPassword: 'ProgPass123!',
    firstName: 'Progress',
    lastName: 'Tester',
  };

  let accessToken;
  let challengeId;

  beforeAll(async () => {
    await clearTestData();
  });

  afterAll(async () => {
    await clearTestData();
  });

  test('registers user and returns access token', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(user)
      .expect(201);
    expect(res.body).toHaveProperty('accessToken');
    accessToken = res.body.accessToken;
  });

  test('creates goal and challenge then posts a progress event', async () => {
    // create goal
    const goalPayload = {
      title: 'Progress Goal',
      description: 'Goal for progress test',
    };
    const g = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(goalPayload)
      .expect(201);
    const goalId = g.body.data.id;

    // create challenge attached to goal
    const chPayload = {
      title: 'Progress Challenge',
      description: 'Challenge for progress test',
      instructions: 'Do it',
      category: 'practice',
      goal_id: goalId,
    };
    const ch = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(chPayload)
      .expect(201);

    challengeId = ch.body.data.id;

    // post progress event (complete)
    const event = {
      challengeId: challengeId,
      completed: true,
      points_earned: 15,
    };
    const ev = await request(app)
      .post('/api/progress/event')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(event)
      .expect(200);

    expect(ev.body.success).toBe(true);
    expect(ev.body.data).toHaveProperty('progress');
    expect(String(ev.body.data.progress.challenge_id)).toBe(
      String(challengeId),
    );
    expect(ev.body.data.progress.points_earned).toBeGreaterThanOrEqual(15);
  });

  test('retrieves overview showing the points', async () => {
    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('overall');
    const totalPoints = res.body.data.overall.totalPoints;
    expect(Number(totalPoints)).toBeGreaterThanOrEqual(15);
  });
});

module.exports = {};

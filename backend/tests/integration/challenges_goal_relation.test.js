// Integration test: create a goal then create a challenge linked to that goal
// Prefer an existing DATABASE_URL (CI), then TEST_DATABASE_URL, then a local default.
// Do NOT overwrite an existing DATABASE_URL set by CI.
process.env.DATABASE_URL =
  process.env.DATABASE_URL ||
  process.env.TEST_DATABASE_URL ||
  'postgresql://skillwise_user:skillwise_pass@localhost:5433/skillwise_db';

const request = require('supertest');
const { clearTestData } = require('../setup');
const app = require('../../src/app');

describe('Challenges linked to Goals (integration)', () => {
  const user = {
    email: 'challenge_goal_user@example.com',
    password: 'ChalGoal123!',
    confirmPassword: 'ChalGoal123!',
    firstName: 'Chal',
    lastName: 'Goal',
  };

  let accessToken;
  let goalId;

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

  test('creates goal then creates challenge with goal_id', async () => {
    // create goal
    const goalPayload = {
      title: 'Linked Goal',
      description: 'Goal for challenge link',
    };
    const g = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(goalPayload)
      .expect(201);
    goalId = g.body.data.id;

    // create challenge attached to goal
    const chPayload = {
      title: 'Linked Challenge',
      description: 'Challenge that belongs to a goal',
      instructions: 'Complete this linked challenge',
      category: 'practice',
      goal_id: goalId,
    };

    const ch = await request(app)
      .post('/api/challenges')
      .set('Authorization', `Bearer ${accessToken}`)
      .send(chPayload)
      .expect(201);

    expect(ch.body.success).toBe(true);
    expect(ch.body.data).toHaveProperty('id');
    // API should return goal linkage in challenge record
    expect(Number(ch.body.data.goal_id || ch.body.data.goalId)).toBe(
      Number(goalId)
    );

    // fetch challenge by id and verify goal link remains
    const fetch = await request(app)
      .get(`/api/challenges/${ch.body.data.id}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(fetch.body.success).toBe(true);
    expect(Number(fetch.body.data.goal_id || fetch.body.data.goalId)).toBe(
      Number(goalId)
    );
  });
});

module.exports = {};

// Goals API integration tests
const request = require('supertest');
const jwt = require('../../src/utils/jwt');

// Mock controller functions before loading app
const mockGetGoals = jest.fn();
const mockCreateGoal = jest.fn();
const mockUpdateGoal = jest.fn();
const mockGetGoalById = jest.fn();
const mockDeleteGoal = jest.fn();

jest.mock('../../src/controllers/goalController', () => ({
  getGoals: (req, res, next) => mockGetGoals(req, res, next),
  createGoal: (req, res, next) => mockCreateGoal(req, res, next),
  updateGoal: (req, res, next) => mockUpdateGoal(req, res, next),
  getGoalById: (req, res, next) => mockGetGoalById(req, res, next),
  deleteGoal: (req, res, next) => mockDeleteGoal(req, res, next),
}));

const app = require('../../src/app');

describe('Goals API Integration', () => {
  let authToken;

  beforeEach(async () => {
    jest.clearAllMocks();
    authToken = jwt.generateToken({
      id: 'user1',
      email: 'g@test.com',
      role: 'member',
    });
  });

  describe('GET /api/goals', () => {
    test('should return user goals', async () => {
      const sample = [{ id: 'g1', title: 'Goal 1' }];
      mockGetGoals.mockImplementation((req, res) =>
        res.status(200).json({ success: true, data: sample })
      );

      const res = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data[0].id).toBe('g1');
    });
  });

  describe('POST /api/goals', () => {
    test('should create new goal', async () => {
      const created = { id: 'g2', title: 'New Goal' };
      mockCreateGoal.mockImplementation((req, res) =>
        res.status(201).json({ success: true, data: created })
      );

      const res = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'New Goal' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('g2');
    });
  });

  describe('PUT /api/goals/:id', () => {
    test('should update existing goal', async () => {
      const updated = { id: 'g2', title: 'Updated Goal' };
      mockUpdateGoal.mockImplementation((req, res) =>
        res.status(200).json({ success: true, data: updated })
      );

      const res = await request(app)
        .put('/api/goals/g2')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Goal' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe('Updated Goal');
    });
  });

  // Three additional integration cases
  test('GET /api/goals/:id returns a single goal', async () => {
    const goal = { id: 'g1', title: 'Goal 1' };
    mockGetGoalById.mockImplementation((req, res) =>
      res.status(200).json({ success: true, data: goal })
    );

    const res = await request(app)
      .get('/api/goals/g1')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('g1');
  });

  test('DELETE /api/goals/:id deletes a goal', async () => {
    const deleted = { id: 'g3', title: 'To Delete' };
    mockDeleteGoal.mockImplementation((req, res) =>
      res.status(200).json({ success: true, data: deleted })
    );

    const res = await request(app)
      .delete('/api/goals/g3')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe('g3');
  });

  test('GET /api/goals without token returns 401', async () => {
    const res = await request(app).get('/api/goals').expect(401);
    // errorHandler in test env returns { status, message, code }
    expect(res.body.message).toMatch(/not logged in/i);
    expect(res.body.status).toBe('fail');
  });
});

module.exports = {};

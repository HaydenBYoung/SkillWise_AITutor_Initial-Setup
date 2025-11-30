// TODO: Implement AI integration tests
const request = require('supertest');
const jwt = require('../../src/utils/jwt');

// Create mocks for controller functions before app is required
const mockGenerateFeedback = jest.fn();
const mockGetHints = jest.fn();
const mockSuggestChallenges = jest.fn();
const mockAnalyzeProgress = jest.fn();
const mockGenerateChallenge = jest.fn();

jest.mock('../../src/controllers/aiController', () => ({
  generateFeedback: (req, res, next) => mockGenerateFeedback(req, res, next),
  getHints: (req, res, next) => mockGetHints(req, res, next),
  suggestChallenges: (req, res, next) => mockSuggestChallenges(req, res, next),
  analyzeProgress: (req, res, next) => mockAnalyzeProgress(req, res, next),
  generateChallenge: (req, res, next) => mockGenerateChallenge(req, res, next),
}));

const app = require('../../src/app');

describe('AI Integration Tests', () => {
  let authToken;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Create token for auth middleware
    authToken = jwt.generateToken({
      id: 'test-user',
      email: 'ai@test.com',
      role: 'member',
    });
  });

  describe('POST /api/ai/feedback', () => {
    test('should generate AI feedback for submission', async () => {
      mockGenerateFeedback.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          data: { feedback: 'Good attempt. Consider edge cases.' },
        });
      });

      const res = await request(app)
        .post('/api/ai/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        // use snake_case keys to match controller/validation
        .send({ submission_text: 'my code', challenge_id: 'c1' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.feedback).toContain('Good attempt');
      expect(mockGenerateFeedback).toHaveBeenCalled();
    });

    test('returns 500 when AI service errors', async () => {
      mockGenerateFeedback.mockImplementation((req, res) => {
        return res
          .status(500)
          .json({ success: false, message: 'AI provider error' });
      });

      const res = await request(app)
        .post('/api/ai/feedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ submission_text: 'broken', challenge_id: 'c1' })
        .expect(500);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/AI provider error/);
    });
  });

  describe('GET /api/ai/hints/:challengeId', () => {
    test('should provide AI-generated hints', async () => {
      mockGetHints.mockImplementation((req, res) => {
        return res.status(200).json({
          success: true,
          data: { hints: ['Try breaking the problem down'] },
        });
      });

      const res = await request(app)
        .get('/api/ai/hints/c1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.hints)).toBe(true);
    });
  });

  // Three extra AI integration test cases
  test('GET /api/ai/suggestions returns recommended challenges', async () => {
    mockSuggestChallenges.mockImplementation((req, res) => {
      return res
        .status(200)
        .json({ success: true, data: [{ id: 'rec1' }, { id: 'rec2' }] });
    });

    const res = await request(app)
      .get('/api/ai/suggestions')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('GET /api/ai/analysis returns user learning analysis', async () => {
    mockAnalyzeProgress.mockImplementation((req, res) => {
      return res.status(200).json({
        success: true,
        data: { strength: 'loops', weakness: 'recursion' },
      });
    });

    const res = await request(app)
      .get('/api/ai/analysis')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.weakness).toBe('recursion');
  });
});

module.exports = {};

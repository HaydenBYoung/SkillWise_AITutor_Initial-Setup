/**
 * Integration Tests for AI Controller
 * Story 3.7: Test AI endpoints
 */
const request = require('supertest');
const app = require('../../src/app');
const aiService = require('../../src/services/aiService');
const db = require('../../src/database/connection');

jest.mock('../../src/services/aiService');
jest.mock('../../src/database/connection');

describe('AI Controller Integration Tests', () => {
  let authToken;

  beforeAll(() => {
    // Mock authentication token
    authToken = 'Bearer mock-jwt-token';
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/ai/generateChallenge', () => {
    it('should generate challenges successfully', async () => {
      const mockChallenges = [{
        title: 'Build a REST API',
        description: 'Create a RESTful API',
        instructions: 'Step by step',
        category: 'Node.js',
        difficulty_level: 'medium',
        estimated_time_minutes: 120,
        points_reward: 10,
        learning_objectives: ['REST', 'APIs'],
        tags: ['backend']
      }];

      aiService.generateChallenges.mockResolvedValue({
        success: true,
        challenges: mockChallenges,
        processingTime: 1500
      });

      const response = await request(app)
        .post('/api/ai/generateChallenge')
        .set('Authorization', authToken)
        .send({
          category: 'Node.js',
          difficulty: 'medium',
          focusAreas: 'REST APIs',
          count: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.challenges).toHaveLength(1);
      expect(response.body.challenges[0].title).toBe('Build a REST API');
    });

    it('should return 400 if category is missing', async () => {
      const response = await request(app)
        .post('/api/ai/generateChallenge')
        .set('Authorization', authToken)
        .send({
          difficulty: 'medium'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Category is required');
    });

    it('should return 400 for invalid difficulty', async () => {
      const response = await request(app)
        .post('/api/ai/generateChallenge')
        .set('Authorization', authToken)
        .send({
          category: 'Node.js',
          difficulty: 'invalid'
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('Invalid difficulty level');
    });

    it('should limit challenge count to 5', async () => {
      aiService.generateChallenges.mockResolvedValue({
        success: true,
        challenges: [],
        processingTime: 1000
      });

      await request(app)
        .post('/api/ai/generateChallenge')
        .set('Authorization', authToken)
        .send({
          category: 'Node.js',
          count: 10 // Should be limited to 5
        });

      expect(aiService.generateChallenges).toHaveBeenCalledWith(
        'Node.js',
        'medium',
        '',
        5
      );
    });
  });

  describe('POST /api/ai/submitForFeedback', () => {
    it('should generate feedback successfully', async () => {
      db.query.mockResolvedValueOnce({
        rows: [{
          title: 'Test Challenge',
          description: 'Test description'
        }]
      });

      aiService.generateFeedback.mockResolvedValue({
        success: true,
        feedback: {
          id: 1,
          score: 85,
          feedback_text: 'Great work!',
          strengths: ['Clean code'],
          improvements: ['Add tests'],
          suggestions: ['Use TypeScript'],
          confidence_score: 0.9
        }
      });

      const response = await request(app)
        .post('/api/ai/submitForFeedback')
        .set('Authorization', authToken)
        .send({
          submissionText: 'function test() { return true; }',
          challengeId: 1,
          submissionType: 'code'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.feedback.score).toBe(85);
    });

    it('should return 400 if submission text is missing', async () => {
      const response = await request(app)
        .post('/api/ai/submitForFeedback')
        .set('Authorization', authToken)
        .send({
          challengeId: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.error).toContain('required');
    });

    it('should return 404 if challenge not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/ai/submitForFeedback')
        .set('Authorization', authToken)
        .send({
          submissionText: 'code',
          challengeId: 999
        });

      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Challenge not found');
    });
  });

  describe('GET /api/ai/feedback/:submissionId', () => {
    it('should retrieve feedback history', async () => {
      const mockHistory = [
        {
          id: 1,
          feedback_text: 'First feedback',
          confidence_score: 0.9,
          created_at: new Date().toISOString()
        }
      ];

      aiService.getFeedbackHistory.mockResolvedValue({
        success: true,
        history: mockHistory
      });

      const response = await request(app)
        .get('/api/ai/feedback/1')
        .set('Authorization', authToken);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.history).toHaveLength(1);
    });
  });

  describe('POST /api/ai/feedback/:feedbackId/followup', () => {
    it('should answer follow-up questions', async () => {
      aiService.answerFollowUp.mockResolvedValue({
        success: true,
        answer: 'Here is the explanation you requested.'
      });

      const response = await request(app)
        .post('/api/ai/feedback/1/followup')
        .set('Authorization', authToken)
        .send({
          question: 'Can you explain more about the first improvement?'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.answer).toBeTruthy();
    });

    it('should return 400 if question is missing', async () => {
      const response = await request(app)
        .post('/api/ai/feedback/1/followup')
        .set('Authorization', authToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Question is required');
    });
  });

  describe('POST /api/ai/challenges/save', () => {
    it('should save AI-generated challenge', async () => {
      const mockChallenge = {
        title: 'New Challenge',
        description: 'Description',
        instructions: 'Instructions',
        category: 'JavaScript',
        difficulty_level: 'medium',
        estimated_time_minutes: 60,
        points_reward: 10,
        learning_objectives: ['Learning'],
        tags: ['js']
      };

      db.query.mockResolvedValue({
        rows: [{
          id: 1,
          ...mockChallenge,
          is_ai_generated: true
        }]
      });

      const response = await request(app)
        .post('/api/ai/challenges/save')
        .set('Authorization', authToken)
        .send({
          challenge: mockChallenge,
          goalId: 1
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.challenge.title).toBe('New Challenge');
    });

    it('should return 400 if challenge data is missing', async () => {
      const response = await request(app)
        .post('/api/ai/challenges/save')
        .set('Authorization', authToken)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Challenge data is required');
    });
  });
});

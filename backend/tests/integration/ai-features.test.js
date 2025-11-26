// Integration test for complete AI challenge generation and feedback flow
const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database/connection');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn().mockResolvedValue({
          id: 'chatcmpl-test',
          model: 'gpt-3.5-turbo',
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Integration Test Challenge',
                  description: 'Test challenge description',
                  difficulty: 'medium',
                  category: 'JavaScript',
                  estimatedTime: '30 minutes',
                  examples: [{ input: 'test', output: 'result' }],
                  acceptanceCriteria: ['Works correctly'],
                }),
              },
            },
          ],
          usage: { prompt_tokens: 100, completion_tokens: 150 },
        }),
      },
    },
  }));
});

describe('AI Features Integration Test', () => {
  let authToken;
  let userId;
  let challengeId;
  let submissionId;

  beforeAll(async () => {
    // Register a test user
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: `integration${Date.now()}@test.com`,
        password: 'TestPass123!',
      });

    authToken = registerRes.body.accessToken;
    userId = registerRes.body.user.id;
  });

  afterAll(async () => {
    // Cleanup
    if (userId) {
      await db.query('DELETE FROM users WHERE id = $1', [userId]);
    }
  });

  describe('Complete AI Challenge Flow', () => {
    it('should generate AI challenge', async () => {
      const response = await request(app)
        .post('/api/ai/generateChallenge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skill: 'JavaScript',
          difficulty: 'medium',
          topic: 'Array Manipulation',
          type: 'coding',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('title');
      expect(response.body.data).toHaveProperty('description');
      expect(response.body.data).toHaveProperty('aiModel');
      expect(response.body.data).toHaveProperty('processingTime');
    });

    it('should save AI-generated challenge', async () => {
      // First generate a challenge
      const generateRes = await request(app)
        .post('/api/ai/generateChallenge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skill: 'Python',
          difficulty: 'easy',
          topic: 'Lists',
          type: 'coding',
        });

      const challenge = generateRes.body.data;

      // Save the challenge
      const saveRes = await request(app)
        .post('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: challenge.title,
          description: challenge.description,
          difficulty: challenge.difficulty,
          category: challenge.category,
          estimatedTime: challenge.estimatedTime,
        });

      expect(saveRes.status).toBe(201);
      challengeId = saveRes.body.data.id;
    });

    it('should submit code for AI feedback', async () => {
      // Mock the database query for submissionId
      jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await request(app)
        .post('/api/ai/submitForFeedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          submissionId: 1,
          submissionCode: 'function test() { return [1, 2, 3]; }',
          challengeTitle: 'Array Test',
          challengeDescription: 'Create an array',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('feedbackText');
      expect(response.body.data).toHaveProperty('confidenceScore');
      expect(response.body.data).toHaveProperty('aiModel');

      submissionId = response.body.data.id;
    });

    it('should retrieve feedback by submission ID', async () => {
      // Mock the database query
      jest.spyOn(db, 'query').mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            submission_id: 1,
            feedback_text: 'Good work',
            confidence_score: 0.9,
            strengths: ['Clean code'],
            improvements: ['Add comments'],
            suggestions: ['Add tests'],
            ai_model: 'gpt-3.5-turbo',
            processing_time_ms: 1000,
            created_at: new Date(),
          },
        ],
      });

      const response = await request(app)
        .get('/api/ai/feedback/1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should require authentication for AI endpoints', async () => {
      const response = await request(app)
        .post('/api/ai/generateChallenge')
        .send({
          skill: 'JavaScript',
          difficulty: 'medium',
          topic: 'Testing',
          type: 'coding',
        });

      expect(response.status).toBe(401);
    });

    it('should validate required fields for challenge generation', async () => {
      const response = await request(app)
        .post('/api/ai/generateChallenge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skill: 'JavaScript',
          // missing required fields
        });

      expect(response.status).toBe(400);
    });

    it('should validate required fields for feedback submission', async () => {
      const response = await request(app)
        .post('/api/ai/submitForFeedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          submissionCode: 'code',
          // missing required fields
        });

      expect(response.status).toBe(400);
    });

    it('should handle invalid JSON from AI', async () => {
      // Mock OpenAI to return invalid JSON
      const OpenAI = require('openai');
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [
          {
            message: { content: 'Invalid JSON response' },
          },
        ],
      });

      OpenAI.mockImplementation(() => ({
        chat: {
          completions: { create: mockCreate },
        },
      }));

      const response = await request(app)
        .post('/api/ai/generateChallenge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skill: 'JavaScript',
          difficulty: 'medium',
          topic: 'Testing',
          type: 'coding',
        });

      expect(response.status).toBe(500);
    });
  });

  describe('Performance', () => {
    it('should complete challenge generation in reasonable time', async () => {
      const startTime = Date.now();

      await request(app)
        .post('/api/ai/generateChallenge')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          skill: 'JavaScript',
          difficulty: 'easy',
          topic: 'Variables',
          type: 'coding',
        });

      const duration = Date.now() - startTime;

      // Should complete within 5 seconds (including mock delay)
      expect(duration).toBeLessThan(5000);
    });

    it('should complete feedback generation in reasonable time', async () => {
      jest.spyOn(db, 'query').mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const startTime = Date.now();

      await request(app)
        .post('/api/ai/submitForFeedback')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          submissionId: 1,
          submissionCode: 'const x = 10;',
          challengeTitle: 'Test',
          challengeDescription: 'Test',
        });

      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(5000);
    });
  });
});

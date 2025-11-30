const request = require('supertest');
const jwt = require('../../src/utils/jwt');

// Mock the OpenAI service to simulate responses
jest.mock('../../src/services/openAIService', () => ({
  callOpenAIAPI: jest.fn().mockResolvedValue({
    id: 'chatcmpl-mock',
    choices: [
      {
        message: {
          content: JSON.stringify({
            summary: 'Good work',
            suggestions: ['Handle edge cases', 'Add tests'],
            strengths: ['Readable code'],
            improvements: ['Optimize loop'],
            confidence: 0.85,
          }),
        },
      },
    ],
  }),
}));

// Mock DB query to avoid touching real DB (ai_prompts_log should be attempted)
jest.mock('../../src/database/connection', () => ({
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
}));

const app = require('../../src/app');
const db = require('../../src/database/connection');

describe('POST /api/ai/feedback', () => {
  let authToken;

  beforeEach(() => {
    authToken = jwt.generateToken({ id: 'test-user', email: 'user@test.com' });
  });

  test('returns AI feedback and logs prompt', async () => {
    const payload = {
      submission_text: 'function sum(a,b) { return a + b; }',
    };

    const res = await request(app)
      .post('/api/ai/feedback')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.ai).toBeDefined();
    // ensure DB logging was attempted for ai_prompts_log
    expect(db.query).toHaveBeenCalled();
  });

  test('returns 401 if unauthorized', async () => {
    await request(app)
      .post('/api/ai/feedback')
      .send({ submission_text: 'x' })
      .expect(401);
  });

  test('handles OpenAI errors gracefully', async () => {
    const openAI = require('../../src/services/openAIService');
    // Simulate persistent API failure (all attempts fail)
    openAI.callOpenAIAPI.mockRejectedValue(new Error('API down'));

    const auth = jwt.generateToken({ id: 'test-user', email: 'user@test.com' });

    const res = await request(app)
      .post('/api/ai/feedback')
      .set('Authorization', `Bearer ${auth}`)
      .send({ submission_text: 'broken' })
      .expect(200);

    // The aiService returns a graceful object on provider errors; controller
    // surfaces that under `ai`. Expect ai.success to be false and an error message.
    expect(res.body.ai).toBeDefined();
    expect(res.body.ai.success).toBe(false);
    expect(res.body.ai.error).toBeDefined();
  });
});

module.exports = {};

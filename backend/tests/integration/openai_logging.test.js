const request = require('supertest');
const jwt = require('../../src/utils/jwt');

// Mock the low-level OpenAI service to avoid network calls
jest.mock('../../src/services/openAIService', () => ({
  callOpenAIAPI: jest.fn().mockResolvedValue({
    id: 'chatcmpl-test',
    choices: [
      {
        message: {
          content: JSON.stringify({
            summary: 'Nice attempt',
            suggestions: ['Add edge cases'],
            strengths: ['Readable'],
            improvements: ['Optimize loops'],
            confidence: 0.9,
          }),
        },
      },
    ],
  }),
}));

// Mock DB to capture logging attempts
jest.mock('../../src/database/connection', () => ({
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
}));

const app = require('../../src/app');
const db = require('../../src/database/connection');

describe('OpenAI integration (mocked) and DB logging', () => {
  let token;

  beforeEach(() => {
    token = jwt.generateToken({ id: 'test-user', email: 'log@test.com' });
    jest.clearAllMocks();
  });

  test('POST /api/ai/feedback calls OpenAI and attempts DB logging', async () => {
    const payload = { submission_text: 'sample code to review' };

    const res = await request(app)
      .post('/api/ai/feedback')
      .set('Authorization', `Bearer ${token}`)
      .send(payload)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.ai).toBeDefined();
    // DB logging of prompt/response should have been attempted
    expect(db.query).toHaveBeenCalled();
  });
});

module.exports = {};

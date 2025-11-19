const request = require('supertest');
const jwt = require('../../src/utils/jwt');

// Mock aiService.generateChallenge directly to avoid module resolution issues
jest.mock('../../src/services/aiService', () => ({
  generateChallenge: jest.fn().mockResolvedValue({
    prompt: 'mock prompt',
    raw: JSON.stringify({ mocked: true }),
    parsed: {
      title: 'Sum of Two Numbers',
      description: 'Add two integers',
      instructions: 'Read two integers and output their sum',
      inputDescription: 'Two integers separated by space',
      outputDescription: 'Single integer sum',
      examples: [{ input: '2 3', output: '5' }],
      difficulty: 'easy',
      estimatedTimeMinutes: 10,
      tags: ['math', 'addition'],
    },
    model: 'mock-model',
    success: true,
  }),
}));

// Mock DB query to avoid touching real DB
jest.mock('../../src/database/connection', () => ({
  query: jest.fn().mockResolvedValue({ rows: [], rowCount: 0 }),
}));

const app = require('../../src/app');
const db = require('../../src/database/connection');

describe('POST /api/ai/generateChallenge', () => {
  let authToken;

  beforeEach(() => {
    authToken = jwt.generateToken({ id: 'test-user', email: 'user@test.com' });
  });

  test('returns generated challenge JSON on success', async () => {
    const payload = {
      category: 'Algorithms',
      difficulty: 'easy',
      learningObjectives: ['array traversal'],
      title: 'Add two numbers',
    };

    const res = await request(app)
      .post('/api/ai/generateChallenge')
      .set('Authorization', `Bearer ${authToken}`)
      .send(payload)
      .expect(200);
    console.log('generateChallenge response body:', JSON.stringify(res.body));
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('parsed');
    expect(res.body.data.parsed.title).toBe('Sum of Two Numbers');
    // ensure DB logging was attempted
    expect(db.query).toHaveBeenCalled();
  });

  test('returns 401 if unauthorized', async () => {
    await request(app)
      .post('/api/ai/generateChallenge')
      .send({ category: 'X' })
      .expect(401);
  });

  test('handles AI provider errors gracefully', async () => {
    // make the aiService.generateChallenge reject for this test
    const aiService = require('../../src/services/aiService');
    aiService.generateChallenge.mockRejectedValueOnce(new Error('API down'));

    const res = await request(app)
      .post('/api/ai/generateChallenge')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ category: 'Algorithms', difficulty: 'easy' })
      .expect(500);

    expect(res.body.message || res.body.error).toBeDefined();
  });
});

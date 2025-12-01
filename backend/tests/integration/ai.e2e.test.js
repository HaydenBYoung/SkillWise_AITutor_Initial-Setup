const request = require('supertest');
const app = require('../../src/app');
const jwt = require('../../src/utils/jwt');

// We'll inject a fake OpenAI client into aiService
const aiService = require('../../src/services/aiService');
const Submission = require('../../src/models/Submission');
const Challenge = require('../../src/models/Challenge');
const db = require('../../src/database/connection');

describe('AI E2E Integration Tests (mock OpenAI client)', () => {
  let authToken;

  beforeEach(async () => {
    jest.restoreAllMocks();
    // token for auth
    authToken = jwt.generateToken({ id: 'tester', email: 'test@ai.com', role: 'member' });
  });

  afterEach(async () => {
    // Reset any client we set
    if (aiService.resetOpenAIClient) aiService.resetOpenAIClient();
    jest.clearAllMocks();
  });

  test('GET /api/ai/hints/:challengeId returns hints (OpenAI mocked)', async () => {
    // Fake client that returns a JSON array of hints
    const fakeHintsResponse = {
      choices: [
        { message: { content: JSON.stringify({ hints: ['First hint', 'Second hint', 'Third hint'] }) } },
      ],
    };

    const fakeClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(fakeHintsResponse),
        },
      },
    };

    // Inject fake client
    aiService.setOpenAIClient(fakeClient);

    // Mock challenge lookup
    jest.spyOn(Challenge, 'findById').mockResolvedValue({ id: '10', title: 'Test Challenge', description: 'Do this task' });

    const res = await request(app)
      .get('/api/ai/hints/10')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.hints).toBeDefined();
    expect(Array.isArray(res.body.hints.hints)).toBe(true);
    expect(res.body.hints.hints[0]).toBe('First hint');
    expect(fakeClient.chat.completions.create).toHaveBeenCalled();
  });

  test('POST /api/ai/feedback returns parsed feedback and persists (OpenAI mocked)', async () => {
    // Fake feedback content from OpenAI
    const fakeFeedbackJSON = JSON.stringify({ feedback_text: 'Great job', score: 95, confidence_score: 0.92, strengths: ['logic'], improvements: ['comments'], suggestions: ['Refactor'] });
    const fakeFeedbackResponse = { choices:[{ message:{ content: fakeFeedbackJSON } }] };

    const fakeClient = {
      chat: {
        completions: {
          create: jest.fn().mockResolvedValue(fakeFeedbackResponse),
        },
      },
    };

    aiService.setOpenAIClient(fakeClient);

    // Mock submission find
    const submission = { id: 's10', user_id: 'tester', challenge_id: '20', submission_text: 'student code' };
    jest.spyOn(Submission, 'findById').mockResolvedValue(submission);

    // Spy on DB insert to persist ai_feedback
    const mockDbInsert = jest.spyOn(db, 'query').mockResolvedValue({ rows: [{ id: 123, submission_id: 's10', feedback_text: 'Great job' }] });

    const res = await request(app)
      .post('/api/ai/feedback')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ submissionId: 's10' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.feedback).toBeDefined();
    expect(res.body.feedback.feedback_text).toBe('Great job');
    expect(fakeClient.chat.completions.create).toHaveBeenCalled();
    expect(mockDbInsert).toHaveBeenCalled();
  });
});


module.exports = {};

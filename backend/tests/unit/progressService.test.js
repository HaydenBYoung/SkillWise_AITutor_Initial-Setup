// Unit tests for progressService.generateAnalytics

// We'll mock OpenAI module and Progress model

// Keep envs/restores
const oldOpenAIKey = process.env.OPENAI_API_KEY;

describe('progressService.generateAnalytics', () => {
  afterEach(() => {
    // restore env
    process.env.OPENAI_API_KEY = oldOpenAIKey;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  test('returns heuristic analysis when OPENAI_API_KEY not set (fallback)', async () => {
    process.env.OPENAI_API_KEY = '';

    // Require services after environment set (isolate modules to avoid cached modules using env from other tests)
    let Progress, aiService, progressService;
    jest.isolateModules(() => {
      Progress = require('../../src/models/Progress');
      aiService = require('../../src/services/aiService');
      progressService = require('../../src/services/progressService');
    });

    // Mock Progress behavior
    jest.spyOn(Progress, 'findByUserId').mockResolvedValue([
      { id: 1, user_id: 1, challenge_id: 1, points_earned: 10, time_spent: 5, created_at: new Date().toISOString() },
    ]);
    jest.spyOn(Progress, 'getUserStats').mockResolvedValue({ total_points: 10, completed_challenges: 1, average_score: 85 });

    // Spy on aiService.analyzePattern fallback
    const analyzeSpy = jest.spyOn(aiService, 'analyzePattern').mockResolvedValue({ weakAreas: ['Fundamentals'], strengths: ['Loops'], recommendations: ['Review basics'] });

    const result = await progressService.generateAnalytics(1, 'week');

    expect(result.timeframe).toBe('week');
    expect(result.overview).toBeDefined();
    expect(result.analysis).toBeDefined();
    expect(result.analysis.fallback).toBe(true);
    expect(analyzeSpy).toHaveBeenCalled();
  });

  test('calls OpenAI and returns parsed analysis when key present', async () => {
    // Provide a fake OpenAI key
    process.env.OPENAI_API_KEY = 'fake_key';

    // Mock the openai module
    jest.mock('openai', () => {
      return {
        OpenAI: class {
          constructor () {}
          chat = {
            completions: {
              create: jest.fn(async (opts) => {
                return {
                  choices: [{ message: { content: JSON.stringify({ strengths: ['A'], weaknesses: ['B'], recommendations: ['Try X'], suggestedCategories: ['Algorithms'], summary: { totalPoints: 200, completedChallenges: 10 } }) } }],
                };
              }),
            },
          };
        },
      };
    });

    // Re-import modules with mocked openai
    let Progress, progressService;
    jest.isolateModules(() => {
      Progress = require('../../src/models/Progress');
      progressService = require('../../src/services/progressService');
    });

    jest.spyOn(Progress, 'findByUserId').mockResolvedValue([
      { id: 1, user_id: 1, challenge_id: 1, points_earned: 20, time_spent: 5, created_at: new Date().toISOString() },
    ]);
    jest.spyOn(Progress, 'getUserStats').mockResolvedValue({ total_points: 200, completed_challenges: 10, average_score: 90 });

    const result = await progressService.generateAnalytics(1, 'week');

    expect(result.timeframe).toBe('week');
    expect(result.overview.overall.totalPoints).toBe(200);
    expect(result.analysis).toBeDefined();
    expect(result.analysis.strengths).toEqual(['A']);
    expect(result.raw).toBeDefined();
  });
});

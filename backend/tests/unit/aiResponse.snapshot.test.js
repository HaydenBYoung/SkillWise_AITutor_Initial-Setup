const path = require('path');

// Build absolute paths so Jest resolves modules consistently regardless of rootDir
const openAIPath = path.resolve(
  __dirname,
  '..',
  '..',
  'src',
  'services',
  'openAIService.js'
);
const dbPath = path.resolve(
  __dirname,
  '..',
  '..',
  'src',
  'database',
  'connection.js'
);
const aiServicePath = path.resolve(
  __dirname,
  '..',
  '..',
  'src',
  'services',
  'aiService.js'
);

// Mock OpenAI service helper and DB to keep tests deterministic and fast.
// Use `doMock` so the mocks are applied at runtime (avoids jest.mock hoisting issues).
jest.doMock(openAIPath, () => ({
  callOpenAIAPI: jest.fn(),
}));
jest.doMock(dbPath, () => ({
  query: jest.fn(),
}));

const openAI = require(openAIPath);
const aiService = require(aiServicePath);

describe('AI service snapshot tests', () => {
  afterEach(() => jest.clearAllMocks());

  test('generateFeedback parses model response and matches snapshot', async () => {
    const fixture = require('../fixtures/openai_feedback_good.json');

    openAI.callOpenAIAPI.mockResolvedValue(fixture);

    const res = await aiService.generateFeedback('console.log("hi")', {
      title: 'Example challenge',
      category: 'JavaScript',
      learningObjectives: ['Loops', 'I/O'],
      created_by: 1,
    });

    // Snapshot the normalized parsed object and the prompt to detect template drift
    expect(res.parsed).toMatchSnapshot();
    expect(res.prompt).toMatchSnapshot();
    expect(res.raw).toMatchSnapshot();
  });

  test('generateChallenge parses model response and matches snapshot', async () => {
    const fixture = require('../fixtures/openai_challenge_good.json');

    openAI.callOpenAIAPI.mockResolvedValue(fixture);

    const res = await aiService.generateChallenge(null, {
      title: 'Sum of Two Numbers',
      category: 'Math',
      difficulty: 'easy',
      learningObjectives: ['addition'],
    });

    expect(res.parsed).toMatchSnapshot();
    expect(res.prompt).toMatchSnapshot();
    expect(res.raw).toMatchSnapshot();
  });
});

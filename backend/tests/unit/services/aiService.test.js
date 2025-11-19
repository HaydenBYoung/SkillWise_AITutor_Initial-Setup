const aiService = require('../../../src/services/aiService');

// Mock OpenAI service helper
jest.mock('../../../src/services/openAIService', () => ({
  callOpenAIAPI: jest.fn(),
}));

const openAI = require('../../../src/services/openAIService');

describe('AIService', () => {
  describe('generateFeedback', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    test('parses structured JSON response into parsed fields', async () => {
      const fakeContent = JSON.stringify({
        summary: 'Nice work',
        suggestions: ['Edge cases', 'Refactor loop'],
        strengths: ['Clarity'],
        improvements: ['Performance'],
        confidence: 0.9,
      });

      openAI.callOpenAIAPI.mockResolvedValue({
        choices: [{ message: { content: fakeContent } }],
      });

      const res = await aiService.generateFeedback('some submission', {
        title: 'T1',
      });

      expect(res.success).toBe(true);
      expect(res.parsed).toBeDefined();
      expect(res.parsed.summary).toBe('Nice work');
      expect(Array.isArray(res.parsed.suggestions)).toBe(true);
    });

    test('returns friendly error info when OpenAI fails', async () => {
      openAI.callOpenAIAPI.mockRejectedValue(new Error('network fail'));

      const res = await aiService.generateFeedback('bad', {});

      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });

  describe('generateHints', () => {
    test('returns a prompt string for hints', async () => {
      const res = await aiService.generateHints({ title: 'X' }, 'progress');
      expect(res.prompt).toBeTruthy();
    });
  });
});

module.exports = {};

const aiService = require('../../../src/services/aiService');

describe('AIService', () => {
  let mockOpenAIClient;

  beforeEach(() => {
    mockOpenAIClient = {
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    };
    aiService.setOpenAIClient(mockOpenAIClient);
    jest.clearAllMocks();
  });

  afterEach(() => {
    aiService.resetOpenAIClient();
  });

  describe('generateChallenge', () => {
    test('should generate challenge with valid preferences', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Test Challenge',
                description: 'A test challenge',
                category: 'JavaScript',
                difficulty: 'Medium',
                points: 50,
                estimatedTime: 30,
                tags: ['test', 'js'],
              }),
            },
          },
        ],
      };
      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.generateChallenge({
        preferences: { category: 'JavaScript' },
        createdBy: 1,
      });

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalled();
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('description');
    });

    test('should handle API errors gracefully', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('API error')
      );

      await expect(
        aiService.generateChallenge({ preferences: {} })
      ).rejects.toThrow('AI generation failed');
    });

    test('should parse JSON from response', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: '{"title":"Challenge","description":"Desc","category":"Test","difficulty":"Easy","points":10,"estimatedTime":15,"tags":[]}',
            },
          },
        ],
      };
      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.generateChallenge({ preferences: {} });

      expect(result.title).toBe('Challenge');
      expect(result.description).toBe('Desc');
    });
  });

  describe('generateFeedback', () => {
    test('should generate meaningful feedback', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: 'Great work! Your solution is correct.',
            },
          },
        ],
      };
      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

      const submission = {
        id: 1,
        challenge_id: 1,
        code: 'console.log("test")',
        score: 100,
      };

      const result = await aiService.generateFeedback(submission);

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalled();
      expect(result).toHaveProperty('feedback_text');
      expect(result.feedback_text).toContain('Great work');
    });

    test('should handle API errors and return fallback', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('API error')
      );

      const submission = {
        id: 1,
        challenge_id: 1,
        code: 'test',
        score: 50,
      };

      await expect(aiService.generateFeedback(submission)).rejects.toThrow('AI feedback generation failed');
    });
  });

  describe('generateHints', () => {
    test('should provide contextual hints', async () => {
      const mockResponse = {
        choices: [
          {
            message: {
              content: JSON.stringify({
                hints: ['Hint 1', 'Hint 2', 'Hint 3'],
              }),
            },
          },
        ],
      };
      mockOpenAIClient.chat.completions.create.mockResolvedValue(mockResponse);

      const challenge = { id: 1, title: 'Test Challenge', description: 'Test' };
      const result = await aiService.generateHints(challenge);

      expect(mockOpenAIClient.chat.completions.create).toHaveBeenCalled();
      expect(result).toHaveProperty('hints');
      expect(Array.isArray(result.hints)).toBe(true);
    });

    test('should handle errors and return fallback hints', async () => {
      mockOpenAIClient.chat.completions.create.mockRejectedValue(
        new Error('API error')
      );

      const challenge = { id: 1, title: 'Test Challenge', description: 'Test' };
      
      await expect(aiService.generateHints(challenge)).rejects.toThrow('AI hints generation failed');
    });
  });

  describe('analyzePattern', () => {
    test('should analyze user activity patterns', async () => {
      const events = [
        { completed: true, challenge_id: 1, points_earned: 50 },
        { completed: true, challenge_id: 2, points_earned: 75 },
      ];

      const result = await aiService.analyzePattern(1, events);

      expect(result).toHaveProperty('weakAreas');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('recommendations');
      expect(result).toHaveProperty('averagePoints');
      expect(result.averagePoints).toBe(62.5);
    });

    test('should handle empty events', async () => {
      const result = await aiService.analyzePattern(1, []);

      expect(result).toHaveProperty('weakAreas');
      expect(result).toHaveProperty('strengths');
      expect(result).toHaveProperty('recommendations');
      expect(Array.isArray(result.weakAreas)).toBe(true);
      expect(Array.isArray(result.strengths)).toBe(true);
    });
  });
});

module.exports = {};

// Story 3.7: Snapshot tests for AI service responses
const aiService = require('../aiService');
const db = require('../../database/connection');

// Mock the database
jest.mock('../../database/connection');

// Mock OpenAI
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('AI Service - Snapshot Tests', () => {
  let mockOpenAI;

  beforeEach(() => {
    jest.clearAllMocks();
    const OpenAI = require('openai');
    mockOpenAI = new OpenAI();
  });

  describe('generateChallenge', () => {
    it('should match snapshot for JavaScript challenge', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Array Manipulation Challenge',
                description:
                  'Create a function that removes duplicates from an array while maintaining the original order.',
                difficulty: 'medium',
                category: 'JavaScript',
                estimatedTime: '30 minutes',
                examples: [
                  { input: '[1, 2, 2, 3, 4, 4, 5]', output: '[1, 2, 3, 4, 5]' },
                  { input: "['a', 'b', 'a', 'c']", output: "['a', 'b', 'c']" },
                ],
                acceptanceCriteria: [
                  'Function should handle arrays of any type',
                  'Original order must be preserved',
                  'Should handle empty arrays',
                  'Should not mutate the original array',
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 150, completion_tokens: 200 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.generateChallenge({
        skill: 'JavaScript',
        difficulty: 'medium',
        topic: 'Array Manipulation',
        type: 'coding',
      });

      // Verify structure matches snapshot
      expect(result).toMatchSnapshot({
        aiModel: expect.any(String),
        processingTime: expect.any(Number),
      });
    });

    it('should match snapshot for Python challenge', async () => {
      const mockResponse = {
        id: 'chatcmpl-456',
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'List Comprehension Exercise',
                description:
                  'Write a function using list comprehension to filter and transform a list of numbers.',
                difficulty: 'easy',
                category: 'Python',
                estimatedTime: '20 minutes',
                examples: [
                  { input: '[1, 2, 3, 4, 5]', output: '[2, 4, 6, 8, 10]' },
                  { input: '[10, 15, 20]', output: '[20, 30, 40]' },
                ],
                acceptanceCriteria: [
                  'Must use list comprehension',
                  'Should handle empty lists',
                  'Should return a new list',
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 140, completion_tokens: 180 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.generateChallenge({
        skill: 'Python',
        difficulty: 'easy',
        topic: 'List Comprehension',
        type: 'coding',
      });

      expect(result).toMatchSnapshot({
        aiModel: expect.any(String),
        processingTime: expect.any(Number),
      });
    });

    it('should match snapshot for hard difficulty challenge', async () => {
      const mockResponse = {
        id: 'chatcmpl-789',
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Binary Tree Traversal',
                description:
                  'Implement three different tree traversal algorithms: preorder, inorder, and postorder.',
                difficulty: 'hard',
                category: 'Data Structures',
                estimatedTime: '60 minutes',
                examples: [
                  {
                    input: 'Tree: [1, 2, 3, 4, 5]',
                    output: 'Preorder: [1, 2, 4, 5, 3]',
                  },
                  {
                    input: 'Tree: [1, 2, 3, 4, 5]',
                    output: 'Inorder: [4, 2, 5, 1, 3]',
                  },
                ],
                acceptanceCriteria: [
                  'All three traversal methods must be implemented',
                  'Should handle empty trees',
                  'Should handle unbalanced trees',
                  'Time complexity should be O(n)',
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 180, completion_tokens: 250 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.generateChallenge({
        skill: 'Data Structures',
        difficulty: 'hard',
        topic: 'Binary Trees',
        type: 'algorithm',
      });

      expect(result).toMatchSnapshot({
        aiModel: expect.any(String),
        processingTime: expect.any(Number),
      });
    });
  });

  describe('submitForFeedback', () => {
    beforeEach(() => {
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });
    });

    it('should match snapshot for good quality code feedback', async () => {
      const mockResponse = {
        id: 'chatcmpl-abc',
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              content: JSON.stringify({
                feedbackText:
                  'Your code demonstrates good understanding of array methods and functional programming concepts.',
                confidenceScore: 0.92,
                strengths: [
                  'Clean and readable code structure',
                  'Proper use of filter and map methods',
                  'Good variable naming conventions',
                ],
                improvements: [
                  'Consider adding input validation',
                  'Could benefit from JSDoc comments',
                ],
                suggestions: [
                  'Add error handling for edge cases',
                  'Consider using TypeScript for better type safety',
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 200, completion_tokens: 150 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.submitForFeedback({
        submissionId: 1,
        submissionCode:
          'const filtered = arr.filter(x => x > 0).map(x => x * 2);',
        challengeTitle: 'Array Manipulation',
        challengeDescription: 'Filter and transform array elements',
      });

      expect(result).toMatchSnapshot({
        id: expect.any(Number),
        aiModel: expect.any(String),
        processingTime: expect.any(Number),
      });
    });

    it('should match snapshot for code needing improvement', async () => {
      const mockResponse = {
        id: 'chatcmpl-def',
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              content: JSON.stringify({
                feedbackText:
                  'The code works but has several areas that could be improved for better performance and maintainability.',
                confidenceScore: 0.78,
                strengths: [
                  'Basic functionality is correct',
                  'Variable names are descriptive',
                ],
                improvements: [
                  'Nested loops create O(n²) complexity - consider using a Set for O(n)',
                  'Missing error handling for invalid inputs',
                  'No input validation',
                  'Code could be more modular',
                ],
                suggestions: [
                  'Refactor to use Set for O(n) performance: Array.from(new Set(arr))',
                  'Add try-catch blocks for error handling',
                  'Break down into smaller, testable functions',
                  'Add unit tests to verify edge cases',
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 220, completion_tokens: 180 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.submitForFeedback({
        submissionId: 2,
        submissionCode:
          'function removeDuplicates(arr) { let result = []; for(let i=0; i<arr.length; i++) { let isDuplicate = false; for(let j=0; j<result.length; j++) { if(arr[i] === result[j]) isDuplicate = true; } if(!isDuplicate) result.push(arr[i]); } return result; }',
        challengeTitle: 'Remove Duplicates',
        challengeDescription: 'Remove duplicate elements from array',
      });

      expect(result).toMatchSnapshot({
        id: expect.any(Number),
        aiModel: expect.any(String),
        processingTime: expect.any(Number),
      });
    });

    it('should match snapshot for excellent code feedback', async () => {
      const mockResponse = {
        id: 'chatcmpl-ghi',
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              content: JSON.stringify({
                feedbackText:
                  'Excellent implementation! This code demonstrates mastery of the concepts with optimal performance and clean structure.',
                confidenceScore: 0.98,
                strengths: [
                  'Optimal O(n) time complexity using Set',
                  'Comprehensive error handling',
                  'Well-documented with JSDoc comments',
                  'Includes unit tests',
                  'Handles all edge cases correctly',
                  'Uses modern ES6+ features appropriately',
                ],
                improvements: [
                  'Consider adding performance benchmarks for large datasets',
                ],
                suggestions: [
                  'Could add a benchmark comparison to show performance gains',
                  'Consider publishing as an npm package',
                ],
              }),
            },
          },
        ],
        usage: { prompt_tokens: 250, completion_tokens: 200 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await aiService.submitForFeedback({
        submissionId: 3,
        submissionCode:
          '/** * Removes duplicate elements from an array while preserving order. * @param {Array} arr - The input array * @returns {Array} Array with duplicates removed * @throws {TypeError} If input is not an array */ function removeDuplicates(arr) { if (!Array.isArray(arr)) throw new TypeError("Input must be an array"); return Array.from(new Set(arr)); }',
        challengeTitle: 'Array Deduplication',
        challengeDescription: 'Remove duplicates efficiently',
      });

      expect(result).toMatchSnapshot({
        id: expect.any(Number),
        aiModel: expect.any(String),
        processingTime: expect.any(Number),
      });
    });
  });

  describe('Error handling snapshots', () => {
    it('should match snapshot for OpenAI API error', async () => {
      const error = new Error('OpenAI API rate limit exceeded');
      error.response = {
        status: 429,
        data: { error: { message: 'Rate limit exceeded' } },
      };

      mockOpenAI.chat.completions.create.mockRejectedValue(error);

      await expect(
        aiService.generateChallenge({
          skill: 'JavaScript',
          difficulty: 'medium',
          topic: 'Testing',
          type: 'coding',
        })
      ).rejects.toThrow('OpenAI API rate limit exceeded');
    });

    it('should match snapshot for invalid JSON response', async () => {
      const mockResponse = {
        id: 'chatcmpl-invalid',
        model: 'gpt-3.5-turbo',
        choices: [
          {
            message: {
              content: 'This is not valid JSON',
            },
          },
        ],
        usage: { prompt_tokens: 100, completion_tokens: 50 },
      };

      mockOpenAI.chat.completions.create.mockResolvedValue(mockResponse);

      await expect(
        aiService.generateChallenge({
          skill: 'JavaScript',
          difficulty: 'easy',
          topic: 'Testing',
          type: 'coding',
        })
      ).rejects.toThrow();
    });
  });
});

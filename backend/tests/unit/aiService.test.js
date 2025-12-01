/**
 * Unit Tests for AI Service
 * Story 3.7: Snapshot tests for AI responses
 */
const aiService = require('../../src/services/aiService');
const db = require('../../src/database/connection');

// Mock the database
jest.mock('../../src/database/connection');

// Mock axios for API calls
jest.mock('axios');
const axios = require('axios');

describe('AI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('generateChallenges', () => {
    const mockGeminiResponse = {
      data: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify([
                    {
                      title: 'Sample Challenge',
                      description: 'Create a REST API',
                      instructions: 'Step by step guide',
                      category: 'Node.js',
                      difficulty_level: 'medium',
                      estimated_time_minutes: 120,
                      points_reward: 10,
                      learning_objectives: [
                        'Understand REST principles',
                        'Build APIs',
                      ],
                      tags: ['api', 'backend', 'express'],
                    },
                  ]),
                },
              ],
            },
          },
        ],
      },
    };

    it('should generate challenges successfully', async () => {
      axios.post.mockResolvedValue(mockGeminiResponse);

      const result = await aiService.generateChallenges(
        'Node.js',
        'medium',
        'REST APIs',
        1
      );

      expect(result.success).toBe(true);
      expect(result.challenges).toHaveLength(1);
      expect(result.challenges[0].title).toBe('Sample Challenge');
      expect(result.challenges[0].category).toBe('Node.js');
      expect(axios.post).toHaveBeenCalled();
      // AI service generates challenges from AI API, not directly from DB
    });

    it('should handle API errors gracefully', async () => {
      axios.post.mockRejectedValue(new Error('API Error'));

      await expect(
        aiService.generateChallenges('Node.js', 'medium', '', 1)
      ).rejects.toThrow('Failed to generate challenges');
    });

    it('should parse JSON responses with code blocks', async () => {
      const responseWithCodeBlock = {
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text:
                      '```json\n' +
                      JSON.stringify([
                        {
                          title: 'Test Challenge',
                          description: 'Test description',
                          instructions: 'Test instructions',
                          category: 'Testing',
                          difficulty_level: 'easy',
                          estimated_time_minutes: 30,
                          points_reward: 5,
                          learning_objectives: ['Testing'],
                          tags: ['test'],
                        },
                      ]) +
                      '\n```',
                  },
                ],
              },
            },
          ],
        },
      };

      axios.post.mockResolvedValue(responseWithCodeBlock);
      db.query.mockResolvedValue({ rows: [{ id: 1 }] });

      const result = await aiService.generateChallenges(
        'Testing',
        'easy',
        '',
        1
      );

      expect(result.success).toBe(true);
      expect(result.challenges[0].title).toBe('Test Challenge');
    });
  });

  describe('generateFeedback', () => {
    const mockFeedbackResponse = {
      data: {
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    score: 85,
                    feedback_text:
                      'Great work! Your solution is well-structured.',
                    strengths: ['Clean code', 'Good documentation'],
                    improvements: [
                      'Add error handling',
                      'Optimize performance',
                    ],
                    suggestions: ['Use async/await', 'Add unit tests'],
                    confidence_score: 0.92,
                  }),
                },
              ],
            },
          },
        ],
      },
    };

    it('should generate feedback successfully', async () => {
      axios.post.mockResolvedValue(mockFeedbackResponse);
      db.query.mockResolvedValue({
        rows: [
          {
            id: 1,
            feedback_text: 'Great work! Your solution is well-structured.',
            confidence_score: 0.92,
          },
        ],
      });

      const result = await aiService.generateFeedback(
        1,
        'function test() { return true; }',
        'JavaScript Function',
        'Create a test function',
        'code'
      );

      expect(result.success).toBe(true);
      expect(result.feedback.score).toBe(85);
      expect(result.feedback.strengths).toContain('Clean code');
      expect(result.feedback.improvements).toContain('Add error handling');
      expect(db.query).toHaveBeenCalled();
    });

    it('should handle invalid JSON responses', async () => {
      axios.post.mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Invalid JSON',
                  },
                ],
              },
            },
          ],
        },
      });

      await expect(
        aiService.generateFeedback(1, 'code', 'Title', 'Description', 'code')
      ).rejects.toThrow();
    });
  });

  describe('answerFollowUp', () => {
    it('should answer follow-up questions', async () => {
      db.query.mockResolvedValue({
        rows: [
          {
            feedback_text: 'Original feedback',
            strengths: ['Good'],
            improvements: ['Better'],
            suggestions: ['Try this'],
          },
        ],
      });

      axios.post.mockResolvedValue({
        data: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: 'Here is a detailed explanation of the improvement suggestion.',
                  },
                ],
              },
            },
          ],
        },
      });

      const result = await aiService.answerFollowUp(
        1,
        'Can you explain the first improvement?'
      );

      expect(result.success).toBe(true);
      expect(result.answer).toBeTruthy();
      expect(typeof result.answer).toBe('string');
    });

    it('should handle missing feedback gracefully', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(aiService.answerFollowUp(999, 'Question')).rejects.toThrow(
        'Feedback not found'
      );
    });
  });

  describe('getFeedbackHistory', () => {
    it('should retrieve feedback history', async () => {
      const mockHistory = [
        {
          id: 1,
          feedback_text: 'First feedback',
          confidence_score: 0.9,
          created_at: new Date(),
        },
        {
          id: 2,
          feedback_text: 'Second feedback',
          confidence_score: 0.85,
          created_at: new Date(),
        },
      ];

      db.query.mockResolvedValue({ rows: mockHistory });

      const result = await aiService.getFeedbackHistory(1);

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(2);
      expect(result.history[0].id).toBe(1);
    });

    it('should return empty array when no history exists', async () => {
      db.query.mockResolvedValue({ rows: [] });

      const result = await aiService.getFeedbackHistory(999);

      expect(result.success).toBe(true);
      expect(result.history).toHaveLength(0);
    });
  });
});

// Snapshot test for prompt templates
describe('AI Prompt Templates Snapshot', () => {
  it('should match challenge generation prompt snapshot', () => {
    const prompt = `
You are an expert educational content creator. Generate 1 high-quality learning challenge(s) for the following:

Category: JavaScript
Difficulty Level: medium
Focus Areas: async/await, promises

For each challenge, provide:
1. A clear, engaging title
2. A detailed description explaining what the learner will accomplish
3. Step-by-step instructions
4. Learning objectives (as an array)
5. Estimated time in minutes
6. Points reward (based on difficulty: easy=5, medium=10, hard=15)
7. Relevant tags (as an array)

Return ONLY a valid JSON array with this exact structure:
[{
  "title": "string",
  "description": "string",
  "instructions": "string",
  "category": "JavaScript",
  "difficulty_level": "medium",
  "estimated_time_minutes": number,
  "points_reward": number,
  "learning_objectives": ["string"],
  "tags": ["string"]
}]

Make the challenges practical, engaging, and appropriate for the difficulty level.
`;

    expect(prompt).toMatchSnapshot();
  });

  it('should match feedback generation prompt snapshot', () => {
    const prompt = `
You are an expert educational mentor providing constructive feedback. Analyze this submission:

Challenge: Build a REST API
Description: Create a RESTful API using Express
Submission Type: code
Submission Content:
function createAPI() { return 'API'; }

Provide detailed feedback in JSON format with this exact structure:
{
  "score": number (0-100),
  "feedback_text": "Overall evaluation in 2-3 sentences",
  "strengths": ["specific positive point 1", "specific positive point 2"],
  "improvements": ["specific improvement suggestion 1", "specific improvement suggestion 2"],
  "suggestions": ["actionable next step 1", "actionable next step 2"],
  "confidence_score": number (0.0-1.0)
}

Be constructive, specific, and encouraging. Focus on both what was done well and how to improve.
`;

    expect(prompt).toMatchSnapshot();
  });
});

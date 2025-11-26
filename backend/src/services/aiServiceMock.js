// Mock AI Service for testing without OpenAI API costs
// Provides realistic fake data with same interface as aiService.js

const db = require('../database/connection');

const aiServiceMock = {
  // Mock challenge generation
  generateChallenge: async ({ skill, difficulty, topic, type }) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    const challenges = {
      JavaScript: {
        'Code Completion': {
          title: `${topic} Implementation Challenge`,
          description: `Complete the function that ${topic.toLowerCase()}. Your solution should handle edge cases and follow best practices.`,
          starterCode: `function solve${topic.replace(
            /\s+/g,
            ''
          )}(input) {\n  // TODO: Implement your solution here\n  \n}`,
          testCases: [
            { input: 'test1', expected: 'result1' },
            { input: 'test2', expected: 'result2' },
          ],
          hints: [
            `Consider the ${difficulty} complexity requirements`,
            'Think about edge cases like empty inputs',
            'Use ES6 features for cleaner code',
          ],
        },
        'Multiple Choice': {
          title: `${topic} Concepts Quiz`,
          description: `Test your understanding of ${topic} in JavaScript.`,
          question: `What is the best approach to ${topic.toLowerCase()} in JavaScript?`,
          options: [
            'Use async/await pattern',
            'Use callback functions',
            'Use promise chains',
            'Use synchronous methods',
          ],
          correctAnswer: 0,
          explanation: `Async/await provides the cleanest syntax for ${topic}`,
        },
        Debugging: {
          title: `Debug ${topic} Implementation`,
          description: `Find and fix the bugs in this ${topic} code.`,
          buggyCode: `function buggy${topic.replace(
            /\s+/g,
            ''
          )}(data) {\n  // Bug: Missing null check\n  return data.map(item => item.value);\n}`,
          hints: [
            'Check for null or undefined inputs',
            'Validate array existence before mapping',
            'Consider type checking',
          ],
        },
      },
      Python: {
        'Code Completion': {
          title: `${topic} Algorithm Challenge`,
          description: `Implement a Python function for ${topic.toLowerCase()}. Focus on efficiency and readability.`,
          starterCode: `def solve_${topic
            .replace(/\s+/g, '_')
            .toLowerCase()}(input_data):\n    # TODO: Implement your solution\n    pass`,
          testCases: [
            { input: '[1, 2, 3]', expected: 'result' },
            { input: '[]', expected: 'empty_result' },
          ],
          hints: [
            'Use list comprehensions for efficiency',
            'Consider using built-in functions',
            'Handle edge cases properly',
          ],
        },
        'Multiple Choice': {
          title: `${topic} Best Practices`,
          description: `Test your Python knowledge about ${topic}.`,
          question: `Which Python feature is best for ${topic.toLowerCase()}?`,
          options: [
            'List comprehensions',
            'Generator expressions',
            'Lambda functions',
            'Class methods',
          ],
          correctAnswer: 1,
          explanation: `Generator expressions are memory-efficient for ${topic}`,
        },
      },
      Java: {
        'Code Completion': {
          title: `${topic} Class Implementation`,
          description: `Create a Java class that handles ${topic.toLowerCase()}.`,
          starterCode: `public class ${topic.replace(
            /\s+/g,
            ''
          )} {\n    // TODO: Implement class members and methods\n    \n}`,
          testCases: [
            { input: 'scenario1', expected: 'output1' },
            { input: 'scenario2', expected: 'output2' },
          ],
          hints: [
            'Follow OOP principles',
            'Use appropriate access modifiers',
            'Implement proper exception handling',
          ],
        },
      },
    };

    // Get skill-specific template or default to JavaScript
    const skillChallenges = challenges[skill] || challenges.JavaScript;
    const typeTemplate =
      skillChallenges[type] || skillChallenges['Code Completion'];

    // Build challenge based on difficulty
    const difficultyModifiers = {
      Beginner: { timeEstimate: 15, points: 10 },
      Intermediate: { timeEstimate: 30, points: 20 },
      Advanced: { timeEstimate: 60, points: 40 },
      Expert: { timeEstimate: 90, points: 60 },
    };

    const modifier =
      difficultyModifiers[difficulty] || difficultyModifiers.Beginner;

    return {
      title: typeTemplate.title,
      description: typeTemplate.description,
      type: type,
      difficulty: difficulty,
      skills: [skill],
      timeEstimate: modifier.timeEstimate,
      points: modifier.points,
      ...(type === 'Code Completion' && {
        starterCode: typeTemplate.starterCode,
        testCases: typeTemplate.testCases,
        hints: typeTemplate.hints,
      }),
      ...(type === 'Multiple Choice' && {
        question: typeTemplate.question,
        options: typeTemplate.options,
        correctAnswer: typeTemplate.correctAnswer,
        explanation: typeTemplate.explanation,
      }),
      ...(type === 'Debugging' && {
        buggyCode: typeTemplate.buggyCode,
        hints: typeTemplate.hints,
      }),
    };
  },

  // Mock feedback generation
  submitForFeedback: async ({
    submissionId,
    code,
    submissionCode,
    challengeId,
    userId,
  }) => {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Use submissionCode if code is not provided
    const codeToAnalyze = code || submissionCode || '';

    // Generate realistic feedback based on code length and complexity
    const codeLines = codeToAnalyze.split('\n').length;
    const hasComments =
      codeToAnalyze.includes('//') || codeToAnalyze.includes('/*');
    const hasErrorHandling =
      codeToAnalyze.includes('try') ||
      codeToAnalyze.includes('catch') ||
      codeToAnalyze.includes('if');

    const feedbackTemplates = [
      {
        overallScore: 85,
        strengths: [
          'Clean and readable code structure',
          'Good variable naming conventions',
          'Efficient algorithm implementation',
        ],
        improvements: [
          'Consider adding more comments for complex logic',
          'Add error handling for edge cases',
          'Could optimize the time complexity',
        ],
        suggestions: [
          'Try using ES6 destructuring for cleaner code',
          'Consider breaking down into smaller functions',
          'Add input validation',
        ],
      },
      {
        overallScore: 75,
        strengths: [
          'Correct implementation of core logic',
          'Handles basic test cases well',
        ],
        improvements: [
          "Code could be more DRY (Don't Repeat Yourself)",
          'Missing edge case handling',
          'Variable names could be more descriptive',
        ],
        suggestions: [
          'Refactor repeated code into helper functions',
          'Add boundary condition checks',
          'Use more meaningful variable names',
        ],
      },
      {
        overallScore: 90,
        strengths: [
          'Excellent code organization',
          'Comprehensive error handling',
          'Well-documented with clear comments',
          'Efficient use of built-in methods',
        ],
        improvements: [
          'Could add more test cases',
          'Consider performance optimization for large inputs',
        ],
        suggestions: [
          'Great job! Keep up the good practices',
          'Consider adding JSDoc comments for better documentation',
        ],
      },
    ];

    // Select feedback based on code characteristics
    let selectedFeedback;
    if (hasComments && hasErrorHandling && codeLines > 10) {
      selectedFeedback = feedbackTemplates[2]; // High score
    } else if (hasErrorHandling || codeLines > 5) {
      selectedFeedback = feedbackTemplates[0]; // Medium score
    } else {
      selectedFeedback = feedbackTemplates[1]; // Lower score
    }

    const feedbackResult = {
      submissionId,
      overallScore: selectedFeedback.overallScore,
      strengths: selectedFeedback.strengths,
      improvements: selectedFeedback.improvements,
      suggestions: selectedFeedback.suggestions,
      detailedAnalysis: `Your solution demonstrates ${
        selectedFeedback.overallScore >= 85 ? 'strong' : 'good'
      } understanding of the problem. ${
        hasComments
          ? 'Good use of comments. '
          : 'Consider adding more comments. '
      }${
        hasErrorHandling
          ? 'Nice error handling. '
          : 'Adding error handling would make this more robust. '
      }Keep practicing!`,
    };

    // Story 3.6: Save feedback to database
    try {
      const prompt = `Analyze this code submission for challenge ${
        challengeId || 'N/A'
      }`;
      const response = JSON.stringify(feedbackResult);

      const result = await db.query(
        `INSERT INTO ai_feedback 
        (submission_id, prompt, response, feedback_text, confidence_score, strengths, improvements, suggestions, ai_model, processing_time_ms, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *`,
        [
          submissionId,
          prompt,
          response,
          feedbackResult.detailedAnalysis,
          selectedFeedback.overallScore / 100,
          selectedFeedback.strengths,
          selectedFeedback.improvements,
          selectedFeedback.suggestions,
          'mock-ai-v1',
          800,
        ]
      );

      return {
        ...feedbackResult,
        id: result.rows[0].id,
        confidenceScore: selectedFeedback.overallScore / 100,
        feedbackText: feedbackResult.detailedAnalysis,
        aiModel: 'mock-ai-v1',
        processingTime: 800,
      };
    } catch (error) {
      console.error('Failed to save mock feedback:', error);
      // Return feedback even if DB save fails
      return {
        ...feedbackResult,
        confidenceScore: selectedFeedback.overallScore / 100,
        feedbackText: feedbackResult.detailedAnalysis,
        aiModel: 'mock-ai-v1',
        processingTime: 800,
      };
    }
  },

  // Get feedback for a submission
  getFeedback: async (submissionId) => {
    const result = await db.query(
      'SELECT * FROM ai_feedback WHERE submission_id = $1 ORDER BY created_at DESC',
      [submissionId]
    );
    return result.rows;
  },

  // Get all feedback for user's challenge submissions
  getFeedbackForChallenge: async (userId, challengeId) => {
    const result = await db.query(
      `SELECT 
        s.id as submission_id,
        s.submission_text as code,
        s.submitted_at,
        s.attempt_number,
        af.id as feedback_id,
        af.feedback_text,
        af.confidence_score,
        af.strengths,
        af.improvements,
        af.suggestions,
        af.ai_model,
        af.processing_time_ms,
        af.created_at as feedback_created_at
      FROM submissions s
      LEFT JOIN ai_feedback af ON s.id = af.submission_id
      WHERE s.user_id = $1 AND s.challenge_id = $2
      ORDER BY s.submitted_at DESC`,
      [userId, challengeId]
    );
    return result.rows;
  },
};

module.exports = aiServiceMock;

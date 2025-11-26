// AI Integration Service with OpenAI API
// Stories 3.2, 3.3, 3.5
const db = require('../database/connection');
const aiPromptTemplates = require('./aiPromptTemplates');
const logger = require('pino')({ name: 'ai-service' });

// Lazy load OpenAI to avoid import errors in test environments
let openai;
const getOpenAI = () => {
  if (!openai) {
    const { OpenAI } = require('openai');
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'test-key',
    });
  }
  return openai;
};

const aiService = {
  // Story 3.2: Generate AI challenge
  generateChallenge: async ({ skill, difficulty, topic, type }) => {
    const startTime = Date.now();

    try {
      const prompt = aiPromptTemplates.generateChallenge({
        skill,
        difficulty,
        topic,
        type,
      });

      logger.info('AI Challenge Generation Request', {
        skill,
        difficulty,
        topic,
      });

      // Call OpenAI API
      const completion = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful coding challenge generator.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      const response = completion.choices[0].message.content;
      const processingTime = Date.now() - startTime;

      // Log prompt and response
      logger.info('AI Challenge Generated', {
        prompt: prompt.substring(0, 100) + '...',
        response: response.substring(0, 100) + '...',
        processingTime,
        model: completion.model,
      });

      // Parse JSON response
      let challengeData;
      try {
        challengeData = JSON.parse(response);
      } catch (e) {
        // If not valid JSON, create structured response
        challengeData = {
          title: `${skill} Challenge`,
          description: response,
          difficulty: difficulty || 'intermediate',
          category: skill,
          estimatedTime: 30,
        };
      }

      return {
        ...challengeData,
        aiModel: completion.model,
        processingTime,
      };
    } catch (error) {
      logger.error('AI Challenge Generation Failed', { error: error.message });
      throw new Error(`Failed to generate challenge: ${error.message}`);
    }
  },

  // Story 3.5: Generate AI feedback for submission
  submitForFeedback: async ({
    submissionId,
    submissionCode,
    challengeTitle,
    challengeDescription,
  }) => {
    const startTime = Date.now();

    try {
      const prompt = aiPromptTemplates.generateFeedback({
        submissionCode,
        challengeTitle,
        challengeDescription,
      });

      logger.info('AI Feedback Request', { submissionId, challengeTitle });

      // Call OpenAI API
      const completion = await getOpenAI().chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'You are an expert code reviewer providing constructive feedback.',
          },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
        max_tokens: 1500,
      });

      const response = completion.choices[0].message.content;
      const processingTime = Date.now() - startTime;

      // Parse feedback JSON
      let feedbackData;
      try {
        feedbackData = JSON.parse(response);
      } catch (e) {
        feedbackData = {
          feedbackText: response,
          confidenceScore: 0.7,
          strengths: [],
          improvements: [],
          suggestions: [],
        };
      }

      // Story 3.6: Save feedback to database with prompt and response
      const result = await db.query(
        `INSERT INTO ai_feedback 
        (submission_id, prompt, response, feedback_text, confidence_score, strengths, improvements, suggestions, ai_model, processing_time_ms, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())
        RETURNING *`,
        [
          submissionId,
          prompt,
          response,
          feedbackData.feedbackText,
          feedbackData.confidenceScore,
          feedbackData.strengths,
          feedbackData.improvements,
          feedbackData.suggestions || [],
          completion.model,
          processingTime,
        ]
      );

      logger.info('AI Feedback Saved', {
        submissionId,
        feedbackId: result.rows[0].id,
        processingTime,
      });

      return {
        ...feedbackData,
        id: result.rows[0].id,
        aiModel: completion.model,
        processingTime,
      };
    } catch (error) {
      logger.error('AI Feedback Generation Failed', { error: error.message });
      throw new Error(`Failed to generate feedback: ${error.message}`);
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

module.exports = aiService;

// AI integration controller for feedback, hints and challenge generation
const aiService = require('../services/aiService');
const { AppError } = require('../middleware/errorHandler');

const aiController = {
  // Keep existing placeholders for other actions (not modified here)
  generateFeedback: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      const body = req.validated || req.body || {};
      const { submission_id, submission_text } = body;

      let submissionText = submission_text || null;
      let challengeContext = {};

      const db = require('../database/connection');

      if (submission_id && !submissionText) {
        // Try to fetch submission text and challenge context
        const q = `
          SELECT s.submission_text, s.user_id, c.id as challenge_id, c.title, c.category, c.difficulty_level, c.learning_objectives
          FROM submissions s
          LEFT JOIN challenges c ON c.id = s.challenge_id
          WHERE s.id = $1
        `;
        const resSub = await db.query(q, [submission_id]);
        const row = resSub.rows && resSub.rows[0];
        if (row) {
          submissionText = row.submission_text;
          challengeContext = {
            id: row.challenge_id,
            title: row.title,
            category: row.category,
            difficulty: row.difficulty_level,
            learningObjectives: row.learning_objectives || [],
          };
        }
      }

      if (!submissionText) {
        return next(
          new AppError(
            'submission_id or submission_text is required',
            400,
            'INVALID_INPUT'
          )
        );
      }

      // Call AI service to generate feedback
      const aiService = require('../services/aiService');
      const aiResult = await aiService.generateFeedback(
        submissionText,
        challengeContext
      );

      // Normalize feedback text to persist
      let feedbackText = null;
      if (aiResult.parsed) {
        try {
          feedbackText =
            typeof aiResult.parsed === 'string'
              ? aiResult.parsed
              : JSON.stringify(aiResult.parsed);
        } catch (e) {
          feedbackText = String(aiResult.parsed);
        }
      } else if (aiResult.raw) {
        feedbackText = aiResult.raw;
      } else if (aiResult.prompt) {
        // Fallback to prompt when no real response available
        feedbackText = aiResult.prompt;
      }

      const AIFeedback = require('../models/AIFeedback');

      const persistObj = {
        submission_id: submission_id || null,
        feedback_text: feedbackText,
        feedback_type: 'ai',
        confidence_score:
          aiResult.parsed && aiResult.parsed.confidence
            ? aiResult.parsed.confidence
            : null,
        suggestions:
          aiResult.parsed && aiResult.parsed.suggestions
            ? aiResult.parsed.suggestions
            : null,
        strengths:
          aiResult.parsed && aiResult.parsed.strengths
            ? aiResult.parsed.strengths
            : null,
        improvements:
          aiResult.parsed && aiResult.parsed.improvements
            ? aiResult.parsed.improvements
            : null,
        ai_model: aiResult.model || null,
        processing_time_ms: aiResult.processing_time_ms || null,
      };

      let created = null;
      try {
        created = await AIFeedback.create(persistObj);
      } catch (persistErr) {
        console.error(
          '[aiController] Failed to persist AI feedback:',
          persistErr.message
        );
        // Still return AI result even if persistence fails
      }

      return res
        .status(200)
        .json({ success: true, data: created || null, ai: aiResult });
    } catch (err) {
      console.error('[aiController] generateFeedback error:', err.message);
      return next(
        new AppError(
          err.message || 'AI feedback generation failed',
          500,
          'AI_ERROR'
        )
      );
    }
  },

  getHints: async (req, res, next) => {
    return next(new AppError('Not implemented', 501, 'NOT_IMPLEMENTED'));
  },

  suggestChallenges: async (req, res, next) => {
    return next(new AppError('Not implemented', 501, 'NOT_IMPLEMENTED'));
  },

  analyzeProgress: async (req, res, next) => {
    return next(new AppError('Not implemented', 501, 'NOT_IMPLEMENTED'));
  },

  // Generate a challenge via AI and return the structured object
  generateChallenge: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      const body = req.validated || req.body || {};

      const result = await aiService.generateChallenge(userId, body);
      try {
        console.debug(
          '[aiController] generateChallenge result:',
          JSON.stringify(result)
        );
      } catch (e) {}

      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      // Map service errors to AppError where appropriate
      console.error('[aiController] generateChallenge error:', err.message);
      return next(
        new AppError(err.message || 'AI generation failed', 500, 'AI_ERROR')
      );
    }
  },
};

module.exports = aiController;

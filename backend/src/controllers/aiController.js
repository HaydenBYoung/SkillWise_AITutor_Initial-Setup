// AI Controller for AI-powered features
const aiService = require('../services/aiService');
const db = require('../database/connection');

const aiController = {
  /**
   * Generate AI challenges
   * Story 3.2: POST /ai/generateChallenge
   */
  generateChallenge: async (req, res, next) => {
    try {
      const { difficulty, focusAreas, count, goalId } = req.body;
      const userId = req.user?.id;

      // Goal is now required
      if (!goalId) {
        return res.status(400).json({
          success: false,
          error: 'Goal is required for challenge generation',
        });
      }

      // Fetch goal details
      const goalResult = await db.query(
        'SELECT title, description, category FROM goals WHERE id = $1 AND user_id = $2',
        [goalId, userId]
      );

      if (goalResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }

      const goalContext = goalResult.rows[0];

      const validDifficulties = ['easy', 'medium', 'hard'];
      if (difficulty && !validDifficulties.includes(difficulty)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid difficulty level. Must be easy, medium, or hard',
        });
      }

      const challengeCount = Math.min(count || 1, 5); // Limit to 5 challenges at once

      // Use goal's category and description as the foundation
      const effectiveCategory = goalContext.category || 'General';
      const effectiveFocusAreas = `${goalContext.title}. ${
        goalContext.description
      }. ${focusAreas || ''}`.trim();

      // Generate challenges using AI
      const result = await aiService.generateChallenges(
        effectiveCategory,
        difficulty || 'medium',
        effectiveFocusAreas,
        challengeCount,
        goalId
      );

      // Add metadata
      const challengesWithMetadata = result.challenges.map((challenge) => ({
        ...challenge,
        is_ai_generated: true,
        created_by: userId || null,
        goal_id: goalId || null,
      }));

      res.status(200).json({
        success: true,
        message: `Generated ${challengesWithMetadata.length} challenge(s)`,
        challenges: challengesWithMetadata,
        processing_time_ms: result.processingTime,
        goal_used: goalContext ? goalContext.title : null,
      });
    } catch (error) {
      console.error('Generate Challenge Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to generate challenges',
        message:
          error.message || 'An error occurred while generating challenges',
      });
    }
  },

  /**
   * Submit work for AI feedback
   * Story 3.5: POST /ai/submitForFeedback
   */
  submitForFeedback: async (req, res, next) => {
    try {
      const { submissionId, submissionText, challengeId, submissionType } =
        req.body;

      // Validation
      if (!submissionText || !challengeId) {
        return res.status(400).json({
          success: false,
          error: 'Submission text and challenge ID are required',
        });
      }

      // Get challenge details
      const challengeResult = await db.query(
        'SELECT title, description FROM challenges WHERE id = $1',
        [challengeId]
      );

      if (challengeResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
        });
      }

      const challenge = challengeResult.rows[0];

      // If submissionId is provided, verify it exists
      let actualSubmissionId = submissionId;
      if (submissionId) {
        const submissionCheck = await db.query(
          'SELECT id FROM submissions WHERE id = $1',
          [submissionId]
        );
        if (submissionCheck.rows.length === 0) {
          return res.status(404).json({
            success: false,
            error: 'Submission not found',
          });
        }
      }

      // Generate feedback
      const result = await aiService.generateFeedback(
        actualSubmissionId,
        submissionText,
        challenge.title,
        challenge.description,
        submissionType || 'text'
      );

      res.status(200).json({
        success: true,
        message: 'Feedback generated successfully',
        feedback: result.feedback,
      });
    } catch (error) {
      console.error('Submit for Feedback Error:', error);
      next(error);
    }
  },

  /**
   * Get feedback history for a submission
   * GET /ai/feedback/:submissionId
   */
  getFeedbackHistory: async (req, res, next) => {
    try {
      const { submissionId } = req.params;

      const result = await aiService.getFeedbackHistory(submissionId);

      res.status(200).json({
        success: true,
        history: result.history,
      });
    } catch (error) {
      console.error('Get Feedback History Error:', error);
      next(error);
    }
  },

  /**
   * Ask follow-up question about feedback
   * POST /ai/feedback/:feedbackId/followup
   */
  askFollowUp: async (req, res, next) => {
    try {
      const { feedbackId } = req.params;
      const { question } = req.body;

      if (!question) {
        return res.status(400).json({
          success: false,
          error: 'Question is required',
        });
      }

      const result = await aiService.answerFollowUp(feedbackId, question);

      res.status(200).json({
        success: true,
        answer: result.answer,
      });
    } catch (error) {
      console.error('Follow-up Question Error:', error);
      next(error);
    }
  },

  /**
   * Save AI-generated challenge to database
   * POST /ai/challenges/save
   */
  saveGeneratedChallenge: async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const { challenge, goalId } = req.body;

      if (!challenge) {
        return res.status(400).json({
          success: false,
          error: 'Challenge data is required',
        });
      }

      // Insert challenge into database
      const result = await db.query(
        `INSERT INTO challenges (
          title, description, instructions, category, difficulty_level,
          estimated_time_minutes, points_reward, learning_objectives, tags,
          is_ai_generated, created_by, goal_id, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          challenge.title,
          challenge.description,
          challenge.instructions,
          challenge.category,
          challenge.difficulty_level || 'medium',
          challenge.estimated_time_minutes || 30,
          challenge.points_reward || 10,
          challenge.learning_objectives || [],
          challenge.tags || [],
          true, // is_ai_generated
          userId,
          goalId || null,
          true,
        ]
      );

      res.status(201).json({
        success: true,
        message: 'Challenge saved successfully',
        challenge: result.rows[0],
      });
    } catch (error) {
      console.error('Save Challenge Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to save challenge',
        message: error.message,
      });
    }
  },
};

module.exports = aiController;

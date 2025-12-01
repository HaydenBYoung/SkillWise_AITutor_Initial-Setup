// Submission controller for challenge work submissions
const submissionService = require('../services/submissionService');
const aiService = require('../services/aiService');
const Challenge = require('../models/Challenge');
const db = require('../database/connection');

const submissionController = {
  // Submit work for challenge
  submitWork: async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const { challengeId, type, content, explanation } = req.body;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }

      if (!challengeId || !content) {
        return res.status(400).json({
          success: false,
          message: 'Challenge ID and content are required',
        });
      }

      // Check if user has already earned points for this challenge
      const existingPointsCheck = await db.query(
        `SELECT points_earned FROM progress_events 
         WHERE user_id = $1 AND related_challenge_id = $2 AND event_type = 'challenge_completed'
         ORDER BY created_at DESC LIMIT 1`,
        [userId, challengeId]
      );

      const hasEarnedPoints =
        existingPointsCheck.rows.length > 0 &&
        existingPointsCheck.rows[0].points_earned > 0;

      if (hasEarnedPoints) {
        return res.status(400).json({
          success: false,
          message:
            'You have already earned points for this challenge and cannot resubmit.',
        });
      }

      // Create submission
      const submission = await submissionService.createSubmission({
        userId,
        challengeId,
        content,
        explanation,
        type: type || 'code',
      });

      // Generate AI feedback synchronously so we can return it immediately
      const challenge = await Challenge.findById(challengeId);
      let feedbackResult = null;

      if (challenge) {
        try {
          feedbackResult = await aiService.generateFeedback(
            submission.id,
            content,
            challenge.title,
            challenge.description,
            type || 'code'
          );
        } catch (err) {
          console.error('Error generating AI feedback:', err);
        }
      }

      return res.status(201).json({
        success: true,
        data: {
          submission,
          feedback: feedbackResult?.feedback || null,
        },
        message: 'Submission created successfully and AI feedback generated.',
      });
    } catch (err) {
      return next(err);
    }
  },

  // Get submission by ID
  getSubmission: async (req, res, next) => {
    try {
      const id = req.params.id;
      const submission = await submissionService.getSubmissionById(id);

      if (!submission) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found',
        });
      }

      return res.status(200).json({ success: true, data: { submission } });
    } catch (err) {
      return next(err);
    }
  },

  // Get user submissions
  getUserSubmissions: async (req, res, next) => {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }

      const submissions = await submissionService.getUserSubmissions(userId);
      return res.status(200).json({ success: true, data: { submissions } });
    } catch (err) {
      return next(err);
    }
  },

  // Update submission
  updateSubmission: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updated = await submissionService.updateSubmission(id, req.body);

      if (!updated) {
        return res.status(404).json({
          success: false,
          message: 'Submission not found',
        });
      }

      return res
        .status(200)
        .json({ success: true, data: { submission: updated } });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = submissionController;

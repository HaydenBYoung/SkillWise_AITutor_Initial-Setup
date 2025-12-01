const challengeService = require('../services/challengeService');
const leaderboardService = require('../services/leaderboardService');
const pointSystem = require('../utils/pointSystem');

const challengeController = {
  // Get all challenges
  getChallenges: async (req, res, next) => {
    try {
      const filters = {
        difficulty: req.query.difficulty,
        subject: req.query.category || req.query.subject,
        search: req.query.search,
      };

      const challenges = await challengeService.getChallenges(filters);
      return res.status(200).json({ success: true, data: challenges });
    } catch (err) {
      return next(err);
    }
  },

  // Get challenge by ID
  getChallengeById: async (req, res, next) => {
    try {
      const id = req.params.id;
      const userId = req.user?.id;
      const challenge = await challengeService.getById(id, userId);
      if (!challenge)
        return res
          .status(404)
          .json({ success: false, message: 'Challenge not found' });
      // Return challenge directly as data, not wrapped in another object
      return res.status(200).json({ success: true, data: challenge });
    } catch (err) {
      return next(err);
    }
  },

  // Create new challenge
  createChallenge: async (req, res, next) => {
    try {
      const payload = req.body || {};
      const created = await challengeService.createChallenge(payload);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return next(err);
    }
  },

  // Update challenge
  updateChallenge: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updated = await challengeService.updateChallenge(
        id,
        req.body || {}
      );
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: 'Challenge not found' });
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },

  // Delete challenge
  deleteChallenge: async (req, res, next) => {
    try {
      const id = req.params.id;
      const deleted = await challengeService.deleteChallenge(id);
      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: 'Challenge not found' });
      return res.status(200).json({ success: true, data: deleted });
    } catch (err) {
      return next(err);
    }
  },

  // Mark challenge as complete and award points
  completeChallenge: async (req, res, next) => {
    try {
      const challengeId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }

      // Get challenge details
      const challenge = await challengeService.getById(challengeId, userId);
      if (!challenge) {
        return res
          .status(404)
          .json({ success: false, message: 'Challenge not found' });
      }

      // Check if already completed and points awarded
      const db = require('../database/connection');
      const alreadyCompleted = await db.query(
        `SELECT id FROM progress_events 
         WHERE user_id = $1 AND related_challenge_id = $2 
         AND event_type = 'challenge_completed' AND points_earned > 0
         LIMIT 1`,
        [userId, challengeId]
      );

      if (alreadyCompleted.rows.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Challenge already completed and points awarded',
        });
      }

      // Calculate points based on difficulty
      const points = pointSystem.calculateChallengePoints(
        challenge.difficulty || 'medium'
      );

      // Award points to user
      await leaderboardService.updateUserPoints(
        userId,
        points,
        'challenge_completed'
      );

      // Record completion in progress_events
      await db.query(
        `INSERT INTO progress_events 
         (user_id, event_type, event_data, points_earned, related_goal_id, related_challenge_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          'challenge_completed',
          JSON.stringify({
            challenge_title: challenge.title,
            difficulty: challenge.difficulty,
          }),
          points,
          challenge.goal_id || null,
          challengeId,
        ]
      );

      return res.status(200).json({
        success: true,
        data: {
          points_earned: points,
          message: `Challenge completed! You earned ${points} points.`,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = challengeController;

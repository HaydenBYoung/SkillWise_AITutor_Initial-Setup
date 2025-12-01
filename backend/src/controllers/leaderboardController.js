// TODO: Implement leaderboard controller for rankings and points
const leaderboardService = require('../services/leaderboardService');
const achievementService = require('../services/achievementService');
const Progress = require('../models/Progress');

const leaderboardController = {
  // TODO: Get global leaderboard
  getLeaderboard: async (req, res, next) => {
    try {
      const timeframe = req.query.timeframe || 'all';
      const limit = parseInt(req.query.limit || '10', 10);
      const subject = req.query.subject || null;
      const data = await leaderboardService.calculateRankings(timeframe, limit, subject);
      return res.json({ success: true, data });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get user ranking
  getUserRanking: async (req, res, next) => {
    try {
      const userId = (req.user && req.user.id) || parseInt(req.params.userId, 10);
      if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
      const rank = await leaderboardService.getUserRank(userId);
      return res.json({ success: true, data: rank });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get points breakdown
  getPointsBreakdown: async (req, res, next) => {
    try {
      const userId = (req.user && req.user.id) || parseInt(req.params.userId, 10);
      if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
      const stats = await Progress.getUserStats(userId);
      return res.json({ success: true, data: stats });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get achievements
  getAchievements: async (req, res, next) => {
    try {
      const userId = (req.user && req.user.id) || parseInt(req.params.userId, 10);
      if (!userId) return res.status(400).json({ success: false, error: 'User ID required' });
      const achievements = await achievementService.getUserAchievements(userId);
      return res.json({ success: true, data: achievements });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = leaderboardController;

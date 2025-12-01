// Implement leaderboard calculations and rankings
const Leaderboard = require('../models/Leaderboard');
const Progress = require('../models/Progress');
const achievementService = require('./achievementService');

const leaderboardService = {
  // Calculate rankings using the Leaderboard model
  calculateRankings: async (timeframe = 'all', limit = 10, subject = null) => {
    switch ((timeframe || 'all').toLowerCase()) {
    case 'weekly':
      return await Leaderboard.getWeeklyLeaderboard(limit);
    case 'monthly':
      return await Leaderboard.getMonthlyLeaderboard(limit);
    case 'subject':
      if (!subject) throw new Error('Subject required for subject leaderboard');
      return await Leaderboard.getSubjectLeaderboard(subject, limit);
    case 'all':
    default:
      return await Leaderboard.getGlobalLeaderboard(limit);
    }
  },

  // Create a manual progress event to add points for a user
  updateUserPoints: async (userId, points, reason = 'manual') => {
    if (!userId) throw new Error('User ID required');
    // create a new progress event with event_type manual_points and reason
    const event = await Progress.create({
      user_id: userId,
      event_type: 'manual_points',
      event_data: { reason },
      points_earned: Number(points) || 0,
    });
    return event;
  },

  // Return top performers (global)
  getTopPerformers: async (limit = 10) => {
    return await Leaderboard.getGlobalLeaderboard(limit);
  },

  // Calculate points contribution from an achievement object or id
  calculateAchievementPoints: async (achievementOrId) => {
    if (!achievementOrId) return 0;
    if (typeof achievementOrId === 'object') {
      return Number(achievementOrId.points || 0);
    }
    // Otherwise treat as ID and look up
    const achievement = await achievementService.getAchievementById(achievementOrId);
    if (!achievement) return 0;
    return Number(achievement.points || 0);
  },
  // Get user rank wrapper
  getUserRank: async (userId) => {
    return await Leaderboard.getUserRank(userId);
  },
};

module.exports = leaderboardService;

const leaderboardService = require('../services/leaderboardService');
const { calculateLevel } = require('../utils/pointSystem');

const leaderboardController = {
  /**
   * Get global leaderboard with filtering
   * GET /api/leaderboard?timeframe=weekly&limit=50&offset=0
   */
  getLeaderboard: async (req, res, next) => {
    try {
      const {
        timeframe = 'all-time',
        category,
        limit = 50,
        offset = 0,
      } = req.query;

      const validTimeframes = ['daily', 'weekly', 'monthly', 'all-time'];
      if (!validTimeframes.includes(timeframe)) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid timeframe. Must be: daily, weekly, monthly, or all-time',
        });
      }

      const result = await leaderboardService.getLeaderboard(
        timeframe,
        category,
        parseInt(limit),
        parseInt(offset)
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error('Error in getLeaderboard:', error);
      next(error);
    }
  },

  /**
   * Get current user's ranking and stats
   * GET /api/leaderboard/me?timeframe=all-time
   */
  getUserRanking: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { timeframe = 'all-time' } = req.query;

      const validTimeframes = ['daily', 'weekly', 'monthly', 'all-time'];
      if (!validTimeframes.includes(timeframe)) {
        return res.status(400).json({
          success: false,
          message:
            'Invalid timeframe. Must be: daily, weekly, monthly, or all-time',
        });
      }

      const userRank = await leaderboardService.getUserRank(userId, timeframe);

      if (!userRank) {
        return res.status(404).json({
          success: false,
          message: 'User statistics not found',
        });
      }

      // Get level information
      const levelInfo = calculateLevel(userRank.points);

      res.json({
        success: true,
        data: {
          ...userRank,
          levelInfo,
        },
      });
    } catch (error) {
      console.error('Error in getUserRanking:', error);
      next(error);
    }
  },

  /**
   * Get surrounding players (players ranked around current user)
   * GET /api/leaderboard/surrounding?timeframe=all-time&range=5
   */
  getSurroundingPlayers: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { timeframe = 'all-time', range = 5 } = req.query;

      const userRank = await leaderboardService.getUserRank(userId, timeframe);

      if (!userRank || !userRank.rank) {
        return res.status(404).json({
          success: false,
          message: 'User ranking not found',
        });
      }

      const rangeNum = parseInt(range);
      const offset = Math.max(0, userRank.rank - rangeNum - 1);
      const limit = rangeNum * 2 + 1;

      const result = await leaderboardService.getLeaderboard(
        timeframe,
        null,
        limit,
        offset
      );

      res.json({
        success: true,
        data: {
          ...result,
          currentUserRank: userRank.rank,
        },
      });
    } catch (error) {
      console.error('Error in getSurroundingPlayers:', error);
      next(error);
    }
  },

  /**
   * Trigger leaderboard recalculation (admin only - can be called by cron job)
   * POST /api/leaderboard/recalculate
   */
  recalculateRankings: async (req, res, next) => {
    try {
      const { timeframe = 'all-time' } = req.body;

      const result = await leaderboardService.recalculateRankings(timeframe);

      res.json({
        success: true,
        message: 'Rankings recalculated successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error in recalculateRankings:', error);
      next(error);
    }
  },
};

module.exports = leaderboardController;

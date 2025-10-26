const achievementService = require('../services/achievementService');
const { AppError } = require('../middleware/errorHandler');

const achievementController = {
  async getAllAchievements(req, res, next) {
    try {
      const achievements = await achievementService.getAllAchievements();
      res.json({ achievements });
    } catch (err) {
      next(new AppError('Failed to fetch achievements', 500, 'FETCH_ERROR'));
    }
  },

  async getAchievementById(req, res, next) {
    try {
      const { id } = req.params;
      const achievement = await achievementService.getAchievementById(id);
      if (!achievement) {
        throw new AppError('Achievement not found', 404, 'NOT_FOUND');
      }
      res.json({ achievement });
    } catch (err) {
      next(err);
    }
  },

  async getUserAchievements(req, res, next) {
    try {
      const achievements = await achievementService.getUserAchievements(req.user.id);
      res.json({ achievements });
    } catch (err) {
      next(new AppError('Failed to fetch user achievements', 500, 'FETCH_ERROR'));
    }
  }
};

module.exports = achievementController;

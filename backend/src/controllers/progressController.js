// Implement progress tracking controller
const progressService = require('../services/progressService');
const { AppError } = require('../middleware/errorHandler');

const progressController = {
  // Get user progress overview
  getProgress: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return next(new AppError('Unauthorized', 401));
      const overview = await progressService.calculateOverallProgress(userId);
      return res.status(200).json({ success: true, data: overview });
    } catch (err) {
      return next(err);
    }
  },

  // Update progress event (e.g., mark challenge complete)
  updateProgress: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return next(new AppError('Unauthorized', 401));

      const { eventType, eventData } = req.body || {};

      if (!eventType || !eventData) {
        return next(new AppError('Missing eventType or eventData', 400));
      }

      const result = await progressService.trackEvent(userId, eventType, eventData);
      return res.status(200).json({ success: true, data: result });
    } catch (err) {
      return next(err);
    }
  },

  // Get progress analytics (placeholder)
  getAnalytics: async (req, res, next) => {
    try {
      // Placeholder - not implemented fully
      return res.status(501).json({ success: false, message: 'Not implemented' });
    } catch (err) {
      return next(err);
    }
  },

  // Get milestones (placeholder)
  getMilestones: async (req, res, next) => {
    try {
      return res.status(501).json({ success: false, message: 'Not implemented' });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = progressController;

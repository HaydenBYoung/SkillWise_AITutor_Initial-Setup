// TODO: Implement progress tracking controller
const progressService = require('../services/progressService');

const progressController = {
  // TODO: Get user progress overview
  getProgress: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });

      const overview = await progressService.calculateOverallProgress(userId);
      return res.status(200).json({ success: true, data: overview });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Update progress event
  updateProgress: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });

      const event = req.body || {};
      // Accept either challengeId or challenge_id
      const eventData = {
        challengeId: event.challengeId || event.challenge_id,
        score: event.score,
        completed: event.completed,
        points_earned:
          event.points_earned || event.pointsEarned || event.points,
        time_spent:
          event.time_spent || event.timeSpent || event.timeSpentMinutes || 0,
      };

      const result = await progressService.trackEvent(userId, eventData);

      // Return created/updated progress and the refreshed overview
      const overview = await progressService.calculateOverallProgress(userId);
      return res
        .status(200)
        .json({ success: true, data: { progress: result, overview } });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get progress analytics
  getAnalytics: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      const timeframe = req.query.timeframe || 'week';
      const analytics = await progressService.generateAnalytics(
        userId,
        timeframe
      );
      return res.status(200).json({ success: true, data: analytics });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get milestones
  getMilestones: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      const milestones = await progressService.checkMilestones(userId);
      return res.status(200).json({ success: true, data: milestones });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = progressController;

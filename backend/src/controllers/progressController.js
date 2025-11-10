const progressService = require('../services/progressService');
const pino = require('pino');

const logger = pino({ name: 'progressController' });

const progressController = {
  // Get user progress overview
  getProgress: async (req, res) => {
    try {
      const userId = req.user.id;
      logger.info(`Fetching progress for user ${userId}`);
      
      const progress = await progressService.getUserProgress(userId);
      
      res.status(200).json({
        success: true,
        data: progress
      });
    } catch (error) {
      logger.error('Error fetching progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch progress data'
      });
    }
  },

  // Get activity data for charts
  getActivityData: async (req, res) => {
    try {
      const userId = req.user.id;
      const { timeframe = '30d' } = req.query;
      
      logger.info(`Fetching activity data for user ${userId}, timeframe: ${timeframe}`);
      
      const activityData = await progressService.getActivityData(userId, timeframe);
      
      res.status(200).json({
        success: true,
        data: activityData
      });
    } catch (error) {
      logger.error('Error fetching activity data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch activity data'
      });
    }
  },

  // Get progress by category
  getProgressByCategory: async (req, res) => {
    try {
      const userId = req.user.id;
      logger.info(`Fetching category progress for user ${userId}`);
      
      const categoryProgress = await progressService.getProgressByCategory(userId);
      
      res.status(200).json({
        success: true,
        data: categoryProgress
      });
    } catch (error) {
      logger.error('Error fetching category progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch category progress'
      });
    }
  },

  // Get achievements and milestones
  getAchievements: async (req, res) => {
    try {
      const userId = req.user.id;
      logger.info(`Fetching achievements for user ${userId}`);
      
      const achievements = await progressService.getAchievements(userId);
      
      res.status(200).json({
        success: true,
        data: achievements
      });
    } catch (error) {
      logger.error('Error fetching achievements:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch achievements'
      });
    }
  },

  // Get completion timeline
  getCompletionTimeline: async (req, res) => {
    try {
      const userId = req.user.id;
      const { limit = 20 } = req.query;
      
      logger.info(`Fetching completion timeline for user ${userId}`);
      
      const timeline = await progressService.getCompletionTimeline(userId, parseInt(limit));
      
      res.status(200).json({
        success: true,
        data: timeline
      });
    } catch (error) {
      logger.error('Error fetching completion timeline:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch completion timeline'
      });
    }
  },

  // Legacy method - update progress event
  updateProgress: async (req, res) => {
    try {
      const userId = req.user.id;
      const { eventType, eventData } = req.body;
      
      logger.info(`Tracking progress event for user ${userId}: ${eventType}`);
      
      const result = await progressService.trackEvent(userId, eventType, eventData);
      
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      logger.error('Error updating progress:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to update progress'
      });
    }
  },

  // Legacy method - get analytics
  getAnalytics: async (req, res) => {
    try {
      const userId = req.user.id;
      const { timeframe = '30d' } = req.query;
      
      const analytics = await progressService.generateAnalytics(userId, timeframe);
      
      res.status(200).json({
        success: true,
        data: analytics
      });
    } catch (error) {
      logger.error('Error fetching analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics'
      });
    }
  },

  // Legacy method - get milestones
  getMilestones: async (req, res) => {
    try {
      const userId = req.user.id;
      
      const milestones = await progressService.checkMilestones(userId);
      
      res.status(200).json({
        success: true,
        data: milestones
      });
    } catch (error) {
      logger.error('Error fetching milestones:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch milestones'
      });
    }
  },
};

module.exports = progressController;

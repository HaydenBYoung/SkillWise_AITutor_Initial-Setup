const notificationService = require('../services/notificationService');

const notificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const limit = Number(req.query.limit) || 50;
      const unreadOnly = req.query.unread === 'true' || false;
      const rows = await notificationService.getUserNotifications(userId, { limit, unreadOnly });
      return res.status(200).json({ success: true, data: rows });
    } catch (err) {
      return next(err);
    }
  },

  createNotification: async (req, res, next) => {
    try {
      const { userId, type, message, data } = req.body || {};
      if (!userId || !message) return res.status(400).json({ success: false, message: 'userId and message are required' });
      // For now, allow authenticated users to create; consider restrictTo for admin in future
      const created = await notificationService.sendNotification(userId, type || 'info', message, data);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return next(err);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const id = req.params.id;
      if (!id) return res.status(400).json({ success: false, message: 'Notification id required' });
      // Could add check that the notification belongs to user; for now update anyway
      const updated = await notificationService.markAsRead(id);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const rows = await notificationService.markAllAsRead(userId);
      return res.status(200).json({ success: true, data: rows });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = notificationController;

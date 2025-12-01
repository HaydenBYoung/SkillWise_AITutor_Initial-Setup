const Notification = require('../models/Notification');

// Implement in-app notification service
const notificationService = {
  sendNotification: async (userId, type, message, data) => {
    if (!userId) throw new Error('User id required');
    const created = await Notification.create({
      user_id: userId,
      type: type || 'info',
      message: message || '',
      payload: data || {},
      is_read: false,
    });
    return created;
  },

  getUserNotifications: async (userId, opts = {}) => {
    if (!userId) throw new Error('User id required');
    const { limit = 50, unreadOnly = false } = opts;
    const rows = await Notification.findByUserId(userId, { limit, unreadOnly });
    // Normalize data to friendly shape
    return rows.map((r) => ({
      id: r.id,
      userId: r.user_id,
      type: r.type,
      message: r.message,
      data: r.data || null,
      isRead: r.is_read,
      createdAt: r.created_at,
    }));
  },

  markAsRead: async (notificationId) => {
    if (!notificationId) throw new Error('Notification id required');
    const updated = await Notification.markAsRead(notificationId);
    return updated;
  },

  markAllAsRead: async (userId) => {
    if (!userId) throw new Error('User id required');
    const rows = await Notification.markAllAsReadForUser(userId);
    return rows;
  },

  sendBulkNotifications: async (userIds, notification) => {
    if (!Array.isArray(userIds)) throw new Error('userIds must be an array');
    const created = [];
    for (const uid of userIds) {
      try {
        const n = await Notification.create({
          user_id: uid,
          type: notification.type || 'info',
          message: notification.message || '',
          payload: notification.data || {},
          is_read: false,
        });
        created.push(n);
      } catch (err) {
        // swallow error for individual creates and continue
        console.error(`Failed to create notification for user ${uid}:`, err.message);
      }
    }
    return created;
  },
};

module.exports = notificationService;

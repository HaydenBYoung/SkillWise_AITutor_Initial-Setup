const db = require('../database/connection');

class Notification {
  static async create (data) {
    try {
      const { user_id, type, message, payload, is_read } = data;
      const query = `
        INSERT INTO notifications (user_id, type, message, data, is_read, created_at, updated_at)
        VALUES ($1, $2, $3, $4::jsonb, $5, NOW(), NOW()) RETURNING *`;
      const params = [user_id, type || 'info', message || '', JSON.stringify(payload || {}), is_read || false];
      const result = await db.query(query, params);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error creating notification: ${err.message}`);
    }
  }

  static async findByUserId (userId, { limit = 50, unreadOnly = false } = {}) {
    try {
      const query = `SELECT * FROM notifications WHERE user_id = $1 ${unreadOnly ? 'AND is_read = false' : ''} ORDER BY created_at DESC LIMIT $2`;
      const result = await db.query(query, [userId, limit]);
      return result.rows;
    } catch (err) {
      throw new Error(`Error finding notifications for user: ${err.message}`);
    }
  }

  static async markAsRead (notificationId) {
    try {
      const query = `UPDATE notifications SET is_read = true, updated_at = NOW() WHERE id = $1 RETURNING *`;
      const result = await db.query(query, [notificationId]);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error marking notification as read: ${err.message}`);
    }
  }

  static async markAllAsReadForUser (userId) {
    try {
      const query = `UPDATE notifications SET is_read = true, updated_at = NOW() WHERE user_id = $1 AND is_read = false RETURNING *`;
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (err) {
      throw new Error(`Error marking all notifications as read: ${err.message}`);
    }
  }
}

module.exports = Notification;

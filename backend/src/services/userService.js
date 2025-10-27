// TODO: User service for database operations and business logic
const db = require('../database/connection');

const userService = {
  // TODO: Get user by ID
  getUserById: async (userId) => {
    const { rows } = await db.query(
      'SELECT id, first_name, last_name, email, created_at, updated_at FROM users WHERE id = $1',
      [userId]
    );
    return rows[0];
  },

  // TODO: Update user profile
  updateProfile: async (userId, profileData) => {
    const fields = [];
    const values = [];
    let paramCount = 1;

    if (profileData.first_name) {
      fields.push(`first_name = $${paramCount}`);
      values.push(profileData.first_name);
      paramCount++;
    }

    if (profileData.last_name) {
      fields.push(`last_name = $${paramCount}`);
      values.push(profileData.last_name);
      paramCount++;
    }

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    values.push(userId);
    const { rows } = await db.query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING id, first_name, last_name, email, created_at, updated_at`,
      values
    );

    return rows[0];
  },

  // TODO: Delete user account
  deleteUser: async (userId) => {
    // Use transaction to ensure all deletions succeed or fail together
    return await db.withTransaction(async (query) => {
      // Delete all refresh tokens first (to prevent logout issues)
      await query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
      
      // Delete related data in proper order (respecting foreign key constraints)
      await query('DELETE FROM ai_feedback WHERE user_id = $1', [userId]);
      await query('DELETE FROM peer_reviews WHERE reviewer_id = $1 OR reviewee_id = $1', [userId]);
      await query('DELETE FROM submissions WHERE user_id = $1', [userId]);
      await query('DELETE FROM progress_events WHERE user_id = $1', [userId]);
      await query('DELETE FROM user_statistics WHERE user_id = $1', [userId]);
      await query('DELETE FROM achievements WHERE user_id = $1', [userId]);
      await query('DELETE FROM goals WHERE user_id = $1', [userId]);
      
      // Finally delete the user
      const result = await query('DELETE FROM users WHERE id = $1 RETURNING id', [userId]);
      
      if (result.rowCount === 0) {
        throw new Error('User not found');
      }
      
      return { deleted: true, userId };
    });
  },

  // TODO: Get user statistics
  getUserStats: async (userId) => {
    // This would integrate with user_statistics table
    const { rows } = await db.query(
      'SELECT * FROM user_statistics WHERE user_id = $1',
      [userId]
    );
    return rows[0] || null;
  },
};

module.exports = userService;
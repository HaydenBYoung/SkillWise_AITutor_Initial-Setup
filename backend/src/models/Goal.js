const db = require('../database/connection');

class Goal {
  static async findByUserId(userId) {
    try {
      const query =
        'SELECT * FROM goals WHERE user_id = $1 ORDER BY created_at DESC';
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding goals for user: ${error.message}`);
    }
  }

  static async findById(goalId) {
    try {
      const query = 'SELECT * FROM goals WHERE id = $1';
      const result = await db.query(query, [goalId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding goal: ${error.message}`);
    }
  }

  static async create(goalData) {
    try {
      // Accept both legacy (target_date) and canonical (target_completion_date)
      const {
        title,
        description,
        user_id,
        target_date,
        target_completion_date,
        type,
      } = goalData;
      const targetDate = target_completion_date || target_date;
      const query = `
        INSERT INTO goals (title, description, user_id, target_completion_date, type, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING *
      `;
      const result = await db.query(query, [
        title,
        description,
        user_id,
        targetDate,
        type,
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating goal: ${error.message}`);
    }
  }

  static async update(goalId, updateData) {
    try {
      // Support both legacy and canonical field names. Canonical fields on DB:
      // target_completion_date (DATE), progress_percentage (INTEGER), is_completed (BOOLEAN)
      const {
        title,
        description,
        target_date,
        target_completion_date,
        progress,
        progress_percentage,
        status,
        is_completed,
      } = updateData;

      // Decide the values to write (prefer canonical names)
      const targetDate = target_completion_date || target_date;
      const progressPct =
        typeof progress_percentage === 'number'
          ? progress_percentage
          : progress;
      const completedFlag =
        typeof is_completed === 'boolean'
          ? is_completed
          : status === 'completed';

      const query = `
        UPDATE goals 
        SET title = COALESCE($2, title),
            description = COALESCE($3, description),
            target_completion_date = COALESCE($4, target_completion_date),
            progress_percentage = COALESCE($5, progress_percentage),
            is_completed = COALESCE($6, is_completed),
            updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const result = await db.query(query, [
        goalId,
        title,
        description,
        targetDate,
        progressPct,
        completedFlag,
      ]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating goal: ${error.message}`);
    }
  }

  static async delete(goalId) {
    try {
      const query = 'DELETE FROM goals WHERE id = $1 RETURNING *';
      const result = await db.query(query, [goalId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting goal: ${error.message}`);
    }
  }
}

module.exports = Goal;

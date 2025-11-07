const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const goalService = {
  // Get all goals for a user
  getUserGoals: async (userId) => {
    const query = `
      SELECT 
        id, user_id, title, description, category, difficulty_level,
        target_completion_date, is_completed, completion_date,
        progress_percentage, points_reward, is_public,
        created_at, updated_at
      FROM goals 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;

    const { rows } = await db.query(query, [userId]);
    return rows;
  },

  // Get single goal by ID
  getGoalById: async (goalId, userId) => {
    const query = `
      SELECT 
        id, user_id, title, description, category, difficulty_level,
        target_completion_date, is_completed, completion_date,
        progress_percentage, points_reward, is_public,
        created_at, updated_at
      FROM goals 
      WHERE id = $1 AND user_id = $2
    `;

    const { rows } = await db.query(query, [goalId, userId]);
    if (rows.length === 0) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }
    return rows[0];
  },

  // Create new goal
  createGoal: async (goalData, userId) => {
    const {
      title,
      description,
      category,
      difficulty_level,
      target_completion_date,
    } = goalData;

    const query = `
      INSERT INTO goals (
        user_id, title, description, category, difficulty_level, 
        target_completion_date
      ) 
      VALUES ($1, $2, $3, $4, $5, $6) 
      RETURNING 
        id, user_id, title, description, category, difficulty_level,
        target_completion_date, is_completed, completion_date,
        progress_percentage, points_reward, is_public,
        created_at, updated_at
    `;

    const { rows } = await db.query(query, [
      userId,
      title,
      description,
      category,
      difficulty_level || 'medium',
      target_completion_date,
    ]);

    return rows[0];
  },

  // Update existing goal
  updateGoal: async (goalId, goalData, userId) => {
    const {
      title,
      description,
      category,
      difficulty_level,
      target_completion_date,
      progress_percentage,
    } = goalData;

    const query = `
      UPDATE goals 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        category = COALESCE($3, category),
        difficulty_level = COALESCE($4, difficulty_level),
        target_completion_date = COALESCE($5, target_completion_date),
        progress_percentage = COALESCE($6, progress_percentage),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7 AND user_id = $8
      RETURNING 
        id, user_id, title, description, category, difficulty_level,
        target_completion_date, is_completed, completion_date,
        progress_percentage, points_reward, is_public,
        created_at, updated_at
    `;

    const { rows } = await db.query(query, [
      title,
      description,
      category,
      difficulty_level,
      target_completion_date,
      progress_percentage,
      goalId,
      userId,
    ]);

    if (rows.length === 0) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }

    return rows[0];
  },

  // Delete goal
  deleteGoal: async (goalId, userId) => {
    const query =
      'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id';
    const { rows } = await db.query(query, [goalId, userId]);

    if (rows.length === 0) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }

    return { success: true };
  },

  // Mark goal as completed
  markCompleted: async (goalId, userId) => {
    const query = `
      UPDATE goals 
      SET 
        is_completed = true,
        completion_date = CURRENT_TIMESTAMP,
        progress_percentage = 100,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING 
        id, user_id, title, description, category, difficulty_level,
        target_completion_date, is_completed, completion_date,
        progress_percentage, points_reward, is_public,
        created_at, updated_at
    `;

    const { rows } = await db.query(query, [goalId, userId]);

    if (rows.length === 0) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }

    return rows[0];
  },

  // Update goal progress
  updateProgress: async (goalId, progress, userId) => {
    const query = `
      UPDATE goals 
      SET 
        progress_percentage = $1,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND user_id = $3
      RETURNING 
        id, user_id, title, description, category, difficulty_level,
        target_completion_date, is_completed, completion_date,
        progress_percentage, points_reward, is_public,
        created_at, updated_at
    `;

    const { rows } = await db.query(query, [progress, goalId, userId]);

    if (rows.length === 0) {
      throw new AppError('Goal not found', 404, 'GOAL_NOT_FOUND');
    }

    return rows[0];
  },
};

module.exports = goalService;

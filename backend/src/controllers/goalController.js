const { query, withTransaction } = require('../database/connection');
const { z } = require('zod');
const pino = require('pino');
const goalService = require('../services/goalService');

const logger = pino({ name: 'goalController' });

// Validation schemas
const createGoalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be 100 characters or less'),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),
  target_completion_date: z.string().optional(),
  is_public: z.boolean().default(false),
});

const updateGoalSchema = createGoalSchema.partial();

const goalController = {
  // Get all goals for a user
  async getGoals(req, res) {
    try {
      const userId = req.user.id;
      logger.info(`Fetching goals for user ${userId}`);
      
      // Use goalService to get goals with points and progress calculations
      const goals = await goalService.getUserGoals(userId);
      
      logger.info(`Found ${goals.length} goals for user ${userId}`);
      
      res.status(200).json({
        success: true,
        data: {
          goals: goals,
          pagination: {
            page: 1,
            limit: goals.length,
            total: goals.length,
            totalPages: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching goals:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch goals',
      });
    }
  },

  // Get a specific goal by ID
  async getGoalById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await query(
        `SELECT 
          g.id, g.title, g.description, g.category, g.difficulty_level,
          g.target_completion_date, g.is_completed, g.completion_date,
          g.progress_percentage, g.points_reward, g.is_public,
          g.created_at, g.updated_at,
          COUNT(gc.id) as total_challenges,
          COUNT(CASE WHEN gc.status = 'completed' THEN 1 END) as completed_challenges
        FROM goals g
        LEFT JOIN goal_challenges gc ON g.id = gc.goal_id
        WHERE g.id = $1 AND g.user_id = $2
        GROUP BY g.id`,
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }
      
      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error fetching goal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch goal',
      });
    }
  },

  // Create a new goal
  async createGoal(req, res) {
    try {
      const validatedData = createGoalSchema.parse(req.body);
      const userId = req.user.id;
      
      const result = await query(
        `INSERT INTO goals 
        (user_id, title, description, category, difficulty_level, target_completion_date, is_public)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id, title, description, category, difficulty_level, 
                  target_completion_date, is_completed, progress_percentage, 
                  points_reward, is_public, created_at, updated_at`,
        [
          userId,
          validatedData.title,
          validatedData.description || null,
          validatedData.category,
          validatedData.difficulty_level,
          validatedData.target_completion_date || null,
          validatedData.is_public,
        ]
      );
      
      logger.info(`Goal created: ${result.rows[0].id} by user ${userId}`);
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Goal created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      
      logger.error('Error creating goal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create goal',
      });
    }
  },

  // Update a goal
  async updateGoal(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const validatedData = updateGoalSchema.parse(req.body);
      
      // Check if goal exists and belongs to user
      const existingGoal = await query(
        'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
        [id, userId]
      );
      
      if (existingGoal.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }
      
      // Build dynamic update query
      const updateFields = [];
      const params = [];
      let paramIndex = 1;
      
      Object.entries(validatedData).forEach(([key, value]) => {
        if (value !== undefined) {
          updateFields.push(`${key} = $${paramIndex}`);
          params.push(value);
          paramIndex++;
        }
      });
      
      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update',
        });
      }
      
      // Add updated_at field
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add WHERE clause parameters
      params.push(id, userId);
      
      const result = await query(
        `UPDATE goals SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
        RETURNING id, title, description, category, difficulty_level,
                  target_completion_date, is_completed, completion_date,
                  progress_percentage, points_reward, is_public,
                  created_at, updated_at`,
        params
      );
      
      logger.info(`Goal updated: ${id} by user ${userId}`);
      
      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Goal updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      
      logger.error('Error updating goal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update goal',
      });
    }
  },

  // Mark goal as completed/incomplete
  async toggleGoalCompletion(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { is_completed } = req.body;
      
      if (typeof is_completed !== 'boolean') {
        return res.status(400).json({
          success: false,
          error: 'is_completed must be a boolean value',
        });
      }
      
      const result = await query(
        `UPDATE goals 
        SET is_completed = $1, 
            completion_date = CASE WHEN $1 = true THEN CURRENT_TIMESTAMP ELSE NULL END,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING id, title, is_completed, completion_date, updated_at`,
        [is_completed, id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }
      
      logger.info(`Goal completion toggled: ${id} to ${is_completed} by user ${userId}`);
      
      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: `Goal marked as ${is_completed ? 'completed' : 'incomplete'}`,
      });
    } catch (error) {
      logger.error('Error toggling goal completion:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update goal completion status',
      });
    }
  },

  // Delete a goal
  async deleteGoal(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      // Delete the goal (foreign key constraints handle related records automatically)
      const result = await query(
        'DELETE FROM goals WHERE id = $1 AND user_id = $2 RETURNING id, title',
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }
      
      logger.info(`Goal deleted: ${id} (${result.rows[0].title}) by user ${userId}`);
      
      res.status(200).json({
        success: true,
        message: 'Goal deleted successfully',
      });
    } catch (error) {
      logger.error('Error deleting goal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete goal',
      });
    }
  },

  // Get goal statistics
  async getGoalStatistics(req, res) {
    try {
      const userId = req.user.id;
      
      const result = await query(
        `SELECT 
          COUNT(*) as total_goals,
          COUNT(CASE WHEN is_completed = true THEN 1 END) as completed_goals,
          COUNT(CASE WHEN is_completed = false THEN 1 END) as active_goals,
          ROUND(AVG(progress_percentage), 2) as average_progress,
          COUNT(CASE WHEN target_completion_date < CURRENT_DATE AND is_completed = false THEN 1 END) as overdue_goals
        FROM goals 
        WHERE user_id = $1`,
        [userId]
      );
      
      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error fetching goal statistics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch goal statistics',
      });
    }
  },
};

module.exports = goalController;

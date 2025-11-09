const { query, withTransaction } = require('../database/connection');
const { z } = require('zod');
const pino = require('pino');

const logger = pino({ name: 'challengeController' });

// Validation schemas
const createChallengeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be 255 characters or less'),
  description: z.string().min(1, 'Description is required'),
  instructions: z.string().min(1, 'Instructions are required'),
  category: z.string().min(1, 'Category is required').max(100, 'Category must be 100 characters or less'),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).default('medium'),
  estimated_time_minutes: z.number().int().positive().optional(),
  points_reward: z.number().int().positive().default(10),
  max_attempts: z.number().int().positive().default(3),
  requires_peer_review: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  learning_objectives: z.array(z.string()).optional(),
});

const updateChallengeSchema = createChallengeSchema.partial();

const addToGoalSchema = z.object({
  goal_id: z.number().int().positive(),
});

const updateStatusSchema = z.object({
  status: z.enum(['todo', 'in_progress', 'completed', 'paused']),
  submission_text: z.string().optional(),
  submission_url: z.string().url().optional(),
  score: z.number().int().min(0).max(100).optional(),
});

const challengeController = {
  // Get all challenges (public challenges + user's goal challenges)
  async getChallenges(req, res) {
    try {
      const userId = req.user.id;
      const { category, difficulty, is_active = true, search, page = 1, limit = 10 } = req.query;
      
      const offset = (page - 1) * limit;
      
      // Build WHERE clause
      let whereClause = 'WHERE is_active = $1';
      const params = [is_active === 'true'];
      let paramIndex = 2;
      
      if (category) {
        whereClause += ` AND category = $${paramIndex}`;
        params.push(category);
        paramIndex++;
      }
      
      if (difficulty) {
        whereClause += ` AND difficulty_level = $${paramIndex}`;
        params.push(difficulty);
        paramIndex++;
      }
      
      if (search) {
        whereClause += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }
      
      const countResult = await query(
        `SELECT COUNT(*) FROM challenges ${whereClause}`,
        params
      );
      const totalCount = parseInt(countResult.rows[0].count);
      
      const result = await query(
        `SELECT 
          c.*,
          u.email as creator_email,
          CASE WHEN c.created_by = $${paramIndex} THEN true ELSE false END as is_owner
        FROM challenges c
        LEFT JOIN users u ON c.created_by = u.id
        ${whereClause}
        ORDER BY c.created_at DESC
        LIMIT $${paramIndex + 1} OFFSET $${paramIndex + 2}`,
        [...params, userId, limit, offset]
      );
      
      res.status(200).json({
        success: true,
        data: {
          challenges: result.rows,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
      });
    } catch (error) {
      logger.error('Error fetching challenges:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch challenges',
      });
    }
  },

  // Get challenge by ID
  async getChallengeById(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const result = await query(
        `SELECT 
          c.*,
          u.email as creator_email,
          CASE WHEN c.created_by = $2 THEN true ELSE false END as is_owner
        FROM challenges c
        LEFT JOIN users u ON c.created_by = u.id
        WHERE c.id = $1`,
        [id, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
        });
      }
      
      res.status(200).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      logger.error('Error fetching challenge:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch challenge',
      });
    }
  },

  // Create new challenge
  async createChallenge(req, res) {
    try {
      const validatedData = createChallengeSchema.parse(req.body);
      const userId = req.user.id;
      
      const result = await query(
        `INSERT INTO challenges 
        (title, description, instructions, category, difficulty_level, 
         estimated_time_minutes, points_reward, max_attempts, requires_peer_review,
         created_by, tags, prerequisites, learning_objectives)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *`,
        [
          validatedData.title,
          validatedData.description,
          validatedData.instructions,
          validatedData.category,
          validatedData.difficulty_level,
          validatedData.estimated_time_minutes || null,
          validatedData.points_reward,
          validatedData.max_attempts,
          validatedData.requires_peer_review,
          userId,
          validatedData.tags || [],
          validatedData.prerequisites || [],
          validatedData.learning_objectives || [],
        ]
      );
      
      logger.info(`Challenge created: ${result.rows[0].id} by user ${userId}`);
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Challenge created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      
      logger.error('Error creating challenge:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create challenge',
      });
    }
  },

  // Update challenge
  async updateChallenge(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const validatedData = updateChallengeSchema.parse(req.body);
      
      // Check if challenge exists and user owns it
      const existingChallenge = await query(
        'SELECT id FROM challenges WHERE id = $1 AND created_by = $2',
        [id, userId]
      );
      
      if (existingChallenge.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found or unauthorized',
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
        `UPDATE challenges SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND created_by = $${paramIndex + 1}
        RETURNING *`,
        params
      );
      
      logger.info(`Challenge updated: ${id} by user ${userId}`);
      
      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Challenge updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      
      logger.error('Error updating challenge:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update challenge',
      });
    }
  },

  // Delete challenge
  async deleteChallenge(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      await withTransaction(async (transactionQuery) => {
        // First, delete related goal_challenges
        await transactionQuery(
          'DELETE FROM goal_challenges WHERE challenge_id = $1',
          [id]
        );
        
        // Then delete the challenge (only if user owns it)
        const result = await transactionQuery(
          'DELETE FROM challenges WHERE id = $1 AND created_by = $2 RETURNING id, title',
          [id, userId]
        );
        
        if (result.rows.length === 0) {
          throw new Error('Challenge not found or unauthorized');
        }
        
        logger.info(`Challenge deleted: ${id} (${result.rows[0].title}) by user ${userId}`);
        
        return result.rows[0];
      });
      
      res.status(200).json({
        success: true,
        message: 'Challenge deleted successfully',
      });
    } catch (error) {
      if (error.message === 'Challenge not found or unauthorized') {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found or unauthorized',
        });
      }
      
      logger.error('Error deleting challenge:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete challenge',
      });
    }
  },

  // Add challenge to goal
  async addToGoal(req, res) {
    try {
      const { challengeId } = req.params;
      const { goal_id } = addToGoalSchema.parse(req.body);
      const userId = req.user.id;
      
      // Verify goal belongs to user
      const goalCheck = await query(
        'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
        [goal_id, userId]
      );
      
      if (goalCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }
      
      // Verify challenge exists
      const challengeCheck = await query(
        'SELECT id FROM challenges WHERE id = $1 AND is_active = true',
        [challengeId]
      );
      
      if (challengeCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found',
        });
      }
      
      const result = await query(
        `INSERT INTO goal_challenges (goal_id, challenge_id, user_id, status)
        VALUES ($1, $2, $3, 'todo')
        ON CONFLICT (goal_id, challenge_id, user_id) DO NOTHING
        RETURNING *`,
        [goal_id, challengeId, userId]
      );
      
      if (result.rows.length === 0) {
        return res.status(409).json({
          success: false,
          error: 'Challenge already added to this goal',
        });
      }
      
      logger.info(`Challenge ${challengeId} added to goal ${goal_id} by user ${userId}`);
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'Challenge added to goal successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      
      logger.error('Error adding challenge to goal:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add challenge to goal',
      });
    }
  },

  // Update challenge status in goal
  async updateChallengeStatus(req, res) {
    try {
      const { challengeId, goalId } = req.params;
      const validatedData = updateStatusSchema.parse(req.body);
      const userId = req.user.id;
      
      // Build dynamic update query
      const updateFields = ['status = $1'];
      const params = [validatedData.status];
      let paramIndex = 2;
      
      if (validatedData.submission_text !== undefined) {
        updateFields.push(`submission_text = $${paramIndex}`);
        params.push(validatedData.submission_text);
        paramIndex++;
      }
      
      if (validatedData.submission_url !== undefined) {
        updateFields.push(`submission_url = $${paramIndex}`);
        params.push(validatedData.submission_url);
        paramIndex++;
      }
      
      if (validatedData.score !== undefined) {
        updateFields.push(`score = $${paramIndex}`);
        params.push(validatedData.score);
        paramIndex++;
      }
      
      // Handle status-specific updates
      if (validatedData.status === 'in_progress') {
        updateFields.push(`started_at = COALESCE(started_at, CURRENT_TIMESTAMP)`);
      } else if (validatedData.status === 'completed') {
        updateFields.push(`completed_at = CURRENT_TIMESTAMP`);
        updateFields.push(`attempts = attempts + 1`);
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add WHERE clause parameters
      params.push(goalId, challengeId, userId);
      
      const result = await query(
        `UPDATE goal_challenges SET ${updateFields.join(', ')}
        WHERE goal_id = $${paramIndex} AND challenge_id = $${paramIndex + 1} AND user_id = $${paramIndex + 2}
        RETURNING *`,
        params
      );
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Challenge not found in goal',
        });
      }
      
      logger.info(`Challenge ${challengeId} status updated to ${validatedData.status} in goal ${goalId} by user ${userId}`);
      
      res.status(200).json({
        success: true,
        data: result.rows[0],
        message: 'Challenge status updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: error.errors,
        });
      }
      
      logger.error('Error updating challenge status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update challenge status',
      });
    }
  },

  // Get challenges for a specific goal
  async getGoalChallenges(req, res) {
    try {
      const { goalId } = req.params;
      const userId = req.user.id;
      
      // Verify goal belongs to user
      const goalCheck = await query(
        'SELECT id FROM goals WHERE id = $1 AND user_id = $2',
        [goalId, userId]
      );
      
      if (goalCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Goal not found',
        });
      }
      
      const result = await query(
        `SELECT 
          c.*,
          gc.status as goal_status,
          gc.started_at,
          gc.completed_at,
          gc.submission_text,
          gc.submission_url,
          gc.score,
          gc.attempts,
          gc.feedback
        FROM goal_challenges gc
        JOIN challenges c ON gc.challenge_id = c.id
        WHERE gc.goal_id = $1 AND gc.user_id = $2
        ORDER BY gc.created_at ASC`,
        [goalId, userId]
      );
      
      res.status(200).json({
        success: true,
        data: result.rows,
      });
    } catch (error) {
      logger.error('Error fetching goal challenges:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch goal challenges',
      });
    }
  },
};

module.exports = challengeController;

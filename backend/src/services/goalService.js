const Goal = require('../models/Goal');
const db = require('../database/connection');
const { validateGoalData } = require('../utils/validators');

const goalService = {
  // Get user goals with progress and points
  getUserGoals: async (userId) => {
    try {
      const query = `
        SELECT 
          g.*,
          COUNT(gc.id) as total_challenges,
          COUNT(gc.id) FILTER (WHERE gc.status = 'completed') as completed_challenges,
          CASE 
            WHEN g.difficulty_level = 'easy' THEN 20
            WHEN g.difficulty_level = 'medium' THEN 35
            WHEN g.difficulty_level = 'hard' THEN 50
            ELSE 35
          END as target_points,
          COALESCE(SUM(c.points_reward) FILTER (WHERE gc.status = 'completed'), 0)::INTEGER as earned_points,
          CASE 
            WHEN g.difficulty_level = 'easy' THEN 
              LEAST(100, ROUND((COALESCE(SUM(c.points_reward) FILTER (WHERE gc.status = 'completed'), 0) * 100.0) / 20))
            WHEN g.difficulty_level = 'medium' THEN 
              LEAST(100, ROUND((COALESCE(SUM(c.points_reward) FILTER (WHERE gc.status = 'completed'), 0) * 100.0) / 35))
            WHEN g.difficulty_level = 'hard' THEN 
              LEAST(100, ROUND((COALESCE(SUM(c.points_reward) FILTER (WHERE gc.status = 'completed'), 0) * 100.0) / 50))
            ELSE 
              LEAST(100, ROUND((COALESCE(SUM(c.points_reward) FILTER (WHERE gc.status = 'completed'), 0) * 100.0) / 35))
          END as calculated_progress_percentage
        FROM goals g
        LEFT JOIN goal_challenges gc ON g.id = gc.goal_id
        LEFT JOIN challenges c ON gc.challenge_id = c.id
        WHERE g.user_id = $1
        GROUP BY g.id
        ORDER BY g.created_at DESC
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error retrieving user goals: ${error.message}`);
    }
  },

  // Get single goal by ID with challenge details
  getGoalById: async (goalId, userId) => {
    try {
      const query = `
        SELECT 
          g.*,
          COUNT(gc.id) as total_challenges,
          COUNT(gc.id) FILTER (WHERE gc.status = 'completed') as completed_challenges,
          COALESCE(g.progress_percentage, 0) as progress_percentage
        FROM goals g
        LEFT JOIN goal_challenges gc ON g.id = gc.goal_id
        WHERE g.id = $1 AND g.user_id = $2
        GROUP BY g.id
      `;
      
      const result = await db.query(query, [goalId, userId]);
      
      if (result.rows.length === 0) {
        return null;
      }

      const goal = result.rows[0];
      
      // Get associated challenges
      const challengesQuery = `
        SELECT 
          c.*,
          gc.status as challenge_status,
          gc.started_at,
          gc.completed_at,
          gc.submission_text,
          gc.submission_url,
          gc.score,
          gc.attempts
        FROM challenges c
        INNER JOIN goal_challenges gc ON c.id = gc.challenge_id
        WHERE gc.goal_id = $1 AND gc.user_id = $2
        ORDER BY gc.created_at ASC
      `;
      
      const challengesResult = await db.query(challengesQuery, [goalId, userId]);
      goal.challenges = challengesResult.rows;
      
      return goal;
    } catch (error) {
      throw new Error(`Error retrieving goal: ${error.message}`);
    }
  },

  // Create new goal with validation
  createGoal: async (goalData) => {
    try {
      // Validate goal data
      const validation = validateGoalData(goalData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const { 
        title, 
        description, 
        category, 
        difficulty_level = 'medium',
        target_completion_date,
        user_id 
      } = goalData;

      const query = `
        INSERT INTO goals (
          title, 
          description, 
          category, 
          difficulty_level,
          target_completion_date,
          user_id,
          created_at, 
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `;
      
      const result = await db.query(query, [
        title, 
        description, 
        category, 
        difficulty_level,
        target_completion_date,
        user_id
      ]);
      
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating goal: ${error.message}`);
    }
  },

  // Update goal
  updateGoal: async (goalId, updateData, userId) => {
    try {
      // Validate goal data
      const validation = validateGoalData(updateData, true); // partial validation for updates
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const { 
        title, 
        description, 
        category, 
        difficulty_level,
        target_completion_date,
        is_completed 
      } = updateData;

      const query = `
        UPDATE goals 
        SET 
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          category = COALESCE($4, category),
          difficulty_level = COALESCE($5, difficulty_level),
          target_completion_date = COALESCE($6, target_completion_date),
          is_completed = COALESCE($7, is_completed),
          completion_date = CASE 
            WHEN $7 = true AND completion_date IS NULL THEN NOW()
            WHEN $7 = false THEN NULL
            ELSE completion_date 
          END,
          updated_at = NOW()
        WHERE id = $1 AND user_id = $8
        RETURNING *
      `;
      
      const result = await db.query(query, [
        goalId, 
        title, 
        description, 
        category, 
        difficulty_level,
        target_completion_date,
        is_completed,
        userId
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating goal: ${error.message}`);
    }
  },

  // Delete goal
  deleteGoal: async (goalId, userId) => {
    try {
      const query = `
        DELETE FROM goals 
        WHERE id = $1 AND user_id = $2 
        RETURNING *
      `;
      
      const result = await db.query(query, [goalId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error deleting goal: ${error.message}`);
    }
  },

  // Add challenge to goal
  addChallengeToGoal: async (goalId, challengeId, userId) => {
    try {
      const query = `
        INSERT INTO goal_challenges (goal_id, challenge_id, user_id, status)
        VALUES ($1, $2, $3, 'todo')
        RETURNING *
      `;
      
      const result = await db.query(query, [goalId, challengeId, userId]);
      return result.rows[0];
    } catch (error) {
      if (error.code === '23505') { // Unique violation
        throw new Error('Challenge already added to this goal');
      }
      throw new Error(`Error adding challenge to goal: ${error.message}`);
    }
  },

  // Update challenge status in goal
  updateChallengeStatus: async (goalId, challengeId, userId, status, submissionData = {}) => {
    try {
      const { submission_text, submission_url, score } = submissionData;
      
      const query = `
        UPDATE goal_challenges 
        SET 
          status = $4,
          started_at = CASE 
            WHEN $4 = 'in_progress' AND started_at IS NULL THEN NOW()
            ELSE started_at 
          END,
          completed_at = CASE 
            WHEN $4 = 'completed' THEN NOW()
            WHEN $4 != 'completed' THEN NULL
            ELSE completed_at 
          END,
          submission_text = COALESCE($5, submission_text),
          submission_url = COALESCE($6, submission_url),
          score = COALESCE($7, score),
          attempts = attempts + 1,
          updated_at = NOW()
        WHERE goal_id = $1 AND challenge_id = $2 AND user_id = $3
        RETURNING *
      `;
      
      const result = await db.query(query, [
        goalId, 
        challengeId, 
        userId, 
        status,
        submission_text,
        submission_url,
        score
      ]);
      
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating challenge status: ${error.message}`);
    }
  },

  // Calculate goal completion percentage (handled by trigger, but can be called manually)
  calculateCompletion: async (goalId) => {
    try {
      const query = `
        SELECT 
          COUNT(*) as total_challenges,
          COUNT(*) FILTER (WHERE status = 'completed') as completed_challenges
        FROM goal_challenges 
        WHERE goal_id = $1
      `;
      
      const result = await db.query(query, [goalId]);
      const { total_challenges, completed_challenges } = result.rows[0];
      
      if (total_challenges === 0) return 0;
      
      return Math.round((completed_challenges / total_challenges) * 100);
    } catch (error) {
      throw new Error(`Error calculating goal completion: ${error.message}`);
    }
  },
};

module.exports = goalService;

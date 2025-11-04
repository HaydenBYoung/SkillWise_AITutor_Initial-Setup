const Challenge = require('../models/Challenge');
const db = require('../database/connection');
const { validateChallengeData } = require('../utils/validators');

const challengeService = {
  // Get challenges with filtering
  getChallenges: async (filters = {}) => {
    try {
      const { category, difficulty, goal_id, userId } = filters;
      let query = `
        SELECT 
          c.*,
          CASE 
            WHEN gc.id IS NOT NULL THEN gc.status 
            ELSE NULL 
          END as user_status,
          CASE 
            WHEN gc.id IS NOT NULL THEN gc.score 
            ELSE NULL 
          END as user_score
        FROM challenges c
        LEFT JOIN goal_challenges gc ON c.id = gc.challenge_id AND gc.user_id = $1
      `;
      
      const queryParams = [userId];
      const conditions = ['c.is_active = true'];
      
      if (category) {
        conditions.push(`c.category = $${queryParams.length + 1}`);
        queryParams.push(category);
      }
      
      if (difficulty) {
        conditions.push(`c.difficulty_level = $${queryParams.length + 1}`);
        queryParams.push(difficulty);
      }
      
      if (goal_id) {
        conditions.push(`gc.goal_id = $${queryParams.length + 1}`);
        queryParams.push(goal_id);
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY c.difficulty_level, c.created_at DESC';
      
      const result = await db.query(query, queryParams);
      return result.rows;
    } catch (error) {
      throw new Error(`Error retrieving challenges: ${error.message}`);
    }
  },

  // Get challenge by ID with user progress
  getChallengeById: async (challengeId, userId) => {
    try {
      const query = `
        SELECT 
          c.*,
          gc.status as user_status,
          gc.started_at,
          gc.completed_at,
          gc.submission_text,
          gc.submission_url,
          gc.score,
          gc.attempts,
          gc.feedback,
          gc.goal_id
        FROM challenges c
        LEFT JOIN goal_challenges gc ON c.id = gc.challenge_id AND gc.user_id = $2
        WHERE c.id = $1 AND c.is_active = true
      `;
      
      const result = await db.query(query, [challengeId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error retrieving challenge: ${error.message}`);
    }
  },

  // Create new challenge
  createChallenge: async (challengeData) => {
    try {
      // Validate challenge data
      const validation = validateChallengeData(challengeData);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const {
        title,
        description,
        instructions,
        category,
        difficulty_level = 'medium',
        estimated_time_minutes,
        points_reward = 10,
        max_attempts = 3,
        requires_peer_review = false,
        created_by,
        tags = [],
        prerequisites = [],
        learning_objectives = [],
      } = challengeData;

      const query = `
        INSERT INTO challenges (
          title,
          description,
          instructions,
          category,
          difficulty_level,
          estimated_time_minutes,
          points_reward,
          max_attempts,
          requires_peer_review,
          created_by,
          tags,
          prerequisites,
          learning_objectives,
          created_at,
          updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
        RETURNING *
      `;

      const result = await db.query(query, [
        title,
        description,
        instructions || description,
        category,
        difficulty_level,
        estimated_time_minutes,
        points_reward,
        max_attempts,
        requires_peer_review,
        created_by,
        tags,
        prerequisites,
        learning_objectives,
      ]);

      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating challenge: ${error.message}`);
    }
  },

  // Update challenge
  updateChallenge: async (challengeId, updateData, userId) => {
    try {
      // Validate challenge data
      const validation = validateChallengeData(updateData, true);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      const {
        title,
        description,
        instructions,
        category,
        difficulty_level,
        estimated_time_minutes,
        points_reward,
        max_attempts,
        requires_peer_review,
        tags,
        prerequisites,
        learning_objectives,
      } = updateData;

      const query = `
        UPDATE challenges 
        SET 
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          instructions = COALESCE($4, instructions),
          category = COALESCE($5, category),
          difficulty_level = COALESCE($6, difficulty_level),
          estimated_time_minutes = COALESCE($7, estimated_time_minutes),
          points_reward = COALESCE($8, points_reward),
          max_attempts = COALESCE($9, max_attempts),
          requires_peer_review = COALESCE($10, requires_peer_review),
          tags = COALESCE($11, tags),
          prerequisites = COALESCE($12, prerequisites),
          learning_objectives = COALESCE($13, learning_objectives),
          updated_at = NOW()
        WHERE id = $1 AND created_by = $14
        RETURNING *
      `;

      const result = await db.query(query, [
        challengeId,
        title,
        description,
        instructions,
        category,
        difficulty_level,
        estimated_time_minutes,
        points_reward,
        max_attempts,
        requires_peer_review,
        tags,
        prerequisites,
        learning_objectives,
        userId,
      ]);

      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error updating challenge: ${error.message}`);
    }
  },

  // Delete challenge
  deleteChallenge: async (challengeId, userId) => {
    try {
      // Soft delete by marking as inactive
      const query = `
        UPDATE challenges 
        SET is_active = false, updated_at = NOW()
        WHERE id = $1 AND created_by = $2
        RETURNING *
      `;

      const result = await db.query(query, [challengeId, userId]);
      return result.rows[0] || null;
    } catch (error) {
      throw new Error(`Error deleting challenge: ${error.message}`);
    }
  },

  // Generate personalized challenges based on user's goals and progress
  generatePersonalizedChallenges: async (userId, goalId = null) => {
    try {
      // Get user's goal categories and difficulty levels
      let goalsQuery = `
        SELECT DISTINCT category, difficulty_level 
        FROM goals 
        WHERE user_id = $1 AND is_completed = false
      `;
      const goalsParams = [userId];
      
      if (goalId) {
        goalsQuery += ' AND id = $2';
        goalsParams.push(goalId);
      }
      
      const goalsResult = await db.query(goalsQuery, goalsParams);
      
      if (goalsResult.rows.length === 0) {
        return [];
      }
      
      // Find challenges that match user's goals but aren't already added
      const challengesQuery = `
        SELECT c.* 
        FROM challenges c
        WHERE c.is_active = true 
        AND (c.category = ANY($1) OR c.difficulty_level = ANY($2))
        AND c.id NOT IN (
          SELECT gc.challenge_id 
          FROM goal_challenges gc 
          WHERE gc.user_id = $3
        )
        ORDER BY 
          CASE c.difficulty_level 
            WHEN 'easy' THEN 1 
            WHEN 'medium' THEN 2 
            WHEN 'hard' THEN 3 
            WHEN 'expert' THEN 4 
          END,
          c.created_at DESC
        LIMIT 10
      `;
      
      const categories = goalsResult.rows.map(row => row.category).filter(Boolean);
      const difficulties = goalsResult.rows.map(row => row.difficulty_level);
      
      const challengesResult = await db.query(challengesQuery, [
        categories,
        difficulties,
        userId,
      ]);
      
      return challengesResult.rows;
    } catch (error) {
      throw new Error(`Error generating personalized challenges: ${error.message}`);
    }
  },

  // Validate challenge completion
  validateCompletion: async (challengeId, submissionData) => {
    try {
      const { submission_text, submission_url } = submissionData;
      
      // Basic validation - at least one submission type required
      if (!submission_text?.trim() && !submission_url?.trim()) {
        return {
          isValid: false,
          errors: ['Either submission text or submission URL is required'],
        };
      }
      
      // URL validation if provided
      if (submission_url && submission_url.trim()) {
        try {
          new URL(submission_url);
        } catch {
          return {
            isValid: false,
            errors: ['Invalid submission URL format'],
          };
        }
      }
      
      // Text length validation
      if (submission_text && submission_text.length > 10000) {
        return {
          isValid: false,
          errors: ['Submission text cannot exceed 10,000 characters'],
        };
      }
      
      return {
        isValid: true,
        errors: [],
      };
    } catch (error) {
      throw new Error(`Error validating challenge completion: ${error.message}`);
    }
  },

  // Calculate challenge difficulty score
  calculateDifficulty: (challenge) => {
    const { estimated_time_minutes, points_reward, max_attempts } = challenge;
    
    let score = 0;
    
    // Time-based scoring
    if (estimated_time_minutes) {
      if (estimated_time_minutes <= 30) score += 1;
      else if (estimated_time_minutes <= 60) score += 2;
      else if (estimated_time_minutes <= 120) score += 3;
      else score += 4;
    }
    
    // Points-based scoring
    if (points_reward) {
      if (points_reward <= 10) score += 1;
      else if (points_reward <= 25) score += 2;
      else if (points_reward <= 50) score += 3;
      else score += 4;
    }
    
    // Attempts-based scoring (fewer attempts = harder)
    if (max_attempts) {
      if (max_attempts >= 5) score += 1;
      else if (max_attempts >= 3) score += 2;
      else score += 3;
    }
    
    // Convert score to difficulty level
    if (score <= 4) return 'easy';
    if (score <= 7) return 'medium';
    if (score <= 10) return 'hard';
    return 'expert';
  },
};

module.exports = challengeService;

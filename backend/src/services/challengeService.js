const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const challengeService = {
  // Get all challenges with optional filtering
  getChallenges: async (filters = {}) => {
    let query = `
      SELECT 
        id, title, description, instructions, category, difficulty_level,
        estimated_time_minutes, points_reward, max_attempts, requires_peer_review,
        is_active, created_by, goal_id, tags, prerequisites, learning_objectives,
        created_at, updated_at
      FROM challenges 
      WHERE is_active = true
    `;

    const params = [];
    let paramCount = 0;

    if (filters.category) {
      paramCount++;
      query += ` AND category = $${paramCount}`;
      params.push(filters.category);
    }

    if (filters.difficulty_level) {
      paramCount++;
      query += ` AND difficulty_level = $${paramCount}`;
      params.push(filters.difficulty_level);
    }

    if (filters.goal_id) {
      paramCount++;
      query += ` AND goal_id = $${paramCount}`;
      params.push(filters.goal_id);
    }

    if (filters.created_by) {
      paramCount++;
      query += ` AND created_by = $${paramCount}`;
      params.push(filters.created_by);
    }

    query += ` ORDER BY created_at DESC`;

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      params.push(filters.limit);
    }

    const { rows } = await db.query(query, params);
    return rows;
  },

  // Get single challenge by ID
  getChallengeById: async (challengeId) => {
    const query = `
      SELECT 
        id, title, description, instructions, category, difficulty_level,
        estimated_time_minutes, points_reward, max_attempts, requires_peer_review,
        is_active, created_by, goal_id, tags, prerequisites, learning_objectives,
        created_at, updated_at
      FROM challenges 
      WHERE id = $1 AND is_active = true
    `;

    const { rows } = await db.query(query, [challengeId]);
    if (rows.length === 0) {
      throw new AppError('Challenge not found', 404, 'CHALLENGE_NOT_FOUND');
    }
    return rows[0];
  },

  // Get challenges linked to a specific goal
  getChallengesByGoalId: async (goalId, userId) => {
    // First verify the goal exists and belongs to the user
    const goalQuery = `
      SELECT id FROM goals 
      WHERE id = $1 AND user_id = $2
    `;
    const goalResult = await db.query(goalQuery, [goalId, userId]);
    if (goalResult.rows.length === 0) {
      throw new AppError(
        'Goal not found or access denied',
        404,
        'GOAL_NOT_FOUND'
      );
    }

    // Get challenges linked to this goal
    const query = `
      SELECT 
        id, title, description, instructions, category, difficulty_level,
        estimated_time_minutes, points_reward, max_attempts, requires_peer_review,
        is_active, created_by, goal_id, tags, prerequisites, learning_objectives,
        created_at, updated_at
      FROM challenges 
      WHERE goal_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;

    const { rows } = await db.query(query, [goalId]);
    return rows;
  },

  // Create new challenge
  createChallenge: async (challengeData, createdBy) => {
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
      goal_id,
      tags,
      prerequisites,
      learning_objectives,
    } = challengeData;

    const query = `
      INSERT INTO challenges (
        title, description, instructions, category, difficulty_level,
        estimated_time_minutes, points_reward, max_attempts, requires_peer_review,
        created_by, goal_id, tags, prerequisites, learning_objectives
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING 
        id, title, description, instructions, category, difficulty_level,
        estimated_time_minutes, points_reward, max_attempts, requires_peer_review,
        is_active, created_by, goal_id, tags, prerequisites, learning_objectives,
        created_at, updated_at
    `;

    const { rows } = await db.query(query, [
      title,
      description,
      instructions,
      category,
      difficulty_level || 'medium',
      estimated_time_minutes || 60,
      points_reward || 10,
      max_attempts || 3,
      requires_peer_review || false,
      createdBy,
      goal_id || null,
      tags || [],
      prerequisites || [],
      learning_objectives || [],
    ]);

    return rows[0];
  },

  // Update existing challenge
  updateChallenge: async (challengeId, challengeData, userId) => {
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
    } = challengeData;

    const query = `
      UPDATE challenges 
      SET 
        title = COALESCE($1, title),
        description = COALESCE($2, description),
        instructions = COALESCE($3, instructions),
        category = COALESCE($4, category),
        difficulty_level = COALESCE($5, difficulty_level),
        estimated_time_minutes = COALESCE($6, estimated_time_minutes),
        points_reward = COALESCE($7, points_reward),
        max_attempts = COALESCE($8, max_attempts),
        requires_peer_review = COALESCE($9, requires_peer_review),
        tags = COALESCE($10, tags),
        prerequisites = COALESCE($11, prerequisites),
        learning_objectives = COALESCE($12, learning_objectives),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND (created_by = $14 OR $14 IN (
        SELECT id FROM users WHERE role = 'admin'
      ))
      RETURNING 
        id, title, description, instructions, category, difficulty_level,
        estimated_time_minutes, points_reward, max_attempts, requires_peer_review,
        is_active, created_by, tags, prerequisites, learning_objectives,
        created_at, updated_at
    `;

    const { rows } = await db.query(query, [
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
      challengeId,
      userId,
    ]);

    if (rows.length === 0) {
      throw new AppError(
        'Challenge not found or unauthorized',
        404,
        'CHALLENGE_NOT_FOUND'
      );
    }

    return rows[0];
  },

  // Delete challenge (soft delete)
  deleteChallenge: async (challengeId, userId) => {
    const query = `
      UPDATE challenges 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND (created_by = $2 OR $2 IN (
        SELECT id FROM users WHERE role = 'admin'
      ))
      RETURNING id
    `;

    const { rows } = await db.query(query, [challengeId, userId]);

    if (rows.length === 0) {
      throw new AppError(
        'Challenge not found or unauthorized',
        404,
        'CHALLENGE_NOT_FOUND'
      );
    }

    return { success: true };
  },

  // Get challenges by category
  getChallengesByCategory: async (category) => {
    return challengeService.getChallenges({ category });
  },

  // Get user's created challenges
  getUserChallenges: async (userId) => {
    return challengeService.getChallenges({ created_by: userId });
  },
};

module.exports = challengeService;

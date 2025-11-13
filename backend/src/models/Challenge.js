const db = require('../database/connection');

class Challenge {
  static async findAll () {
    try {
      const query = 'SELECT * FROM challenges ORDER BY created_at DESC';
      const result = await db.query(query);
      return result.rows;
    } catch (err) {
      throw new Error(`Error fetching challenges: ${err.message}`);
    }
  }

  static async findById (id) {
    try {
      const query = 'SELECT * FROM challenges WHERE id = $1';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error fetching challenge: ${err.message}`);
    }
  }

  static async findByDifficulty (level) {
    try {
      const query =
        'SELECT * FROM challenges WHERE LOWER(difficulty_level) = LOWER($1) ORDER BY created_at DESC';
      const result = await db.query(query, [level]);
      return result.rows;
    } catch (err) {
      throw new Error(
        `Error fetching challenges by difficulty: ${err.message}`,
      );
    }
  }

  static async findBySubject (subject) {
    try {
      const query =
        'SELECT * FROM challenges WHERE LOWER(category) = LOWER($1) ORDER BY created_at DESC';
      const result = await db.query(query, [subject]);
      return result.rows;
    } catch (err) {
      throw new Error(`Error fetching challenges by subject: ${err.message}`);
    }
  }

  static async findByGoalId (goalId) {
    try {
      const query =
        'SELECT * FROM challenges WHERE goal_id = $1 ORDER BY created_at DESC';
      const result = await db.query(query, [goalId]);
      return result.rows;
    } catch (err) {
      throw new Error(
        `Error fetching challenges for goal ${goalId}: ${err.message}`,
      );
    }
  }

  static async create (data) {
    try {
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
        is_active,
        created_by,
        tags,
        prerequisites,
        learning_objectives,
        goal_id,
      } = data;

      const query = `
        INSERT INTO challenges
          (title, description, instructions, category, difficulty_level, estimated_time_minutes, points_reward, max_attempts, requires_peer_review, is_active, created_by, tags, prerequisites, learning_objectives, goal_id, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,NOW(),NOW())
        RETURNING *
      `;

      const params = [
        title || null,
        description || null,
        instructions || null,
        category || null,
        difficulty_level || null,
        estimated_time_minutes || null,
        points_reward || null,
        max_attempts || null,
        requires_peer_review || false,
        is_active !== undefined ? is_active : true,
        created_by || null,
        tags || null,
        prerequisites || null,
        learning_objectives || null,
        goal_id || null,
      ];

      const result = await db.query(query, params);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error creating challenge: ${err.message}`);
    }
  }

  static async update (id, updateData) {
    try {
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
        is_active,
        tags,
        prerequisites,
        learning_objectives,
        goal_id,
      } = updateData;

      const query = `
        UPDATE challenges SET
          title = COALESCE($2, title),
          description = COALESCE($3, description),
          instructions = COALESCE($4, instructions),
          category = COALESCE($5, category),
          difficulty_level = COALESCE($6, difficulty_level),
          estimated_time_minutes = COALESCE($7, estimated_time_minutes),
          points_reward = COALESCE($8, points_reward),
          max_attempts = COALESCE($9, max_attempts),
          requires_peer_review = COALESCE($10, requires_peer_review),
          is_active = COALESCE($11, is_active),
          tags = COALESCE($12, tags),
          prerequisites = COALESCE($13, prerequisites),
          learning_objectives = COALESCE($14, learning_objectives),
          goal_id = COALESCE($15, goal_id),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const params = [
        id,
        title || null,
        description || null,
        instructions || null,
        category || null,
        difficulty_level || null,
        estimated_time_minutes || null,
        points_reward || null,
        max_attempts || null,
        requires_peer_review || null,
        is_active !== undefined ? is_active : null,
        tags || null,
        prerequisites || null,
        learning_objectives || null,
        goal_id || null,
      ];

      const result = await db.query(query, params);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error updating challenge: ${err.message}`);
    }
  }

  static async delete (id) {
    try {
      const query = 'DELETE FROM challenges WHERE id = $1 RETURNING *';
      const result = await db.query(query, [id]);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error deleting challenge: ${err.message}`);
    }
  }
}

module.exports = Challenge;

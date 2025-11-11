const db = require('../database/connection');

class Progress {
  // Return recent progress events (mapped from progress_events)
  static async findByUserId (userId) {
    try {
      const query =
        'SELECT * FROM progress_events WHERE user_id = $1 ORDER BY timestamp_occurred DESC';
      const result = await db.query(query, [userId]);
      // map to legacy shape expected by services
      return result.rows.map((r) => {
        const createdAt = r.timestamp_occurred || r.created_at;
        const createdAtStr = createdAt
          ? createdAt.toISOString
            ? createdAt.toISOString()
            : String(createdAt)
          : null;

        return {
          id: r.id,
          user_id: r.user_id,
          challenge_id: r.related_challenge_id,
          score:
            r.event_data && r.event_data.score
              ? Number(r.event_data.score)
              : null,
          completed:
            r.event_type === 'challenge_completed' ||
            (r.event_data && r.event_data.completed === true),
          points_earned:
            r.points_earned ||
            (r.event_data && r.event_data.points_earned) ||
            0,
          time_spent:
            r.event_data && r.event_data.time_spent
              ? Number(r.event_data.time_spent)
              : null,
          created_at: createdAtStr,
          raw: r,
        };
      });
    } catch (error) {
      throw new Error(`Error finding progress for user: ${error.message}`);
    }
  }

  static async findByUserAndChallenge (userId, challengeId) {
    try {
      const query =
        'SELECT * FROM progress_events WHERE user_id = $1 AND related_challenge_id = $2 ORDER BY timestamp_occurred DESC LIMIT 1';
      const result = await db.query(query, [userId, challengeId]);
      const r = result.rows[0];
      if (!r) return null;
      const createdAt = r.timestamp_occurred || r.created_at;
      const createdAtStr = createdAt
        ? createdAt.toISOString
          ? createdAt.toISOString()
          : String(createdAt)
        : null;
      return {
        id: r.id,
        user_id: r.user_id,
        challenge_id: r.related_challenge_id,
        score:
          r.event_data && r.event_data.score
            ? Number(r.event_data.score)
            : null,
        completed:
          r.event_type === 'challenge_completed' ||
          (r.event_data && r.event_data.completed === true),
        points_earned:
          r.points_earned || (r.event_data && r.event_data.points_earned) || 0,
        time_spent:
          r.event_data && r.event_data.time_spent
            ? Number(r.event_data.time_spent)
            : null,
        created_at: createdAtStr,
        raw: r,
      };
    } catch (error) {
      throw new Error(`Error finding progress: ${error.message}`);
    }
  }

  static async getUserStats (userId) {
    try {
      const query = `
        SELECT
          COUNT(*) as total_attempts,
          COUNT(CASE WHEN event_type = 'challenge_completed' THEN 1 END) as completed_challenges,
          COALESCE(SUM(points_earned), 0) as total_points,
          AVG( (event_data->>'score')::numeric ) as average_score
        FROM progress_events
        WHERE user_id = $1
      `;
      const result = await db.query(query, [userId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error getting user stats: ${error.message}`);
    }
  }

  // Create a progress event (append-only). eventData should include event_type and event_data JSON
  static async create (progressData) {
    try {
      const {
        user_id,
        challenge_id,
        event_type,
        event_data,
        points_earned,
        related_goal_id,
        related_submission_id,
        session_id,
      } = progressData;
      const query = `
        INSERT INTO progress_events (user_id, event_type, event_data, points_earned, related_goal_id, related_challenge_id, related_submission_id, session_id, timestamp_occurred, created_at)
        VALUES ($1, $2, $3::jsonb, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `;
      const params = [
        user_id,
        event_type || 'event',
        JSON.stringify(event_data || {}),
        points_earned || 0,
        related_goal_id || null,
        challenge_id || null,
        related_submission_id || null,
        session_id || null,
      ];
      const result = await db.query(query, params);
      const r = result.rows[0];
      return {
        id: r.id,
        user_id: r.user_id,
        challenge_id: r.related_challenge_id,
        score:
          r.event_data && r.event_data.score
            ? Number(r.event_data.score)
            : null,
        completed:
          r.event_type === 'challenge_completed' ||
          (r.event_data && r.event_data.completed === true),
        points_earned:
          r.points_earned || (r.event_data && r.event_data.points_earned) || 0,
        time_spent:
          r.event_data && r.event_data.time_spent
            ? Number(r.event_data.time_spent)
            : null,
        created_at: r.timestamp_occurred || r.created_at,
        raw: r,
      };
    } catch (error) {
      throw new Error(`Error creating progress: ${error.message}`);
    }
  }

  // Update an existing progress event (by id) - keeps event_data as JSONB
  static async update (progressId, updateData) {
    try {
      const { event_type, event_data, points_earned, timestamp_occurred } =
        updateData;
      const query = `
        UPDATE progress_events
        SET event_type = COALESCE($2, event_type),
            event_data = COALESCE($3::jsonb, event_data),
            points_earned = COALESCE($4, points_earned),
            timestamp_occurred = COALESCE($5, timestamp_occurred),
            created_at = NOW()
        WHERE id = $1
        RETURNING *
      `;
      const params = [
        progressId,
        event_type || null,
        event_data ? JSON.stringify(event_data) : null,
        points_earned || null,
        timestamp_occurred || null,
      ];
      const result = await db.query(query, params);
      const r = result.rows[0];
      if (!r) return null;
      return {
        id: r.id,
        user_id: r.user_id,
        challenge_id: r.related_challenge_id,
        score:
          r.event_data && r.event_data.score
            ? Number(r.event_data.score)
            : null,
        completed:
          r.event_type === 'challenge_completed' ||
          (r.event_data && r.event_data.completed === true),
        points_earned:
          r.points_earned || (r.event_data && r.event_data.points_earned) || 0,
        time_spent:
          r.event_data && r.event_data.time_spent
            ? Number(r.event_data.time_spent)
            : null,
        created_at: r.timestamp_occurred || r.created_at,
        raw: r,
      };
    } catch (error) {
      throw new Error(`Error updating progress: ${error.message}`);
    }
  }

  static async getLeaderboardData (limit = 10) {
    try {
      const query = `
        SELECT 
          u.id,
          u.username,
          u.first_name,
          u.last_name,
          COALESCE(SUM(pe.points_earned), 0) as total_points,
          COUNT(CASE WHEN pe.event_type = 'challenge_completed' THEN 1 END) as challenges_completed
        FROM users u
        LEFT JOIN progress_events pe ON u.id = pe.user_id
        GROUP BY u.id, u.username, u.first_name, u.last_name
        ORDER BY total_points DESC, challenges_completed DESC
        LIMIT $1
      `;
      const result = await db.query(query, [limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error getting leaderboard data: ${error.message}`);
    }
  }
}

module.exports = Progress;

const db = require('../database/connection');

class Submission {
  // Create a new submission. Calculates next attempt number.
  static async create (data) {
    try {
      const {
        user_id,
        challenge_id,
        submission_text,
        submission_files,
        time_spent_minutes,
      } = data;

      // Get max attempt_number for this user/challenge
      const attemptQuery = 'SELECT COALESCE(MAX(attempt_number), 0) AS max_attempt FROM submissions WHERE user_id = $1 AND challenge_id = $2';
      const ares = await db.query(attemptQuery, [user_id, challenge_id]);
      const nextAttempt = Number(ares.rows[0].max_attempt || 0) + 1;

      const query = `
        INSERT INTO submissions (user_id, challenge_id, submission_text, submission_files, attempt_number, time_spent_minutes, submitted_at, created_at, updated_at)
        VALUES ($1, $2, $3, $4::jsonb, $5, $6, NOW(), NOW(), NOW())
        RETURNING *
      `;
      const params = [
        user_id,
        challenge_id,
        submission_text || null,
        submission_files || null,
        nextAttempt,
        time_spent_minutes || null,
      ];
      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating submission: ${error.message}`);
    }
  }

  // Get submission by id
  static async findById (submissionId) {
    try {
      const query = 'SELECT * FROM submissions WHERE id = $1';
      const result = await db.query(query, [submissionId]);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error finding submission: ${error.message}`);
    }
  }

  // Get user submissions (latest first)
  static async findByUserId (userId) {
    try {
      const query = 'SELECT * FROM submissions WHERE user_id = $1 ORDER BY submitted_at DESC';
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding submissions for user: ${error.message}`);
    }
  }

  // Get challenge submissions
  static async findByChallengeId (challengeId) {
    try {
      const query = 'SELECT * FROM submissions WHERE challenge_id = $1 ORDER BY submitted_at DESC';
      const result = await db.query(query, [challengeId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error finding submissions for challenge: ${error.message}`);
    }
  }

  // Update a submission by id
  static async update (submissionId, updateData) {
    try {
      const {
        submission_text,
        submission_files,
        status,
        score,
        graded_by,
        graded_at,
        feedback,
        is_flagged,
      } = updateData;

      const query = `
        UPDATE submissions SET
          submission_text = COALESCE($2, submission_text),
          submission_files = COALESCE($3::jsonb, submission_files),
          status = COALESCE($4, status),
          score = COALESCE($5, score),
          graded_by = COALESCE($6, graded_by),
          graded_at = COALESCE($7, graded_at),
          feedback = COALESCE($8, feedback),
          is_flagged = COALESCE($9, is_flagged),
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const params = [
        submissionId,
        submission_text || null,
        submission_files || null,
        status || null,
        score !== undefined ? score : null,
        graded_by || null,
        graded_at || null,
        feedback || null,
        is_flagged !== undefined ? is_flagged : null,
      ];

      const result = await db.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating submission: ${error.message}`);
    }
  }
}

module.exports = Submission;

const db = require('../database/connection');

class AIFeedback {
  static async create(data) {
    try {
      const {
        submission_id,
        feedback_text,
        feedback_type,
        confidence_score,
        suggestions,
        strengths,
        improvements,
        ai_model,
        processing_time_ms,
      } = data;

      const query = `
        INSERT INTO ai_feedback
          (submission_id, feedback_text, feedback_type, confidence_score, suggestions, strengths, improvements, ai_model, processing_time_ms, created_at, updated_at)
        VALUES
          ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW())
        RETURNING *
      `;

      const params = [
        submission_id || null,
        feedback_text || null,
        feedback_type || 'ai',
        confidence_score || null,
        suggestions || null,
        strengths || null,
        improvements || null,
        ai_model || null,
        processing_time_ms || null,
      ];

      const result = await db.query(query, params);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error creating AI feedback: ${err.message}`);
    }
  }

  static async findBySubmissionId(submissionId) {
    try {
      const query =
        'SELECT * FROM ai_feedback WHERE submission_id = $1 ORDER BY created_at DESC';
      const result = await db.query(query, [submissionId]);
      return result.rows;
    } catch (err) {
      throw new Error(
        `Error fetching AI feedback for submission ${submissionId}: ${err.message}`
      );
    }
  }

  static async findByUserId(userId) {
    try {
      const query = `
        SELECT af.*
        FROM ai_feedback af
        JOIN submissions s ON s.id = af.submission_id
        WHERE s.user_id = $1
        ORDER BY af.created_at DESC
      `;
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (err) {
      throw new Error(
        `Error fetching AI feedback for user ${userId}: ${err.message}`
      );
    }
  }
}

module.exports = AIFeedback;

const db = require('../database/connection');

class PeerReview {
  static async create (data) {
    try {
      const {
        reviewer_id,
        reviewee_id,
        submission_id,
        review_text,
        rating,
        criteria_scores,
        time_spent_minutes,
        is_anonymous,
        is_completed,
      } = data;

      const query = `
        INSERT INTO peer_reviews (reviewer_id, reviewee_id, submission_id, review_text, rating, criteria_scores, time_spent_minutes, is_anonymous, is_completed, created_at, updated_at)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW(),NOW()) RETURNING *
      `;
      const params = [
        reviewer_id,
        reviewee_id,
        submission_id,
        review_text || null,
        rating || null,
        criteria_scores || null,
        time_spent_minutes || null,
        is_anonymous !== undefined ? is_anonymous : true,
        is_completed !== undefined ? is_completed : false,
      ];
      const result = await db.query(query, params);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error creating peer review: ${err.message}`);
    }
  }

  static async findBySubmissionId (submissionId) {
    try {
      const query = 'SELECT * FROM peer_reviews WHERE submission_id = $1 ORDER BY created_at DESC';
      const result = await db.query(query, [submissionId]);
      return result.rows;
    } catch (err) {
      throw new Error(`Error finding peer reviews for submission: ${err.message}`);
    }
  }

  static async findByReviewerId (reviewerId) {
    try {
      const query = 'SELECT * FROM peer_reviews WHERE reviewer_id = $1 ORDER BY created_at DESC';
      const result = await db.query(query, [reviewerId]);
      return result.rows;
    } catch (err) {
      throw new Error(`Error finding peer reviews by reviewer: ${err.message}`);
    }
  }

  static async findByRevieweeId (revieweeId) {
    try {
      const query = 'SELECT * FROM peer_reviews WHERE reviewee_id = $1 ORDER BY created_at DESC';
      const result = await db.query(query, [revieweeId]);
      return result.rows;
    } catch (err) {
      throw new Error(`Error finding peer reviews for reviewee: ${err.message}`);
    }
  }

  static async findPendingByReviewerId (reviewerId) {
    try {
      const query = 'SELECT * FROM peer_reviews WHERE reviewer_id = $1 AND is_completed = false ORDER BY created_at ASC';
      const result = await db.query(query, [reviewerId]);
      return result.rows;
    } catch (err) {
      throw new Error(`Error finding pending peer reviews: ${err.message}`);
    }
  }

  static async update (reviewId, updateData) {
    try {
      const { review_text, rating, criteria_scores, time_spent_minutes, is_anonymous, is_completed } = updateData;
      const query = `
        UPDATE peer_reviews SET
          review_text = COALESCE($2, review_text),
          rating = COALESCE($3, rating),
          criteria_scores = COALESCE($4::jsonb, criteria_scores),
          time_spent_minutes = COALESCE($5, time_spent_minutes),
          is_anonymous = COALESCE($6, is_anonymous),
          is_completed = COALESCE($7, is_completed),
          completed_at = CASE WHEN COALESCE($7, is_completed) = true THEN NOW() ELSE completed_at END,
          updated_at = NOW()
        WHERE id = $1 RETURNING *
      `;
      const params = [
        reviewId,
        review_text || null,
        rating !== undefined ? rating : null,
        criteria_scores || null,
        time_spent_minutes || null,
        is_anonymous !== undefined ? is_anonymous : null,
        is_completed !== undefined ? is_completed : null,
      ];
      const result = await db.query(query, params);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error updating peer review: ${err.message}`);
    }
  }

  static async delete (reviewId) {
    try {
      const query = 'DELETE FROM peer_reviews WHERE id = $1 RETURNING *';
      const result = await db.query(query, [reviewId]);
      return result.rows[0];
    } catch (err) {
      throw new Error(`Error deleting peer review: ${err.message}`);
    }
  }
}

module.exports = PeerReview;

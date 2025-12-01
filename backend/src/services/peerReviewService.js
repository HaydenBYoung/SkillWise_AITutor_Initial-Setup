const { pool } = require('../database/connection');
const { calculatePeerReviewPoints } = require('../utils/pointSystem');
const leaderboardService = require('./leaderboardService');

const peerReviewService = {
  /**
   * Assign submissions to reviewers automatically
   * Algorithm: Assign each submission to 2-3 reviewers who:
   * - Haven't reviewed this submission before
   * - Didn't create the submission (no self-review)
   * - Are at a similar skill level (within 2 levels)
   * - Have fewer pending reviews (load balancing)
   */
  assignReviewers: async (submissionId) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get submission details
      const submissionQuery = `
        SELECT s.*, u.id as author_id, us.level as author_level
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        JOIN goals g ON c.goal_id = g.id
        JOIN users u ON g.user_id = u.id
        LEFT JOIN user_statistics us ON u.id = us.user_id
        WHERE s.id = $1
      `;
      const submissionResult = await client.query(submissionQuery, [
        submissionId,
      ]);

      if (submissionResult.rows.length === 0) {
        throw new Error('Submission not found');
      }

      const submission = submissionResult.rows[0];
      const authorId = submission.author_id;
      const authorLevel = submission.author_level || 1;

      // Find eligible reviewers
      const reviewersQuery = `
        SELECT u.id, us.level,
          COUNT(pr.id) FILTER (WHERE pr.is_completed = false) as pending_reviews
        FROM users u
        LEFT JOIN user_statistics us ON u.id = us.user_id
        LEFT JOIN peer_reviews pr ON u.id = pr.reviewer_id
        WHERE u.id != $1  -- Not the author
          AND u.is_active = true
          AND ABS(COALESCE(us.level, 1) - $2) <= 2  -- Within 2 levels
          AND NOT EXISTS (
            SELECT 1 FROM peer_reviews 
            WHERE reviewer_id = u.id AND submission_id = $3
          )  -- Haven't reviewed this submission
        GROUP BY u.id, us.level
        ORDER BY pending_reviews ASC, RANDOM()
        LIMIT 3
      `;
      const reviewersResult = await client.query(reviewersQuery, [
        authorId,
        authorLevel,
        submissionId,
      ]);

      // Create peer review assignments
      const assignments = [];
      for (const reviewer of reviewersResult.rows) {
        const insertQuery = `
          INSERT INTO peer_reviews (
            reviewer_id, reviewee_id, submission_id, 
            is_anonymous, is_completed
          )
          VALUES ($1, $2, $3, true, false)
          RETURNING *
        `;
        const result = await client.query(insertQuery, [
          reviewer.id,
          authorId,
          submissionId,
        ]);
        assignments.push(result.rows[0]);
      }

      await client.query('COMMIT');
      return assignments;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error assigning reviewers:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Create or update a peer review
   */
  createReview: async (reviewData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const { reviewId, reviewText, rating, criteriaScores, timeSpent } =
        reviewData;

      // Update the peer review
      const updateQuery = `
        UPDATE peer_reviews
        SET 
          review_text = $1,
          rating = $2,
          criteria_scores = $3,
          time_spent_minutes = $4,
          is_completed = true,
          completed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $5
        RETURNING *
      `;
      const result = await client.query(updateQuery, [
        reviewText,
        rating,
        JSON.stringify(criteriaScores),
        timeSpent,
        reviewId,
      ]);

      if (result.rows.length === 0) {
        throw new Error('Peer review not found');
      }

      const review = result.rows[0];

      // Calculate and award points to reviewer
      const hasStructuredFeedback =
        criteriaScores && Object.keys(criteriaScores).length > 0;
      const points = calculatePeerReviewPoints(
        rating,
        reviewText.length,
        hasStructuredFeedback
      );

      await leaderboardService.updateUserPoints(
        review.reviewer_id,
        points,
        'peer_review_given'
      );

      // Award points to reviewee for receiving review
      await leaderboardService.updateUserPoints(
        review.reviewee_id,
        5,
        'peer_review_received'
      );

      // Update statistics
      await client.query(
        `
        UPDATE user_statistics
        SET total_peer_reviews_given = total_peer_reviews_given + 1
        WHERE user_id = $1
      `,
        [review.reviewer_id]
      );

      await client.query(
        `
        UPDATE user_statistics
        SET total_peer_reviews_received = total_peer_reviews_received + 1
        WHERE user_id = $1
      `,
        [review.reviewee_id]
      );

      await client.query('COMMIT');
      return review;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating review:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Get pending review assignments for a user
   */
  getPendingReviews: async (userId) => {
    try {
      const query = `
        SELECT 
          pr.id,
          pr.submission_id,
          pr.created_at,
          s.submission_text as content,
          s.submission_files,
          s.score,
          s.submitted_at as submission_date,
          c.title as challenge_title,
          c.description as challenge_description,
          c.difficulty_level as difficulty,
          CONCAT(u.first_name, ' ', u.last_name) as author_name
        FROM peer_reviews pr
        JOIN submissions s ON pr.submission_id = s.id
        JOIN challenges c ON s.challenge_id = c.id
        JOIN users u ON s.user_id = u.id
        WHERE pr.reviewer_id = $1
          AND pr.is_completed = false
        ORDER BY pr.created_at ASC
      `;
      const result = await pool.query(query, [userId]);

      return result.rows.map((row) => ({
        id: row.id,
        submissionId: row.submission_id,
        assignedAt: row.created_at,
        submission: {
          content: row.content,
          submissionFiles: row.submission_files,
          score: row.score,
          submittedAt: row.submission_date,
        },
        challenge: {
          title: row.challenge_title,
          description: row.challenge_description,
          difficulty: row.difficulty,
        },
        authorName: row.author_name,
      }));
    } catch (error) {
      console.error('Error getting pending reviews:', error);
      throw error;
    }
  },

  /**
   * Get all available submissions for review (not assigned system)
   * Returns submissions from other users that haven't been reviewed yet by current user
   */
  getAvailableSubmissions: async (userId) => {
    try {
      const query = `
        SELECT 
          s.id as submission_id,
          s.submission_text as content,
          s.submission_files,
          s.score,
          s.submitted_at,
          c.id as challenge_id,
          c.title as challenge_title,
          c.description as challenge_description,
          c.difficulty_level as difficulty,
          CONCAT(u.first_name, ' ', u.last_name) as author_name,
          u.id as author_id
        FROM submissions s
        JOIN challenges c ON s.challenge_id = c.id
        JOIN users u ON s.user_id = u.id
        WHERE s.user_id != $1  -- Not the current user's submissions
          AND s.score >= 75  -- Only show successful submissions
          AND NOT EXISTS (
            SELECT 1 FROM peer_reviews pr 
            WHERE pr.submission_id = s.id 
              AND pr.reviewer_id = $1
          )  -- Haven't reviewed this submission yet
        ORDER BY s.submitted_at DESC
        LIMIT 50
      `;
      const result = await pool.query(query, [userId]);

      return result.rows.map((row) => ({
        submissionId: row.submission_id,
        submission: {
          content: row.content,
          submissionFiles: row.submission_files,
          score: row.score,
          submittedAt: row.submitted_at,
        },
        challenge: {
          id: row.challenge_id,
          title: row.challenge_title,
          description: row.challenge_description,
          difficulty: row.difficulty,
        },
        authorName: row.author_name,
        authorId: row.author_id,
      }));
    } catch (error) {
      console.error('Error getting available submissions:', error);
      throw error;
    }
  },

  /**
   * Get reviews received by a user
   */
  getReviewsReceived: async (userId) => {
    try {
      const query = `
        SELECT 
          pr.id,
          pr.review_text,
          pr.rating,
          pr.criteria_scores,
          pr.completed_at,
          pr.is_anonymous,
          s.id as submission_id,
          c.title as challenge_title,
          CASE 
            WHEN pr.is_anonymous THEN 'Anonymous Reviewer'
            ELSE u.full_name
          END as reviewer_name
        FROM peer_reviews pr
        JOIN submissions s ON pr.submission_id = s.id
        JOIN challenges c ON s.challenge_id = c.id
        LEFT JOIN users u ON pr.reviewer_id = u.id
        WHERE pr.reviewee_id = $1
          AND pr.is_completed = true
        ORDER BY pr.completed_at DESC
      `;
      const result = await pool.query(query, [userId]);

      return result.rows.map((row) => ({
        id: row.id,
        reviewText: row.review_text,
        rating: row.rating,
        criteriaScores: row.criteria_scores,
        completedAt: row.completed_at,
        submissionId: row.submission_id,
        challengeTitle: row.challenge_title,
        reviewerName: row.reviewer_name,
      }));
    } catch (error) {
      console.error('Error getting received reviews:', error);
      throw error;
    }
  },

  /**
   * Get reviews given by a user
   */
  getReviewsGiven: async (userId) => {
    try {
      const query = `
        SELECT 
          pr.id,
          pr.review_text,
          pr.rating,
          pr.criteria_scores,
          pr.completed_at,
          pr.is_completed,
          s.id as submission_id,
          c.title as challenge_title
        FROM peer_reviews pr
        JOIN submissions s ON pr.submission_id = s.id
        JOIN challenges c ON s.challenge_id = c.id
        WHERE pr.reviewer_id = $1
        ORDER BY pr.created_at DESC
      `;
      const result = await pool.query(query, [userId]);

      return result.rows.map((row) => ({
        id: row.id,
        reviewText: row.review_text,
        rating: row.rating,
        criteriaScores: row.criteria_scores,
        completedAt: row.completed_at,
        isCompleted: row.is_completed,
        submissionId: row.submission_id,
        challengeTitle: row.challenge_title,
      }));
    } catch (error) {
      console.error('Error getting given reviews:', error);
      throw error;
    }
  },

  /**
   * Get a specific review assignment details
   */
  getReviewDetails: async (reviewId, userId) => {
    try {
      const query = `
        SELECT 
          pr.*,
          s.content as submission_content,
          s.code_url,
          s.created_at as submission_date,
          c.title as challenge_title,
          c.description as challenge_description,
          c.difficulty,
          c.requirements
        FROM peer_reviews pr
        JOIN submissions s ON pr.submission_id = s.id
        JOIN challenges c ON s.challenge_id = c.id
        WHERE pr.id = $1 AND pr.reviewer_id = $2
      `;
      const result = await pool.query(query, [reviewId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const row = result.rows[0];
      return {
        id: row.id,
        submissionId: row.submission_id,
        reviewText: row.review_text,
        rating: row.rating,
        criteriaScores: row.criteria_scores,
        timeSpent: row.time_spent_minutes,
        isCompleted: row.is_completed,
        completedAt: row.completed_at,
        submission: {
          content: row.submission_content,
          codeUrl: row.code_url,
          submittedAt: row.submission_date,
        },
        challenge: {
          title: row.challenge_title,
          description: row.challenge_description,
          difficulty: row.difficulty,
          requirements: row.requirements,
        },
      };
    } catch (error) {
      console.error('Error getting review details:', error);
      throw error;
    }
  },

  /**
   * Create a direct peer review (not from assignment system)
   */
  createDirectReview: async (reviewData) => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const {
        reviewerId,
        submissionId,
        reviewText,
        rating,
        criteriaScores,
        timeSpent,
      } = reviewData;

      // Get submission and reviewee info
      const submissionQuery = `
        SELECT s.user_id as reviewee_id
        FROM submissions s
        WHERE s.id = $1
      `;
      const submissionResult = await client.query(submissionQuery, [
        submissionId,
      ]);

      if (submissionResult.rows.length === 0) {
        throw new Error('Submission not found');
      }

      const revieweeId = submissionResult.rows[0].reviewee_id;

      // Check if user is trying to review their own submission
      if (reviewerId === revieweeId) {
        throw new Error('Cannot review your own submission');
      }

      // Check if already reviewed
      const existingReview = await client.query(
        'SELECT id FROM peer_reviews WHERE reviewer_id = $1 AND submission_id = $2',
        [reviewerId, submissionId]
      );

      if (existingReview.rows.length > 0) {
        throw new Error('You have already reviewed this submission');
      }

      // Create the peer review
      const insertQuery = `
        INSERT INTO peer_reviews (
          reviewer_id, reviewee_id, submission_id, 
          review_text, rating, criteria_scores, time_spent_minutes,
          is_anonymous, is_completed, completed_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, true, true, CURRENT_TIMESTAMP)
        RETURNING *
      `;
      const result = await client.query(insertQuery, [
        reviewerId,
        revieweeId,
        submissionId,
        reviewText,
        rating,
        JSON.stringify(criteriaScores || {}),
        timeSpent || 0,
      ]);

      const review = result.rows[0];

      // Calculate and award points to reviewer
      const hasStructuredFeedback =
        criteriaScores && Object.keys(criteriaScores).length > 0;
      const points = calculatePeerReviewPoints(
        rating,
        reviewText.length,
        hasStructuredFeedback
      );

      await leaderboardService.updateUserPoints(
        reviewerId,
        points,
        'peer_review_given'
      );

      // Award points to reviewee for receiving review
      await leaderboardService.updateUserPoints(
        revieweeId,
        5,
        'peer_review_received'
      );

      // Update statistics
      await client.query(
        `
        UPDATE user_statistics
        SET total_peer_reviews_given = COALESCE(total_peer_reviews_given, 0) + 1
        WHERE user_id = $1
      `,
        [reviewerId]
      );

      await client.query(
        `
        UPDATE user_statistics
        SET total_peer_reviews_received = COALESCE(total_peer_reviews_received, 0) + 1
        WHERE user_id = $1
      `,
        [revieweeId]
      );

      await client.query('COMMIT');
      return review;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating direct review:', error);
      throw error;
    } finally {
      client.release();
    }
  },
};

module.exports = peerReviewService;

// Submission business logic
const db = require('../database/connection');
const peerReviewService = require('./peerReviewService');

const submissionService = {
  // Create a new submission
  createSubmission: async ({
    userId,
    challengeId,
    content,
    explanation,
    type = 'code',
  }) => {
    try {
      // Check if user has already earned points for this challenge (prevents resubmission if points awarded)
      const pointsCheck = await db.query(
        `SELECT COUNT(*)::int as count FROM progress_events 
         WHERE user_id = $1 AND related_challenge_id = $2 AND event_type = 'challenge_completed' AND points_earned > 0`,
        [userId, challengeId]
      );

      if (parseInt(pointsCheck.rows[0].count) > 0) {
        throw new Error(
          'You have already earned points for this challenge and cannot resubmit.'
        );
      }

      // Get the next attempt number for this user and challenge
      const attemptQuery = `
        SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
        FROM submissions
        WHERE user_id = $1 AND challenge_id = $2
      `;
      const attemptResult = await db.query(attemptQuery, [userId, challengeId]);
      const nextAttempt = attemptResult.rows[0].next_attempt;

      const query = `
        INSERT INTO submissions (user_id, challenge_id, submission_text, status, attempt_number)
        VALUES ($1, $2, $3, 'submitted', $4)
        RETURNING id, user_id, challenge_id, submission_text as content, status, submitted_at, score, attempt_number
      `;

      const result = await db.query(query, [
        userId,
        challengeId,
        content,
        nextAttempt,
      ]);
      const submission = result.rows[0];

      // Automatically assign peer reviewers (don't await - can happen async)
      peerReviewService.assignReviewers(submission.id).catch((err) => {
        console.error('Error auto-assigning reviewers:', err);
        // Don't fail submission if reviewer assignment fails
      });

      return submission;
    } catch (error) {
      console.error('Error in createSubmission:', error);
      throw error;
    }
  },

  // Get submission by ID
  getSubmissionById: async (submissionId) => {
    const query = `
      SELECT 
        s.id,
        s.user_id,
        s.challenge_id,
        s.submission_text as content,
        s.status,
        s.score,
        s.submitted_at,
        af.feedback_text,
        af.strengths,
        af.improvements,
        af.suggestions
      FROM submissions s
      LEFT JOIN ai_feedback af ON af.submission_id = s.id
      WHERE s.id = $1
    `;

    const result = await db.query(query, [submissionId]);
    return result.rows[0] || null;
  },

  // Get user submissions
  getUserSubmissions: async (userId) => {
    const query = `
      SELECT 
        s.id,
        s.challenge_id,
        s.submission_text as content,
        s.status,
        s.score,
        s.submitted_at,
        c.title as challenge_title,
        c.difficulty
      FROM submissions s
      JOIN challenges c ON c.id = s.challenge_id
      WHERE s.user_id = $1
      ORDER BY s.submitted_at DESC
    `;

    const result = await db.query(query, [userId]);
    return result.rows;
  },

  // Get challenge submissions
  getChallengeSubmissions: async (challengeId) => {
    const query = `
      SELECT 
        s.id,
        s.user_id,
        s.submission_text as content,
        s.status,
        s.score,
        s.submitted_at,
        u.full_name as user_name
      FROM submissions s
      JOIN users u ON u.id = s.user_id
      WHERE s.challenge_id = $1
      ORDER BY s.submitted_at DESC
    `;

    const result = await db.query(query, [challengeId]);
    return result.rows;
  },

  // Update submission
  updateSubmission: async (submissionId, updateData) => {
    const { status, score } = updateData;
    const query = `
      UPDATE submissions 
      SET status = COALESCE($2, status),
          score = COALESCE($3, score),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, user_id, challenge_id, submission_text as content, status, score, submitted_at
    `;

    const result = await db.query(query, [submissionId, status, score]);
    return result.rows[0] || null;
  },

  // Update submission status
  updateSubmissionStatus: async (submissionId, status) => {
    const query = `
      UPDATE submissions 
      SET status = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING id, status
    `;

    const result = await db.query(query, [submissionId, status]);
    return result.rows[0] || null;
  },

  // Submit challenge solution (legacy name kept for compatibility)
  submitSolution: async (submissionData) => {
    return await submissionService.createSubmission(submissionData);
  },

  // Grade submission (placeholder)
  gradeSubmission: async (submissionId) => {
    throw new Error('Grading is handled by AI feedback service');
  },
};

module.exports = submissionService;

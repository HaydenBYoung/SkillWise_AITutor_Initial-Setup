const db = require('../database/connection');

const submissionService = {
  // Create a new submission
  createSubmission: async ({
    userId,
    challengeId,
    code,
    language = 'javascript',
  }) => {
    // Get the next attempt number for this user and challenge
    const attemptQuery = `
      SELECT COALESCE(MAX(attempt_number), 0) + 1 as next_attempt
      FROM submissions
      WHERE user_id = $1 AND challenge_id = $2
    `;
    const attemptResult = await db.query(attemptQuery, [userId, challengeId]);
    const attemptNumber = attemptResult.rows[0].next_attempt;

    const query = `
      INSERT INTO submissions (user_id, challenge_id, submission_text, status, submitted_at, attempt_number)
      VALUES ($1, $2, $3, 'submitted', NOW(), $4)
      RETURNING *
    `;

    const result = await db.query(query, [
      userId,
      challengeId,
      code,
      attemptNumber,
    ]);
    return result.rows[0];
  },

  // Submit challenge solution (alias for compatibility)
  submitSolution: async (submissionData) => {
    return submissionService.createSubmission(submissionData);
  },

  // TODO: Get submission by ID
  getSubmissionById: async (submissionId) => {
    // Implementation needed
    throw new Error('Not implemented');
  },

  // TODO: Get user submissions
  getUserSubmissions: async (userId) => {
    // Implementation needed
    throw new Error('Not implemented');
  },

  // TODO: Get challenge submissions
  getChallengeSubmissions: async (challengeId) => {
    // Implementation needed
    throw new Error('Not implemented');
  },

  // TODO: Grade submission
  gradeSubmission: async (submissionId) => {
    // Implementation needed
    throw new Error('Not implemented');
  },

  // TODO: Update submission status
  updateSubmissionStatus: async (submissionId, status) => {
    // Implementation needed
    throw new Error('Not implemented');
  },
};

module.exports = submissionService;

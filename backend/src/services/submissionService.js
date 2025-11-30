// Submission business logic
const db = require('../database/connection');

const submissionService = {
  // Create a new submission
  createSubmission: async ({ userId, challengeId, content, explanation, type = 'code' }) => {
    const query = `
      INSERT INTO submissions (user_id, challenge_id, submission_text, status)
      VALUES ($1, $2, $3, 'submitted')
      RETURNING id, user_id, challenge_id, submission_text as content, status, submitted_at, score
    `;
    
    const result = await db.query(query, [userId, challengeId, content]);
    return result.rows[0];
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

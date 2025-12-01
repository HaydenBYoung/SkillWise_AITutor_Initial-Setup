// Submission business logic
const Submission = require('../models/Submission');
const Challenge = require('../models/Challenge');
const progressService = require('./progressService');

const submissionService = {
  // TODO: Submit challenge solution
  submitSolution: async (submissionData) => {
    if (!submissionData || !submissionData.user_id || !submissionData.challenge_id) {
      throw new Error('Missing required submission fields');
    }
    // Check challenge and max attempts
    const challenge = await Challenge.findById(submissionData.challenge_id);
    if (!challenge) throw new Error('Challenge not found');
    const existing = await Submission.findByUserId(submissionData.user_id);
    const attemptsForChallenge = (existing || []).filter((s) => Number(s.challenge_id) === Number(submissionData.challenge_id));
    const maxAttemptExisting = attemptsForChallenge.reduce((m, s) => Math.max(m, Number(s.attempt_number || 0)), 0);
    const nextAttempt = maxAttemptExisting + 1;
    if (Number(challenge.max_attempts) && Number(challenge.max_attempts) > 0 && nextAttempt > Number(challenge.max_attempts)) {
      throw new Error('Maximum number of attempts exceeded');
    }
    const created = await Submission.create(submissionData);
    return created;
  },

  // TODO: Get submission by ID
  getSubmissionById: async (submissionId) => {
    if (!submissionId) throw new Error('Submission id required');
    const row = await Submission.findById(submissionId);
    return row;
  },

  // TODO: Get user submissions
  getUserSubmissions: async (userId) => {
    if (!userId) throw new Error('User id required');
    const rows = await Submission.findByUserId(userId);
    return rows;
  },

  // TODO: Get challenge submissions
  getChallengeSubmissions: async (challengeId) => {
    if (!challengeId) throw new Error('Challenge id required');
    const rows = await Submission.findByChallengeId(challengeId);
    return rows;
  },

  // TODO: Grade submission
  gradeSubmission: async (submissionId, gradeData = {}) => {
    if (!submissionId) throw new Error('Submission id required');
    const existing = await Submission.findById(submissionId);
    if (!existing) throw new Error('Submission not found');
    const { score, graded_by, feedback, status } = gradeData;
    const updatePayload = {
      score: score !== undefined ? score : existing.score,
      graded_by: graded_by || existing.graded_by,
      graded_at: new Date(),
      feedback: feedback || existing.feedback,
      status: status || 'reviewed',
    };
    const updated = await Submission.update(submissionId, updatePayload);

    // If graded with a score, award points via progressService
    if (score !== undefined && score !== null) {
      // fetch challenge to read points reward
      const challenge = await Challenge.findById(existing.challenge_id);
      const pointsReward = challenge && challenge.points_reward ? Number(challenge.points_reward) : 0;
      const pointsEarned = Math.round((pointsReward * Number(score)) / 100);
      // If earned points > 0, track event
      if (pointsEarned > 0) {
        await progressService.trackEvent(existing.user_id, {
          challengeId: existing.challenge_id,
          score: Number(score),
          completed: Number(score) >= 50, // treat >= 50 as completed
          points_earned: pointsEarned,
        });
      }
    }
    return updated;
  },

  // TODO: Update submission status
  updateSubmissionStatus: async (submissionId, status) => {
    if (!submissionId) throw new Error('Submission id required');
    if (!status) throw new Error('Status required');
    const updated = await Submission.update(submissionId, { status });
    return updated;
  },
};

module.exports = submissionService;

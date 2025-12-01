const submissionService = require('../services/submissionService');
const aiService = require('../services/aiService');

const submissionController = {
  // Submit work for challenge
  submitWork: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      const payload = req.body || {};
      // Accept challenge_id either in body or path param
      const challengeId = payload.challenge_id || req.params.id || payload.challengeId;
      if (!challengeId)
        return res
          .status(400)
          .json({ success: false, message: 'challenge_id is required' });

      const submissionData = {
        user_id: userId,
        challenge_id: challengeId,
        submission_text: payload.submission_text || payload.text || null,
        submission_files: payload.submission_files || payload.files || null,
        time_spent_minutes: payload.time_spent_minutes || payload.time_spent || null,
      };
      const created = await submissionService.submitSolution(submissionData);
      // Generate AI feedback asynchronously (but await to return immediate feedback)
      let feedback = null;
      try {
        feedback = await aiService.generateFeedback(created);
      } catch (err) {
        // Do not block submission on AI errors; log and continue
        const logger = req.app.get('logger');
        logger && logger.warn && logger.warn({ event: 'ai:feedback:error', error: err.message });
      }

      return res.status(201).json({ success: true, data: created, feedback });
    } catch (err) {
      return next(err);
    }
  },

  // Get submission by ID
  getSubmission: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      const id = req.params.id;
      const submission = await submissionService.getSubmissionById(id);
      if (!submission)
        return res
          .status(404)
          .json({ success: false, message: 'Submission not found' });
      // Restrict to owner or admin/instructor
      if (Number(submission.user_id) !== Number(userId)) {
        const role = (req.user && req.user.role) || 'user';
        if (!['admin', 'instructor'].includes(role)) {
          return res
            .status(403)
            .json({ success: false, message: 'Forbidden' });
        }
      }
      return res.status(200).json({ success: true, data: submission });
    } catch (err) {
      return next(err);
    }
  },

  // Get user submissions
  getUserSubmissions: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      // allow optional param userId, otherwise current user
      const requestedUser = req.params.userId || userId;
      // Allow if owner or admin/instructor
      if (Number(requestedUser) !== Number(userId)) {
        const role = (req.user && req.user.role) || 'user';
        if (!['admin', 'instructor'].includes(role)) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
      }
      const rows = await submissionService.getUserSubmissions(requestedUser);
      return res.status(200).json({ success: true, data: rows });
    } catch (err) {
      return next(err);
    }
  },

  // Get submissions for a challenge (for reviewers/instructors)
  getChallengeSubmissions: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      const challengeId = req.params.challengeId || req.params.id;
      if (!challengeId)
        return res
          .status(400)
          .json({ success: false, message: 'challengeId required' });
      // For now restrict to authenticated users - ideally check role
      const rows = await submissionService.getChallengeSubmissions(challengeId);
      return res.status(200).json({ success: true, data: rows });
    } catch (err) {
      return next(err);
    }
  },

  // Update submission (owner edit or reviewer grading)
  updateSubmission: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      const id = req.params.id;
      const submission = await submissionService.getSubmissionById(id);
      if (!submission)
        return res
          .status(404)
          .json({ success: false, message: 'Submission not found' });

      const payload = req.body || {};
      // If the owner is updating the submission text/files
      if (Number(submission.user_id) === Number(userId)) {
        const allowed = {
          submission_text: payload.submission_text || payload.text || null,
          submission_files: payload.submission_files || payload.files || null,
          status: payload.status || submission.status,
        };
        await submissionService.updateSubmissionStatus(id, allowed.status);
        // And also update text/files if provided
        if (payload.submission_text || payload.submission_files) {
          // update text/files in model directly
          await require('../models/Submission').update(id, {
            submission_text: payload.submission_text || null,
            submission_files: payload.submission_files || null,
          });
        }
        const refreshed = await submissionService.getSubmissionById(id);
        return res.status(200).json({ success: true, data: refreshed });
      }

      // Else this is a grading action by someone else
      // Prevent owner from self-grading - check
      if (Number(submission.user_id) === Number(userId)) {
        return res
          .status(403)
          .json({ success: false, message: 'Cannot grade own submission' });
      }

      // Only instructors/admins can grade submissions
      const role = (req.user && req.user.role) || 'user';
      if (!['admin', 'instructor'].includes(role)) {
        return res
          .status(403)
          .json({ success: false, message: 'You are not allowed to grade submissions' });
      }

      // require score or status change for grading
      const gradePayload = {
        score: payload.score !== undefined ? payload.score : undefined,
        graded_by: Number(userId),
        feedback: payload.feedback || payload.comments || null,
        status: payload.status || 'reviewed',
      };
      const updated = await submissionService.gradeSubmission(id, gradePayload);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = submissionController;

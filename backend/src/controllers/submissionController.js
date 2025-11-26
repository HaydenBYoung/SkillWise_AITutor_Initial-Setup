// TODO: Implement work submission controller
const submissionService = require('../services/submissionService');

const submissionController = {
  // Submit work for challenge
  submitWork: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const challengeId = req.params.id || req.body.challengeId;
      const { code, language } = req.body;

      if (!challengeId) {
        return res.status(400).json({
          status: 'error',
          message: 'Challenge ID is required',
        });
      }

      if (!code) {
        return res.status(400).json({
          status: 'error',
          message: 'Code submission is required',
        });
      }

      const submission = await submissionService.createSubmission({
        userId,
        challengeId: parseInt(challengeId),
        code,
        language: language || 'javascript',
      });

      res.status(201).json({
        status: 'success',
        data: { submission },
      });
    } catch (error) {
      next(error);
    }
  },

  // TODO: Get submission by ID
  getSubmission: async (req, res, next) => {
    // Implementation needed
  },

  // TODO: Get user submissions
  getUserSubmissions: async (req, res, next) => {
    // Implementation needed
  },

  // TODO: Update submission
  updateSubmission: async (req, res, next) => {
    // Implementation needed
  },
};

module.exports = submissionController;

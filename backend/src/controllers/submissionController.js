// Submission controller for challenge work submissions
const submissionService = require('../services/submissionService');
const aiService = require('../services/aiService');
const Challenge = require('../models/Challenge');

const submissionController = {
  // Submit work for challenge
  submitWork: async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const { challengeId, type, content, explanation } = req.body;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!challengeId || !content) {
        return res.status(400).json({ 
          success: false, 
          message: 'Challenge ID and content are required' 
        });
      }

      // Create submission
      const submission = await submissionService.createSubmission({
        userId,
        challengeId,
        content,
        explanation,
        type: type || 'code'
      });

      // Generate AI feedback asynchronously
      Challenge.findById(challengeId)
        .then(challenge => {
          if (challenge) {
            return aiService.generateFeedback(
              submission.id,
              content,
              challenge.title,
              challenge.description,
              type || 'code'
            );
          }
        })
        .catch(err => {
          console.error('Error generating AI feedback:', err);
        });

      return res.status(201).json({ 
        success: true, 
        data: { submission },
        message: 'Submission created successfully. AI feedback will be generated shortly.' 
      });
    } catch (err) {
      return next(err);
    }
  },

  // Get submission by ID
  getSubmission: async (req, res, next) => {
    try {
      const id = req.params.id;
      const submission = await submissionService.getSubmissionById(id);
      
      if (!submission) {
        return res.status(404).json({ 
          success: false, 
          message: 'Submission not found' 
        });
      }

      return res.status(200).json({ success: true, data: { submission } });
    } catch (err) {
      return next(err);
    }
  },

  // Get user submissions
  getUserSubmissions: async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const submissions = await submissionService.getUserSubmissions(userId);
      return res.status(200).json({ success: true, data: { submissions } });
    } catch (err) {
      return next(err);
    }
  },

  // Update submission
  updateSubmission: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updated = await submissionService.updateSubmission(id, req.body);
      
      if (!updated) {
        return res.status(404).json({ 
          success: false, 
          message: 'Submission not found' 
        });
      }

      return res.status(200).json({ success: true, data: { submission: updated } });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = submissionController;

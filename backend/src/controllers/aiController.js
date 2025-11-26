// AI Integration Controller
// Stories 3.2, 3.5
const aiService =
  process.env.USE_MOCK_AI === 'true'
    ? require('../services/aiServiceMock')
    : require('../services/aiService');

const aiController = {
  // Story 3.2: Generate AI challenge
  generateChallenge: async (req, res, next) => {
    try {
      const { skill, difficulty, topic, type } = req.body;

      const challenge = await aiService.generateChallenge({
        skill: skill || 'JavaScript',
        difficulty: difficulty || 'intermediate',
        topic: topic || 'general programming',
        type: type || 'coding',
      });

      res.status(200).json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      next(error);
    }
  },

  // Story 3.5: Submit for AI feedback
  submitForFeedback: async (req, res, next) => {
    try {
      const {
        submissionId,
        submissionCode,
        challengeTitle,
        challengeDescription,
      } = req.body;

      if (!submissionId || !submissionCode) {
        return res.status(400).json({
          success: false,
          message: 'submissionId and submissionCode are required',
        });
      }

      const feedback = await aiService.submitForFeedback({
        submissionId,
        submissionCode,
        challengeTitle: challengeTitle || 'Coding Challenge',
        challengeDescription: challengeDescription || '',
      });

      res.status(200).json({
        success: true,
        data: feedback,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get feedback for a submission
  getFeedback: async (req, res, next) => {
    try {
      const { submissionId } = req.params;

      const feedback = await aiService.getFeedback(submissionId);

      res.status(200).json({
        success: true,
        data: feedback,
      });
    } catch (error) {
      next(error);
    }
  },

  // Get all feedback for user's challenge submissions
  getChallengeFeedback: async (req, res, next) => {
    try {
      const { challengeId } = req.params;
      const userId = req.user.id;

      const feedback = await aiService.getFeedbackForChallenge(
        userId,
        challengeId
      );

      res.status(200).json({
        success: true,
        data: feedback,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = aiController;

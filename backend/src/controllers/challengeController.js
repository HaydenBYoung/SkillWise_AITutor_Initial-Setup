const challengeService = require('../services/challengeService');
const goalService = require('../services/goalService');

const challengeController = {
  // Get all challenges (public challenges + user's goal challenges)
  getChallenges: async (req, res, next) => {
    try {
      const { category, difficulty, goal_id } = req.query;
      const userId = req.user.id;
      
      const challenges = await challengeService.getChallenges({
        category,
        difficulty,
        goal_id,
        userId,
      });
      
      res.status(200).json({
        success: true,
        data: challenges,
        message: 'Challenges retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Get challenge by ID
  getChallengeById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const challenge = await challengeService.getChallengeById(id, userId);
      
      if (!challenge) {
        return res.status(404).json({
          success: false,
          message: 'Challenge not found',
        });
      }

      res.status(200).json({
        success: true,
        data: challenge,
        message: 'Challenge retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new challenge
  createChallenge: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const challengeData = { ...req.body, created_by: userId };
      
      const newChallenge = await challengeService.createChallenge(challengeData);
      
      res.status(201).json({
        success: true,
        data: newChallenge,
        message: 'Challenge created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Update challenge
  updateChallenge: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const updatedChallenge = await challengeService.updateChallenge(id, req.body, userId);
      
      if (!updatedChallenge) {
        return res.status(404).json({
          success: false,
          message: 'Challenge not found or unauthorized',
        });
      }

      res.status(200).json({
        success: true,
        data: updatedChallenge,
        message: 'Challenge updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete challenge
  deleteChallenge: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const deletedChallenge = await challengeService.deleteChallenge(id, userId);
      
      if (!deletedChallenge) {
        return res.status(404).json({
          success: false,
          message: 'Challenge not found or unauthorized',
        });
      }

      res.status(200).json({
        success: true,
        data: deletedChallenge,
        message: 'Challenge deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Add challenge to goal
  addToGoal: async (req, res, next) => {
    try {
      const { challengeId, goalId } = req.params;
      const userId = req.user.id;
      
      const result = await goalService.addChallengeToGoal(goalId, challengeId, userId);
      
      res.status(201).json({
        success: true,
        data: result,
        message: 'Challenge added to goal successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Update challenge status in goal
  updateChallengeStatus: async (req, res, next) => {
    try {
      const { challengeId, goalId } = req.params;
      const { status, submission_text, submission_url, score } = req.body;
      const userId = req.user.id;
      
      const result = await goalService.updateChallengeStatus(
        goalId, 
        challengeId, 
        userId, 
        status, 
        { submission_text, submission_url, score }
      );
      
      if (!result) {
        return res.status(404).json({
          success: false,
          message: 'Challenge not found in goal',
        });
      }

      res.status(200).json({
        success: true,
        data: result,
        message: 'Challenge status updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = challengeController;

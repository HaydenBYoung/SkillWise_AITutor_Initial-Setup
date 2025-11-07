const challengeService = require('../services/challengeService');

const challengeController = {
  // Get all challenges with optional filtering
  getChallenges: async (req, res, next) => {
    try {
      const filters = {
        category: req.query.category,
        difficulty_level: req.query.difficulty,
        goal_id: req.query.goal_id ? parseInt(req.query.goal_id) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      };

      const challenges = await challengeService.getChallenges(filters);
      res.json({ challenges });
    } catch (error) {
      next(error);
    }
  },

  // Get single challenge by ID
  getChallengeById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const challenge = await challengeService.getChallengeById(id);
      res.json({ challenge });
    } catch (error) {
      next(error);
    }
  },

  // Get challenges linked to a specific goal
  getChallengesByGoalId: async (req, res, next) => {
    try {
      const { goalId } = req.params;
      const userId = req.user.id;

      const challenges = await challengeService.getChallengesByGoalId(
        goalId,
        userId
      );
      res.json({ challenges });
    } catch (error) {
      next(error);
    }
  },

  // Create new challenge (requires authentication)
  createChallenge: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const challengeData = req.validated;

      const challenge = await challengeService.createChallenge(
        challengeData,
        userId
      );
      res.status(201).json({ challenge });
    } catch (error) {
      next(error);
    }
  },

  // Update existing challenge
  updateChallenge: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const challengeData = req.validated;

      const challenge = await challengeService.updateChallenge(
        id,
        challengeData,
        userId
      );
      res.json({ challenge });
    } catch (error) {
      next(error);
    }
  },

  // Delete challenge (soft delete)
  deleteChallenge: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await challengeService.deleteChallenge(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Get challenges by category
  getChallengesByCategory: async (req, res, next) => {
    try {
      const { category } = req.params;
      const challenges = await challengeService.getChallengesByCategory(
        category
      );
      res.json({ challenges });
    } catch (error) {
      next(error);
    }
  },

  // Get user's created challenges
  getUserChallenges: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const challenges = await challengeService.getUserChallenges(userId);
      res.json({ challenges });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = challengeController;

const goalService = require('../services/goalService');
const { AppError } = require('../middleware/errorHandler');

const goalController = {
  // Get all goals for authenticated user
  getGoals: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const goals = await goalService.getUserGoals(userId);
      res.json({ goals });
    } catch (error) {
      next(error);
    }
  },

  // Get single goal by ID
  getGoalById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const goal = await goalService.getGoalById(id, userId);
      res.json({ goal });
    } catch (error) {
      next(error);
    }
  },

  // Create new goal
  createGoal: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const goalData = req.validated;

      const goal = await goalService.createGoal(goalData, userId);
      res.status(201).json({ goal });
    } catch (error) {
      next(error);
    }
  },

  // Update existing goal
  updateGoal: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const goalData = req.validated;

      const goal = await goalService.updateGoal(id, goalData, userId);
      res.json({ goal });
    } catch (error) {
      next(error);
    }
  },

  // Delete goal
  deleteGoal: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await goalService.deleteGoal(id, userId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },

  // Mark goal as completed
  markCompleted: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const goal = await goalService.markCompleted(id, userId);
      res.json({ goal });
    } catch (error) {
      next(error);
    }
  },

  // Update goal progress
  updateProgress: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { progress } = req.body;
      const userId = req.user.id;

      if (typeof progress !== 'number' || progress < 0 || progress > 100) {
        throw new AppError(
          'Progress must be a number between 0 and 100',
          400,
          'INVALID_PROGRESS'
        );
      }

      const goal = await goalService.updateProgress(id, progress, userId);
      res.json({ goal });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = goalController;

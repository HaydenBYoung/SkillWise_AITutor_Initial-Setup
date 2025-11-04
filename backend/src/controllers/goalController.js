const goalService = require('../services/goalService');
const Goal = require('../models/Goal');

const goalController = {
  // Get all goals for user
  getGoals: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const goals = await goalService.getUserGoals(userId);
      
      res.status(200).json({
        success: true,
        data: goals,
        message: 'Goals retrieved successfully',
      });
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
      
      if (!goal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
        });
      }

      res.status(200).json({
        success: true,
        data: goal,
        message: 'Goal retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Create new goal
  createGoal: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const goalData = { ...req.body, user_id: userId };
      
      const newGoal = await goalService.createGoal(goalData);
      
      res.status(201).json({
        success: true,
        data: newGoal,
        message: 'Goal created successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Update existing goal
  updateGoal: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const updatedGoal = await goalService.updateGoal(id, req.body, userId);
      
      if (!updatedGoal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
        });
      }

      res.status(200).json({
        success: true,
        data: updatedGoal,
        message: 'Goal updated successfully',
      });
    } catch (error) {
      next(error);
    }
  },

  // Delete goal
  deleteGoal: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      
      const deletedGoal = await goalService.deleteGoal(id, userId);
      
      if (!deletedGoal) {
        return res.status(404).json({
          success: false,
          message: 'Goal not found',
        });
      }

      res.status(200).json({
        success: true,
        data: deletedGoal,
        message: 'Goal deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = goalController;

const goalService = require('../services/goalService');

const goalController = {
  // Get all goals for user
  getGoals: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }

      const goals = await goalService.getUserGoals(userId);
      // Map progress_percentage to progress for frontend compatibility
      const mappedGoals = goals.map(g => ({
        ...g,
        progress: g.progress_percentage || 0
      }));
      return res.status(200).json({ success: true, data: mappedGoals });
    } catch (err) {
      next(err);
    }
  },

  // Get single goal by ID
  getGoalById: async (req, res, next) => {
    try {
      const goalId = req.params.id;
      const userId = req.user && req.user.id;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }

      const goal = await goalService.getGoalById(goalId, userId);
      if (!goal)
        return res
          .status(404)
          .json({ success: false, message: 'Goal not found' });
      // Map progress_percentage to progress for frontend compatibility
      const mappedGoal = {
        ...goal,
        progress: goal.progress_percentage || 0
      };
      return res.status(200).json({ success: true, data: mappedGoal });
    } catch (err) {
      next(err);
    }
  },

  // Create new goal
  createGoal: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });

      const goalData = req.body || {};
      // Ensure user_id is set for creation
      const newGoal = await goalService.createGoal(goalData, userId);
      // Map progress_percentage to progress for frontend compatibility
      const mappedGoal = {
        ...newGoal,
        progress: newGoal.progress_percentage || 0
      };
      return res.status(201).json({ success: true, data: mappedGoal });
    } catch (err) {
      next(err);
    }
  },

  // Update existing goal
  updateGoal: async (req, res, next) => {
    try {
      const goalId = req.params.id;
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });

      const update = req.body || {};
      const updated = await goalService.updateGoal(goalId, update, userId);
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: 'Goal not found' });
      // Map progress_percentage to progress for frontend compatibility
      const mappedGoal = {
        ...updated,
        progress: updated.progress_percentage || 0
      };
      return res.status(200).json({ success: true, data: mappedGoal });
    } catch (err) {
      next(err);
    }
  },

  // Delete goal
  deleteGoal: async (req, res, next) => {
    try {
      const goalId = req.params.id;
      const userId = req.user && req.user.id;
      if (!userId)
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });

      const deleted = await goalService.deleteGoal(goalId, userId);
      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: 'Goal not found' });
      return res.status(200).json({ success: true, data: deleted });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = goalController;

const goalService = require('../services/goalService');
const leaderboardService = require('../services/leaderboardService');
const pointSystem = require('../utils/pointSystem');

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
      const mappedGoals = goals.map((g) => ({
        ...g,
        progress: g.progress_percentage || 0,
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
        progress: goal.progress_percentage || 0,
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
        progress: newGoal.progress_percentage || 0,
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
        progress: updated.progress_percentage || 0,
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

  // Mark goal as complete and award points
  completeGoal: async (req, res, next) => {
    try {
      const goalId = req.params.id;
      const userId = req.user?.id;

      if (!userId) {
        return res
          .status(401)
          .json({ success: false, message: 'Unauthorized' });
      }

      // Get goal details
      const goal = await goalService.getGoalById(goalId, userId);
      if (!goal) {
        return res
          .status(404)
          .json({ success: false, message: 'Goal not found' });
      }

      if (goal.user_id !== userId) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }

      // Check if already marked as completed
      if (goal.is_completed) {
        return res.status(400).json({
          success: false,
          message: 'Goal already completed',
        });
      }

      // Update goal to completed
      await goalService.updateGoal(goalId, { is_completed: true }, userId);

      // Calculate points (100 base + bonus based on progress percentage)
      const points = pointSystem.calculateGoalPoints(
        goal.progress_percentage || 100
      );

      // Award points to user
      await leaderboardService.updateUserPoints(
        userId,
        points,
        'goal_completed'
      );

      // Record completion in progress_events
      const db = require('../database/connection');
      await db.query(
        `INSERT INTO progress_events 
         (user_id, event_type, event_data, points_earned, related_goal_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          userId,
          'goal_completed',
          JSON.stringify({ goal_title: goal.title, category: goal.category }),
          points,
          goalId,
        ]
      );

      return res.status(200).json({
        success: true,
        data: {
          points_earned: points,
          message: `Goal completed! You earned ${points} points.`,
        },
      });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = goalController;

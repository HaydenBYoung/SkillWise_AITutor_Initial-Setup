// TODO: Implement goal business logic and calculations
const Goal = require('../models/Goal');

const goalService = {
  // TODO: Get user goals with progress
  getUserGoals: async (userId) => {
    try {
      const goals = await Goal.findByUserId(userId);
      //add completion calc to each goal
      return goals.map((goal) => ({
        ...goal,
        completion: goalService.calculateCompletion(goal),
      }));
    } catch (error) {
      console.error('Error getting user goals: ', error);
      //throw new Error('Could not retrieve goals.');
    }
    throw new Error('Not implemented');
  },

  // TODO: Create new goal with validation
  createGoal: async (goalData, userId) => {
    try {
      //Validate required fields
      if (!goalData.title) {
        throw new Error('Goal title is required.');
      }

      const newGoal = await Goal.create({
        ...goalData,
        user_id: userId,
      });

      return {
        ...newGoal,
        completion: goalService.calculateCompletion(newGoal),
      };
    } catch (error) {
      console.error('Error creating goal: ', error);
    }
    throw new Error('Not implemented');
  },

  // TODO: Update goal progress
  updateProgress: async (goalId, progress) => {
    try {
      const goal = await Goal.findById(goalId);
      if (!goal) throw new Error('Goal not found.');

      const updatedGoal = await Goal.update(goalId, { progress });
      return {
        ...updatedGoal,
        completion: goalService.calculateCompletion(updatedGoal),
      };
    } catch (error) {
      console.error('Error updating progress: ', error);
    }
    throw new Error('Not implemented');
  },

  // TODO: Calculate goal completion percentage
  calculateCompletion: (goal) => {
    if (goal.target_value == null || goal.target_value === 0) return 0;

    const progress = goal.progress || 0;
    const completion = (progress / goal.target_value) * 100;

    //Make sure it's capped between 0-100%
    return Math.min(Math.max(completion, 0), 100);
  },
};

module.exports = goalService;

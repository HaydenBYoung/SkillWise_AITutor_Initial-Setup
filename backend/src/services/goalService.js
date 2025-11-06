const Goal = require('../models/Goal');

const goalService = {
  // Get user goals (returns array of goals for the user)
  getUserGoals: async (userId) => {
    if (!userId) throw new Error('User ID is required');
    const goals = await Goal.findByUserId(userId);
    return goals || [];
  },

  // Create new goal with validation
  createGoal: async (goalData, userId) => {
    if (!userId) throw new Error('User ID is required');

    const payload = Object.assign({}, goalData, { user_id: userId });

    // Basic validation
    if (!payload.title) {
      throw new Error('Goal title is required');
    }

    const created = await Goal.create(payload);
    return created;
  },

  // Get single goal by id (and optionally check owner)
  getGoalById: async (goalId, userId) => {
    if (!goalId) throw new Error('Goal ID is required');
    const goal = await Goal.findById(goalId);
    if (!goal) return null;
    if (userId && String(goal.user_id) !== String(userId)) return null;
    return goal;
  },

  // Update goal progress (stores progress percentage)
  updateProgress: async (goalId, progress) => {
    const updated = await Goal.update(goalId, { progress });
    return updated;
  },

  // Update a goal (with ownership safeguard)
  updateGoal: async (goalId, updateData, userId) => {
    if (!goalId) throw new Error('Goal ID is required');
    const existing = await Goal.findById(goalId);
    if (!existing) return null;
    if (userId && String(existing.user_id) !== String(userId)) return null;
    const updated = await Goal.update(goalId, updateData);
    return updated;
  },

  // Delete goal with ownership check
  deleteGoal: async (goalId, userId) => {
    if (!goalId) throw new Error('Goal ID is required');
    const existing = await Goal.findById(goalId);
    if (!existing) return null;
    if (userId && String(existing.user_id) !== String(userId)) return null;
    const deleted = await Goal.delete(goalId);
    return deleted;
  },

  // Note: calculateCompletion currently uses a simple heuristic. Consider deriving completion from related challenges for more accuracy.
  calculateCompletion: (goal) => {
    if (!goal) return 0;
    // If explicit progress field exists, use it
    if (typeof goal.progress === 'number')
      return Math.min(100, Math.max(0, goal.progress));
    // Otherwise naive calculation: completed flag
    if (goal.status === 'completed' || goal.status === 'done') return 100;
    return 0;
  },
};

module.exports = goalService;

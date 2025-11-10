import { apiService } from './api.js';

export const goalService = {
  // Get all goals for the current user
  async getGoals(params = {}) {
    try {
      const response = await apiService.goals.getAll(params);
      console.log('API Response:', response); // Debug logging
      
      // Handle both response.data.data.goals and response.data.goals formats
      let goals = [];
      if (response.data.success && response.data.data && response.data.data.goals) {
        goals = response.data.data.goals;
      } else if (response.data.goals) {
        goals = response.data.goals;
      } else if (Array.isArray(response.data)) {
        goals = response.data;
      }
      
      // Use real backend data instead of mock progress calculations
      const goalsWithProgress = goals.map(goal => {
        return {
          ...goal,
          // Use backend-calculated progress if available, otherwise use stored progress
          progress: goal.calculated_progress_percentage || goal.progress_percentage || goal.progress || 0,
          // Keep the real earned and target points from backend
          earned_points: goal.earned_points || 0,
          target_points: goal.target_points || 0,
          // Use real challenge counts from backend
          totalChallenges: goal.total_challenges || 0,
          completedChallenges: goal.completed_challenges || 0
        };
      });
      
      return {
        success: true,
        data: {
          goals: goalsWithProgress,
          ...response.data
        }
      };
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  // Get a specific goal by ID
  async getGoalById(goalId) {
    try {
      const response = await apiService.goals.getById(goalId);
      return response.data;
    } catch (error) {
      console.error(`Error fetching goal ${goalId}:`, error);
      throw error;
    }
  },

  // Create a new goal
  async createGoal(goalData) {
    try {
      console.log('Creating goal with data:', goalData); // Debug logging
      const response = await apiService.goals.create(goalData);
      console.log('Create goal response:', response); // Debug logging
      
      // Use real backend data for new goals
      const goalWithProgress = {
        ...response.data,
        progress: response.data.calculated_progress_percentage || response.data.progress_percentage || 0,
        earned_points: response.data.earned_points || 0,
        target_points: response.data.target_points || 0,
        totalChallenges: response.data.total_challenges || 0,
        completedChallenges: response.data.completed_challenges || 0
      };
      
      return {
        success: true,
        data: goalWithProgress
      };
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  // Update an existing goal
  async updateGoal(goalId, goalData) {
    try {
      const response = await apiService.goals.update(goalId, goalData);
      return response.data;
    } catch (error) {
      console.error(`Error updating goal ${goalId}:`, error);
      throw error;
    }
  },

  // Delete a goal
  async deleteGoal(goalId) {
    try {
      const response = await apiService.goals.delete(goalId);
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`Error deleting goal ${goalId}:`, error);
      throw error;
    }
  },

  // Toggle goal completion
  async toggleGoalCompletion(goalId, isCompleted) {
    try {
      const response = await apiService.patch(`/goals/${goalId}/toggle-completion`, { 
        is_completed: isCompleted 
      });
      return response.data;
    } catch (error) {
      console.error(`Error toggling goal completion ${goalId}:`, error);
      throw error;
    }
  }
};

export default goalService;
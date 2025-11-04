import apiService from './api.js';

const GOALS_ENDPOINT = '/goals';

export const goalService = {
  // Get all goals for the current user
  async getGoals() {
    try {
      const response = await apiService.get(GOALS_ENDPOINT);
      return response.data;
    } catch (error) {
      console.error('Error fetching goals:', error);
      throw error;
    }
  },

  // Get a specific goal by ID
  async getGoalById(goalId) {
    try {
      const response = await apiService.get(`${GOALS_ENDPOINT}/${goalId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching goal ${goalId}:`, error);
      throw error;
    }
  },

  // Create a new goal
  async createGoal(goalData) {
    try {
      const response = await apiService.post(GOALS_ENDPOINT, goalData);
      return response.data;
    } catch (error) {
      console.error('Error creating goal:', error);
      throw error;
    }
  },

  // Update an existing goal
  async updateGoal(goalId, goalData) {
    try {
      const response = await apiService.put(`${GOALS_ENDPOINT}/${goalId}`, goalData);
      return response.data;
    } catch (error) {
      console.error(`Error updating goal ${goalId}:`, error);
      throw error;
    }
  },

  // Delete a goal
  async deleteGoal(goalId) {
    try {
      await apiService.delete(`${GOALS_ENDPOINT}/${goalId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting goal ${goalId}:`, error);
      throw error;
    }
  },

  // Get goals with statistics
  async getGoalsWithStats() {
    try {
      const response = await apiService.get(`${GOALS_ENDPOINT}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching goals with stats:', error);
      throw error;
    }
  }
};

export default goalService;
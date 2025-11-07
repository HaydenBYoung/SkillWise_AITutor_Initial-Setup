import { apiService } from './api';

export const goalsService = {
  // Get all goals for the current user
  async getGoals() {
    return apiService.goals.getAll();
  },

  // Get a single goal by ID
  async getGoal(id) {
    return apiService.goals.getById(id);
  },

  // Create a new goal
  async createGoal(goalData) {
    return apiService.goals.create(goalData);
  },

  // Update an existing goal
  async updateGoal(id, goalData) {
    return apiService.goals.update(id, goalData);
  },

  // Delete a goal
  async deleteGoal(id) {
    return apiService.goals.delete(id);
  },

  // Mark goal as completed
  async markGoalCompleted(id) {
    // This endpoint doesn't exist in the apiService structure, so import the base api
    const api = (await import('./api')).default;
    return api.patch(`/goals/${id}/complete`);
  },

  // Update goal progress
  async updateGoalProgress(id, progress) {
    // This endpoint doesn't exist in the apiService structure, so import the base api
    const api = (await import('./api')).default;
    return api.patch(`/goals/${id}/progress`, { progress });
  },
};

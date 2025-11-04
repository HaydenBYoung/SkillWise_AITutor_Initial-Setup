import apiService from './api.js';

const PROGRESS_ENDPOINT = '/progress';

export const progressService = {
  // Get user's overall progress
  async getUserProgress() {
    try {
      const response = await apiService.get(PROGRESS_ENDPOINT);
      return response.data;
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  },

  // Get progress for a specific goal
  async getGoalProgress(goalId) {
    try {
      const response = await apiService.get(`${PROGRESS_ENDPOINT}/goal/${goalId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching progress for goal ${goalId}:`, error);
      throw error;
    }
  },

  // Get progress analytics/stats
  async getProgressAnalytics() {
    try {
      const response = await apiService.get(`${PROGRESS_ENDPOINT}/analytics`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress analytics:', error);
      throw error;
    }
  },

  // Get activity data for charts
  async getActivityData(timeframe = '7d') {
    try {
      const response = await apiService.get(`${PROGRESS_ENDPOINT}/activity?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      throw error;
    }
  },

  // Get progress by category
  async getProgressByCategory() {
    try {
      const response = await apiService.get(`${PROGRESS_ENDPOINT}/categories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching progress by category:', error);
      throw error;
    }
  },

  // Get completion rate over time
  async getCompletionRate(timeframe = '30d') {
    try {
      const response = await apiService.get(`${PROGRESS_ENDPOINT}/completion-rate?timeframe=${timeframe}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching completion rate:', error);
      throw error;
    }
  },

  // Log a progress event
  async logProgress(progressData) {
    try {
      const response = await apiService.post(`${PROGRESS_ENDPOINT}/log`, progressData);
      return response.data;
    } catch (error) {
      console.error('Error logging progress:', error);
      throw error;
    }
  },

  // Get leaderboard data
  async getLeaderboard() {
    try {
      const response = await apiService.get(`${PROGRESS_ENDPOINT}/leaderboard`);
      return response.data;
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
      throw error;
    }
  }
};

export default progressService;
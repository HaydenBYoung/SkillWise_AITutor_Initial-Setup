import { apiService } from './api.js';

export const progressService = {
  // Get user's overall progress
  async getUserProgress() {
    try {
      const response = await apiService.progress.getAll();
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching user progress:', error);
      throw error;
    }
  },

  // Get activity data for charts
  async getActivityData(timeframe = '30d') {
    try {
      const response = await apiService.progress.getActivity({ timeframe });
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching activity data:', error);
      throw error;
    }
  },

  // Get progress by category
  async getProgressByCategory() {
    try {
      const response = await apiService.progress.getCategories();
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching progress by category:', error);
      throw error;
    }
  },

  // Get achievements and milestones
  async getAchievements() {
    try {
      const response = await apiService.progress.getAchievements();
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching achievements:', error);
      throw error;
    }
  },

  // Get completion timeline
  async getCompletionTimeline(limit = 20) {
    try {
      const response = await apiService.progress.getTimeline({ limit });
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error fetching completion timeline:', error);
      throw error;
    }
  },

  // Legacy methods for backward compatibility
  async getProgressAnalytics() {
    return await this.getUserProgress();
  },

  async getCompletionRate(timeframe = '30d') {
    return await this.getActivityData(timeframe);
  },

  async logProgress(progressData) {
    try {
      const response = await apiService.progress.trackEvent(progressData);
      return {
        success: response.data.success,
        data: response.data.data
      };
    } catch (error) {
      console.error('Error logging progress:', error);
      throw error;
    }
  },

  async getLeaderboard() {
    // This would be implemented as part of Sprint 4
    return {
      success: true,
      data: []
    };
  }
};

export default progressService;
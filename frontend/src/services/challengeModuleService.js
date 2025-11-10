import { apiService } from './api.js';

export const challengeModuleService = {
  // Get all challenge modules for the current user
  async getChallengeModules() {
    try {
      const response = await apiService.challengeModules.getAll();
      console.log('Challenge modules response:', response.data);
      
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching challenge modules:', error);
      throw error;
    }
  },

  // Complete a challenge
  async completeChallenge(goalId, challengeId, answer) {
    try {
      const response = await apiService.challengeModules.complete(goalId, challengeId, answer);
      return response.data;
    } catch (error) {
      console.error('Error completing challenge:', error);
      if (error.response && error.response.data) {
        return {
          success: false,
          message: error.response.data.message || 'Failed to complete challenge'
        };
      }
      return {
        success: false,
        message: 'Network error occurred'
      };
    }
  }
};

export default challengeModuleService;
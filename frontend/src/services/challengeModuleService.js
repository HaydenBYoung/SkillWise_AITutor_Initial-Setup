import { apiService } from './api.js';

export const challengeModuleService = {
  // Get all challenge modules for the current user
  async getChallengeModules() {
    try {
      console.log('🚀 getChallengeModules called');
      const response = await apiService.challengeModules.getAll();
      console.log('📥 Raw response:', response);
      console.log('📦 Response data:', response.data);
      console.log('📊 Data type:', typeof response.data);
      console.log('📋 Is array?', Array.isArray(response.data));
      
      if (response.data) {
        console.log('✅ Challenge modules fetched successfully:', response.data.length, 'modules');
        return {
          success: true,
          data: response.data
        };
      } else {
        console.log('❌ No data in response');
        return {
          success: false,
          data: []
        };
      }
    } catch (error) {
      console.error('💥 Error fetching challenge modules:', error);
      throw error;
    }
  },

  // Complete a challenge
  async completeChallenge(goalId, challengeId, answer) {
    console.log('🚀 challengeModuleService.completeChallenge called with:', { goalId, challengeId, answer });
    
    try {
      console.log('📡 Making API call to apiService.challengeModules.complete...');
      const response = await apiService.challengeModules.complete(goalId, challengeId, answer);
      console.log('📥 Raw API response:', response);
      console.log('📦 Response data:', response.data);
      
      return response.data;
    } catch (error) {
      console.error('💥 Error in challengeModuleService.completeChallenge:', error);
      console.error('Error response:', error.response);
      
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
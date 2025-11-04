import apiService from './api.js';

const CHALLENGES_ENDPOINT = '/challenges';

export const challengeService = {
  // Get all challenges
  async getChallenges() {
    try {
      const response = await apiService.get(CHALLENGES_ENDPOINT);
      return response.data;
    } catch (error) {
      console.error('Error fetching challenges:', error);
      throw error;
    }
  },

  // Get challenges by goal ID
  async getChallengesByGoal(goalId) {
    try {
      const response = await apiService.get(`${CHALLENGES_ENDPOINT}/goal/${goalId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching challenges for goal ${goalId}:`, error);
      throw error;
    }
  },

  // Get a specific challenge by ID
  async getChallengeById(challengeId) {
    try {
      const response = await apiService.get(`${CHALLENGES_ENDPOINT}/${challengeId}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching challenge ${challengeId}:`, error);
      throw error;
    }
  },

  // Create a new challenge
  async createChallenge(challengeData) {
    try {
      const response = await apiService.post(CHALLENGES_ENDPOINT, challengeData);
      return response.data;
    } catch (error) {
      console.error('Error creating challenge:', error);
      throw error;
    }
  },

  // Update an existing challenge
  async updateChallenge(challengeId, challengeData) {
    try {
      const response = await apiService.put(`${CHALLENGES_ENDPOINT}/${challengeId}`, challengeData);
      return response.data;
    } catch (error) {
      console.error(`Error updating challenge ${challengeId}:`, error);
      throw error;
    }
  },

  // Delete a challenge
  async deleteChallenge(challengeId) {
    try {
      await apiService.delete(`${CHALLENGES_ENDPOINT}/${challengeId}`);
      return true;
    } catch (error) {
      console.error(`Error deleting challenge ${challengeId}:`, error);
      throw error;
    }
  },

  // Mark challenge as completed
  async completeChallenge(challengeId) {
    try {
      const response = await apiService.put(`${CHALLENGES_ENDPOINT}/${challengeId}/complete`);
      return response.data;
    } catch (error) {
      console.error(`Error completing challenge ${challengeId}:`, error);
      throw error;
    }
  },

  // Get challenges with filtering options
  async getChallengesFiltered(filters = {}) {
    try {
      const queryParams = new URLSearchParams(filters).toString();
      const url = queryParams ? `${CHALLENGES_ENDPOINT}?${queryParams}` : CHALLENGES_ENDPOINT;
      const response = await apiService.get(url);
      return response.data;
    } catch (error) {
      console.error('Error fetching filtered challenges:', error);
      throw error;
    }
  }
};

export default challengeService;
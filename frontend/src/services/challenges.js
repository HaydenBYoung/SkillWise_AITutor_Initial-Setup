import { apiService } from './api';

export const challengesService = {
  // Get all challenges with optional filtering
  async getChallenges(filters = {}) {
    return apiService.challenges.getAll(filters);
  },

  // Get a single challenge by ID
  async getChallenge(id) {
    return apiService.challenges.getById(id);
  },

  // Get challenges by category
  async getChallengesByCategory(category) {
    return apiService.challenges.getByCategory(category);
  },

  // Get challenges linked to a specific goal
  async getChallengesByGoalId(goalId) {
    return apiService.challenges.getByGoalId(goalId);
  },

  // Get user's created challenges
  async getUserChallenges() {
    return apiService.challenges.getUserChallenges();
  },

  // Create a new challenge
  async createChallenge(challengeData) {
    return apiService.challenges.create(challengeData);
  },

  // Update an existing challenge
  async updateChallenge(id, challengeData) {
    return apiService.challenges.update(id, challengeData);
  },

  // Delete a challenge
  async deleteChallenge(id) {
    return apiService.challenges.delete(id);
  },
};

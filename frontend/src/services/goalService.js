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
      
      // Add progress calculation for each goal based on mock challenge completion
      const goalsWithProgress = goals.map(goal => {
        // Mock progress calculation based on goal category
        let progress = 0;
        let totalChallenges = 10; // default
        
        if (goal.category === 'programming') {
          // Simulate 2 modules with random completion
          const module1Progress = Math.floor(Math.random() * 11); // 0-10 challenges
          const module2Progress = Math.floor(Math.random() * 9); // 0-8 challenges
          const totalCompleted = module1Progress + module2Progress;
          totalChallenges = 18; // 10 + 8
          progress = Math.round((totalCompleted / totalChallenges) * 100);
        } else if (goal.category === 'web development') {
          // Simulate 2 modules with random completion
          const module1Progress = Math.floor(Math.random() * 13); // 0-12 challenges
          const module2Progress = Math.floor(Math.random() * 16); // 0-15 challenges
          const totalCompleted = module1Progress + module2Progress;
          totalChallenges = 27; // 12 + 15
          progress = Math.round((totalCompleted / totalChallenges) * 100);
        } else if (goal.category === 'data science') {
          // Simulate 1 module with random completion
          const moduleProgress = Math.floor(Math.random() * 15); // 0-14 challenges
          totalChallenges = 14;
          progress = Math.round((moduleProgress / totalChallenges) * 100);
        } else if (goal.category === 'databases') {
          // Simulate 1 module with random completion
          const moduleProgress = Math.floor(Math.random() * 17); // 0-16 challenges
          totalChallenges = 16;
          progress = Math.round((moduleProgress / totalChallenges) * 100);
        } else {
          // Generic progress for other categories
          const moduleProgress = Math.floor(Math.random() * 11); // 0-10 challenges
          totalChallenges = 10;
          progress = Math.round((moduleProgress / totalChallenges) * 100);
        }
        
        const completedChallenges = Math.floor((progress / 100) * totalChallenges);
        
        return {
          ...goal,
          progress: Math.min(progress, 100), // Cap at 100%
          totalChallenges,
          completedChallenges
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
      
      // Add initial progress data to new goal
      const goalWithProgress = {
        ...response.data,
        progress: 0,
        totalChallenges: goalData.category === 'programming' ? 18 : 
                        goalData.category === 'web development' ? 27 :
                        goalData.category === 'data science' ? 14 :
                        goalData.category === 'databases' ? 16 : 10,
        completedChallenges: 0
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
      const response = await apiService.goals.update(goalId, { is_completed: isCompleted });
      return response.data;
    } catch (error) {
      console.error(`Error toggling goal completion ${goalId}:`, error);
      throw error;
    }
  }
};

export default goalService;
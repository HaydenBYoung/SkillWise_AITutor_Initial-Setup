const db = require('../database/connection');

const challengeModuleService = {
  // Get challenge modules for a user with available challenges for each category
  getChallengeModulesForUser: async (userId) => {
    try {
      // Get all user goals with their categories
      const goalsQuery = `
        SELECT 
          g.id,
          g.title,
          g.category,
          g.difficulty_level,
          g.earned_points
        FROM goals g
        WHERE g.user_id = $1
        ORDER BY g.created_at DESC
      `;
      
      const goalsResult = await db.query(goalsQuery, [userId]);
      const goals = goalsResult.rows;
      
      // For each goal, create a challenge module with 3 challenges (easy, medium, hard)
      const modules = [];
      
      for (const goal of goals) {
        // Create 3 simple temp challenges for this goal
        const challenges = [
          {
            id: `temp-easy-${goal.id}`,
            title: `${goal.category} Basics`,
            description: `Learn the fundamentals of ${goal.category}`,
            difficulty_level: 'easy',
            points_reward: 1,
            category: goal.category,
            status: 'todo'
          },
          {
            id: `temp-medium-${goal.id}`,
            title: `${goal.category} Intermediate`, 
            description: `Take your ${goal.category} skills to the next level`,
            difficulty_level: 'medium',
            points_reward: 2,
            category: goal.category,
            status: 'todo'
          },
          {
            id: `temp-hard-${goal.id}`,
            title: `${goal.category} Advanced`,
            description: `Master advanced ${goal.category} concepts`,
            difficulty_level: 'hard',
            points_reward: 3,
            category: goal.category,
            status: 'todo'
          }
        ];

        // Calculate module progress
        const completedChallenges = 0; // Always 0 for temp challenges
        const totalChallenges = 3;
        
        // Get category emoji
        const getCategoryEmoji = (category) => {
          switch (category?.toLowerCase()) {
            case 'programming': return '💻';
            case 'web development': return '🌐';
            case 'data science': return '📊';
            case 'databases': return '🗄️';
            default: return '📚';
          }
        };

        const module = {
          id: `goal-${goal.id}`,
          goalId: goal.id,
          title: goal.title,
          category: goal.category,
          logo: getCategoryEmoji(goal.category),
          totalChallenges,
          completedChallenges,
          earnedPoints: goal.earned_points || 0, // Use actual earned_points from database
          targetPoints: 6, // 1 + 2 + 3 = 6 points total per module
          challenges
        };
        
        modules.push(module);
      }
      
      return modules;
    } catch (error) {
      console.error('Error in getChallengeModulesForUser:', error);
      throw new Error(`Error retrieving challenge modules: ${error.message}`);
    }
  },

  // Complete a challenge in a module
  completeChallenge: async (userId, goalId, challengeId, userAnswer) => {
    try {
      console.log('🎯 Processing challenge completion:', { userId, goalId, challengeId, userAnswer });
      
      // Determine points earned based on difficulty
      let pointsEarned = 1;
      if (challengeId.includes('medium')) pointsEarned = 2;
      else if (challengeId.includes('hard')) pointsEarned = 3;
      
      console.log('💰 Points to be earned:', pointsEarned);
      
      // Add points to the goal's earned_points
      const updateQuery = `
        UPDATE goals 
        SET earned_points = COALESCE(earned_points, 0) + $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2 AND user_id = $3
        RETURNING earned_points, points_reward, title
      `;
      
      console.log('🔄 Executing SQL query:', updateQuery);
      console.log('🔄 Query params:', [pointsEarned, goalId, userId]);
      
      const updateResult = await db.query(updateQuery, [pointsEarned, goalId, userId]);
      
      console.log('📊 Update result:', updateResult.rows);
      
      if (updateResult.rows.length === 0) {
        throw new Error('Goal not found or does not belong to user');
      }
      
      const goal = updateResult.rows[0];
      console.log('✅ Goal updated:', goal);
      
      return {
        success: true,
        message: `🎉 Congratulations! You earned ${pointsEarned} points for "${goal.title}"!`,
        pointsEarned,
        goalProgress: {
          earned: goal.earned_points,
          target: goal.points_reward
        }
      };
    } catch (error) {
      console.error('❌ Error completing challenge:', error);
      console.error('❌ Error stack:', error.stack);
      console.error('❌ Error message:', error.message);
      return {
        success: false,
        message: "An error occurred while completing the challenge."
      };
    }
  }
};

module.exports = challengeModuleService;
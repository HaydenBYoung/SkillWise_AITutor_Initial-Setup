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
          CASE 
            WHEN g.difficulty_level = 'easy' THEN 20
            WHEN g.difficulty_level = 'medium' THEN 35
            WHEN g.difficulty_level = 'hard' THEN 50
            ELSE 35
          END as target_points,
          COALESCE(SUM(c.points_reward) FILTER (WHERE gc.status = 'completed'), 0) as earned_points,
          g.progress_percentage
        FROM goals g
        LEFT JOIN goal_challenges gc ON g.id = gc.goal_id
        LEFT JOIN challenges c ON gc.challenge_id = c.id
        WHERE g.user_id = $1
        GROUP BY g.id
        ORDER BY g.created_at DESC
      `;
      
      const goalsResult = await db.query(goalsQuery, [userId]);
      const goals = goalsResult.rows;
      
      // For each goal, create a challenge module with 3 challenges (easy, medium, hard)
      const modules = [];
      
      for (const goal of goals) {
        // Get challenges for this category (3 per category: easy, medium, hard)
        const challengesQuery = `
          SELECT c.*, 
                 gc.status as user_status,
                 gc.id as goal_challenge_id
          FROM challenges c
          LEFT JOIN goal_challenges gc ON c.id = gc.challenge_id 
                                       AND gc.goal_id = $1 
                                       AND gc.user_id = $2
          WHERE LOWER(c.category) = LOWER($3)
          ORDER BY 
            CASE c.difficulty_level 
              WHEN 'easy' THEN 1 
              WHEN 'medium' THEN 2 
              WHEN 'hard' THEN 3 
            END
          LIMIT 3
        `;
        
        const challengesResult = await db.query(challengesQuery, [goal.id, userId, goal.category]);
        const challenges = challengesResult.rows.map(challenge => ({
          ...challenge,
          status: challenge.user_status || 'todo'
        }));
        
        // Calculate module progress
        const completedChallenges = challenges.filter(c => c.status === 'completed').length;
        const totalChallenges = challenges.length;
        const earnedModulePoints = challenges
          .filter(c => c.status === 'completed')
          .reduce((sum, c) => sum + c.points_reward, 0);
        
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
          earnedPoints: earnedModulePoints,
          targetPoints: 6, // 1 + 2 + 3 = 6 points total per module
          challenges,
          goalProgress: {
            earned: goal.earned_points,
            target: goal.target_points,
            percentage: goal.progress_percentage
          }
        };
        
        modules.push(module);
      }
      
      return modules;
    } catch (error) {
      throw new Error(`Error retrieving challenge modules: ${error.message}`);
    }
  },

  // Complete a challenge in a module
  completeChallenge: async (userId, goalId, challengeId, userAnswer) => {
    try {
      // Validate the answer (for now, just check if it's "4")
      if (userAnswer !== "4") {
        return {
          success: false,
          message: "Incorrect answer. Please try again!"
        };
      }

      // Check if this challenge is already linked to the goal
      const existingQuery = `
        SELECT id, status FROM goal_challenges 
        WHERE goal_id = $1 AND challenge_id = $2 AND user_id = $3
      `;
      
      const existingResult = await db.query(existingQuery, [goalId, challengeId, userId]);
      
      if (existingResult.rows.length === 0) {
        // Add the challenge to the goal first
        const addQuery = `
          INSERT INTO goal_challenges (goal_id, challenge_id, user_id, status)
          VALUES ($1, $2, $3, 'completed')
          RETURNING *
        `;
        
        await db.query(addQuery, [goalId, challengeId, userId]);
      } else {
        // Update existing challenge status
        const updateQuery = `
          UPDATE goal_challenges 
          SET status = 'completed', completed_at = NOW(), updated_at = NOW()
          WHERE goal_id = $1 AND challenge_id = $2 AND user_id = $3
          RETURNING *
        `;
        
        await db.query(updateQuery, [goalId, challengeId, userId]);
      }

      // Get the challenge points
      const challengeQuery = `SELECT points_reward FROM challenges WHERE id = $1`;
      const challengeResult = await db.query(challengeQuery, [challengeId]);
      const pointsEarned = challengeResult.rows[0]?.points_reward || 0;

      return {
        success: true,
        message: `Congratulations! You earned ${pointsEarned} points!`,
        pointsEarned
      };
      
    } catch (error) {
      console.error('Error completing challenge:', error);
      return {
        success: false,
        message: "An error occurred while completing the challenge."
      };
    }
  }
};

module.exports = challengeModuleService;
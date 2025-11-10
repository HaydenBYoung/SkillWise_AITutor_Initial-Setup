const db = require('../database/connection');

const progressService = {
  // Get comprehensive user progress statistics
  getUserProgress: async (userId) => {
    try {
      const query = `
        WITH goal_stats AS (
          SELECT 
            COUNT(*) as total_goals,
            COUNT(*) FILTER (WHERE is_completed = true) as completed_goals,
            COALESCE(SUM(
              CASE 
                WHEN difficulty_level = 'easy' THEN 20
                WHEN difficulty_level = 'medium' THEN 35
                WHEN difficulty_level = 'hard' THEN 50
                ELSE 35
              END
            ), 0) as total_target_points,
            COALESCE(SUM(earned_points), 0) as total_earned_points,
            -- Estimate completed challenges based on earned points
            -- Each challenge gives 1-3 points, so we estimate based on total earned points
            COALESCE(SUM(earned_points), 0) as estimated_completed_challenges,
            -- Total possible challenges (3 per goal: easy=1pt, medium=2pts, hard=3pts)
            COUNT(*) * 3 as total_possible_challenges
          FROM goals 
          WHERE user_id = $1
        )
        SELECT 
          gs.total_goals,
          gs.completed_goals,
          gs.total_target_points,
          gs.total_earned_points as earned_points,
          gs.estimated_completed_challenges as completed_challenges,
          gs.total_possible_challenges as total_challenges,
          gs.total_goals as active_goals,
          COALESCE(
            CASE 
              WHEN gs.total_goals > 0 THEN ROUND((gs.completed_goals::DECIMAL / gs.total_goals) * 100)
              ELSE 0 
            END, 0
          ) as completion_rate,
          COALESCE(
            CASE 
              WHEN gs.total_goals > 0 THEN ROUND((gs.completed_goals::DECIMAL / gs.total_goals) * 100)
              ELSE 0 
            END, 0
          ) as goal_completion_rate,
          COALESCE(
            CASE 
              WHEN gs.total_possible_challenges > 0 THEN ROUND((gs.estimated_completed_challenges::DECIMAL / gs.total_possible_challenges) * 100)
              ELSE 0 
            END, 0
          ) as challenge_completion_rate,
          1 as active_days_last_7,
          1 as active_days_last_30
        FROM goal_stats gs
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows[0] || {};
    } catch (error) {
      throw new Error(`Error retrieving user progress: ${error.message}`);
    }
  },

  // Get activity timeline for charts
  getActivityData: async (userId, timeframe = '30d') => {
    try {
      // Map frontend timeframes to backend format
      let days;
      switch (timeframe) {
        case 'week':
        case '7d':
          days = 7;
          break;
        case 'month':
        case '30d':
          days = 30;
          break;
        case 'quarter':
        case '90d':
          days = 90;
          break;
        case 'year':
        case '365d':
          days = 365;
          break;
        default:
          days = 30;
      }
      
      const query = `
        WITH date_series AS (
          SELECT 
            generate_series(
              CURRENT_DATE - INTERVAL '${days - 1} days',
              CURRENT_DATE,
              INTERVAL '1 day'
            )::DATE as date
        ),
        daily_activity AS (
          SELECT 
            DATE(g.updated_at) as activity_date,
            COUNT(*) as goals_worked_on,
            COALESCE(SUM(g.earned_points), 0) as points_earned
          FROM goals g
          WHERE g.user_id = $1 
            AND DATE(g.updated_at) >= CURRENT_DATE - INTERVAL '${days - 1} days'
            AND g.earned_points > 0
          GROUP BY DATE(g.updated_at)
        )
        SELECT 
          ds.date,
          COALESCE(da.goals_worked_on, 0) as challenges_completed,
          COALESCE(da.points_earned, 0) as points_earned
        FROM date_series ds
        LEFT JOIN daily_activity da ON ds.date = da.activity_date
        ORDER BY ds.date
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error retrieving activity data: ${error.message}`);
    }
  },

  // Get progress by category
  getProgressByCategory: async (userId) => {
    try {
      const query = `
        SELECT 
          g.category,
          COUNT(g.id) as total_goals,
          COUNT(g.id) FILTER (WHERE g.is_completed = true) as completed_goals,
          COALESCE(SUM(g.earned_points), 0) as earned_points,
          COALESCE(SUM(
            CASE 
              WHEN g.difficulty_level = 'easy' THEN 20
              WHEN g.difficulty_level = 'medium' THEN 35
              WHEN g.difficulty_level = 'hard' THEN 50
              ELSE 35
            END
          ), 0) as target_points
        FROM goals g
        WHERE g.user_id = $1
        GROUP BY g.category
        ORDER BY earned_points DESC
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows.map(row => ({
        ...row,
        completion_percentage: row.total_goals > 0 ? Math.round((row.completed_goals / row.total_goals) * 100) : 0,
        points_percentage: row.target_points > 0 ? Math.round((row.earned_points / row.target_points) * 100) : 0
      }));
    } catch (error) {
      throw new Error(`Error retrieving category progress: ${error.message}`);
    }
  },

  // Get recent achievements and milestones
  getAchievements: async (userId) => {
    try {
      const query = `
        WITH milestones AS (
          -- Points milestones
          SELECT 
            'points' as achievement_type,
            'Points Milestone' as title,
            CASE 
              WHEN total_points >= 1000 THEN 'Points Master: 1000+ points earned!'
              WHEN total_points >= 500 THEN 'Points Expert: 500+ points earned!'
              WHEN total_points >= 100 THEN 'Points Achiever: 100+ points earned!'
              WHEN total_points >= 25 THEN 'Points Beginner: 25+ points earned!'
              WHEN total_points >= 10 THEN 'First Steps: 10+ points earned!'
              WHEN total_points >= 5 THEN 'Getting Started: 5+ points earned!'
              WHEN total_points >= 1 THEN 'Welcome: First points earned!'
              ELSE 'Getting Started'
            END as description,
            total_points as value,
            CURRENT_TIMESTAMP as achieved_at
          FROM (
            SELECT COALESCE(SUM(c.points_reward) FILTER (WHERE gc.status = 'completed'), 0) as total_points
            FROM goal_challenges gc
            JOIN challenges c ON gc.challenge_id = c.id
            WHERE gc.user_id = $1
          ) points_data
          WHERE total_points >= 1
          
          UNION ALL
          
          -- Challenge completion milestones  
          SELECT 
            'challenges' as achievement_type,
            'Challenge Milestone' as title,
            CASE 
              WHEN completed_challenges >= 20 THEN 'Challenge Master: 20+ challenges completed!'
              WHEN completed_challenges >= 10 THEN 'Challenge Expert: 10+ challenges completed!'
              WHEN completed_challenges >= 5 THEN 'Challenge Achiever: 5+ challenges completed!'
              WHEN completed_challenges >= 3 THEN 'Getting Active: 3+ challenges completed!'
              WHEN completed_challenges >= 1 THEN 'First Challenge: Completed your first challenge!'
              ELSE 'Challenge Starter'
            END as description,
            completed_challenges as value,
            CURRENT_TIMESTAMP as achieved_at
          FROM (
            SELECT COUNT(*) FILTER (WHERE gc.status = 'completed') as completed_challenges
            FROM goal_challenges gc 
            WHERE gc.user_id = $1
          ) challenges_data
          WHERE completed_challenges >= 1
          
          UNION ALL
          
          -- Goals completed milestones
          SELECT 
            'goals' as achievement_type,
            'Goals Milestone' as title,
            CASE 
              WHEN completed_goals >= 10 THEN 'Goal Master: 10+ goals completed!'
              WHEN completed_goals >= 5 THEN 'Goal Achiever: 5+ goals completed!'
              WHEN completed_goals >= 1 THEN 'First Goal: Completed your first goal!'
              ELSE 'Goal Starter'
            END as description,
            completed_goals as value,
            CURRENT_TIMESTAMP as achieved_at
          FROM (
            SELECT COUNT(*) FILTER (WHERE is_completed = true) as completed_goals
            FROM goals 
            WHERE user_id = $1
          ) goals_data
          WHERE completed_goals >= 1
          
          UNION ALL
          
          -- Challenge streak milestones
          SELECT 
            'streak' as achievement_type,
            'Activity Milestone' as title,
            CASE 
              WHEN active_days >= 30 THEN 'Consistency Master: 30+ active days!'
              WHEN active_days >= 14 THEN 'Two Week Streak: 14+ active days!'
              WHEN active_days >= 7 THEN 'One Week Streak: 7+ active days!'
              WHEN active_days >= 3 THEN 'Getting Consistent: 3+ active days!'
              WHEN active_days >= 1 THEN 'First Day: Started your learning journey!'
              ELSE 'Starting Out'
            END as description,
            active_days as value,
            CURRENT_TIMESTAMP as achieved_at
          FROM (
            SELECT COUNT(DISTINCT DATE(g.updated_at)) as active_days
            FROM goals g
            WHERE g.user_id = $1 
              AND g.updated_at >= CURRENT_DATE - INTERVAL '30 days'
              AND g.earned_points > 0
          ) streak_data
          WHERE active_days >= 1
        )
        SELECT * FROM milestones
        ORDER BY achieved_at DESC
        LIMIT 10
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error retrieving achievements: ${error.message}`);
    }
  },

  // Get completion timeline
  getCompletionTimeline: async (userId, limit = 20) => {
    try {
      const query = `
        SELECT 
          'goal' as type,
          g.title,
          g.description,
          g.difficulty_level,
          g.earned_points as points,
          g.title as goal_title,
          g.category,
          g.updated_at as completed_at
        FROM goals g
        WHERE g.user_id = $1 AND g.earned_points > 0
        ORDER BY g.updated_at DESC
        LIMIT $2
      `;
      
      const result = await db.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      throw new Error(`Error retrieving completion timeline: ${error.message}`);
    }
  },

  // Legacy methods for backward compatibility
  calculateOverallProgress: async (userId) => {
    return await progressService.getUserProgress(userId);
  },

  trackEvent: async (userId, eventType, eventData) => {
    // This could be implemented if needed for detailed event tracking
    console.log(`Event tracked for user ${userId}: ${eventType}`, eventData);
    return { success: true };
  },

  generateAnalytics: async (userId, timeframe) => {
    return await progressService.getActivityData(userId, timeframe);
  },

  checkMilestones: async (userId) => {
    return await progressService.getAchievements(userId);
  },
};

module.exports = progressService;

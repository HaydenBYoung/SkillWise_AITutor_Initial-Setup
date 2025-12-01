const { pool } = require('../database/connection');
const {
  calculateLevel,
  calculatePercentile,
  updateStreak,
} = require('../utils/pointSystem');

const leaderboardService = {
  /**
   * Get global leaderboard with optional filtering
   * @param {string} timeframe - 'daily', 'weekly', 'monthly', 'all-time'
   * @param {string} category - Filter by goal category (optional)
   * @param {number} limit - Number of results to return
   * @param {number} offset - Pagination offset
   */
  getLeaderboard: async (
    timeframe = 'all-time',
    category = null,
    limit = 50,
    offset = 0
  ) => {
    try {
      let query;
      let params;

      if (timeframe === 'all-time') {
        // Use user_statistics for all-time rankings
        query = `
          SELECT 
            us.user_id,
            CONCAT(u.first_name, ' ', u.last_name) as full_name,
            us.total_points,
            us.level,
            us.total_challenges_completed,
            us.total_goals_completed,
            us.current_streak_days,
            us.rank_position,
            ROW_NUMBER() OVER (ORDER BY us.total_points DESC, us.total_challenges_completed DESC) as rank
          FROM user_statistics us
          JOIN users u ON us.user_id = u.id
          WHERE u.is_active = true
          ORDER BY us.total_points DESC, us.total_challenges_completed DESC
          LIMIT $1 OFFSET $2
        `;
        params = [limit, offset];
      } else {
        // Use leaderboard table for time-based rankings
        const { periodStart, periodEnd } = getPeriodDates(timeframe);

        query = `
          SELECT 
            l.user_id,
            CONCAT(u.first_name, ' ', u.last_name) as full_name,
            l.points as total_points,
            l.challenges_completed as total_challenges_completed,
            l.goals_completed as total_goals_completed,
            l.rank_position as rank,
            us.level,
            us.current_streak_days
          FROM leaderboard l
          JOIN users u ON l.user_id = u.id
          JOIN user_statistics us ON l.user_id = us.user_id
          WHERE l.timeframe = $1 
            AND l.period_start = $2 
            AND l.period_end = $3
            AND u.is_active = true
          ORDER BY l.rank_position ASC
          LIMIT $4 OFFSET $5
        `;
        params = [timeframe, periodStart, periodEnd, limit, offset];
      }

      const result = await pool.query(query, params);

      // Get total count
      const countQuery =
        timeframe === 'all-time'
          ? 'SELECT COUNT(*) FROM user_statistics us JOIN users u ON us.user_id = u.id WHERE u.is_active = true'
          : `SELECT COUNT(*) FROM leaderboard l JOIN users u ON l.user_id = u.id 
           WHERE l.timeframe = $1 AND u.is_active = true`;
      const countParams = timeframe === 'all-time' ? [] : [timeframe];
      const countResult = await pool.query(countQuery, countParams);
      const totalUsers = parseInt(countResult.rows[0].count);

      return {
        leaderboard: result.rows.map((row, index) => ({
          rank: offset + index + 1,
          userId: row.user_id,
          fullName: row.full_name,
          points: row.total_points,
          level: row.level,
          challengesCompleted: row.total_challenges_completed,
          goalsCompleted: row.total_goals_completed,
          currentStreak: row.current_streak_days,
          percentile: calculatePercentile(offset + index + 1, totalUsers),
        })),
        totalUsers,
        timeframe,
        pagination: {
          limit,
          offset,
          hasMore: offset + limit < totalUsers,
        },
      };
    } catch (error) {
      console.error('Error getting leaderboard:', error);
      throw error;
    }
  },

  /**
   * Get user's rank and surrounding players
   * @param {number} userId - User ID
   * @param {string} timeframe - Timeframe for ranking
   */
  getUserRank: async (userId, timeframe = 'all-time') => {
    try {
      let rankQuery;
      let statsQuery;
      let params;

      if (timeframe === 'all-time') {
        rankQuery = `
          WITH ranked_users AS (
            SELECT 
              us.user_id,
              us.total_points,
              ROW_NUMBER() OVER (ORDER BY us.total_points DESC, us.total_challenges_completed DESC) as rank
            FROM user_statistics us
            JOIN users u ON us.user_id = u.id
            WHERE u.is_active = true
          )
          SELECT rank FROM ranked_users WHERE user_id = $1
        `;

        statsQuery = `
          SELECT 
            us.*,
            CONCAT(u.first_name, ' ', u.last_name) as full_name,
            (SELECT COUNT(*) FROM user_statistics us2 
             JOIN users u2 ON us2.user_id = u2.id 
             WHERE u2.is_active = true) as total_users
          FROM user_statistics us
          JOIN users u ON us.user_id = u.id
          WHERE us.user_id = $1
        `;
        params = [userId];
      } else {
        const { periodStart, periodEnd } = getPeriodDates(timeframe);

        rankQuery = `
          SELECT rank_position as rank
          FROM leaderboard
          WHERE user_id = $1 AND timeframe = $2 
            AND period_start = $3 AND period_end = $4
        `;

        statsQuery = `
          SELECT 
            l.points as total_points,
            l.challenges_completed as total_challenges_completed,
            l.goals_completed as total_goals_completed,
            l.rank_position,
            CONCAT(u.first_name, ' ', u.last_name) as full_name,
            us.level,
            us.current_streak_days,
            (SELECT COUNT(*) FROM leaderboard WHERE timeframe = $2) as total_users
          FROM leaderboard l
          JOIN users u ON l.user_id = u.id
          JOIN user_statistics us ON l.user_id = us.user_id
          WHERE l.user_id = $1 AND l.timeframe = $2
            AND l.period_start = $3 AND l.period_end = $4
        `;
        params = [userId, timeframe, periodStart, periodEnd];
      }

      const rankResult = await pool.query(rankQuery, params);
      const statsResult = await pool.query(statsQuery, params);

      if (statsResult.rows.length === 0) {
        return null;
      }

      const stats = statsResult.rows[0];
      const rank = rankResult.rows.length > 0 ? rankResult.rows[0].rank : null;
      const totalUsers = parseInt(stats.total_users);

      return {
        userId,
        fullName: stats.full_name,
        rank,
        points: stats.total_points,
        level: stats.level,
        challengesCompleted: stats.total_challenges_completed,
        goalsCompleted: stats.total_goals_completed,
        currentStreak: stats.current_streak_days,
        percentile: rank ? calculatePercentile(rank, totalUsers) : 0,
        totalUsers,
      };
    } catch (error) {
      console.error('Error getting user rank:', error);
      throw error;
    }
  },

  /**
   * Update user points and statistics
   * @param {number} userId - User ID
   * @param {number} points - Points to add
   * @param {string} reason - Reason for points (for logging)
   */
  updateUserPoints: async (userId, points, reason = 'activity') => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Get current stats
      const currentStatsQuery = `
        SELECT total_points, level, current_streak_days, last_activity_date
        FROM user_statistics
        WHERE user_id = $1
      `;
      const currentStats = await client.query(currentStatsQuery, [userId]);

      let newTotalPoints = points;
      let streakInfo = { currentStreak: 1, streakBonus: 0 };

      if (currentStats.rows.length === 0) {
        // Create user statistics if doesn't exist
        const insertQuery = `
          INSERT INTO user_statistics (user_id, total_points, last_activity_date, current_streak_days, level)
          VALUES ($1, $2, CURRENT_DATE, 1, 1)
          RETURNING total_points, level, current_streak_days
        `;
        const insertResult = await client.query(insertQuery, [userId, points]);

        await client.query('COMMIT');
        return {
          total_points: insertResult.rows[0].total_points,
          level: insertResult.rows[0].level,
          current_streak: insertResult.rows[0].current_streak_days,
          levelInfo: calculateLevel(insertResult.rows[0].total_points),
        };
      }

      // Calculate streak update
      const lastActivityDate = currentStats.rows[0].last_activity_date;
      const currentStreak = currentStats.rows[0].current_streak_days || 0;
      streakInfo = updateStreak(lastActivityDate, currentStreak);

      // Add streak bonus to points if new streak milestone
      newTotalPoints =
        currentStats.rows[0].total_points + points + streakInfo.streakBonus;

      // Update user statistics
      const updateQuery = `
        UPDATE user_statistics
        SET 
          total_points = $1,
          current_streak_days = $2,
          longest_streak_days = GREATEST(longest_streak_days, $2),
          last_activity_date = CURRENT_DATE,
          updated_at = CURRENT_TIMESTAMP
        WHERE user_id = $3
        RETURNING total_points, level, current_streak_days
      `;
      const result = await client.query(updateQuery, [
        newTotalPoints,
        streakInfo.currentStreak,
        userId,
      ]);

      const levelInfo = calculateLevel(newTotalPoints);

      // Update level if changed
      if (levelInfo.level !== result.rows[0].level) {
        await client.query(
          'UPDATE user_statistics SET level = $1 WHERE user_id = $2',
          [levelInfo.level, userId]
        );
        console.log(
          `🎉 User ${userId} leveled up to level ${levelInfo.level}!`
        );
      }

      // Log streak info
      if (streakInfo.isNewStreak) {
        console.log(
          `🔥 User ${userId} streak: ${streakInfo.currentStreak} days (bonus: ${streakInfo.streakBonus} points)`
        );
      }

      await client.query('COMMIT');

      return {
        total_points: newTotalPoints,
        level: levelInfo.level,
        current_streak: streakInfo.currentStreak,
        streak_bonus: streakInfo.streakBonus,
        levelInfo,
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating user points:', error);
      throw error;
    } finally {
      client.release();
    }
  },

  /**
   * Recalculate all user rankings
   * Should be run periodically (e.g., daily cron job)
   */
  recalculateRankings: async (timeframe = 'all-time') => {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      if (timeframe === 'all-time') {
        // Update rank_position in user_statistics
        const updateQuery = `
          WITH ranked_users AS (
            SELECT 
              user_id,
              ROW_NUMBER() OVER (ORDER BY total_points DESC, total_challenges_completed DESC) as new_rank
            FROM user_statistics
          )
          UPDATE user_statistics us
          SET rank_position = ru.new_rank
          FROM ranked_users ru
          WHERE us.user_id = ru.user_id
        `;
        await client.query(updateQuery);
      } else {
        // Create/update leaderboard entries for timeframe
        const { periodStart, periodEnd } = getPeriodDates(timeframe);

        // Calculate period-specific points from progress_events
        const insertQuery = `
          INSERT INTO leaderboard (user_id, timeframe, rank_position, points, challenges_completed, goals_completed, period_start, period_end)
          SELECT 
            pe.user_id,
            $1 as timeframe,
            ROW_NUMBER() OVER (ORDER BY SUM(pe.points_earned) DESC) as rank_position,
            COALESCE(SUM(pe.points_earned), 0) as points,
            COUNT(DISTINCT CASE WHEN pe.event_type = 'challenge_completed' THEN pe.related_id END) as challenges_completed,
            COUNT(DISTINCT CASE WHEN pe.event_type = 'goal_completed' THEN pe.related_id END) as goals_completed,
            $2 as period_start,
            $3 as period_end
          FROM progress_events pe
          WHERE pe.event_date >= $2 AND pe.event_date <= $3
          GROUP BY pe.user_id
          ON CONFLICT (user_id, timeframe, period_start) 
          DO UPDATE SET
            rank_position = EXCLUDED.rank_position,
            points = EXCLUDED.points,
            challenges_completed = EXCLUDED.challenges_completed,
            goals_completed = EXCLUDED.goals_completed,
            updated_at = CURRENT_TIMESTAMP
        `;
        await client.query(insertQuery, [timeframe, periodStart, periodEnd]);
      }

      await client.query('COMMIT');
      return { success: true, timeframe };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error recalculating rankings:', error);
      throw error;
    } finally {
      client.release();
    }
  },
};

/**
 * Helper function to get period start/end dates
 */
function getPeriodDates(timeframe) {
  const now = new Date();
  let periodStart, periodEnd;

  switch (timeframe) {
    case 'daily':
      periodStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 1);
      break;
    case 'weekly':
      const dayOfWeek = now.getDay();
      periodStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - dayOfWeek
      );
      periodEnd = new Date(periodStart);
      periodEnd.setDate(periodEnd.getDate() + 7);
      break;
    case 'monthly':
      periodStart = new Date(now.getFullYear(), now.getMonth(), 1);
      periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      break;
    default:
      periodStart = new Date(2024, 0, 1);
      periodEnd = new Date(2100, 0, 1);
  }

  return {
    periodStart: periodStart.toISOString().split('T')[0],
    periodEnd: periodEnd.toISOString().split('T')[0],
  };
}

module.exports = leaderboardService;

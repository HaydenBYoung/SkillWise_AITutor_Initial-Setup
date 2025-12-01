// Basic progress tracking and analytics helpers built on Progress model
const Progress = require('../models/Progress');

const progressService = {
  // Calculate a lightweight overview used by frontend charts
  calculateOverallProgress: async (userId) => {
    if (!userId) throw new Error('User ID required');

    // Get recent progress rows and aggregated stats
    const rows = await Progress.findByUserId(userId);
    const stats = await Progress.getUserStats(userId);

    // Get database connection for challenge titles
    const db = require('../database/connection');
    
    // Recent activity: map last 10 events with actual challenge titles
    const recentActivity = await Promise.all(
      (rows || []).slice(0, 10).map(async (r) => {
        let title = 'Activity';
        if (r.challenge_id) {
          const challengeResult = await db.query(
            'SELECT title FROM challenges WHERE id = $1',
            [r.challenge_id]
          );
          title = challengeResult.rows[0]?.title || `Challenge ${r.challenge_id}`;
        }
        
        return {
          id: r.id,
          type: r.completed ? 'challenge_completed' : 'challenge_attempt',
          title,
          points: r.points_earned || 0,
          progress: r.completed ? 100 : 0,
          timestamp: r.created_at || r.updated_at || new Date().toISOString(),
        };
      })
    );

    // Weekly progress: simple last-7-days points bucket (best-effort)
    const today = new Date();
    const weekly = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dayStr = d.toISOString().slice(0, 10);
      // sum points for that day
      const dayPoints = (rows || [])
        .filter((r) => (r.created_at || '').slice(0, 10) === dayStr)
        .reduce((s, r) => s + (r.points_earned || 0), 0);
      weekly.push({
        day: d.toLocaleDateString(undefined, { weekday: 'short' }),
        points: dayPoints,
        date: dayStr,
      });
    }

    // Skill breakdown: not available from Progress table, return empty placeholder
    const skillBreakdown = [];

    // Get completed goals count (only count goals that are marked as completed)
    const completedGoalsResult = await db.query(
      'SELECT COUNT(*) as count FROM goals WHERE user_id = $1 AND is_completed = true',
      [userId]
    );
    const completedGoalsCount = parseInt(completedGoalsResult.rows[0]?.count) || 0;

    const overall = {
      totalPoints: Number(stats.total_points) || 0,
      level: Math.floor((Number(stats.total_points) || 0) / 100) + 1,
      experiencePoints: Number(stats.total_points) || 0,
      nextLevelXP:
        (Math.floor((Number(stats.total_points) || 0) / 100) + 1) * 100,
      completedGoals: completedGoalsCount,
      completedChallenges: Number(stats.completed_challenges) || 0,
      currentStreak: 0,
      longestStreak: 0,
    };

    return {
      overall,
      weeklyProgress: weekly,
      skillBreakdown,
      recentActivity,
    };
  },

  // Track an event (create or update a progress record)
  trackEvent: async (userId, eventData = {}) => {
    if (!userId) throw new Error('User ID required');

    const { challengeId, score, completed, points_earned, time_spent } =
      eventData;

    if (!challengeId) {
      // For non-challenge events, we still create a generic record
      const created = await Progress.create({
        user_id: userId,
        challenge_id: null,
        event_type: completed ? 'challenge_completed' : 'event',
        event_data: {
          score: score || null,
          completed: !!completed,
          points_earned: points_earned || 0,
          time_spent: time_spent || 0,
        },
        points_earned: points_earned || 0,
      });
      return created;
    }

    // If an existing progress entry exists for this user+challenge, update it
    const existing = await Progress.findByUserAndChallenge(userId, challengeId);
    if (existing) {
      const updated = await Progress.update(existing.id, {
        event_type: completed ? 'challenge_completed' : 'challenge_attempt',
        event_data: {
          score: score || existing.score,
          completed: !!completed,
          points_earned: points_earned || existing.points_earned || 0,
          time_spent: time_spent || existing.time_spent || 0,
        },
        points_earned: points_earned || existing.points_earned || 0,
      });
      return updated;
    }

    // Otherwise create a new progress record
    const created = await Progress.create({
      user_id: userId,
      challenge_id: challengeId,
      event_type: completed ? 'challenge_completed' : 'challenge_attempt',
      event_data: {
        score: score || null,
        completed: !!completed,
        points_earned: points_earned || 0,
        time_spent: time_spent || 0,
      },
      points_earned: points_earned || 0,
    });
    return created;
  },

  // Generate simple analytics (placeholder)
  generateAnalytics: async (userId, timeframe = 'week') => {
    // Reuse calculateOverallProgress for now
    const overview = await progressService.calculateOverallProgress(userId);
    return {
      timeframe,
      overview,
    };
  },

  // Return simple milestone list (placeholder)
  checkMilestones: async (userId) => {
    // Placeholder: no milestones computed yet
    return [];
  },
};

module.exports = progressService;

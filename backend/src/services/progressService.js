// Basic progress tracking and analytics helpers built on Progress model
const Progress = require('../models/Progress');
const { OpenAI } = require('openai');
const aiService = require('./aiService');

const progressService = {
  // Calculate a lightweight overview used by frontend charts
  calculateOverallProgress: async (userId) => {
    if (!userId) throw new Error('User ID required');

    // Get recent progress rows and aggregated stats
    const rows = await Progress.findByUserId(userId);
    const stats = await Progress.getUserStats(userId);

    // Recent activity: map last 10 events
    const recentActivity = (rows || []).slice(0, 10).map((r) => ({
      id: r.id,
      type: r.completed ? 'challenge_completed' : 'challenge_attempt',
      title: r.challenge_id ? `Challenge ${r.challenge_id}` : 'Activity',
      points: r.points_earned || 0,
      progress: r.completed ? 100 : 0,
      timestamp: r.created_at || r.updated_at || new Date().toISOString(),
    }));

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

    const overall = {
      totalPoints: Number(stats.total_points) || 0,
      level: Math.floor((Number(stats.total_points) || 0) / 100) + 1,
      experiencePoints: Number(stats.total_points) || 0,
      nextLevelXP:
        (Math.floor((Number(stats.total_points) || 0) / 100) + 1) * 100,
      completedGoals: 0,
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
    // Base overview
    const overview = await progressService.calculateOverallProgress(userId);

    // Fetch recent events to include in the AI prompt
    const events = await Progress.findByUserId(userId);

    // Build summarized event list for the prompt (compact)
    const summaryLines = (events || [])
      .slice(0, 10)
      .map((e) => `- ${e.completed ? 'Completed' : 'Attempted'}: challenge=${e.challenge_id || 'n/a'}, points=${e.points_earned || 0}, time_spent=${e.time_spent || 0}`)
      .join('\n');

    const client = process.env.OPENAI_API_KEY
      ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      : null;

    if (!client) {
      // Fallback to local heuristic analysis
      const pattern = await aiService.analyzePattern(userId, events);
      return {
        timeframe,
        overview,
        analysis: {
          fallback: true,
          pattern,
        },
      };
    }

    const prompt = `You are a helpful analytics assistant. Based on the user's recent activity and stats, produce a concise JSON object with keys: strengths (array of strings), weaknesses (array of strings), recommendations (array of strings), suggestedCategories (array of strings), summary (object with keys: totalPoints, completedChallenges, averageScore). The input user stats:\nTotal points: ${overview.overall.totalPoints}\nLevel: ${overview.overall.level}\nCompleted challenges: ${overview.overall.completedChallenges}\nAverage score: ${overview.overall.completedChallenges ? (overview.overall.experiencePoints / (overview.overall.completedChallenges || 1)).toFixed(2) : 'N/A'}\nRecent activity:\n${summaryLines}`;

    try {
      const response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.3,
      });

      const content = response.choices?.[0]?.message?.content || '';
      let parsed = null;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        // Try to extract JSON portion
        const first = content.indexOf('{');
        const last = content.lastIndexOf('}');
        if (first !== -1 && last !== -1) {
          try {
            parsed = JSON.parse(content.slice(first, last + 1));
          } catch (err) {
            parsed = { summary: { message: content } };
          }
        } else {
          parsed = { summary: { message: content } };
        }
      }

      return {
        timeframe,
        overview,
        analysis: parsed,
        raw: content,
      };
    } catch (err) {
      // On AI error, fallback to heuristic analysis
      const pattern = await aiService.analyzePattern(userId, events);
      return {
        timeframe,
        overview,
        analysis: {
          fallback: true,
          error: err.message,
          pattern,
        },
      };
    }
  },

  // Return simple milestone list (placeholder)
  checkMilestones: async (userId) => {
    if (!userId) throw new Error('User id required');
    const stats = await Progress.getUserStats(userId);
    const totalPoints = Number(stats.total_points) || 0;
    const completed = Number(stats.completed_challenges) || 0;
    const avg = Number(stats.average_score) || 0;

    // Define milestone thresholds
    const milestones = [];
    // Points -> every 100 points as a level milestone
    const currentLevel = Math.floor(totalPoints / 100) + 1;
    const nextLevelPoints = currentLevel * 100;
    const levelProgress = Math.min(1, (totalPoints % 100) / 100);
    milestones.push({
      id: 'level_progress',
      name: `Level ${currentLevel} Progress`,
      description: `Progress toward next level (Level ${currentLevel + 1})`,
      achieved: totalPoints >= nextLevelPoints,
      currentValue: totalPoints,
      targetValue: nextLevelPoints,
      progress: levelProgress,
      reward: `${(nextLevelPoints - totalPoints)} points to reach next level`,
    });

    // Completed challenges milestones with achievement keys
    const challengeThresholds = [
      { count: 1, key: 'first-steps' },
      { count: 5, key: 'five-challenges' },
      { count: 10, key: 'ten-challenges' },
      { count: 25, key: 'challenge-master' },
      { count: 50, key: 'challenge-legend' },
    ];
    for (const t of challengeThresholds) {
      const achieved = completed >= t.count;
      milestones.push({
        id: `completed_${t.count}`,
        name: `Complete ${t.count} challenges`,
        description: `Reward for completing ${t.count} challenges`,
        achieved,
        currentValue: completed,
        targetValue: t.count,
        progress: Math.min(1, completed / t.count),
        reward: `${t.count * 10} XP`,
        achievementKey: t.key,
      });
      // Award achievement if milestone just reached
      if (achieved && t.key) {
        const achievementService = require('./achievementService');
        try {
          await achievementService.awardAchievement(userId, t.key);
        } catch (err) {
          console.error(`Failed to award achievement ${t.key}:`, err.message);
        }
      }
    }

    // Average score milestones
    const scoreTargets = [60, 80, 90];
    for (const s of scoreTargets) {
      milestones.push({
        id: `avg_score_${s}`,
        name: `Average score ${s}+`,
        description: `Target average score of ${s}% across challenges`,
        achieved: avg >= s,
        currentValue: avg,
        targetValue: s,
        progress: Math.min(1, avg / s),
        reward: 'Badge',
      });
    }

    return milestones;
  },
};

module.exports = progressService;

// Implement minimal progress tracking needed by frontend
const Progress = require('../models/Progress');
const Challenge = require('../models/Challenge');

const progressService = {
  // Calculate overall user progress (simple implementation)
  calculateOverallProgress: async (userId) => {
    // For now, return counts from Progress model
    const rows = await Progress.findByUserId(userId);
    const total = rows.length;
    const completed = rows.filter(r => r.completed).length;
    return {
      totalAttempts: total,
      completedChallenges: completed,
    };
  },

  // Track a progress event such as marking a challenge complete/un-complete
  // eventType: 'toggle_complete' or 'submission' etc.
  // eventData: { challengeId, completed, score, timeSpent }
  trackEvent: async (userId, eventType, eventData) => {
    if (!userId) throw new Error('Missing userId');

    if (eventType === 'toggle_complete') {
      const { challengeId, completed } = eventData;

      if (!challengeId) throw new Error('Missing challengeId');

      // Try to find existing progress record
      const existing = await Progress.findByUserAndChallenge(userId, challengeId);

      // Determine points for challenge (if available)
      let pointsEarned = 0;
      try {
        const challenge = await Challenge.findById(challengeId);
        if (challenge && challenge.points) {
          pointsEarned = completed ? Number(challenge.points) : 0;
        }
      } catch (err) {
        // ignore and leave points as 0
      }

      if (existing) {
        // Update the existing progress row
        const updated = await Progress.update(existing.id, {
          score: existing.score || null,
          completed: completed,
          points_earned: pointsEarned,
        });
        return updated;
      }

      // Create a new progress record
      const created = await Progress.create({
        user_id: userId,
        challenge_id: challengeId,
        score: null,
        completed: completed,
        points_earned: pointsEarned,
        time_spent: null,
      });
      return created;
    }

    // For other event types, provide a basic fallback
    if (eventType === 'submission') {
      const { challengeId, score, timeSpent } = eventData;
      // Save as a progress event (create or update)
      const existing = await Progress.findByUserAndChallenge(userId, challengeId);
      if (existing) {
        const updated = await Progress.update(existing.id, {
          score: score || existing.score,
          completed: score >= 0 ? existing.completed : existing.completed,
          points_earned: existing.points_earned,
          time_spent: timeSpent || existing.time_spent,
        });
        return updated;
      }

      const created = await Progress.create({
        user_id: userId,
        challenge_id: challengeId,
        score: score || null,
        completed: false,
        points_earned: 0,
        time_spent: timeSpent || null,
      });
      return created;
    }

    throw new Error('Unsupported event type');
  },

  // Generate basic analytics (not implemented fully)
  generateAnalytics: async (userId, timeframe) => {
    throw new Error('Not implemented');
  },

  // Check milestones (not implemented yet)
  checkMilestones: async (userId) => {
    throw new Error('Not implemented');
  },
};

module.exports = progressService;

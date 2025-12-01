// Scheduled tasks for background jobs (e.g., weekly progress emails)
const progressService = require('../services/progressService');
const emailService = require('../services/emailService');
const db = require('../database/connection');

const scheduledTasks = {
  // Send weekly progress emails to all active users
  sendWeeklyProgressEmails: async () => {
    console.log('[Scheduled Task] Starting weekly progress email job...');
    try {
      // Get all active users
      const { rows: users } = await db.query('SELECT id, email, first_name FROM users WHERE email IS NOT NULL');
      console.log(`[Weekly Progress] Found ${users.length} users`);
      
      let sent = 0;
      let failed = 0;
      
      for (const user of users) {
        try {
          const overview = await progressService.calculateOverallProgress(user.id);
          const progressData = {
            totalPoints: overview.overall.totalPoints,
            level: overview.overall.level,
            completedChallenges: overview.overall.completedChallenges,
          };
          await emailService.sendProgressUpdate(user.email, progressData);
          sent++;
        } catch (err) {
          console.error(`[Weekly Progress] Failed for user ${user.id}:`, err.message);
          failed++;
        }
      }
      
      console.log(`[Weekly Progress] Completed. Sent: ${sent}, Failed: ${failed}`);
      return { sent, failed };
    } catch (err) {
      console.error('[Weekly Progress] Job error:', err.message);
      throw err;
    }
  },
};

module.exports = scheduledTasks;

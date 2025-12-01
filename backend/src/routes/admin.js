// Admin utility routes
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const db = require('../database/connection');

// Retroactively process existing submissions to create progress events
router.post('/process-submissions', auth, async (req, res) => {
  try {
    // Get all graded submissions with AI feedback
    const submissions = await db.query(`
      SELECT 
        s.id as submission_id,
        s.user_id,
        s.challenge_id,
        s.score,
        c.points_reward,
        c.goal_id
      FROM submissions s
      JOIN challenges c ON c.id = s.challenge_id
      WHERE s.score IS NOT NULL AND s.score >= 75
    `);
    
    let eventsCreated = 0;
    let goalsUpdated = new Set();
    
    for (const sub of submissions.rows) {
      // Create progress event if it doesn't exist
      const existingEvent = await db.query(
        `SELECT id FROM progress_events WHERE user_id = $1 AND related_challenge_id = $2`,
        [sub.user_id, sub.challenge_id]
      );
      
      if (existingEvent.rows.length === 0) {
        await db.query(
          `INSERT INTO progress_events (user_id, related_challenge_id, event_type, event_data, points_earned)
           VALUES ($1, $2, 'challenge_completed', $3, $4)`,
          [
            sub.user_id,
            sub.challenge_id,
            JSON.stringify({ score: sub.score, completed: true, retroactive: true }),
            sub.points_reward
          ]
        );
        eventsCreated++;
        
        if (sub.goal_id) {
          goalsUpdated.add(sub.goal_id);
        }
      }
    }
    
    // Recalculate goal progress for affected goals
    for (const goalId of goalsUpdated) {
      const result = await db.query(
        `SELECT COALESCE(SUM(pe.points_earned), 0) as total_points
         FROM progress_events pe
         JOIN challenges c ON c.id = pe.related_challenge_id
         WHERE c.goal_id = $1`,
        [goalId]
      );
      
      const totalPoints = result.rows[0]?.total_points || 0;
      const progressPercentage = Math.min(Math.round(totalPoints), 100);
      
      await db.query(
        `UPDATE goals 
         SET progress_percentage = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [progressPercentage, goalId]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Submissions processed', 
      eventsCreated,
      goalsUpdated: goalsUpdated.size,
      totalSubmissions: submissions.rows.length
    });
  } catch (error) {
    console.error('Process submissions error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Recalculate goal progress based on existing submissions
router.post('/recalculate-goals', auth, async (req, res) => {
  try {
    // Get all goals
    const goals = await db.query('SELECT id FROM goals');
    
    for (const goal of goals.rows) {
      // Calculate total points from all passing submissions for this goal
      const result = await db.query(
        `SELECT COALESCE(SUM(pe.points_earned), 0) as total_points
         FROM progress_events pe
         JOIN challenges c ON c.id = pe.challenge_id
         WHERE c.goal_id = $1`,
        [goal.id]
      );
      
      const totalPoints = result.rows[0]?.total_points || 0;
      const progressPercentage = Math.min(Math.round(totalPoints), 100);
      
      // Update goal
      await db.query(
        `UPDATE goals 
         SET progress_percentage = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2`,
        [progressPercentage, goal.id]
      );
    }
    
    res.json({ success: true, message: 'Goal progress recalculated', goalsUpdated: goals.rows.length });
  } catch (error) {
    console.error('Recalculate goals error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Link existing challenges to a goal
router.post('/link-challenges-to-goal', auth, async (req, res) => {
  try {
    const { challengeIds, goalId } = req.body;
    
    if (!challengeIds || !Array.isArray(challengeIds) || !goalId) {
      return res.status(400).json({ 
        success: false, 
        error: 'challengeIds (array) and goalId are required' 
      });
    }
    
    // Update challenges to link them to the goal
    const result = await db.query(
      `UPDATE challenges 
       SET goal_id = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = ANY($2::int[])
       RETURNING id, title, goal_id`,
      [goalId, challengeIds]
    );
    
    // Now recalculate the goal's progress
    const progressResult = await db.query(
      `SELECT COALESCE(SUM(pe.points_earned), 0) as total_points
       FROM progress_events pe
       JOIN challenges c ON c.id = pe.related_challenge_id
       WHERE c.goal_id = $1`,
      [goalId]
    );
    
    const totalPoints = progressResult.rows[0]?.total_points || 0;
    const progressPercentage = Math.min(Math.round(totalPoints), 100);
    
    await db.query(
      `UPDATE goals 
       SET progress_percentage = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [progressPercentage, goalId]
    );
    
    res.json({ 
      success: true, 
      message: 'Challenges linked to goal',
      linkedChallenges: result.rows,
      updatedProgress: progressPercentage
    });
  } catch (error) {
    console.error('Link challenges error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

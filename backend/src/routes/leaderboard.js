const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

// Get global leaderboard with optional filtering
// GET /api/leaderboard?timeframe=weekly&limit=50&offset=0
router.get('/', auth, leaderboardController.getLeaderboard);

// Get current user's ranking and stats
// GET /api/leaderboard/me?timeframe=all-time
router.get('/me', auth, leaderboardController.getUserRanking);

// Get surrounding players (players ranked around current user)
// GET /api/leaderboard/surrounding?timeframe=all-time&range=5
router.get('/surrounding', auth, leaderboardController.getSurroundingPlayers);

// Recalculate rankings (can be called by cron job or admin)
// POST /api/leaderboard/recalculate
router.post('/recalculate', auth, leaderboardController.recalculateRankings);

module.exports = router;

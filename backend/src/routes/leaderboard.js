// Leaderboard routes: provide both legacy and new alias endpoints used by frontend
const express = require('express');
const router = express.Router();
const leaderboardController = require('../controllers/leaderboardController');
const auth = require('../middleware/auth');

// Global leaderboard (legacy path '/')
router.get('/', auth, leaderboardController.getLeaderboard);

// Alias matching frontend expectation '/global'
router.get('/global', auth, leaderboardController.getLeaderboard);

// User ranking (legacy path '/ranking')
router.get('/ranking', auth, leaderboardController.getUserRanking);

// Alias matching frontend expectation '/user-rank'
router.get('/user-rank', auth, leaderboardController.getUserRanking);

// Points breakdown
router.get('/points', auth, leaderboardController.getPointsBreakdown);

// Achievements list
router.get('/achievements', auth, leaderboardController.getAchievements);

module.exports = router;

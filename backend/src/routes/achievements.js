const express = require('express');
const router = express.Router();
const achievementController = require('../controllers/achievementController');
const auth = require('../middleware/auth');

// Protected GET /api/achievements - List all achievements
router.get('/', auth, achievementController.getAllAchievements);

// Protected GET /api/achievements/recent - Get recent achievements from all users
router.get('/recent', auth, achievementController.getRecentAchievements);

// Protected GET /api/achievements/:id - Get specific achievement
router.get('/:id', auth, achievementController.getAchievementById);

// Protected GET /api/achievements/user/progress - Get authenticated user's achievements
router.get('/user/progress', auth, achievementController.getUserAchievements);

module.exports = router;

const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const auth = require('../middleware/auth');

// Get user progress overview
router.get('/', auth, progressController.getProgress);

// Get activity data for charts
router.get('/activity', auth, progressController.getActivityData);

// Get progress by category
router.get('/categories', auth, progressController.getProgressByCategory);

// Get achievements and milestones
router.get('/achievements', auth, progressController.getAchievements);

// Get completion timeline
router.get('/timeline', auth, progressController.getCompletionTimeline);

// Legacy routes for backward compatibility
router.post('/event', auth, progressController.updateProgress);
router.get('/analytics', auth, progressController.getAnalytics);
router.get('/milestones', auth, progressController.getMilestones);

module.exports = router;

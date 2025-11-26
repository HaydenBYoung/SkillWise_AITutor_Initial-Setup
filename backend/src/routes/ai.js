// AI Routes - Stories 3.2, 3.5
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// Story 3.2: Generate AI challenge
router.post('/generateChallenge', auth, aiController.generateChallenge);

// Story 3.5: Submit for AI feedback
router.post('/submitForFeedback', auth, aiController.submitForFeedback);

// Get feedback for a submission
router.get('/feedback/:submissionId', auth, aiController.getFeedback);

// Get all feedback for a challenge
router.get(
  '/challenge/:challengeId/feedback',
  auth,
  aiController.getChallengeFeedback
);

module.exports = router;

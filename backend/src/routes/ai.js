// TODO: Implement AI routes
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const rateLimit = require('express-rate-limit');
const {
  aiGenerateValidation,
  aiFeedbackValidation,
} = require('../middleware/validation');

// POST /feedback - generate AI feedback for a submission
const aiFeedbackLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minute window
  max: 30, // limit each user/IP to 30 requests per windowMs for feedback
  message: { error: 'AI feedback rate limit exceeded' },
});

router.post(
  '/feedback',
  auth,
  aiFeedbackLimiter,
  aiFeedbackValidation,
  aiController.generateFeedback
);

// TODO: Add GET /hints/:challengeId route for getting hints
router.get('/hints/:challengeId', auth, aiController.getHints);

// TODO: Add GET /suggestions route for challenge suggestions
router.get('/suggestions', auth, aiController.suggestChallenges);

// TODO: Add GET /analysis route for progress analysis
router.get('/analysis', auth, aiController.analyzeProgress);

// POST /generateChallenge - generate a new challenge via AI
const aiRouteLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 10, // limit each user/IP to 10 requests per windowMs for AI generation
  message: { error: 'AI generation rate limit exceeded' },
});

router.post(
  '/generateChallenge',
  auth,
  aiRouteLimiter,
  aiGenerateValidation,
  aiController.generateChallenge
);

module.exports = router;

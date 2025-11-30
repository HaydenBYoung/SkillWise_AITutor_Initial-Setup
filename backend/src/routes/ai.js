// AI Routes for AI-powered features
const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');

// Story 3.2: Generate AI challenges
router.post('/generateChallenge', auth, aiController.generateChallenge);

// Story 3.5: Submit work for AI feedback
router.post('/submitForFeedback', auth, aiController.submitForFeedback);

// Get feedback history for a submission
router.get('/feedback/:submissionId', auth, aiController.getFeedbackHistory);

// Ask follow-up question about feedback
router.post('/feedback/:feedbackId/followup', auth, aiController.askFollowUp);

// Save AI-generated challenge to database
router.post('/challenges/save', auth, aiController.saveGeneratedChallenge);

module.exports = router;

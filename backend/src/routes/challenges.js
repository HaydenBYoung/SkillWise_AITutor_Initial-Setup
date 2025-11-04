const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const auth = require('../middleware/auth');

// Get all challenges with optional filtering
router.get('/', auth, challengeController.getChallenges);

// Get single challenge by ID
router.get('/:id', auth, challengeController.getChallengeById);

// Create new challenge
router.post('/', auth, challengeController.createChallenge);

// Update challenge (only creator can update)
router.put('/:id', auth, challengeController.updateChallenge);

// Delete challenge (only creator can delete)
router.delete('/:id', auth, challengeController.deleteChallenge);

// Add challenge to goal
router.post('/:challengeId/goals/:goalId', auth, challengeController.addToGoal);

// Update challenge status in goal
router.put('/:challengeId/goals/:goalId/status', auth, challengeController.updateChallengeStatus);

module.exports = router;

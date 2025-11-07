const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Get all challenges (with optional filtering)
router.get('/', challengeController.getChallenges);

// Get challenges by category
router.get('/category/:category', challengeController.getChallengesByCategory);

// Get challenges linked to a specific goal (requires auth)
router.get('/goal/:goalId', auth, challengeController.getChallengesByGoalId);

// Get user's created challenges (requires auth)
router.get('/my-challenges', auth, challengeController.getUserChallenges);

// Get single challenge by ID
router.get('/:id', challengeController.getChallengeById);

// Create new challenge (requires auth)
router.post(
  '/',
  auth,
  validation.challengeValidation,
  challengeController.createChallenge
);

// Update existing challenge (requires auth and ownership)
router.put(
  '/:id',
  auth,
  validation.challengeValidation,
  challengeController.updateChallenge
);

// Delete challenge (requires auth and ownership)
router.delete('/:id', auth, challengeController.deleteChallenge);

module.exports = router;

const express = require('express');
const router = express.Router();
const challengeModuleService = require('../services/challengeModuleService');
const auth = require('../middleware/auth');

// Get all challenge modules for a user
router.get('/', auth, async (req, res) => {
  try {
    const modules = await challengeModuleService.getChallengeModulesForUser(req.user.id);
    res.json(modules); // Return modules directly, not wrapped
  } catch (error) {
    console.error('Error fetching challenge modules:', error);
    res.status(500).json({ error: 'Failed to fetch challenge modules' });
  }
});

// Complete a challenge
router.post('/:goalId/challenges/:challengeId/complete', auth, async (req, res) => {
  try {
    console.log('🎯 Challenge completion request:', {
      goalId: req.params.goalId,
      challengeId: req.params.challengeId,
      userId: req.user.id
    });

    const result = await challengeModuleService.completeChallenge(
      req.user.id,
      req.params.goalId,
      req.params.challengeId,
      req.body.answer
    );

    console.log('✅ Challenge completion result:', result);
    res.json(result);
  } catch (error) {
    console.error('❌ Error completing challenge:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to complete challenge' 
    });
  }
});

// Add a simple test route
router.post('/test', auth, async (req, res) => {
  res.json({ success: true, message: "Test route works!" });
});

module.exports = router;
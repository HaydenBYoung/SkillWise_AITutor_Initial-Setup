const express = require('express');
const router = express.Router();
const challengeModuleService = require('../services/challengeModuleService');
const auth = require('../middleware/auth');

// Get all challenge modules for a user
router.get('/', auth, async (req, res) => {
  try {
    const modules = await challengeModuleService.getChallengeModulesForUser(req.user.id);
    res.json(modules);
  } catch (error) {
    console.error('Error fetching challenge modules:', error);
    res.status(500).json({ error: 'Failed to fetch challenge modules' });
  }
});

// Complete a challenge
router.post('/:goalId/challenges/:challengeId/complete', auth, async (req, res) => {
  try {
    const { goalId, challengeId } = req.params;
    const { answer } = req.body;
    
    const result = await challengeModuleService.completeChallenge(
      req.user.id, 
      parseInt(goalId), 
      parseInt(challengeId), 
      answer
    );
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error('Error completing challenge:', error);
    res.status(500).json({ error: 'Failed to complete challenge' });
  }
});

module.exports = router;
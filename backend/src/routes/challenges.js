// Challenge routes (CRUD) — mounted under /api/challenges
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const auth = require('../middleware/auth');

// GET / - all challenges
router.get('/', auth, challengeController.getChallenges);

// GET /:id - single challenge
router.get('/:id', auth, challengeController.getChallengeById);

// POST /:id/complete - mark challenge as complete and award points
router.post('/:id/complete', auth, challengeController.completeChallenge);

// POST / - create challenge (admin only)
router.post('/', auth, challengeController.createChallenge);

// PUT /:id - update challenge (admin only)
router.put('/:id', auth, challengeController.updateChallenge);

// DELETE /:id - delete challenge (admin only)
router.delete('/:id', auth, challengeController.deleteChallenge);

module.exports = router;

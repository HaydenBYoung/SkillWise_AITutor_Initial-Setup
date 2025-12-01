// Challenge routes (CRUD) — mounted under /api/challenges
const express = require('express');
const router = express.Router();
const challengeController = require('../controllers/challengeController');
const submissionController = require('../controllers/submissionController');
const auth = require('../middleware/auth');
const { restrictTo } = require('../middleware/auth');

// GET / - all challenges
router.get('/', auth, challengeController.getChallenges);

// GET /:id - single challenge
router.get('/:id', auth, challengeController.getChallengeById);

// POST / - create challenge (admin only)
router.post('/', auth, challengeController.createChallenge);

// PUT /:id - update challenge (admin only)
router.put('/:id', auth, challengeController.updateChallenge);

// DELETE /:id - delete challenge (admin only)
router.delete('/:id', auth, challengeController.deleteChallenge);

// POST /:id/submit - submit work for a challenge (authenticated user)
router.post('/:id/submit', auth, submissionController.submitWork);

// GET /:id/submissions - list submissions for this challenge (reviewer/instructor)
router.get('/:id/submissions', auth, restrictTo('admin', 'instructor'), submissionController.getChallengeSubmissions);

module.exports = router;

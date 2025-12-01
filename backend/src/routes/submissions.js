// TODO: Implement submission routes
const express = require('express');
const router = express.Router();
const submissionController = require('../controllers/submissionController');
const auth = require('../middleware/auth');
const { restrictTo } = require('../middleware/auth');

// TODO: Add POST / route for submitting work
router.post('/', auth, submissionController.submitWork);

// GET user submissions (uses param userId) - must come before `/:id` route
router.get('/user/:userId', auth, submissionController.getUserSubmissions);

// GET challenge submissions for instructors/reviewers
router.get('/challenge/:challengeId', auth, restrictTo('admin', 'instructor'), submissionController.getChallengeSubmissions);

// GET a specific submission by id
router.get('/:id', auth, submissionController.getSubmission);

// Update submission (owner update or grading)
router.put('/:id', auth, submissionController.updateSubmission);

module.exports = router;

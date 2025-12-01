const express = require('express');
const router = express.Router();
const peerReviewController = require('../controllers/peerReviewController');
const auth = require('../middleware/auth');

// Get all available submissions for review (not assigned)
// GET /api/reviews/available
router.get('/available', auth, peerReviewController.getAvailableSubmissions);

// Get pending review assignments for current user
// GET /api/reviews/pending
router.get('/pending', auth, peerReviewController.getPendingReviews);

// Get reviews received by current user
// GET /api/reviews/received
router.get('/received', auth, peerReviewController.getReceivedReviews);

// Get reviews given by current user
// GET /api/reviews/given
router.get('/given', auth, peerReviewController.getReviewsGiven);

// Submit a direct review (not from assignment)
// POST /api/reviews/submit
router.post('/submit', auth, peerReviewController.submitDirectReview);

// Get details of a specific review assignment
// GET /api/reviews/:reviewId
router.get('/:reviewId', auth, peerReviewController.getReviewDetails);

// Submit a peer review
// POST /api/reviews/:reviewId
router.post('/:reviewId', auth, peerReviewController.submitReview);

module.exports = router;

// TODO: Implement peer review routes
const express = require('express');
const router = express.Router();
const peerReviewController = require('../controllers/peerReviewController');
const auth = require('../middleware/auth');

// TODO: Add GET /assignments route for review assignments
router.get('/assignments', auth, peerReviewController.getReviewAssignments);

// Alias for frontend: /queue
router.get('/queue', auth, peerReviewController.getReviewAssignments);

// POST create review (legacy)
router.post('/', auth, peerReviewController.submitReview);

// POST /submissions/:submissionId/review - create review for a specific submission
router.post('/submissions/:submissionId/review', auth, peerReviewController.submitReview);

// GET my submissions summary (frontend alias)
router.get('/my-submissions', auth, peerReviewController.getMySubmissions);

// GET /submissions/:submissionId - review details for a submission
router.get('/submissions/:submissionId', auth, peerReviewController.getReviewDetails);

// GET /received - received reviews (legacy) - get reviews for reviewee
router.get('/received', auth, peerReviewController.getReceivedReviews);

// GET /history route for review history
router.get('/history', auth, peerReviewController.getReviewHistory);

// PUT /:id - update a review
router.put('/:id', auth, peerReviewController.updateReview);

// DELETE /:id - delete a review
router.delete('/:id', auth, peerReviewController.deleteReview);

// PUT /:id/rating - submit a rating
router.put('/:id/rating', auth, peerReviewController.submitRating);

module.exports = router;

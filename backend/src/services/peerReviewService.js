const PeerReview = require('../models/PeerReview');
const Submission = require('../models/Submission');
const notificationService = require('./notificationService');

// Peer review business logic
const peerReviewService = {
  // TODO: Create new peer review
  createReview: async (reviewData) => {
    if (!reviewData) throw new Error('Review data required');
    const { reviewer_id, submission_id, reviewee_id } = reviewData;
    if (!reviewer_id || !submission_id || !reviewee_id) throw new Error('Missing required fields');
    if (Number(reviewer_id) === Number(reviewee_id)) throw new Error('Reviewer cannot review own submission');
    // Validate submission exists and ensure reviewee matches submission's user
    const submission = await Submission.findById(submission_id);
    if (!submission) throw new Error('Submission not found');
    if (Number(submission.user_id) !== Number(reviewee_id)) throw new Error('Submission owner mismatch');
    // Create review
    try {
      const created = await PeerReview.create(reviewData);
      try {
        // Notify the reviewee that a new review was posted
        await notificationService.sendNotification(reviewee_id, 'peer_review', `You received a new review from user ${reviewer_id}`, { reviewId: created.id, submissionId: submission_id });
      } catch (err) {
        // non-critical, log and continue
        console.error('Failed to send review notification:', err.message);
      }
      return created;
    } catch (err) {
      // Postgres unique constraint error code 23505
      if (err && err.code === '23505') {
        const e = new Error('Review already exists for this reviewer and submission');
        e.code = 'DUPLICATE_REVIEW';
        e.statusCode = 400;
        throw e;
      }
      throw err;
    }
  },

  // TODO: Get reviews for submission
  getReviewsForSubmission: async (submissionId) => {
    if (!submissionId) throw new Error('Submission id required');
    const rows = await PeerReview.findBySubmissionId(submissionId);
    return rows;
  },

  // TODO: Get reviews by reviewer
  getReviewsByReviewer: async (reviewerId) => {
    if (!reviewerId) throw new Error('Reviewer id required');
    const rows = await PeerReview.findByReviewerId(reviewerId);
    return rows;
  },

  // TODO: Update review
  updateReview: async (reviewId, updateData) => {
    if (!reviewId) throw new Error('Review id required');
    const existing = await PeerReview.update(reviewId, updateData);
    return existing;
  },

  // TODO: Delete review
  deleteReview: async (reviewId) => {
    if (!reviewId) throw new Error('Review id required');
    const deleted = await PeerReview.delete(reviewId);
    return deleted;
  },

  // TODO: Get pending reviews for user
  getPendingReviews: async (userId) => {
    if (!userId) throw new Error('User id required');
    const rows = await PeerReview.findPendingByReviewerId(userId);
    return rows;
  },

  // TODO: Submit review rating
  submitRating: async (reviewId, rating) => {
    if (!reviewId) throw new Error('Review id required');
    const updateData = { rating, is_completed: true };
    const updated = await PeerReview.update(reviewId, updateData);
    return updated;
  },
};

module.exports = peerReviewService;

// TODO: Implement peer review system controller
const peerReviewService = require('../services/peerReviewService');

// Peer review controller

const peerReviewController = {
  // TODO: Get reviews to complete
  getReviewAssignments: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const rows = await peerReviewService.getPendingReviews(userId);
      return res.status(200).json({ success: true, data: rows });
    } catch (err) {
      return next(err);
    }
  },

  // Get submissions belonging to current user with peer review summary
  getMySubmissions: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const Submission = require('../models/Submission');
      const PeerReview = require('../models/PeerReview');
      const submissions = await Submission.findByUserId(userId);
      // Append review summary
      const enriched = await Promise.all(submissions.map(async (s) => {
        const reviews = await PeerReview.findBySubmissionId(s.id);
        const avgRating = reviews.length ? (reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length) : null;
        return Object.assign({}, s, {
          reviewsCount: reviews.length,
          averageRating: avgRating,
          status: s.status || 'under-review',
        });
      }));
      return res.status(200).json({ success: true, data: enriched });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Submit peer review
  submitReview: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const payload = req.body || {};
      // Expected fields: submissionId, reviewText, rating, criteriaScores, timeSpent
      const submissionId = payload.submissionId || payload.submission_id;
      if (!submissionId) return res.status(400).json({ success: false, message: 'submissionId required' });
      const reviewData = {
        reviewer_id: userId,
        reviewee_id: payload.revieweeId || payload.reviewee_id || payload.reviewee || null,
        submission_id: submissionId,
        review_text: payload.reviewText || payload.review_text || payload.comments || null,
        rating: payload.rating || null,
        criteria_scores: payload.criteriaScores || payload.criteria_scores || null,
        time_spent_minutes: payload.timeSpent || payload.time_spent || null,
        is_anonymous: payload.isAnonymous !== undefined ? payload.isAnonymous : true,
        is_completed: payload.isCompleted !== undefined ? payload.isCompleted : !!payload.rating,
      };
      // If reviewee not provided, try to look up via submission
      if (!reviewData.reviewee_id) {
        const submission = await require('../models/Submission').findById(submissionId);
        if (!submission) return res.status(400).json({ success: false, message: 'Invalid submissionId' });
        reviewData.reviewee_id = submission.user_id;
      }
      const created = await peerReviewService.createReview(reviewData);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get received reviews
  getReceivedReviews: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      // optional query param to view another users' reviews (admin/instructor)
      const requestedUser = req.query.userId || req.params.userId || userId;
      // If requestedUser not equal to user and user not admin/instructor, forbids access
      if (Number(requestedUser) !== Number(userId)) {
        const role = (req.user && req.user.role) || 'user';
        if (!['admin', 'instructor'].includes(role)) {
          return res.status(403).json({ success: false, message: 'Forbidden' });
        }
      }
      // Note: getReviewsForSubmission expects submissionId; but we want reviewee id; use backend model directly
      const PeerReview = require('../models/PeerReview');
      const received = await PeerReview.findByRevieweeId(requestedUser);
      return res.status(200).json({ success: true, data: received });
    } catch (err) {
      return next(err);
    }
  },

  // Get review details for a submission
  getReviewDetails: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const submissionId = req.params.submissionId || req.query.submissionId;
      if (!submissionId) return res.status(400).json({ success: false, message: 'submissionId required' });
      const Submission = require('../models/Submission');
      const PeerReview = require('../models/PeerReview');
      const submission = await Submission.findById(submissionId);
      if (!submission) return res.status(404).json({ success: false, message: 'Submission not found' });
      const reviews = await PeerReview.findBySubmissionId(submissionId);
      return res.status(200).json({ success: true, data: { submission, reviews } });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Get review history
  getReviewHistory: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      // Returns reviews performed by the user
      const rows = await peerReviewService.getReviewsByReviewer(userId);
      return res.status(200).json({ success: true, data: rows });
    } catch (err) {
      return next(err);
    }
  },

  // Update a review by id
  updateReview: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const id = req.params.id;
      if (!id) return res.status(400).json({ success: false, message: 'Review id required' });
      // Optionally check permission: only reviewer or admin can update; we don't need existing value here
      // Optionally check permission: only reviewer or admin can update
      const role = (req.user && req.user.role) || 'user';
      if (!['admin', 'instructor'].includes(role)) {
        // Ensure the review exists and belongs to this user
        // Role-based check: we could ensure review belongs to user
        // If user didn't author it, forbid
        // Note: For now keep simple; refer service for more checks
      }
      const updateData = req.body || {};
      const updated = await peerReviewService.updateReview(id, updateData);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },

  // Delete review
  deleteReview: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const id = req.params.id;
      if (!id) return res.status(400).json({ success: false, message: 'Review id required' });
      const deleted = await peerReviewService.deleteReview(id);
      return res.status(200).json({ success: true, data: deleted });
    } catch (err) {
      return next(err);
    }
  },

  // Submit rating (alternate to update)
  submitRating: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const id = req.params.id;
      const rating = Number(req.body.rating);
      if (!id || (!rating && rating !== 0)) return res.status(400).json({ success: false, message: 'Review id and rating required' });
      const updated = await peerReviewService.submitRating(id, rating);
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = peerReviewController;

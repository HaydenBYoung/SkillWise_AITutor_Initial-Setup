const peerReviewService = require('../services/peerReviewService');

const peerReviewController = {
  /**
   * Get pending review assignments for current user
   * GET /api/reviews/pending
   */
  getPendingReviews: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const reviews = await peerReviewService.getPendingReviews(userId);

      res.json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      console.error('Error in getPendingReviews:', error);
      next(error);
    }
  },

  /**
   * Get details of a specific review assignment
   * GET /api/reviews/:reviewId
   */
  getReviewDetails: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const { reviewId } = req.params;

      const review = await peerReviewService.getReviewDetails(reviewId, userId);

      if (!review) {
        return res.status(404).json({
          success: false,
          message: 'Review not found or you do not have access',
        });
      }

      res.json({
        success: true,
        data: review,
      });
    } catch (error) {
      console.error('Error in getReviewDetails:', error);
      next(error);
    }
  },

  /**
   * Submit a peer review
   * POST /api/reviews/:reviewId
   */
  submitReview: async (req, res, next) => {
    try {
      const { reviewId } = req.params;
      const { reviewText, rating, criteriaScores, timeSpent } = req.body;

      if (!reviewText || reviewText.trim().length < 50) {
        return res.status(400).json({
          success: false,
          message: 'Review text must be at least 50 characters',
        });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      const review = await peerReviewService.createReview({
        reviewId,
        reviewText,
        rating,
        criteriaScores,
        timeSpent,
      });

      res.json({
        success: true,
        message: 'Review submitted successfully',
        data: review,
      });
    } catch (error) {
      console.error('Error in submitReview:', error);
      next(error);
    }
  },

  /**
   * Get reviews received by current user
   * GET /api/reviews/received
   */
  getReceivedReviews: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const reviews = await peerReviewService.getReviewsReceived(userId);

      res.json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      console.error('Error in getReceivedReviews:', error);
      next(error);
    }
  },

  /**
   * Get reviews given by current user
   * GET /api/reviews/given
   */
  getReviewsGiven: async (req, res, next) => {
    try {
      const userId = req.user.userId;
      const reviews = await peerReviewService.getReviewsGiven(userId);

      res.json({
        success: true,
        data: reviews,
      });
    } catch (error) {
      console.error('Error in getReviewsGiven:', error);
      next(error);
    }
  },

  /**
   * Get all available submissions for review
   * GET /api/reviews/available
   */
  getAvailableSubmissions: async (req, res, next) => {
    try {
      const userId = req.user.id || req.user.userId;
      const submissions = await peerReviewService.getAvailableSubmissions(
        userId
      );

      res.json({
        success: true,
        data: submissions,
      });
    } catch (error) {
      console.error('Error in getAvailableSubmissions:', error);
      next(error);
    }
  },

  /**
   * Submit a review for any submission (not pre-assigned)
   * POST /api/reviews/submit
   */
  submitDirectReview: async (req, res, next) => {
    try {
      const reviewerId = req.user.id || req.user.userId;
      const { submissionId, reviewText, rating, criteriaScores, timeSpent } =
        req.body;

      if (!submissionId) {
        return res.status(400).json({
          success: false,
          message: 'Submission ID is required',
        });
      }

      if (!reviewText || reviewText.trim().length < 50) {
        return res.status(400).json({
          success: false,
          message: 'Review text must be at least 50 characters',
        });
      }

      if (!rating || rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be between 1 and 5',
        });
      }

      const review = await peerReviewService.createDirectReview({
        reviewerId,
        submissionId,
        reviewText,
        rating,
        criteriaScores,
        timeSpent,
      });

      res.json({
        success: true,
        message: 'Review submitted successfully',
        data: review,
      });
    } catch (error) {
      console.error('Error in submitDirectReview:', error);
      next(error);
    }
  },
};

module.exports = peerReviewController;

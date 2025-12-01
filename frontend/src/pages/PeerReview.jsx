import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/PeerReview.css';

// Simple icon replacements
const FileText = () => <span>📄</span>;
const Star = ({ filled }) => <span>{filled ? '⭐' : '☆'}</span>;
const Send = () => <span>📤</span>;
const Eye = () => <span>👁️</span>;
const CheckCircle = () => <span>✅</span>;
const Clock = () => <span>⏰</span>;

const PeerReview = () => {
  const [activeTab, setActiveTab] = useState('available');
  const [availableSubmissions, setAvailableSubmissions] = useState([]);
  const [pendingReviews, setPendingReviews] = useState([]);
  const [receivedReviews, setReceivedReviews] = useState([]);
  const [givenReviews, setGivenReviews] = useState([]);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewForm, setReviewForm] = useState({
    reviewText: '',
    rating: 5,
    criteriaScores: {
      clarity: 5,
      completeness: 5,
      codeQuality: 5,
      creativity: 5,
    },
    timeSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchReviews();
  }, [activeTab]);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeTab === 'available') {
        const response = await api.get('/reviews/available');
        setAvailableSubmissions(response.data.data);
      } else if (activeTab === 'pending') {
        const response = await api.get('/reviews/pending');
        setPendingReviews(response.data.data);
      } else if (activeTab === 'received') {
        const response = await api.get('/reviews/received');
        setReceivedReviews(response.data.data);
      } else if (activeTab === 'given') {
        const response = await api.get('/reviews/given');
        setGivenReviews(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectReview = async (reviewId) => {
    try {
      const response = await api.get(`/api/reviews/${reviewId}`);
      setSelectedSubmission(response.data.data);
      setReviewForm({
        reviewText: response.data.data.reviewText || '',
        rating: response.data.data.rating || 5,
        criteriaScores: response.data.data.criteriaScores || {
          clarity: 5,
          completeness: 5,
          codeQuality: 5,
          creativity: 5,
        },
        timeSpent: response.data.data.timeSpent || 0,
      });
    } catch (err) {
      console.error('Error fetching review details:', err);
      setError('Failed to load review details');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (reviewForm.reviewText.trim().length < 50) {
      setError('Review must be at least 50 characters');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      if (selectedSubmission.submissionId) {
        // Direct review of available submission
        await api.post('/reviews/submit', {
          submissionId: selectedSubmission.submissionId,
          ...reviewForm,
        });
      } else {
        // Assigned review (has reviewId)
        await api.post(`/reviews/${selectedSubmission.id}`, reviewForm);
      }

      // Refresh reviews
      await fetchReviews();
      setSelectedSubmission(null);
      setReviewForm({
        reviewText: '',
        rating: 5,
        criteriaScores: {
          clarity: 5,
          completeness: 5,
          codeQuality: 5,
          creativity: 5,
        },
        timeSpent: 0,
      });

      alert(
        'Review submitted successfully! You earned points for your review.'
      );
    } catch (err) {
      console.error('Error submitting review:', err);
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectSubmission = (submission) => {
    setSelectedSubmission(submission);
    setReviewForm({
      reviewText: '',
      rating: 5,
      criteriaScores: {
        clarity: 5,
        completeness: 5,
        codeQuality: 5,
        creativity: 5,
      },
      timeSpent: 0,
    });
  };

  const renderStars = (rating, onRate = null) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={`star ${star <= rating ? 'filled' : ''} ${
              onRate ? 'clickable' : ''
            }`}
            onClick={() => onRate && onRate(star)}
            style={{ cursor: onRate ? 'pointer' : 'default', fontSize: '24px' }}
          >
            {star <= rating ? '⭐' : '☆'}
          </span>
        ))}
      </div>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderPendingReviews = () => (
    <div className="reviews-list">
      {pendingReviews.length === 0 ? (
        <div className="empty-state">
          <CheckCircle size={48} />
          <p>No pending reviews</p>
          <p className="empty-subtitle">You're all caught up!</p>
        </div>
      ) : (
        pendingReviews.map((review) => (
          <div
            key={review.id}
            className="review-card"
            onClick={() => handleSelectReview(review.id)}
          >
            <div className="review-header">
              <FileText size={20} />
              <h3>{review.challenge.title}</h3>
              <span
                className={`difficulty-badge ${review.challenge.difficulty}`}
              >
                {review.challenge.difficulty}
              </span>
            </div>
            <p className="review-description">{review.challenge.description}</p>
            <div className="review-meta">
              <span className="meta-item">
                <Clock size={16} />
                Assigned {formatDate(review.assignedAt)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderAvailableSubmissions = () => (
    <div className="reviews-list">
      {availableSubmissions.length === 0 ? (
        <div className="empty-state">
          <Eye size={48} />
          <p>No submissions available for review</p>
          <p className="empty-subtitle">
            Check back later or create another account to test!
          </p>
        </div>
      ) : (
        availableSubmissions.map((submission) => (
          <div
            key={submission.submissionId}
            className="review-card"
            onClick={() => handleSelectSubmission(submission)}
          >
            <div className="review-header">
              <FileText size={20} />
              <h3>{submission.challenge.title}</h3>
              <span
                className={`difficulty-badge ${submission.challenge.difficulty}`}
              >
                {submission.challenge.difficulty}
              </span>
            </div>
            <p className="review-description">
              {submission.challenge.description}
            </p>
            <div className="review-meta">
              <span className="meta-item">👤 By: {submission.authorName}</span>
              <span className="meta-item">
                📊 Score: {submission.submission.score}/100
              </span>
              <span className="meta-item">
                <Clock size={16} />
                {formatDate(submission.submission.submittedAt)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderReceivedReviews = () => (
    <div className="reviews-list">
      {receivedReviews.length === 0 ? (
        <div className="empty-state">
          <Eye size={48} />
          <p>No reviews received yet</p>
          <p className="empty-subtitle">
            Complete challenges to receive feedback
          </p>
        </div>
      ) : (
        receivedReviews.map((review) => (
          <div key={review.id} className="review-card received">
            <div className="review-header">
              <FileText size={20} />
              <h3>{review.challengeTitle}</h3>
              {renderStars(review.rating)}
            </div>
            <p className="reviewer-name">Reviewed by: {review.reviewerName}</p>
            <div className="review-text">
              <p>{review.reviewText}</p>
            </div>
            {review.criteriaScores && (
              <div className="criteria-scores">
                <h4>Detailed Scores:</h4>
                <div className="scores-grid">
                  {Object.entries(review.criteriaScores).map(([key, value]) => (
                    <div key={key} className="score-item">
                      <span className="score-label">{key}</span>
                      {renderStars(value)}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="review-meta">
              <span className="meta-item">
                <Clock size={16} />
                {formatDate(review.completedAt)}
              </span>
            </div>
          </div>
        ))
      )}
    </div>
  );

  const renderGivenReviews = () => (
    <div className="reviews-list">
      {givenReviews.length === 0 ? (
        <div className="empty-state">
          <Send size={48} />
          <p>No reviews given yet</p>
          <p className="empty-subtitle">Start reviewing to help others!</p>
        </div>
      ) : (
        givenReviews.map((review) => (
          <div key={review.id} className="review-card given">
            <div className="review-header">
              <FileText size={20} />
              <h3>{review.challengeTitle}</h3>
              {review.isCompleted ? (
                <span className="status-badge completed">
                  <CheckCircle size={16} /> Completed
                </span>
              ) : (
                <span className="status-badge pending">
                  <Clock size={16} /> Pending
                </span>
              )}
            </div>
            {review.isCompleted && (
              <>
                <div className="review-rating">
                  {renderStars(review.rating)}
                </div>
                <div className="review-text">
                  <p>{review.reviewText}</p>
                </div>
                <div className="review-meta">
                  <span className="meta-item">
                    <Clock size={16} />
                    {formatDate(review.completedAt)}
                  </span>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );

  const renderReviewForm = () => (
    <div className="review-form-container">
      <button className="back-btn" onClick={() => setSelectedSubmission(null)}>
        ← Back to Pending Reviews
      </button>

      <div className="submission-details">
        <h2>{selectedSubmission.challenge.title}</h2>
        <p className="challenge-description">
          {selectedSubmission.challenge.description}
        </p>

        <div className="submission-content">
          <h3>Submission to Review:</h3>
          <div className="submission-box">
            <p>{selectedSubmission.submission.content}</p>
            {selectedSubmission.submission.submissionFiles && (
              <a
                href={selectedSubmission.submission.submissionFiles}
                target="_blank"
                rel="noopener noreferrer"
              >
                View Code
              </a>
            )}
          </div>
          <p className="submission-date">
            Submitted on:{' '}
            {formatDate(selectedSubmission.submission.submittedAt)}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmitReview} className="review-form">
        <h3>Your Review</h3>

        <div className="form-group">
          <label>Overall Rating *</label>
          {renderStars(reviewForm.rating, (rating) =>
            setReviewForm({ ...reviewForm, rating })
          )}
        </div>

        <div className="criteria-rating">
          <label>Detailed Criteria Scores</label>
          {Object.keys(reviewForm.criteriaScores).map((criterion) => (
            <div key={criterion} className="criterion-item">
              <span className="criterion-label">{criterion}</span>
              {renderStars(reviewForm.criteriaScores[criterion], (rating) =>
                setReviewForm({
                  ...reviewForm,
                  criteriaScores: {
                    ...reviewForm.criteriaScores,
                    [criterion]: rating,
                  },
                })
              )}
            </div>
          ))}
        </div>

        <div className="form-group">
          <label htmlFor="reviewText">
            Review Feedback * (min 50 characters)
          </label>
          <textarea
            id="reviewText"
            value={reviewForm.reviewText}
            onChange={(e) =>
              setReviewForm({ ...reviewForm, reviewText: e.target.value })
            }
            placeholder="Provide constructive feedback on the submission..."
            rows={8}
            required
            minLength={50}
          />
          <span className="char-count">
            {reviewForm.reviewText.length} / 50 minimum
          </span>
        </div>

        <div className="form-group">
          <label htmlFor="timeSpent">Time Spent (minutes)</label>
          <input
            type="number"
            id="timeSpent"
            value={reviewForm.timeSpent}
            onChange={(e) =>
              setReviewForm({
                ...reviewForm,
                timeSpent: parseInt(e.target.value),
              })
            }
            min="0"
          />
        </div>

        {error && <div className="error-message">{error}</div>}

        <button type="submit" className="submit-btn" disabled={submitting}>
          <Send size={20} />
          {submitting ? 'Submitting...' : 'Submit Review'}
        </button>
      </form>
    </div>
  );

  return (
    <div className="peer-review-container">
      <div className="peer-review-header">
        <h1>Peer Reviews</h1>
        <p>Give and receive constructive feedback</p>
      </div>

      {!selectedSubmission && (
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'available' ? 'active' : ''}`}
            onClick={() => setActiveTab('available')}
          >
            <Eye size={20} />
            Available Submissions
          </button>
          <button
            className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <Clock size={20} />
            Pending ({pendingReviews.length})
          </button>
          <button
            className={`tab ${activeTab === 'received' ? 'active' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            <Eye size={20} />
            Received
          </button>
          <button
            className={`tab ${activeTab === 'given' ? 'active' : ''}`}
            onClick={() => setActiveTab('given')}
          >
            <Send size={20} />
            Given
          </button>
        </div>
      )}

      <div className="peer-review-content">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading reviews...</p>
          </div>
        ) : selectedSubmission ? (
          renderReviewForm()
        ) : (
          <>
            {activeTab === 'available' && renderAvailableSubmissions()}
            {activeTab === 'pending' && renderPendingReviews()}
            {activeTab === 'received' && renderReceivedReviews()}
            {activeTab === 'given' && renderGivenReviews()}
          </>
        )}
      </div>
    </div>
  );
};

export default PeerReview;

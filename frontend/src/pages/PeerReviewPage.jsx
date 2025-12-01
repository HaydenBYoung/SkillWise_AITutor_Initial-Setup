// Peer review UI implemented using mock data; replace mocks with API calls and wire peer-review endpoints
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardLayout from '../components/common/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

const PeerReviewPage = () => {
  const [reviews, setReviews] = useState([]);
  const [mySubmissions, setMySubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('review-others');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const { user } = useAuth();

  // Fetch queue and my submissions from the API
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const queue = await apiService.peerReview.getReviewQueue();
        // Enrich queue items with submission details for better UI
        const queueWithDetails = await Promise.all(
          (queue || []).map(async (r) => {
            try {
              const details = await apiService.peerReview.getReviewDetails(r.submission_id || r.submissionId || r.submission_id);
              return Object.assign({}, r, { submission: details?.submission || details?.data?.submission || null, title: (details?.data?.submission && details.data.submission.title) || r.title, description: (details?.data?.submission && details.data.submission.submission_text) || r.description, author: r.author || 'Anonymous', needsReview: !r.is_completed });
            } catch (err) {
              return r;
            }
          }),
        );
        const mine = await apiService.peerReview.getMySubmissions();
        setReviews(queueWithDetails || []);
        setMySubmissions(mine || []);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading peer review data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReviews = reviews.filter(
    (review) =>
      selectedCategory === 'all' ||
      review.category.toLowerCase() === selectedCategory.toLowerCase(),
  );

  const getStatusBadge = (status) => {
    const statusConfig = {
      'under-review': { text: 'Under Review', className: 'status-pending' },
      completed: { text: 'Completed', className: 'status-completed' },
      'needs-revision': { text: 'Needs Revision', className: 'status-warning' },
    };
    const config = statusConfig[status] || {
      text: status,
      className: 'status-default',
    };
    return (
      <span className={`status-badge ${config.className}`}>{config.text}</span>
    );
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      Beginner: '#4CAF50',
      Intermediate: '#FF9800',
      Advanced: '#F44336',
    };
    return colors[difficulty] || '#757575';
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Review modal state & handlers
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const openReviewModal = (submission) => {
    setSelectedSubmission(submission);
    setReviewText('');
    setRating(5);
  };

  const closeReviewModal = () => {
    setSelectedSubmission(null);
    setSubmitting(false);
  };

  const openDetailsModal = async (submission) => {
    try {
      setLoading(true);
      const details = await apiService.peerReview.getReviewDetails(submission.id || submission.submissionId);
      // details.data contains { submission, reviews }
      setSelectedSubmission(Object.assign({}, submission, { details: details.data }));
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error loading submission details', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!selectedSubmission) return;
    try {
      setSubmitting(true);
      const submissionId = selectedSubmission.submission?.id || selectedSubmission.submissionId || selectedSubmission.submission_id || selectedSubmission.id;
      const payload = {
        reviewText,
        rating,
        isCompleted: true,
      };
      // If the selectedSubmission includes a peer-review id or reviewer matches current user, update the existing record
      if (selectedSubmission && (selectedSubmission.reviewer_id || selectedSubmission.reviewerId) && Number(selectedSubmission.reviewer_id || selectedSubmission.reviewerId) === Number(user?.id)) {
        await apiService.peerReview.updateReview(selectedSubmission.id, payload);
      } else {
        await apiService.peerReview.submitReview(submissionId, payload);
      }
      // refresh data
      const queue = await apiService.peerReview.getReviewQueue();
      const mine = await apiService.peerReview.getMySubmissions();
      setReviews(queue || []);
      setMySubmissions(mine || []);
      closeReviewModal();
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error submitting review', err);
      setSubmitting(false);
      // TODO: show a user-friendly notification on error
    }
  };

  return (
    <DashboardLayout>
      <div className="peer-review-page">
        <div className="page-header">
          <h1>Peer Review</h1>
          <p>Collaborate with fellow learners and improve together</p>
        </div>

        <div className="review-tabs">
          <button
            className={`tab-button ${
              activeTab === 'review-others' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('review-others')}
          >
            Review Others ({reviews.filter((r) => r.needsReview).length})
          </button>
          <button
            className={`tab-button ${
              activeTab === 'my-submissions' ? 'active' : ''
            }`}
            onClick={() => setActiveTab('my-submissions')}
          >
            My Submissions ({mySubmissions.length})
          </button>
        </div>

        {activeTab === 'review-others' && (
          <div className="review-others-section">
            <div className="section-header">
              <h2>Help Others Improve</h2>
              <div className="filters">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  <option value="all">All Categories</option>
                  <option value="react">React</option>
                  <option value="javascript">JavaScript</option>
                  <option value="algorithms">Algorithms</option>
                  <option value="css">CSS</option>
                  <option value="database">Database</option>
                </select>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner message="Loading submissions for review..." />
            ) : (
              <div className="reviews-grid">
                {filteredReviews.map((review) => (
                  <div key={review.id} className="review-card">
                    <div className="review-header">
                      <div className="author-info">
                        <span className="author-avatar">
                          {review.authorAvatar}
                        </span>
                        <div>
                          <h4>{review.title}</h4>
                          <p>by {review.author}</p>
                        </div>
                      </div>
                      <div className="review-meta">
                        <span
                          className="difficulty-badge"
                          style={{
                            backgroundColor: getDifficultyColor(
                              review.difficulty,
                            ),
                          }}
                        >
                          {review.difficulty}
                        </span>
                        <span className="category-badge">
                          {review.category}
                        </span>
                      </div>
                    </div>

                    <div className="review-content">
                      <p>{review.description}</p>
                      <div className="code-preview">
                        <code>{review.codeSnippet}</code>
                      </div>
                    </div>

                    <div className="review-footer">
                      <div className="review-stats">
                        <span className="time-ago">
                          {formatTimeAgo(review.submittedAt)}
                        </span>
                        <span className="reviews-count">
                          {review.reviewsCount}/{review.maxReviews} reviews
                        </span>
                      </div>

                      {review.needsReview ? (
                        <button className="btn-primary" onClick={() => openReviewModal(review)}>Start Review</button>
                      ) : (
                        <button className="btn-secondary" disabled>
                          Review Complete
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredReviews.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📝</div>
                    <h3>No submissions available</h3>
                    <p>Check back later for new submissions to review!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-submissions' && (
          <div className="my-submissions-section">
            <div className="section-header">
              <h2>Your Submissions</h2>
              <button className="btn-primary">Submit New Work</button>
            </div>

            {loading ? (
              <LoadingSpinner message="Loading your submissions..." />
            ) : (
              <div className="submissions-list">
                {mySubmissions.map((submission) => (
                  <div key={submission.id} className="submission-card">
                    <div className="submission-header">
                      <div className="submission-info">
                        <h4>{submission.title}</h4>
                        <div className="submission-meta">
                          <span className="category-badge">
                            {submission.category}
                          </span>
                          <span
                            className="difficulty-badge"
                            style={{
                              backgroundColor: getDifficultyColor(
                                submission.difficulty,
                              ),
                            }}
                          >
                            {submission.difficulty}
                          </span>
                          {getStatusBadge(submission.status)}
                        </div>
                      </div>
                      <div className="submission-actions">
                        <button className="btn-secondary" onClick={() => openDetailsModal(submission)}>View Details</button>
                      </div>
                    </div>

                    <div className="submission-stats">
                      <div className="stat-item">
                        <strong>{submission.reviewsReceived}</strong>
                        <span>Reviews Received</span>
                      </div>
                      <div className="stat-item">
                        <strong>{submission.averageRating}</strong>
                        <span>Average Rating</span>
                      </div>
                      <div className="stat-item">
                        <strong>{formatTimeAgo(submission.submittedAt)}</strong>
                        <span>Submitted</span>
                      </div>
                    </div>

                    {submission.feedback && (
                      <div className="latest-feedback">
                        <h5>Latest Feedback:</h5>
                        <p>"{submission.feedback}"</p>
                      </div>
                    )}

                    <div className="progress-bar">
                      <div className="progress-label">
                        Review Progress: {submission.reviewsReceived}/
                        {submission.maxReviews}
                      </div>
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{
                            width: `${
                              (submission.reviewsReceived /
                                submission.maxReviews) *
                              100
                            }%`,
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}

                {mySubmissions.length === 0 && (
                  <div className="empty-state">
                    <div className="empty-icon">📤</div>
                    <h3>No submissions yet</h3>
                    <p>
                      Submit your first piece of work to get feedback from
                      peers!
                    </p>
                    <button className="btn-primary">Submit Your Work</button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Review modal */}
        {selectedSubmission && (
          <div className="modal-overlay">
            <div className="modal-card">
              <div className="modal-header">
                <h3>Review: {selectedSubmission.title}</h3>
                <button className="btn-link" onClick={closeReviewModal}>Close</button>
              </div>
              <div className="modal-body">
                <p><strong>Author:</strong> {selectedSubmission.author || 'Anonymous'}</p>
                <p>{selectedSubmission.description || selectedSubmission.details?.submission?.submission_text}</p>
                <textarea
                  placeholder="Write constructive feedback for the author"
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  rows={6}
                  style={{ width: '100%', padding: '8px', marginTop: '8px' }}
                />
                <div style={{ marginTop: '8px' }}>
                  <label>Rating:</label>
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    {[5,4,3,2,1].map((r) => (
                      <option key={r} value={r}>{r} ★</option>
                    ))}
                  </select>
                </div>
                {selectedSubmission.details && (
                  <div style={{ marginTop: '12px' }}>
                    <h4>Existing Reviews</h4>
                    {Array.isArray(selectedSubmission.details.reviews) && selectedSubmission.details.reviews.length > 0 ? (
                      <ul>
                        {selectedSubmission.details.reviews.map((r) => (
                          <li key={r.id}>
                            <strong>{r.rating || 'No Rating'}</strong> — {r.review_text}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p>No reviews yet</p>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn-secondary" onClick={closeReviewModal}>Cancel</button>
                <button className="btn-primary" onClick={handleSubmitReview} disabled={submitting}>Submit Review</button>
              </div>
            </div>
          </div>
        )}

        <div className="review-tips">
          <h3>💡 Review Tips</h3>
          <div className="tips-grid">
            <div className="tip-card">
              <h4>Be Constructive</h4>
              <p>
                Focus on specific improvements and provide actionable feedback
              </p>
            </div>
            <div className="tip-card">
              <h4>Be Respectful</h4>
              <p>
                Remember there's a person behind the code. Be kind and
                encouraging
              </p>
            </div>
            <div className="tip-card">
              <h4>Be Specific</h4>
              <p>
                Point out exactly what works well and what could be improved
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default PeerReviewPage;

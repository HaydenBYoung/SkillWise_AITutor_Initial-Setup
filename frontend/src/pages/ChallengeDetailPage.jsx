import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './ChallengeDetailPage.css';

function ChallengeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Submission form state
  const [submissionType, setSubmissionType] = useState('code');
  const [content, setContent] = useState('');
  const [explanation, setExplanation] = useState('');
  const [feedback, setFeedback] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [hasEarnedPoints, setHasEarnedPoints] = useState(false);
  const [bestScore, setBestScore] = useState(0);

  useEffect(() => {
    fetchChallenge();
  }, [id]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/challenges/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Backend returns challenge directly in data, not wrapped
      const challengeData = response.data.data;
      setChallenge(challengeData);

      // Check if user has earned points for this challenge
      if (challengeData.hasEarnedPoints) {
        setHasEarnedPoints(true);
      }

      // Track best score
      if (challengeData.submission?.score) {
        setBestScore(challengeData.submission.score);
      }

      // If there's an existing submission, pre-fill the form
      if (challengeData.submission) {
        const sub = challengeData.submission;
        setSubmissionType(sub.type || 'code');
        setContent(sub.content || '');
        setExplanation(sub.explanation || '');
        if (sub.aiFeedback) {
          setFeedback(sub.aiFeedback);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Error fetching challenge:', err);
      setError('Failed to load challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!content.trim()) {
      alert('Please provide your work before submitting');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('access_token');

      const response = await axios.post(
        '/api/submissions',
        {
          challengeId: id,
          type: submissionType,
          content: content,
          explanation: explanation,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      // Set the feedback and show modal immediately
      if (response.data.data.feedback) {
        const newScore = response.data.data.feedback.score;
        const previousBest = bestScore;

        // Keep the higher score
        if (newScore > previousBest) {
          setBestScore(newScore);
        }

        setFeedback({
          ...response.data.data.feedback,
          isResubmission: previousBest > 0,
          previousScore: previousBest,
          improvedScore: newScore > previousBest,
        });
        setShowFeedbackModal(true);

        // Check if points were earned
        if (newScore >= 75 && !hasEarnedPoints) {
          setHasEarnedPoints(true);
        }
      }

      // Refresh challenge to get updated submission
      await fetchChallenge();
    } catch (err) {
      console.error('Error submitting:', err);
      if (err.response?.data?.message?.includes('already earned points')) {
        alert(
          'You have already earned points for this challenge and cannot resubmit.'
        );
      } else {
        alert('Failed to submit. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const getDifficultyColor = (difficulty) => {
    const colors = {
      beginner: '#4caf50',
      intermediate: '#ff9800',
      advanced: '#f44336',
    };
    return colors[difficulty] || '#999';
  };

  if (loading) {
    return (
      <div className="challenge-detail-page">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading challenge...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="challenge-detail-page">
        <div className="error-state">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/challenges')}>
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="challenge-detail-page">
        <div className="error-state">
          <h2>Challenge Not Found</h2>
          <button onClick={() => navigate('/challenges')}>
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="challenge-detail-page">
      <div className="challenge-header">
        <button className="back-button" onClick={() => navigate('/challenges')}>
          ← Back to Challenges
        </button>
        <h1>{challenge.title}</h1>
        <div className="challenge-meta">
          <span
            className="difficulty-badge"
            style={{
              backgroundColor: getDifficultyColor(challenge.difficulty),
            }}
          >
            {challenge.difficulty}
          </span>
          {challenge.is_ai_generated && (
            <span className="ai-badge">🤖 AI Generated</span>
          )}
          <span className="status-badge">{challenge.status}</span>
        </div>
      </div>

      <div className="challenge-content">
        <div className="challenge-info">
          <section className="description-section">
            <h2>Description</h2>
            <p>{challenge.description}</p>
          </section>

          {challenge.instructions && (
            <section className="instructions-section">
              <h2>Instructions</h2>
              <p>{challenge.instructions}</p>
            </section>
          )}

          {challenge.learning_objectives &&
            challenge.learning_objectives.length > 0 && (
              <section className="objectives-section">
                <h2>Learning Objectives</h2>
                <ul>
                  {challenge.learning_objectives.map((obj, index) => (
                    <li key={index}>{obj}</li>
                  ))}
                </ul>
              </section>
            )}

          {challenge.requirements && challenge.requirements.length > 0 && (
            <section className="requirements-section">
              <h2>Requirements</h2>
              <ul>
                {challenge.requirements.map((req, index) => (
                  <li key={index}>{req}</li>
                ))}
              </ul>
            </section>
          )}

          {challenge.tags && challenge.tags.length > 0 && (
            <section className="tags-section">
              <h3>Tags</h3>
              <div className="tags">
                {challenge.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
              </div>
            </section>
          )}
        </div>

        <div className="submission-panel">
          <h2>Your Work</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="submission-type">Submission Type</label>
              <select
                id="submission-type"
                value={submissionType}
                onChange={(e) => setSubmissionType(e.target.value)}
                disabled={hasEarnedPoints}
              >
                <option value="code">Code</option>
                <option value="text">Text</option>
                <option value="url">URL</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="content">Your Solution *</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={
                  submissionType === 'code'
                    ? '// Enter your code here...'
                    : submissionType === 'url'
                    ? 'https://github.com/yourusername/project'
                    : 'Describe your solution...'
                }
                rows={15}
                required
                disabled={hasEarnedPoints}
              />
            </div>

            <div className="form-group">
              <label htmlFor="explanation">Explanation (Optional)</label>
              <textarea
                id="explanation"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                placeholder="Explain your approach, challenges faced, and what you learned..."
                rows={5}
                disabled={hasEarnedPoints}
              />
            </div>

            <button
              type="submit"
              className="submit-button"
              disabled={submitting || hasEarnedPoints}
            >
              {submitting
                ? 'Submitting...'
                : hasEarnedPoints
                ? '🔒 Points Already Earned'
                : bestScore > 0
                ? 'Resubmit for Better Score'
                : 'Submit Work'}
            </button>

            {hasEarnedPoints && (
              <p
                style={{
                  color: '#4caf50',
                  marginTop: '10px',
                  fontWeight: '500',
                }}
              >
                ✅ You've earned points for this challenge! Score: {bestScore}
                /100
              </p>
            )}

            {bestScore > 0 && !hasEarnedPoints && (
              <p
                style={{
                  color: '#ff9800',
                  marginTop: '10px',
                  fontWeight: '500',
                }}
              >
                📊 Current best score: {bestScore}/100 - You can resubmit to try
                for a better grade!
              </p>
            )}
          </form>

          {feedback && (
            <div className="ai-feedback-section">
              <h3>🤖 AI Feedback</h3>

              {feedback.overall && (
                <div className="feedback-overall">
                  <p>{feedback.overall}</p>
                </div>
              )}

              {feedback.positive && feedback.positive.length > 0 && (
                <div className="feedback-positive">
                  <h4>✅ What You Did Well</h4>
                  <ul>
                    {feedback.positive.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="feedback-improvements">
                  <h4>💡 Areas for Improvement</h4>
                  <ul>
                    {feedback.improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="feedback-suggestions">
                  <h4>🚀 Suggestions for Next Steps</h4>
                  <ul>
                    {feedback.suggestions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {challenge.submission && challenge.submission.score && (
                <div className="feedback-score">
                  <h4>Score: {challenge.submission.score}/100</h4>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* AI Feedback Modal */}
      {showFeedbackModal && feedback && (
        <div
          className="feedback-modal-overlay"
          onClick={() => setShowFeedbackModal(false)}
        >
          <div className="feedback-modal" onClick={(e) => e.stopPropagation()}>
            <div className="feedback-modal-header">
              <h2>🤖 AI Feedback Results</h2>
              <button
                className="modal-close"
                onClick={() => setShowFeedbackModal(false)}
              >
                ×
              </button>
            </div>

            <div className="feedback-modal-body">
              {feedback.score !== undefined && (
                <div className="feedback-score-display">
                  <h3>Your Score</h3>
                  <div
                    className={`score-circle ${
                      feedback.score >= 75 ? 'passing' : 'needs-work'
                    }`}
                  >
                    <span className="score-number">{feedback.score}</span>
                    <span className="score-total">/100</span>
                  </div>

                  {feedback.isResubmission && (
                    <div
                      style={{
                        marginBottom: '15px',
                        padding: '10px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '6px',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '14px', color: '#666' }}>
                        Previous Score: {feedback.previousScore}/100
                        {feedback.improvedScore ? (
                          <span
                            style={{ color: '#4caf50', marginLeft: '10px' }}
                          >
                            ⬆️ Improved by{' '}
                            {feedback.score - feedback.previousScore} points!
                          </span>
                        ) : feedback.score < feedback.previousScore ? (
                          <span
                            style={{ color: '#ff9800', marginLeft: '10px' }}
                          >
                            ⬇️ Lower than previous - keeping your best score of{' '}
                            {feedback.previousScore}
                          </span>
                        ) : (
                          <span style={{ color: '#999', marginLeft: '10px' }}>
                            Same score
                          </span>
                        )}
                      </p>
                    </div>
                  )}

                  {feedback.score >= 75 ? (
                    hasEarnedPoints ? (
                      <p className="score-message">
                        Points already earned on a previous submission!
                      </p>
                    ) : (
                      <p className="score-message success">
                        🎉 Great job! You've passed this challenge and earned
                        points!
                      </p>
                    )
                  ) : (
                    <p className="score-message">
                      Keep working on it! You need 75+ to earn points.{' '}
                      {!hasEarnedPoints && 'You can resubmit to try again!'}
                    </p>
                  )}
                </div>
              )}

              {feedback.feedback_text && (
                <div className="feedback-overall">
                  <h4>Overall Feedback</h4>
                  <p>{feedback.feedback_text}</p>
                </div>
              )}

              {feedback.strengths && feedback.strengths.length > 0 && (
                <div className="feedback-strengths">
                  <h4>✅ Strengths</h4>
                  <ul>
                    {feedback.strengths.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="feedback-improvements">
                  <h4>💡 Areas for Improvement</h4>
                  <ul>
                    {feedback.improvements.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {feedback.suggestions && feedback.suggestions.length > 0 && (
                <div className="feedback-suggestions">
                  <h4>🚀 Next Steps</h4>
                  <ul>
                    {feedback.suggestions.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="feedback-modal-footer">
              <button
                className="btn-primary"
                onClick={() => setShowFeedbackModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ChallengeDetailPage;

import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import AIFeedbackForm from '../components/ai/AIFeedbackForm';
import FeedbackHistory from '../components/ai/FeedbackHistory';
import { apiService } from '../services/api';
import './ChallengeDetailPage.css';

const ChallengeDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchChallenge();
  }, [id]);

  const fetchChallenge = async () => {
    try {
      setLoading(true);
      const response = await apiService.challenges.getById(id);
      setChallenge(response.data || response);
      // Set starter code if available
      if (response.data?.starter_code || response.starter_code) {
        setCode(response.data?.starter_code || response.starter_code);
      }
    } catch (err) {
      console.error('Failed to fetch challenge:', err);
      setError('Failed to load challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!code.trim()) {
      setError('Please write some code before submitting');
      return;
    }

    try {
      setSubmitting(true);
      setError('');

      // Submit the challenge solution
      const response = await apiService.challenges.submit(id, {
        code: code,
        submittedAt: new Date().toISOString(),
      });

      // Get the submission ID from response
      const subId = response.data?.id || response.id || `sub_${Date.now()}`;
      setSubmissionId(subId);

      // Show the AI feedback form
      setShowFeedbackForm(true);
    } catch (err) {
      console.error('Failed to submit challenge:', err);
      setError(err.response?.data?.message || 'Failed to submit challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackReceived = (feedback) => {
    console.log('Feedback received:', feedback);
    // Feedback stays visible - user can manually navigate back
  };

  const handleBackToChallenges = () => {
    navigate('/challenges');
  };

  if (loading) {
    return (
      <DashboardLayout>
        <LoadingSpinner message="Loading challenge..." />
      </DashboardLayout>
    );
  }

  if (error && !challenge) {
    return (
      <DashboardLayout>
        <div className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={() => navigate('/challenges')}>
            Back to Challenges
          </button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="challenge-detail-page">
        {!showFeedbackForm ? (
          <>
            <div className="challenge-header">
              <button
                className="back-button"
                onClick={() => navigate('/challenges')}
              >
                ← Back to Challenges
              </button>
              <h1>{challenge?.title}</h1>
              <div className="challenge-meta">
                <span
                  className={`difficulty ${
                    challenge?.difficulty_level || challenge?.difficulty
                  }`}
                >
                  {challenge?.difficulty_level ||
                    challenge?.difficulty ||
                    'Medium'}
                </span>
                <span className="category">{challenge?.category}</span>
                {challenge?.points_reward && (
                  <span className="points">
                    {challenge.points_reward} points
                  </span>
                )}
              </div>
            </div>

            <div className="challenge-content">
              <div className="challenge-description">
                <h2>Description</h2>
                <p>{challenge?.description}</p>

                {challenge?.instructions && (
                  <>
                    <h3>Instructions</h3>
                    <p>{challenge.instructions}</p>
                  </>
                )}

                {challenge?.hints && challenge.hints.length > 0 && (
                  <>
                    <h3>Hints</h3>
                    <ul>
                      {challenge.hints.map((hint, index) => (
                        <li key={index}>{hint}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>

              <div className="code-editor-section">
                <h2>Your Solution</h2>
                <textarea
                  className="code-editor"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="Write your code here..."
                  rows={20}
                />

                {error && <div className="error-message">{error}</div>}

                <div className="action-buttons">
                  <button
                    className="submit-button"
                    onClick={handleSubmit}
                    disabled={submitting || !code.trim()}
                  >
                    {submitting
                      ? 'Submitting...'
                      : '✨ Submit & Get AI Feedback'}
                  </button>
                </div>
              </div>

              <FeedbackHistory challengeId={id} />
            </div>
          </>
        ) : (
          <div className="feedback-section">
            <button className="back-button" onClick={handleBackToChallenges}>
              ← Back to Challenges
            </button>
            <div className="feedback-header">
              <h2>Get AI Feedback on Your Solution</h2>
              <p>Submit your code to receive detailed AI-powered feedback</p>
            </div>

            <AIFeedbackForm
              submissionId={submissionId}
              challengeTitle={challenge?.title}
              challengeDescription={challenge?.description}
              onFeedbackReceived={handleFeedbackReceived}
              initialCode={code}
            />

            <div className="feedback-actions">
              <button
                className="btn-secondary"
                onClick={handleBackToChallenges}
              >
                ✓ Done - Back to Challenges
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChallengeDetailPage;

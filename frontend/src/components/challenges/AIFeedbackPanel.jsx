import React, { useState, useEffect } from 'react';
import './AIFeedbackPanel.css';

/**
 * AI Feedback Panel Component
 * Story 3.4 & 3.5: Submit work for AI feedback and display results
 */
const AIFeedbackPanel = ({ challengeId, submissionId = null }) => {
  const [submissionText, setSubmissionText] = useState('');
  const [submissionType, setSubmissionType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [feedbackHistory, setFeedbackHistory] = useState([]);
  const [error, setError] = useState(null);
  const [followUpQuestion, setFollowUpQuestion] = useState('');
  const [followUpAnswer, setFollowUpAnswer] = useState(null);
  const [followUpLoading, setFollowUpLoading] = useState(false);

  useEffect(() => {
    if (submissionId) {
      loadFeedbackHistory();
    }
  }, [submissionId]);

  const loadFeedbackHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai/feedback/${submissionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (response.ok) {
        setFeedbackHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to load feedback history:', err);
    }
  };

  const handleSubmitForFeedback = async (e) => {
    e.preventDefault();

    if (!submissionText.trim()) {
      setError('Please enter your submission');
      return;
    }

    setLoading(true);
    setError(null);
    setFeedback(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/submitForFeedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          submissionId,
          submissionText,
          challengeId,
          submissionType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get feedback');
      }

      setFeedback(data.feedback);
      setSubmissionText('');

      // Reload history if we have a submission ID
      if (submissionId) {
        loadFeedbackHistory();
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowUpQuestion = async (feedbackId) => {
    if (!followUpQuestion.trim()) {
      return;
    }

    setFollowUpLoading(true);
    setFollowUpAnswer(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/ai/feedback/${feedbackId}/followup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question: followUpQuestion
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get answer');
      }

      setFollowUpAnswer(data.answer);
      setFollowUpQuestion('');
    } catch (err) {
      setError(err.message);
    } finally {
      setFollowUpLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-medium';
    return 'score-low';
  };

  return (
    <div className="ai-feedback-panel">
      <h3>🤖 AI Feedback Assistant</h3>

      {/* Submission Form */}
      <form onSubmit={handleSubmitForFeedback} className="ai-feedback-form">
        <div className="form-group">
          <label htmlFor="submissionType">Submission Type</label>
          <select
            id="submissionType"
            value={submissionType}
            onChange={(e) => setSubmissionType(e.target.value)}
          >
            <option value="text">Text</option>
            <option value="code">Code</option>
            <option value="link">Link/URL</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="submissionText">Your Submission</label>
          <textarea
            id="submissionText"
            value={submissionText}
            onChange={(e) => setSubmissionText(e.target.value)}
            placeholder={
              submissionType === 'code'
                ? 'Paste your code here...'
                : submissionType === 'link'
                ? 'Enter the URL to your work...'
                : 'Describe your work or solution...'
            }
            rows="8"
            required
          />
        </div>

        {error && <div className="ai-feedback-error">{error}</div>}

        <button
          type="submit"
          className="ai-feedback-submit-btn"
          disabled={loading}
        >
          {loading ? '⏳ Analyzing...' : '✨ Get AI Feedback'}
        </button>
      </form>

      {/* Current Feedback Display */}
      {feedback && (
        <div className="ai-feedback-result">
          <h4>📊 Feedback Results</h4>

          <div className="feedback-score">
            <div className={`score-circle ${getScoreColor(feedback.score)}`}>
              <span className="score-value">{feedback.score}</span>
              <span className="score-label">/ 100</span>
            </div>
            <div className="confidence-bar">
              <div className="confidence-label">
                Confidence: {Math.round(feedback.confidence_score * 100)}%
              </div>
              <div className="confidence-progress">
                <div
                  className="confidence-fill"
                  style={{ width: `${feedback.confidence_score * 100}%` }}
                />
              </div>
            </div>
          </div>

          <div className="feedback-section">
            <h5>💬 Overall Feedback</h5>
            <p>{feedback.feedback_text}</p>
          </div>

          {feedback.strengths && feedback.strengths.length > 0 && (
            <div className="feedback-section strengths">
              <h5>✅ Strengths</h5>
              <ul>
                {feedback.strengths.map((strength, index) => (
                  <li key={index}>{strength}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.improvements && feedback.improvements.length > 0 && (
            <div className="feedback-section improvements">
              <h5>🔧 Areas for Improvement</h5>
              <ul>
                {feedback.improvements.map((improvement, index) => (
                  <li key={index}>{improvement}</li>
                ))}
              </ul>
            </div>
          )}

          {feedback.suggestions && feedback.suggestions.length > 0 && (
            <div className="feedback-section suggestions">
              <h5>💡 Suggestions</h5>
              <ul>
                {feedback.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Follow-up Questions */}
          <div className="feedback-followup">
            <h5>❓ Have a follow-up question?</h5>
            <div className="followup-input-group">
              <input
                type="text"
                value={followUpQuestion}
                onChange={(e) => setFollowUpQuestion(e.target.value)}
                placeholder="Ask a question about this feedback..."
              />
              <button
                onClick={() => handleFollowUpQuestion(feedback.id)}
                disabled={followUpLoading || !followUpQuestion.trim()}
              >
                {followUpLoading ? 'Asking...' : 'Ask'}
              </button>
            </div>
            {followUpAnswer && (
              <div className="followup-answer">
                <strong>Answer:</strong>
                <p>{followUpAnswer}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Feedback History */}
      {feedbackHistory.length > 0 && (
        <div className="ai-feedback-history">
          <h4>📜 Feedback History</h4>
          {feedbackHistory.map((item, index) => (
            <div key={item.id} className="history-item">
              <div className="history-header">
                <span className="history-date">
                  {new Date(item.created_at).toLocaleDateString()} at{' '}
                  {new Date(item.created_at).toLocaleTimeString()}
                </span>
                <span className="history-model">{item.ai_model}</span>
              </div>
              <p className="history-feedback">{item.feedback_text}</p>
              {item.strengths && item.strengths.length > 0 && (
                <div className="history-strengths">
                  <strong>Strengths:</strong> {item.strengths.join(', ')}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AIFeedbackPanel;

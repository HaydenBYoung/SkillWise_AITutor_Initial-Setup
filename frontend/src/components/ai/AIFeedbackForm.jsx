// Story 3.4: AI Feedback Submission Form
import { useState } from 'react';
import { apiService } from '../../services/api';
import './AIFeedbackForm.css';

const AIFeedbackForm = ({
  submissionId,
  challengeTitle,
  challengeDescription,
  onFeedbackReceived,
  initialCode = '',
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [submissionCode, setSubmissionCode] = useState(initialCode);
  const [feedback, setFeedback] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setSubmissionCode(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!submissionCode.trim()) {
      setError('Please provide code to review');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.ai.submitForFeedback({
        submissionId: submissionId || Date.now(), // Use timestamp if no submissionId
        submissionCode,
        challengeTitle: challengeTitle || 'Code Review',
        challengeDescription: challengeDescription || '',
      });

      setFeedback(response.data);

      if (onFeedbackReceived) {
        onFeedbackReceived(response.data);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to get AI feedback');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFeedback(null);
    setError(null);
    setSubmissionCode('');
    setSelectedFile(null);
  };

  return (
    <div className="ai-feedback-form">
      <div className="form-header">
        <h3>🤖 Get AI Feedback</h3>
        <p>Submit your code for instant AI-powered review and suggestions</p>
      </div>

      {!feedback ? (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="file-input">Upload Code File (optional)</label>
            <input
              id="file-input"
              type="file"
              accept=".js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.html,.css"
              onChange={handleFileChange}
              className="file-input"
            />
            {selectedFile && (
              <p className="file-name">📄 {selectedFile.name}</p>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="code-input">
              Your Code {selectedFile ? '(from file)' : ''}
            </label>
            <textarea
              id="code-input"
              value={submissionCode}
              onChange={(e) => setSubmissionCode(e.target.value)}
              placeholder="Paste your code here..."
              rows={15}
              className="code-textarea"
              required
            />
          </div>

          {error && <div className="alert alert-error">{error}</div>}

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading || !submissionCode.trim()}
            >
              {loading ? '🔄 Analyzing...' : '✨ Get AI Feedback'}
            </button>
          </div>
        </form>
      ) : (
        <div className="feedback-results">
          <div className="feedback-header">
            <h4>📊 AI Feedback Results</h4>
            <div className="confidence-score">
              <span>Confidence:</span>
              <div className="score-bar">
                <div
                  className="score-fill"
                  style={{ width: `${(feedback.confidenceScore || 0) * 100}%` }}
                ></div>
              </div>
              <span className="score-value">
                {((feedback.confidenceScore || 0) * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="feedback-content">
            <div className="feedback-section">
              <h5>📝 Overall Feedback</h5>
              <p>{feedback.feedbackText}</p>
            </div>

            {feedback.strengths && feedback.strengths.length > 0 && (
              <div className="feedback-section strengths">
                <h5>💪 Strengths</h5>
                <ul>
                  {feedback.strengths.map((strength, index) => (
                    <li key={index}>{strength}</li>
                  ))}
                </ul>
              </div>
            )}

            {feedback.improvements && feedback.improvements.length > 0 && (
              <div className="feedback-section improvements">
                <h5>🎯 Areas for Improvement</h5>
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

            {feedback.aiModel && (
              <div className="feedback-meta">
                <small>
                  Generated by {feedback.aiModel} in {feedback.processingTime}ms
                </small>
              </div>
            )}
          </div>

          <div className="form-actions">
            <button onClick={handleReset} className="btn btn-secondary">
              ← Submit Another
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIFeedbackForm;

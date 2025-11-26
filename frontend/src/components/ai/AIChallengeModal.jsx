// Story 3.1: AI Challenge Generation Button + Modal
import { useState } from 'react';
import { apiService } from '../../services/api';
import './AIChallengeModal.css';

const AIChallengeModal = ({ isOpen, onClose, onChallengeCreated }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedChallenge, setGeneratedChallenge] = useState(null);
  const [formData, setFormData] = useState({
    skill: 'JavaScript',
    difficulty: 'intermediate',
    topic: 'general programming',
    type: 'coding',
  });

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiService.ai.generateChallenge(formData);
      setGeneratedChallenge(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate challenge');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveChallenge = () => {
    if (generatedChallenge && onChallengeCreated) {
      onChallengeCreated(generatedChallenge);
    }
    handleClose();
  };

  const handleClose = () => {
    setGeneratedChallenge(null);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={handleClose}>
      <div
        className="modal-content ai-challenge-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>🤖 Generate AI Challenge</h2>
          <button className="modal-close" onClick={handleClose}>
            &times;
          </button>
        </div>

        <div className="modal-body">
          {!generatedChallenge ? (
            <>
              <div className="form-group">
                <label htmlFor="skill">Programming Language/Skill</label>
                <select
                  id="skill"
                  name="skill"
                  value={formData.skill}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="JavaScript">JavaScript</option>
                  <option value="Python">Python</option>
                  <option value="Java">Java</option>
                  <option value="C++">C++</option>
                  <option value="React">React</option>
                  <option value="Node.js">Node.js</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="difficulty">Difficulty Level</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="topic">Topic/Focus Area</label>
                <input
                  id="topic"
                  name="topic"
                  type="text"
                  value={formData.topic}
                  onChange={handleInputChange}
                  className="form-control"
                  placeholder="e.g., arrays, async programming, data structures"
                />
              </div>

              <div className="form-group">
                <label htmlFor="type">Challenge Type</label>
                <select
                  id="type"
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="coding">Coding Problem</option>
                  <option value="algorithm">Algorithm</option>
                  <option value="debugging">Debugging</option>
                  <option value="optimization">Code Optimization</option>
                </select>
              </div>

              {error && <div className="alert alert-error">{error}</div>}
            </>
          ) : (
            <div className="generated-challenge">
              <h3>{generatedChallenge.title}</h3>
              <div className="challenge-meta">
                <span className="badge">{generatedChallenge.difficulty}</span>
                <span className="badge">{generatedChallenge.category}</span>
                {generatedChallenge.estimatedTime && (
                  <span className="time">
                    ⏱️ {generatedChallenge.estimatedTime} min
                  </span>
                )}
              </div>
              <div className="challenge-description">
                <p>{generatedChallenge.description}</p>
              </div>
              {generatedChallenge.examples &&
                generatedChallenge.examples.length > 0 && (
                  <div className="challenge-examples">
                    <h4>Examples:</h4>
                    {generatedChallenge.examples.map((example, index) => (
                      <div key={index} className="example">
                        <strong>Input:</strong> {example.input}
                        <br />
                        <strong>Output:</strong> {example.output}
                      </div>
                    ))}
                  </div>
                )}
              {generatedChallenge.acceptanceCriteria && (
                <div className="challenge-criteria">
                  <h4>Acceptance Criteria:</h4>
                  <ul>
                    {generatedChallenge.acceptanceCriteria.map(
                      (criterion, index) => (
                        <li key={index}>{criterion}</li>
                      )
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {!generatedChallenge ? (
            <>
              <button
                className="btn btn-secondary"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? 'Generating...' : '✨ Generate Challenge'}
              </button>
            </>
          ) : (
            <>
              <button
                className="btn btn-secondary"
                onClick={() => setGeneratedChallenge(null)}
              >
                ← Generate Another
              </button>
              <button className="btn btn-primary" onClick={handleSaveChallenge}>
                ✓ Use This Challenge
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIChallengeModal;

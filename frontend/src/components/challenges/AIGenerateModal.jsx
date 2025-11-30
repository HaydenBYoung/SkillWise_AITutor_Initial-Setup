import React, { useState } from 'react';
import './AIGenerateModal.css';

/**
 * AI Challenge Generation Modal Component
 * Story 3.1 & 3.3: Modal for generating AI challenges with customization
 */
const AIGenerateModal = ({ isOpen, onClose, onGenerateSuccess, goalId = null, userGoals = [] }) => {
  const [formData, setFormData] = useState({
    difficulty: 'medium',
    focusAreas: '',
    count: 1,
    selectedGoalId: goalId || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [generatedChallenges, setGeneratedChallenges] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);

  const categories = [
    'JavaScript',
    'React',
    'Node.js',
    'Python',
    'Data Structures',
    'Algorithms',
    'Web Development',
    'Backend Development',
    'Database',
    'DevOps',
    'Testing',
    'Security'
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGenerate = async () => {
    if (!formData.selectedGoalId) {
      setError('Please select a goal');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('access_token');
      
      const response = await fetch('/api/ai/generateChallenge', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          difficulty: formData.difficulty,
          focusAreas: formData.focusAreas,
          count: formData.count,
          goalId: formData.selectedGoalId
        })
      });

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', text);
        throw new Error('Server returned an invalid response. Please check the console for details.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || 'Failed to generate challenges');
      }

      setGeneratedChallenges(data.challenges);
    } catch (err) {
      console.error('Generate error:', err);
      setError(err.message || 'Failed to generate challenges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditChallenge = (index) => {
    setEditingIndex(index);
  };

  const handleUpdateChallenge = (index, field, value) => {
    const updated = [...generatedChallenges];
    updated[index] = {
      ...updated[index],
      [field]: value
    };
    setGeneratedChallenges(updated);
  };

  const handleSaveChallenge = async (challenge, index) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch('/api/ai/challenges/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          challenge,
          goalId: formData.selectedGoalId || null
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save challenge');
      }

      // Remove saved challenge from the list
      const updated = generatedChallenges.filter((_, i) => i !== index);
      setGeneratedChallenges(updated);

      if (onGenerateSuccess) {
        onGenerateSuccess(data.challenge);
      }

      // Close modal if all challenges are saved
      if (updated.length === 0) {
        handleClose();
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleClose = () => {
    setFormData({
      category: '',
      difficulty: 'medium',
      focusAreas: '',
      count: 1
    });
    setGeneratedChallenges([]);
    setError(null);
    setEditingIndex(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="ai-modal-overlay" onClick={handleClose}>
      <div className="ai-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="ai-modal-header">
          <h2>🤖 Generate AI Challenge</h2>
          <button className="ai-modal-close" onClick={handleClose}>&times;</button>
        </div>

        <div className="ai-modal-body">
          {generatedChallenges.length === 0 ? (
            // Generation Form
            <div className="ai-generation-form">
              <div className="form-group">
                <label htmlFor="selectedGoalId">Select Goal *</label>
                <select
                  id="selectedGoalId"
                  name="selectedGoalId"
                  value={formData.selectedGoalId}
                  onChange={handleInputChange}
                  required
                >
                  <option value="">Select a goal...</option>
                  {userGoals.map(goal => (
                    <option key={goal.id} value={goal.id}>
                      {goal.title} - {goal.difficulty || 'Medium'}
                    </option>
                  ))}
                </select>
                <small>Challenges will be generated based on this goal's content</small>
              </div>

              <div className="form-group">
                <label htmlFor="difficulty">Difficulty Level</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="focusAreas">Additional Focus Areas (optional)</label>
                <input
                  type="text"
                  id="focusAreas"
                  name="focusAreas"
                  value={formData.focusAreas}
                  onChange={handleInputChange}
                  placeholder="e.g., loops, async/await, REST APIs"
                />
                <small>Add specific topics to focus on beyond the goal description</small>
              </div>

              <div className="form-group">
                <label htmlFor="count">Number of Challenges</label>
                <input
                  type="number"
                  id="count"
                  name="count"
                  value={formData.count}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                />
                <small>Generate 1-5 challenges at once</small>
              </div>

              {error && <div className="ai-error">{error}</div>}

              <button
                className="ai-generate-btn"
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? '✨ Generating...' : '✨ Generate Challenges'}
              </button>
            </div>
          ) : (
            // Generated Challenges Display
            <div className="ai-generated-challenges">
              <p className="ai-success-message">
                ✅ Generated {generatedChallenges.length} challenge(s). Review and save them below:
              </p>

              {generatedChallenges.map((challenge, index) => (
                <div key={index} className="ai-challenge-card">
                  {editingIndex === index ? (
                    // Editing Mode
                    <div className="ai-challenge-edit">
                      <div className="form-group">
                        <label>Title</label>
                        <input
                          type="text"
                          value={challenge.title}
                          onChange={(e) => handleUpdateChallenge(index, 'title', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label>Description</label>
                        <textarea
                          value={challenge.description}
                          onChange={(e) => handleUpdateChallenge(index, 'description', e.target.value)}
                          rows="3"
                        />
                      </div>
                      <div className="form-group">
                        <label>Instructions</label>
                        <textarea
                          value={challenge.instructions}
                          onChange={(e) => handleUpdateChallenge(index, 'instructions', e.target.value)}
                          rows="4"
                        />
                      </div>
                      <div className="ai-challenge-actions">
                        <button
                          className="ai-btn-secondary"
                          onClick={() => setEditingIndex(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className="ai-btn-primary"
                          onClick={() => setEditingIndex(null)}
                        >
                          Done Editing
                        </button>
                      </div>
                    </div>
                  ) : (
                    // Display Mode
                    <>
                      <div className="ai-challenge-header">
                        <h3>{challenge.title}</h3>
                        <span className={`difficulty-badge ${challenge.difficulty_level}`}>
                          {challenge.difficulty_level}
                        </span>
                      </div>
                      <p className="ai-challenge-description">{challenge.description}</p>
                      <div className="ai-challenge-instructions">
                        <strong>Instructions:</strong>
                        <p>{challenge.instructions}</p>
                      </div>
                      <div className="ai-challenge-meta">
                        <span>⏱️ {challenge.estimated_time_minutes} min</span>
                        <span>🎯 {challenge.points_reward} points</span>
                        <span>🏷️ {challenge.tags?.join(', ')}</span>
                      </div>
                      <div className="ai-challenge-actions">
                        <button
                          className="ai-btn-secondary"
                          onClick={() => handleEditChallenge(index)}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          className="ai-btn-primary"
                          onClick={() => handleSaveChallenge(challenge, index)}
                        >
                          💾 Save Challenge
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}

              <button className="ai-generate-more-btn" onClick={() => setGeneratedChallenges([])}>
                ← Generate More Challenges
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AIGenerateModal;

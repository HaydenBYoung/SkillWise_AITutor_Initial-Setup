import React, { useState } from 'react';
import { apiService } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';

const defaultResponseShape = {
  title: '',
  description: '',
  instructions: '',
  tags: [],
  difficulty: '',
};

const GenerateChallengeModal = ({ onClose }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('General');
  const [difficulty, setDifficulty] = useState('medium');
  const [learningObjectives, setLearningObjectives] = useState('');
  const [constraints, setConstraints] = useState('');
  const [examples, setExamples] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setLoading(true);

    const payload = {
      title: title || undefined,
      category: category || undefined,
      difficulty: difficulty || undefined,
      learningObjectives: learningObjectives
        ? learningObjectives
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
      constraints: constraints || undefined,
      examples: examples
        ? examples
            .split('\n---\n')
            .map((s) => s.trim())
            .filter(Boolean)
        : [],
    };

    try {
      const resp = await apiService.ai.generateChallenge(payload);
      if (resp && resp.success && resp.data) {
        // backend may return parsed or raw content; prefer parsed
        const parsed = resp.data.parsed || resp.data;
        // try to normalize into expected display fields
        const display = {
          ...defaultResponseShape,
          title:
            parsed.title ||
            parsed?.raw?.title ||
            parsed?.prompt?.title ||
            parsed?.title ||
            '',
          description:
            parsed.description ||
            parsed?.raw?.description ||
            parsed?.description ||
            '',
          instructions: parsed.instructions || parsed?.instructions || '',
          tags: parsed.tags || parsed?.tags || [],
          difficulty: parsed.difficulty || parsed?.difficulty || '',
        };

        setResult(display);
      } else {
        setError((resp && resp.error) || 'AI generation failed');
      }
    } catch (err) {
      setError(err.message || 'Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h3>Generate Challenge</h3>
          <button className="close-btn" onClick={onClose}>
            &times;
          </button>
        </div>

        <form className="modal-body" onSubmit={handleSubmit}>
          <label>
            Title
            <input value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>

          <label>
            Category
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </label>

          <label>
            Difficulty
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>

          <label>
            Learning Objectives (one per line)
            <textarea
              value={learningObjectives}
              onChange={(e) => setLearningObjectives(e.target.value)}
            />
          </label>

          <label>
            Constraints (free text)
            <textarea
              value={constraints}
              onChange={(e) => setConstraints(e.target.value)}
            />
          </label>

          <label>
            Examples (separate examples with a line containing `---`)
            <textarea
              value={examples}
              onChange={(e) => setExamples(e.target.value)}
            />
          </label>

          <div className="modal-actions">
            <button type="submit" disabled={loading} className="primary">
              {loading ? 'Generating...' : 'Generate'}
            </button>
            <button type="button" onClick={onClose} className="secondary">
              Close
            </button>
          </div>

          {loading && (
            <div style={{ marginTop: 12 }}>
              <LoadingSpinner message="Generating challenge via AI..." />
            </div>
          )}

          {error && <div className="error">{error}</div>}

          {result && (
            <div className="ai-result">
              <h4>{result.title || 'Untitled'}</h4>
              <p>
                <strong>Difficulty:</strong> {result.difficulty}
              </p>
              <p>
                <strong>Tags:</strong> {(result.tags || []).join(', ')}
              </p>
              <div>
                <h5>Description</h5>
                <p>{result.description}</p>
              </div>
              <div>
                <h5>Instructions</h5>
                <p>{result.instructions}</p>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default GenerateChallengeModal;

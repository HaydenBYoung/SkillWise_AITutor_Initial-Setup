import React from 'react';

const GoalCard = ({
  goal,
  onEdit,
  onDelete,
  onMarkCompleted,
  onUpdateProgress,
}) => {
  if (!goal) return null;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString();
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy':
        return 'difficulty-easy';
      case 'hard':
        return 'difficulty-hard';
      default:
        return 'difficulty-medium';
    }
  };

  const getProgressColor = (progress) => {
    if (progress >= 100) return 'progress-complete';
    if (progress >= 70) return 'progress-high';
    if (progress >= 30) return 'progress-medium';
    return 'progress-low';
  };

  return (
    <div
      className={`card goal-card ${goal.is_completed ? 'goal-completed' : ''}`}
    >
      <div className="goal-header">
        <div className="goal-title-section">
          <h3>{goal.title}</h3>
          {goal.category && (
            <span className="goal-category">{goal.category}</span>
          )}
        </div>
        <div className="goal-actions">
          <button
            className="btn-icon"
            onClick={() => onEdit?.(goal)}
            title="Edit goal"
          >
            ✏️
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete?.(goal.id)}
            title="Delete goal"
          >
            🗑️
          </button>
        </div>
      </div>

      {goal.description && (
        <div className="goal-description">
          <p>{goal.description}</p>
        </div>
      )}

      <div className="goal-progress">
        <div className="progress-header">
          <span>Progress</span>
          <span className="progress-percentage">
            {goal.progress_percentage || 0}%
          </span>
        </div>
        <div className="progress-bar">
          <div
            className={`progress-fill ${getProgressColor(
              goal.progress_percentage || 0
            )}`}
            style={{ width: `${goal.progress_percentage || 0}%` }}
          />
        </div>
      </div>

      <div className="goal-footer">
        <div className="goal-meta">
          <span
            className={`difficulty-badge ${getDifficultyColor(
              goal.difficulty_level
            )}`}
          >
            {goal.difficulty_level || 'medium'}
          </span>
          {goal.target_completion_date && (
            <span className="goal-date">
              Due: {formatDate(goal.target_completion_date)}
            </span>
          )}
        </div>

        <div className="goal-footer-actions">
          {!goal.is_completed && (
            <>
              <button
                className="btn btn-sm btn-secondary"
                onClick={() => onUpdateProgress?.(goal.id)}
                title="Update progress"
              >
                Update Progress
              </button>
              <button
                className="btn btn-sm btn-primary"
                onClick={() => onMarkCompleted?.(goal.id)}
                title="Mark as completed"
              >
                Complete
              </button>
            </>
          )}
          {goal.is_completed && (
            <span className="completion-badge">
              ✅ Completed {formatDate(goal.completion_date)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default GoalCard;

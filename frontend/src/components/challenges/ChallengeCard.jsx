import React from 'react';

const ChallengeCard = ({
  challenge,
  onSelect,
  onEdit,
  onDelete,
  showActions = false,
}) => {
  if (!challenge) return null;

  const formatTime = (minutes) => {
    if (!minutes) return 'N/A';
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
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

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'status-completed';
      case 'in-progress':
        return 'status-in-progress';
      case 'available':
        return 'status-available';
      default:
        return 'status-available';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'completed':
        return 'Completed';
      case 'in-progress':
        return 'In Progress';
      case 'available':
        return 'Available';
      default:
        return 'Available';
    }
  };

  const getButtonText = (status) => {
    switch (status) {
      case 'completed':
        return 'View Details';
      case 'in-progress':
        return 'Continue';
      case 'available':
        return 'Start Challenge';
      default:
        return 'Start Challenge';
    }
  };

  const getButtonClass = (status) => {
    switch (status) {
      case 'completed':
        return 'btn btn-secondary';
      case 'in-progress':
        return 'btn btn-primary';
      case 'available':
        return 'btn btn-primary';
      default:
        return 'btn btn-primary';
    }
  };

  const formatTags = (tags) => {
    if (!tags || tags.length === 0) return [];
    return Array.isArray(tags) ? tags : [];
  };

  return (
    <div className="card challenge-card">
      <div className="challenge-header">
        <div className="challenge-title-section">
          <h3>{challenge.title}</h3>
          <div className="challenge-meta">
            <span className="challenge-category">{challenge.category}</span>
            <span
              className={`difficulty-badge ${getDifficultyColor(
                challenge.difficulty_level
              )}`}
            >
              {challenge.difficulty_level}
            </span>
            <span
              className={`status-badge ${getStatusColor(challenge.status)}`}
            >
              {getStatusLabel(challenge.status)}
            </span>
          </div>
        </div>

        {showActions && (
          <div className="challenge-actions">
            <button
              className="btn-icon"
              onClick={() => onEdit?.(challenge)}
              title="Edit challenge"
            >
              ✏️
            </button>
            <button
              className="btn-icon"
              onClick={() => onDelete?.(challenge.id)}
              title="Delete challenge"
            >
              🗑️
            </button>
          </div>
        )}
      </div>

      <div className="challenge-description">
        <p>{challenge.description}</p>
      </div>

      <div className="challenge-details">
        <div className="challenge-stat">
          <span className="stat-label">Estimated Time:</span>
          <span className="stat-value">
            {formatTime(challenge.estimated_time_minutes)}
          </span>
        </div>

        <div className="challenge-stat">
          <span className="stat-label">Points Reward:</span>
          <span className="stat-value">
            {challenge.points_reward || 10} pts
          </span>
        </div>

        <div className="challenge-stat">
          <span className="stat-label">Max Attempts:</span>
          <span className="stat-value">{challenge.max_attempts || 3}</span>
        </div>

        {challenge.requires_peer_review && (
          <div className="challenge-feature">
            <span className="feature-badge">👥 Peer Review Required</span>
          </div>
        )}
      </div>

      {formatTags(challenge.tags).length > 0 && (
        <div className="challenge-tags">
          {formatTags(challenge.tags).map((tag, index) => (
            <span key={index} className="tag">
              {tag}
            </span>
          ))}
        </div>
      )}

      <div className="challenge-footer">
        <div className="challenge-date">
          <span>
            Created: {new Date(challenge.created_at).toLocaleDateString()}
          </span>
        </div>

        <button
          className={getButtonClass(challenge.status)}
          onClick={() => onSelect?.(challenge)}
        >
          {getButtonText(challenge.status)}
        </button>
      </div>
    </div>
  );
};

export default ChallengeCard;

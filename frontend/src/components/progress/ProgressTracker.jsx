import React from 'react';
import { ProgressBar } from 'recharts';

const ProgressTracker = ({
  currentProgress = 0,
  totalGoals = 0,
  completedGoals = 0,
  completedChallenges = 0,
  totalChallenges = 0,
  showDetails = true,
  className = '',
}) => {
  const progressPercentage =
    totalGoals > 0 ? Math.round((completedGoals / totalGoals) * 100) : 0;
  const challengePercentage =
    totalChallenges > 0
      ? Math.round((completedChallenges / totalChallenges) * 100)
      : 0;

  const getProgressColor = (percentage) => {
    if (percentage >= 100) return 'var(--success)';
    if (percentage >= 70) return 'var(--primary)';
    if (percentage >= 30) return 'var(--warning)';
    return 'var(--error)';
  };

  const getProgressStatus = (percentage) => {
    if (percentage >= 100) return 'Complete';
    if (percentage >= 70) return 'Excellent';
    if (percentage >= 50) return 'Good';
    if (percentage >= 30) return 'Fair';
    return 'Getting Started';
  };

  return (
    <div
      className={`progress-tracker ${className}`}
      data-testid="progress-tracker"
    >
      <div className="progress-header">
        <h3>Learning Progress</h3>
        <span className="progress-status">
          {getProgressStatus(progressPercentage)}
        </span>
      </div>

      <div className="progress-section">
        <div className="progress-label">
          <span>Goals Progress</span>
          <span className="progress-percentage">{progressPercentage}%</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${progressPercentage}%`,
              backgroundColor: getProgressColor(progressPercentage),
            }}
          />
        </div>
        {showDetails && (
          <div className="progress-details">
            <span>
              {completedGoals} of {totalGoals} goals completed
            </span>
          </div>
        )}
      </div>

      <div className="progress-section">
        <div className="progress-label">
          <span>Challenges Progress</span>
          <span className="progress-percentage">{challengePercentage}%</span>
        </div>
        <div className="progress-bar-container">
          <div
            className="progress-bar-fill"
            style={{
              width: `${challengePercentage}%`,
              backgroundColor: getProgressColor(challengePercentage),
            }}
          />
        </div>
        {showDetails && (
          <div className="progress-details">
            <span>
              {completedChallenges} of {totalChallenges} challenges completed
            </span>
          </div>
        )}
      </div>

      {showDetails && (
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-value">
              {completedGoals + completedChallenges}
            </span>
            <span className="stat-label">Total Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">
              {Math.round(
                ((completedGoals + completedChallenges) /
                  (totalGoals + totalChallenges)) *
                  100
              ) || 0}
              %
            </span>
            <span className="stat-label">Overall Progress</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgressTracker;

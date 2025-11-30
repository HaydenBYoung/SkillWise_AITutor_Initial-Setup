import {} from 'react';

const GoalCard = ({ goal, onComplete, onEdit, onDelete }) => {
  // Goal card displays title, description, progress bar and actions (edit/delete/complete)
  console.log('📊 GoalCard rendering goal:', goal?.id, 'progress:', goal?.progress, 'progress_percentage:', goal?.progress_percentage);
  
  // Calculate point requirements based on difficulty
  const getPointsRequired = (difficulty) => {
    if (difficulty === 'easy') return 20;
    if (difficulty === 'hard') return 80;
    return 50; // medium
  };
  
  const pointsRequired = goal?.points_required || getPointsRequired(goal?.difficulty_level || 'medium');
  const pointsEarned = goal?.points_earned || 0;
  const canComplete = pointsEarned >= pointsRequired;
  
  return (
    <div className="goal-card">
      <div className="goal-header">
        <h3>{goal?.title || 'Goal Title'}</h3>
        <span className="goal-category">{goal?.category || 'Category'}</span>
      </div>

      <div className="goal-actions">
        {!goal.is_completed && goal.status !== 'completed' && (
          <button 
            onClick={() => onComplete(goal.id)} 
            className="btn-success"
            disabled={!canComplete}
            title={!canComplete ? `Need ${pointsRequired - pointsEarned} more points to complete` : 'Mark as complete'}
          >
            {canComplete ? 'Mark Complete' : `${pointsRequired - pointsEarned} pts needed`}
          </button>
        )}
        {onEdit && (
          <button onClick={() => onEdit(goal)} className="btn-secondary">Edit</button>
        )}
        {onDelete && (
          <button onClick={() => onDelete(goal.id)} className="btn-danger">Delete</button>
        )}
      </div>

      <div className="goal-content">
        <p>{goal?.description || 'Goal description goes here...'}</p>

        <div className="goal-progress">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${goal?.progress || 0}%` }}
            ></div>
          </div>
          <span className="progress-text">{goal?.progress || 0}%</span>
        </div>
        
        <div style={{ marginTop: '10px', fontSize: '0.9rem', color: '#666' }}>
          Points: {pointsEarned} / {pointsRequired}
        </div>
      </div>

      <div className="goal-footer">
        <span className="goal-difficulty" style={{ textTransform: 'capitalize' }}>
          {goal?.difficulty_level || goal?.difficulty || 'Medium'}
        </span>
        {goal?.targetDate && (
          <span className="goal-date">Due: {goal.targetDate}</span>
        )}
      </div>
    </div>
  );
};

export default GoalCard;

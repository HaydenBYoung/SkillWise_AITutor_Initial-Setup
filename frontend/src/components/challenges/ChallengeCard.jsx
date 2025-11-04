import React from 'react';
import { Link } from 'react-router-dom';

const ChallengeCard = ({ challenge, onEdit, onDelete }) => {
  const {
    id,
    title,
    description,
    category,
    difficulty_level,
    points_value,
    estimated_time_minutes,
    is_public,
    completion_status,
    progress_percentage = 0,
    created_at,
    goal_id,
  } = challenge;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category) => {
    const colors = {
      'programming': 'bg-blue-100 text-blue-800',
      'web development': 'bg-purple-100 text-purple-800',
      'data science': 'bg-indigo-100 text-indigo-800',
      'algorithms': 'bg-cyan-100 text-cyan-800',
      'database': 'bg-gray-100 text-gray-800',
      'system design': 'bg-pink-100 text-pink-800',
    };
    return colors[category?.toLowerCase()] || 'bg-gray-100 text-gray-800';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'not_started': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'completed': return 'Completed';
      case 'in_progress': return 'In Progress';
      case 'not_started': return 'Not Started';
      default: return 'Not Started';
    }
  };

  const formatTime = (minutes) => {
    if (!minutes) return 'Unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  return (
    <div className={`challenge-card bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow ${
      completion_status === 'completed' ? 'border-green-200 bg-green-50' : 'border-gray-200'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {category && (
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(category)}`}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            )}
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(difficulty_level)}`}>
              {difficulty_level?.charAt(0).toUpperCase() + difficulty_level?.slice(1)}
            </span>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(completion_status)}`}>
              {getStatusText(completion_status)}
            </span>
            {!is_public && (
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                Private
              </span>
            )}
          </div>
          <Link 
            to={`/challenges/${id}`}
            className="block hover:text-blue-600 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
              {title}
            </h3>
          </Link>
        </div>
        
        {/* Actions */}
        <div className="flex items-center gap-2 ml-4">
          <button
            onClick={onEdit}
            className="text-gray-400 hover:text-blue-600 transition-colors"
            title="Edit challenge"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 hover:text-red-600 transition-colors"
            title="Delete challenge"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {description}
        </p>
      )}

      {/* Progress (if in progress) */}
      {completion_status === 'in_progress' && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">{progress_percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-blue-500 transition-all"
              style={{ width: `${progress_percentage}%` }}
            />
          </div>
        </div>
      )}

      {/* Challenge Details */}
      <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{formatTime(estimated_time_minutes)}</span>
        </div>
        <div className="flex items-center text-gray-600">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{points_value || 0} points</span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500 mb-4">
        <div>
          <span>Created {formatDate(created_at)}</span>
        </div>
        {goal_id && (
          <div>
            <Link 
              to={`/goals/${goal_id}`}
              className="text-blue-600 hover:text-blue-800"
            >
              View Goal
            </Link>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {completion_status === 'not_started' && (
          <Link
            to={`/challenges/${id}/attempt`}
            className="flex-1 btn-primary text-center"
          >
            Start Challenge
          </Link>
        )}
        {completion_status === 'in_progress' && (
          <Link
            to={`/challenges/${id}/attempt`}
            className="flex-1 btn-primary text-center"
          >
            Continue
          </Link>
        )}
        {completion_status === 'completed' && (
          <Link
            to={`/challenges/${id}/review`}
            className="flex-1 btn-secondary text-center"
          >
            Review Solution
          </Link>
        )}
        <Link
          to={`/challenges/${id}`}
          className="flex-1 btn-secondary text-center"
        >
          View Details
        </Link>
      </div>
    </div>
  );
};

export default ChallengeCard;

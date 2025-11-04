import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const GoalCard = ({ goal, onEdit, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  const {
    id,
    title,
    description,
    category,
    difficulty_level,
    target_completion_date,
    is_completed,
    progress_percentage = 0,
    total_challenges = 0,
    completed_challenges = 0,
    created_at,
  } = goal;

  const formatDate = (dateString) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getDifficultyStyle = (difficulty) => {
    switch (difficulty) {
      case 'easy': 
        return {
          bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
          text: 'text-green-800',
          emoji: '🟢'
        };
      case 'medium': 
        return {
          bg: 'bg-gradient-to-r from-yellow-100 to-amber-100',
          text: 'text-yellow-800',
          emoji: '🟡'
        };
      case 'hard': 
        return {
          bg: 'bg-gradient-to-r from-orange-100 to-red-100',
          text: 'text-orange-800',
          emoji: '🟠'
        };
      case 'expert': 
        return {
          bg: 'bg-gradient-to-r from-red-100 to-pink-100',
          text: 'text-red-800',
          emoji: '🔴'
        };
      default: 
        return {
          bg: 'bg-gradient-to-r from-gray-100 to-slate-100',
          text: 'text-gray-800',
          emoji: '⚪'
        };
    }
  };

  const getCategoryStyle = (category) => {
    const styles = {
      'programming': {
        bg: 'bg-gradient-to-r from-blue-100 to-indigo-100',
        text: 'text-blue-800',
        emoji: '💻'
      },
      'web development': {
        bg: 'bg-gradient-to-r from-purple-100 to-violet-100',
        text: 'text-purple-800',
        emoji: '🌐'
      },
      'data science': {
        bg: 'bg-gradient-to-r from-indigo-100 to-blue-100',
        text: 'text-indigo-800',
        emoji: '📊'
      },
      'design': {
        bg: 'bg-gradient-to-r from-pink-100 to-rose-100',
        text: 'text-pink-800',
        emoji: '🎨'
      },
      'business': {
        bg: 'bg-gradient-to-r from-gray-100 to-zinc-100',
        text: 'text-gray-800',
        emoji: '💼'
      },
      'marketing': {
        bg: 'bg-gradient-to-r from-green-100 to-emerald-100',
        text: 'text-green-800',
        emoji: '📈'
      },
      'language learning': {
        bg: 'bg-gradient-to-r from-yellow-100 to-amber-100',
        text: 'text-yellow-800',
        emoji: '🗣️'
      },
    };
    return styles[category?.toLowerCase()] || {
      bg: 'bg-gradient-to-r from-gray-100 to-slate-100',
      text: 'text-gray-800',
      emoji: '📁'
    };
  };

  const isOverdue = target_completion_date && 
    new Date(target_completion_date) < new Date() && 
    !is_completed;

  const difficultyStyle = getDifficultyStyle(difficulty_level);
  const categoryStyle = getCategoryStyle(category);

  return (
    <div 
      className={`goal-card group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 p-6 transition-all duration-300 hover:shadow-2xl hover:scale-105 cursor-pointer ${
        is_completed 
          ? 'border-green-300 dark:border-green-600 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20' 
          : isOverdue 
            ? 'border-red-300 dark:border-red-600 bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20' 
            : 'border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-500'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Completed Badge */}
      {is_completed && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-green-400 to-emerald-500 text-white rounded-full p-3 shadow-lg animate-bounce">
          <span className="text-lg">🏆</span>
        </div>
      )}

      {/* Overdue Badge */}
      {isOverdue && (
        <div className="absolute -top-3 -right-3 bg-gradient-to-r from-red-400 to-pink-500 text-white rounded-full p-3 shadow-lg animate-pulse">
          <span className="text-lg">⚠️</span>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3 flex-wrap">
            {category && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${categoryStyle.bg} ${categoryStyle.text} flex items-center gap-1`}>
                <span>{categoryStyle.emoji}</span>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </span>
            )}
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${difficultyStyle.bg} ${difficultyStyle.text} flex items-center gap-1`}>
              <span>{difficultyStyle.emoji}</span>
              {difficulty_level?.charAt(0).toUpperCase() + difficulty_level?.slice(1)}
            </span>
            {is_completed && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 flex items-center gap-1">
                <span>✅</span>
                Completed
              </span>
            )}
            {isOverdue && (
              <span className="px-3 py-1 text-xs font-bold rounded-full bg-gradient-to-r from-red-100 to-pink-100 text-red-800 flex items-center gap-1 animate-pulse">
                <span>⏰</span>
                Overdue
              </span>
            )}
          </div>
          <Link 
            to={`/goals/${id}`}
            className="block hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors group"
          >
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-3 line-clamp-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
              {title}
            </h3>
          </Link>
        </div>
        
        {/* Actions */}
        <div className={`flex items-center gap-2 ml-4 transition-all duration-300 ${isHovered ? 'opacity-100 scale-100' : 'opacity-60 scale-90'}`}>
          <button
            onClick={onEdit}
            className="text-gray-400 dark:text-gray-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors p-2 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50"
            title="Edit goal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={onDelete}
            className="text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-colors p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/50"
            title="Delete goal"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>

      {/* Description */}
      {description && (
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-5 line-clamp-3 leading-relaxed">
          {description}
        </p>
      )}

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
            <span>📊</span>
            Progress
          </span>
          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-lg">
            {progress_percentage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden shadow-inner">
          <div
            className={`h-3 rounded-full transition-all duration-1000 ease-out ${
              is_completed 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                : 'bg-gradient-to-r from-indigo-400 to-purple-500'
            } relative overflow-hidden`}
            style={{ 
              width: `${progress_percentage}%`,
              minWidth: progress_percentage > 0 ? '8px' : '0px'
            }}
          >
            {progress_percentage > 0 && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            )}
          </div>
        </div>
        <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <span>🎯</span>
            {completed_challenges} of {total_challenges} challenges completed
          </span>
        </div>
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
        <div className="flex items-center gap-1">
          <span>📅</span>
          <span>Created {formatDate(created_at)}</span>
        </div>
        {target_completion_date && (
          <div className={`flex items-center gap-1 ${isOverdue ? 'text-red-600 font-semibold' : ''}`}>
            <span>{isOverdue ? '⚠️' : '🎯'}</span>
            <span>Target: {formatDate(target_completion_date)}</span>
          </div>
        )}
      </div>

      {/* Enhanced Action Buttons */}
      <div className="flex gap-3">
        <Link
          to={`/goals/${id}`}
          className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-medium py-3 px-4 rounded-xl text-center transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
        >
          <span>👁️</span>
          <span>View Details</span>
        </Link>
        <Link
          to={`/goals/${id}/challenges`}
          className="flex-1 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-medium py-3 px-4 rounded-xl text-center transition-all duration-200 hover:scale-105 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
        >
          <span>⚡</span>
          <span>Challenges</span>
        </Link>
      </div>
    </div>
  );
};

export default GoalCard;

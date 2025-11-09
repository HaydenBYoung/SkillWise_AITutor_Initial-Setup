import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useForm } from 'react-hook-form';
import { goalService } from '../services/goalService';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sortBy, setSortBy] = useState('newest');
  const [filterCategory, setFilterCategory] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm();

  // Fetch goals on component mount
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalService.getGoals();
      console.log('Goals response:', response);
      
      if (response.success) {
        setGoals(response.data.goals || response.data || []);
      } else {
        setGoals([]);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
      setGoals([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (formData) => {
    try {
      setSubmitting(true);
      console.log('Submitting goal:', formData);
      
      const response = await goalService.createGoal(formData);
      console.log('Create goal response:', response);
      
      if (response.success) {
        toast.success('🎯 Goal created successfully!');
        setGoals(prev => [response.data, ...prev]);
        setShowForm(false);
        reset();
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error(error.response?.data?.error || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await goalService.deleteGoal(goalId);
      
      // Update state immediately to remove goal from UI
      setGoals(prev => prev.filter(goal => goal.id !== goalId));
      toast.success('Goal deleted successfully');
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error('Failed to delete goal. Please try again.');
    }
  };

  const handleToggleCompletion = async (goalId, currentStatus) => {
    try {
      await goalService.toggleGoalCompletion(goalId, !currentStatus);
      setGoals(prev => prev.map(goal => 
        goal.id === goalId 
          ? { ...goal, is_completed: !currentStatus }
          : goal
      ));
      toast.success(currentStatus ? 'Goal marked as incomplete' : 'Goal completed! 🎉');
    } catch (error) {
      console.error('Error toggling goal completion:', error);
      toast.error('Failed to update goal status');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
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
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const sortedAndFilteredGoals = goals
    .filter(goal => !filterCategory || goal.category === filterCategory)
    .sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at) - new Date(a.created_at);
        case 'oldest':
          return new Date(a.created_at) - new Date(b.created_at);
        case 'difficulty-easy':
          const difficultyOrder = { easy: 1, medium: 2, hard: 3 };
          return difficultyOrder[a.difficulty_level] - difficultyOrder[b.difficulty_level];
        case 'difficulty-hard':
          const difficultyOrderDesc = { hard: 1, medium: 2, easy: 3 };
          return difficultyOrderDesc[a.difficulty_level] - difficultyOrderDesc[b.difficulty_level];
        default:
          return 0;
      }
    });

  const categories = [...new Set(goals.map(goal => goal.category).filter(Boolean))];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🎯 My Learning Goals
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your learning journey and measure your progress
          </p>
        </div>

        {/* Create Goal Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            {showForm ? '✕ Cancel' : '➕ Create New Goal'}
          </button>
        </div>

        {/* Goal Creation Form */}
        {showForm && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Create New Goal</h2>
            
            <form onSubmit={handleSubmit(handleCreateGoal)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Goal Title *
                </label>
                <input
                  type="text"
                  {...register('title', { 
                    required: 'Title is required',
                    minLength: { value: 3, message: 'Title must be at least 3 characters' }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., Learn Python Fundamentals"
                />
                {errors.title && (
                  <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  {...register('description')}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Describe what you want to achieve..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    {...register('category', { required: 'Category is required' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select Category</option>
                    <option value="programming">Programming</option>
                    <option value="web development">Web Development</option>
                    <option value="data science">Data Science</option>
                    <option value="databases">Databases</option>
                    <option value="design">Design</option>
                    <option value="business">Business</option>
                  </select>
                  {errors.category && (
                    <p className="text-red-500 text-sm mt-1">{errors.category.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Difficulty
                  </label>
                  <select
                    {...register('difficulty_level')}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Date
                  </label>
                  <input
                    type="date"
                    {...register('target_completion_date')}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-6 py-2 rounded-md font-medium transition-colors"
                >
                  {submitting ? 'Creating...' : '✓ Create Goal'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Filters */}
        {goals.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-6 border border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-4 items-center">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort by
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="difficulty-easy">Difficulty: Easy to Hard</option>
                  <option value="difficulty-hard">Difficulty: Hard to Easy</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Filter by Category
                </label>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Goals List */}
        {sortedAndFilteredGoals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedAndFilteredGoals.map((goal) => (
              <div
                key={goal.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 border-2 transition-all hover:shadow-xl ${
                  goal.is_completed 
                    ? 'border-green-300 bg-green-50 dark:bg-green-900/20' 
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Goal Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getDifficultyColor(goal.difficulty_level)}`}>
                        {goal.difficulty_level?.charAt(0).toUpperCase() + goal.difficulty_level?.slice(1)}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                        {goal.category?.charAt(0).toUpperCase() + goal.category?.slice(1)}
                      </span>
                      {goal.is_completed && (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {goal.title}
                    </h3>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleToggleCompletion(goal.id, goal.is_completed)}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1 ${
                        goal.is_completed 
                          ? 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300' 
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-300'
                      }`}
                      title={goal.is_completed ? 'Mark as incomplete' : 'Mark as complete'}
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {goal.is_completed ? 'Completed' : 'Complete'}
                    </button>
                    <button
                      onClick={() => handleDeleteGoal(goal.id)}
                      className="px-3 py-1 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 border border-red-300 transition-all duration-200 flex items-center gap-1"
                      title="Delete goal"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Description */}
                {goal.description && (
                  <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">
                    {goal.description}
                  </p>
                )}

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                      {goal.progress || 0}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
                    <div
                      className="h-2.5 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500 ease-out"
                      style={{ width: `${goal.progress || 0}%` }}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-2 text-xs text-gray-500 dark:text-gray-400">
                    <span>
                      📚 {goal.completedChallenges || 0} / {goal.totalChallenges || 0} challenges
                    </span>
                    <span className="text-blue-600 dark:text-blue-400 font-medium">
                      {goal.progress >= 100 ? '🎉 Complete!' : '⚡ In Progress'}
                    </span>
                  </div>
                </div>

                {/* Footer */}
                <div className="text-sm text-gray-500 dark:text-gray-400 space-y-1">
                  <div>Created: {formatDate(goal.created_at)}</div>
                  <div>Target: {formatDate(goal.target_completion_date)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No goals added yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Start your learning journey by creating your first goal!
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              ➕ Create Your First Goal
            </button>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No goals match your filters
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try adjusting your filters or create a new goal.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage;

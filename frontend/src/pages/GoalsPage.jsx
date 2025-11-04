import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import GoalCard from '../components/goals/GoalCard';
import GoalForm from '../components/goals/GoalForm';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfettiCelebration from '../components/common/ConfettiCelebration';
import { useAuth } from '../hooks/useAuth';
import { goalsApi } from '../services/api';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    difficulty: '',
  });
  const { user } = useAuth();

  // Fetch goals on component mount
  useEffect(() => {
    fetchGoals();
  }, []);

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const response = await goalsApi.getGoals();
      if (response.success) {
        setGoals(response.data);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = async (goalData) => {
    try {
      setSubmitting(true);
      const response = await goalsApi.createGoal(goalData);
      if (response.success) {
        setGoals(prev => [response.data, ...prev]);
        setShowForm(false);
        
        // 🎉 CELEBRATION PRESERVED! 🎉
        setShowCelebration(true);
        toast.success('🎯 Amazing! Your new goal is ready to conquer!', {
          duration: 4000,
          icon: '🚀',
        });
      }
    } catch (error) {
      console.error('Error creating goal:', error);
      toast.error(error.response?.data?.message || 'Failed to create goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateGoal = async (goalData) => {
    try {
      setSubmitting(true);
      const response = await goalsApi.updateGoal(editingGoal.id, goalData);
      if (response.success) {
        setGoals(prev => prev.map(goal => 
          goal.id === editingGoal.id ? response.data : goal
        ));
        setEditingGoal(null);
        
        // Check if goal was completed and trigger celebration 🏆
        if (response.data.is_completed && !editingGoal.is_completed) {
          setShowCelebration(true);
          toast.success('🏆 GOAL COMPLETED! You\'re unstoppable!', {
            duration: 5000,
            icon: '🎊',
          });
        } else {
          toast.success('✨ Goal updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error updating goal:', error);
      toast.error(error.response?.data?.message || 'Failed to update goal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!confirm('Are you sure you want to delete this goal? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await goalsApi.deleteGoal(goalId);
      if (response.success) {
        setGoals(prev => prev.filter(goal => goal.id !== goalId));
        toast.success('Goal deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting goal:', error);
      toast.error(error.response?.data?.message || 'Failed to delete goal');
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingGoal(null);
  };

  const filteredGoals = goals.filter(goal => {
    if (filters.category && goal.category !== filters.category) return false;
    if (filters.difficulty && goal.difficulty_level !== filters.difficulty) return false;
    if (filters.status) {
      if (filters.status === 'completed' && !goal.is_completed) return false;
      if (filters.status === 'active' && goal.is_completed) return false;
    }
    return true;
  });

  const categories = [...new Set(goals.map(goal => goal.category).filter(Boolean))];
  const completedGoals = goals.filter(goal => goal.is_completed).length;
  const averageProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + (goal.progress_percentage || 0), 0) / goals.length)
    : 0;

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
      {/* 🎉 CELEBRATION PRESERVED! 🎉 */}
      {showCelebration && (
        <ConfettiCelebration onComplete={() => setShowCelebration(false)} />
      )}
      
      <div className="goals-page relative">
        {/* Enhanced Page Header with Gradient Background */}
        <div className="page-header mb-8 p-8 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 dark:from-indigo-600 dark:via-purple-600 dark:to-pink-600 text-white shadow-xl">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white mb-2">
                🎯 My Learning Goals
              </h1>
              <div className="flex items-center space-x-6 text-white/90 dark:text-white/95">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <span className="font-medium">{goals.length} goals</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🏆</span>
                  <span className="font-medium">{completedGoals} completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📈</span>
                  <span className="font-medium">{averageProgress}% average progress</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white dark:bg-gray-100 text-indigo-600 dark:text-indigo-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              disabled={showForm}
            >
              <span className="text-xl">✨</span>
              <span>Create New Goal</span>
            </button>
          </div>
        </div>

        {/* Enhanced Goal Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto shadow-2xl animate-slideUp">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl">{editingGoal ? '✏️' : '🎯'}</span>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {editingGoal ? 'Edit Goal' : 'Create New Goal'}
                  </h2>
                </div>
                <GoalForm
                  goal={editingGoal}
                  onSubmit={editingGoal ? handleUpdateGoal : handleCreateGoal}
                  onCancel={handleCancelForm}
                  isLoading={submitting}
                />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters with Glass Effect */}
        <div className="goals-filters bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-xl shadow-lg mb-8 border border-white/20 dark:border-gray-600/20">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🔍</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filter Goals</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📁 Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="form-select w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📊 Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-select w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="active">🔥 Active</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                ⚡ Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="form-select w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-indigo-500 dark:focus:border-indigo-400 transition-colors"
              >
                <option value="">All Difficulties</option>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🟠 Hard</option>
                <option value="expert">🔴 Expert</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ category: '', status: '', difficulty: '' })}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Goals Grid */}
        <div className="goals-grid">
          {filteredGoals.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredGoals.map((goal, index) => (
                <div 
                  key={goal.id}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <GoalCard
                    goal={goal}
                    onEdit={() => handleEditGoal(goal)}
                    onDelete={() => handleDeleteGoal(goal.id)}
                  />
                </div>
              ))}
            </div>
          ) : goals.length === 0 ? (
            <div className="empty-state text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <span className="text-6xl">🎯</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Ready to Start Your Journey?</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto text-lg">
                Create your first learning goal to start tracking your progress and organizing your challenges. 
                Every expert was once a beginner! 🚀
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                ✨ Create Your First Goal
              </button>
            </div>
          ) : (
            <div className="empty-state text-center py-16 bg-white rounded-2xl shadow-lg">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <span className="text-6xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No Goals Match Your Filters</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                Try adjusting your filters to discover more goals, or create a new one!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setFilters({ category: '', status: '', difficulty: '' })}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                >
                  🗑️ Clear Filters
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  ✨ Create New Goal
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage;

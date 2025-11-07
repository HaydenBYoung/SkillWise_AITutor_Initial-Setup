import React, { useState, useEffect } from 'react';
import GoalCard from '../components/goals/GoalCard';
import GoalForm from '../components/goals/GoalForm';
import Modal from '../components/common/Modal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardLayout from '../components/common/DashboardLayout';
import { goalsService } from '../services/goals';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Load goals on component mount
  useEffect(() => {
    loadGoals();
  }, []);

  const loadGoals = async () => {
    try {
      setLoading(true);
      setError('');

      // Debug: Check if we have a token
      const token = localStorage.getItem('access_token');
      console.log('🔍 Loading goals - Token exists:', !!token);
      if (token) {
        console.log('🔍 Token preview:', token.substring(0, 20) + '...');
      }

      const response = await goalsService.getGoals();
      console.log('✅ Goals loaded successfully:', response);
      console.log('📊 Response.data:', response.data);
      console.log('📊 Response.data.goals:', response.data?.goals);
      console.log('📊 Goals array length:', response.data?.goals?.length || 0);
      setGoals(response.data?.goals || response.goals || []);
    } catch (err) {
      console.error('❌ Error loading goals:', err);
      console.log('❌ Error details:', {
        message: err.message,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
      });
      setError('Failed to load goals. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGoal = () => {
    setEditingGoal(null);
    setIsModalOpen(true);
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingGoal(null);
  };

  const handleSubmitGoal = async (goalData) => {
    try {
      if (editingGoal) {
        // Update existing goal
        const response = await goalsService.updateGoal(
          editingGoal.id,
          goalData
        );
        console.log('✅ Goal updated successfully:', response);
        console.log('📊 Updated goal data:', response.data?.goal);
        setGoals(
          goals.map((goal) =>
            goal && goal.id === editingGoal.id
              ? response.data?.goal || response.goal
              : goal
          )
        );
      } else {
        // Create new goal
        console.log('🔄 Creating new goal:', goalData);
        const response = await goalsService.createGoal(goalData);
        console.log('✅ Goal created successfully:', response);
        console.log('📊 New goal data:', response.data?.goal);
        console.log('📊 Current goals count before adding:', goals.length);
        setGoals([response.data?.goal || response.goal, ...goals]);
        console.log('📊 Goals count should now be:', goals.length + 1);
      }
      handleCloseModal();
    } catch (err) {
      console.error('❌ Error saving goal:', err);
      throw err; // Let the form handle the error
    }
  };

  const handleDeleteGoal = async (goalId) => {
    if (!window.confirm('Are you sure you want to delete this goal?')) {
      return;
    }

    try {
      await goalsService.deleteGoal(goalId);
      setGoals(goals.filter((goal) => goal && goal.id !== goalId));
    } catch (err) {
      console.error('Error deleting goal:', err);
      setError('Failed to delete goal. Please try again.');
    }
  };

  const handleMarkCompleted = async (goalId) => {
    try {
      const response = await goalsService.markGoalCompleted(goalId);
      setGoals(
        goals.map((goal) =>
          goal && goal.id === goalId
            ? response.data?.goal || response.goal
            : goal
        )
      );
    } catch (err) {
      console.error('Error marking goal as completed:', err);
      setError('Failed to update goal. Please try again.');
    }
  };

  const handleUpdateProgress = async (goalId) => {
    const newProgress = prompt('Enter progress percentage (0-100):');
    if (newProgress === null) return;

    const progress = parseInt(newProgress);
    if (isNaN(progress) || progress < 0 || progress > 100) {
      alert('Please enter a valid number between 0 and 100');
      return;
    }

    try {
      const response = await goalsService.updateGoalProgress(goalId, progress);
      setGoals(
        goals.map((goal) =>
          goal && goal.id === goalId
            ? response.data?.goal || response.goal
            : goal
        )
      );
    } catch (err) {
      console.error('Error updating progress:', err);
      setError('Failed to update progress. Please try again.');
    }
  };

  const filteredGoals = goals.filter((goal) => {
    if (filterCategory && goal?.category !== filterCategory) return false;
    if (filterStatus === 'completed' && !goal?.is_completed) return false;
    if (filterStatus === 'active' && goal?.is_completed) return false;
    return true;
  });

  const categories = [
    ...new Set(goals.map((goal) => goal?.category).filter(Boolean)),
  ];

  return (
    <DashboardLayout>
      <div className="goals-page">
        <div className="page-header">
          <div>
            <h1>My Learning Goals</h1>
            <p>Track your progress and achieve your learning objectives</p>
          </div>
          <button className="btn btn-primary" onClick={handleCreateGoal}>
            Create New Goal
          </button>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="goals-filters">
          <div className="filter-group">
            <label htmlFor="category-filter">Category:</label>
            <select
              id="category-filter"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="status-filter">Status:</label>
            <select
              id="status-filter"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="">All Goals</option>
              <option value="active">Active</option>
              <option value="completed">Completed</option>
            </select>
          </div>
        </div>

        <div className="goals-content">
          {loading ? (
            <LoadingSpinner message="Loading your goals..." />
          ) : filteredGoals.length > 0 ? (
            <div className="goals-grid">
              {filteredGoals
                .filter((goal) => goal && goal.id)
                .map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={handleEditGoal}
                    onDelete={handleDeleteGoal}
                    onMarkCompleted={handleMarkCompleted}
                    onUpdateProgress={handleUpdateProgress}
                  />
                ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state-content">
                <h3>
                  {goals.length === 0
                    ? 'No goals yet'
                    : 'No goals match your filters'}
                </h3>
                <p>
                  {goals.length === 0
                    ? 'Create your first learning goal to get started!'
                    : 'Try adjusting your filters to see more goals.'}
                </p>
                {goals.length === 0 && (
                  <button
                    className="btn btn-primary"
                    onClick={handleCreateGoal}
                  >
                    Create Your First Goal
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={editingGoal ? 'Edit Goal' : 'Create New Goal'}
          size="large"
        >
          <GoalForm
            onSubmit={handleSubmitGoal}
            onCancel={handleCloseModal}
            initialData={editingGoal}
          />
        </Modal>
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage;

// Goals management page with creation form and list
import React, { useEffect, useState } from 'react';
import GoalCard from '../components/goals/GoalCard';
import DashboardLayout from '../components/common/DashboardLayout';
import GoalForm from '../components/goals/GoalForm';
import { apiService } from '../services/api';

const GoalsPage = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchGoals = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.goals.getAll();
      setGoals(res.data.goals || res.data || []);
    } catch (err) {
      console.error('Failed to fetch goals', err);
      setError(err.response?.data?.message || err.message || 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleCreate = (newGoal) => {
    setGoals(prev => [newGoal, ...prev]);
    // Event dispatched in GoalForm too, but dispatch here to be safe
    window.dispatchEvent(new CustomEvent('goal:created', { detail: { goal: newGoal } }));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <GoalForm onCreate={handleCreate} />
          </div>

          <div className="lg:col-span-2">
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Your Goals</h2>

              {loading && <p>Loading goals...</p>}
              {error && <p className="text-red-600">{error}</p>}

              {!loading && goals.length === 0 && (
                <p className="text-gray-500">You don't have any goals yet. Create one to get started.</p>
              )}

              <div className="grid grid-cols-1 gap-4 mt-4">
                {goals.map(goal => (
                  <GoalCard key={goal.id || goal._id || goal.title} goal={goal} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default GoalsPage;

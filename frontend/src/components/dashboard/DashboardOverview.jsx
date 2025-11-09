import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { goalService } from '../../services/goalService';
import LoadingSpinner from '../common/LoadingSpinner';

const DashboardOverview = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await goalService.getGoals();
      
      if (response.success) {
        const goalsData = response.data.goals || response.data || [];
        setGoals(goalsData);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate statistics
  const totalGoals = goals.length;
  const completedGoals = goals.filter(goal => goal.is_completed).length;
  const totalChallenges = goals.reduce((sum, goal) => sum + (goal.totalChallenges || 0), 0);
  const completedChallenges = goals.reduce((sum, goal) => sum + (goal.completedChallenges || 0), 0);
  const averageProgress = goals.length > 0 
    ? Math.round(goals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / goals.length)
    : 0;

  // Mock streak calculation (would come from backend in real app)
  const currentStreak = Math.floor(Math.random() * 15) + 1;

  // Get recent activity (mock data based on goals)
  const recentActivity = goals.slice(0, 3).map(goal => ({
    id: goal.id,
    action: goal.progress >= 50 ? 'Progress made' : 'Goal created',
    goal: goal.title,
    progress: goal.progress,
    time: 'Today'
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="dashboard-overview space-y-8">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 text-white p-8 rounded-2xl shadow-xl">
        <h1 className="text-4xl font-bold mb-2">Welcome to SkillWise! 🚀</h1>
        <p className="text-blue-100 text-lg">
          Track your learning progress and achieve your goals
        </p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Goals Completed</h3>
              <p className="text-3xl font-bold text-green-600 dark:text-green-400 mt-1">
                {completedGoals}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {totalGoals} total goals
              </p>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Challenges Completed</h3>
              <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {completedChallenges}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                of {totalChallenges} available
              </p>
            </div>
            <div className="text-4xl">⚡</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Average Progress</h3>
              <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {averageProgress}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                across all goals
              </p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Current Streak</h3>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                {currentStreak}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                days active
              </p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">📊</span>
            Recent Activity
          </h3>
          
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {activity.action} on "{activity.goal}"
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {activity.time} • {activity.progress}% complete
                    </p>
                  </div>
                  <div className="text-2xl">
                    {activity.progress >= 50 ? '🚀' : '📝'}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-gray-500 dark:text-gray-400">
              <div className="text-4xl mb-2">📈</div>
              <p>No recent activity</p>
              <p className="text-sm">Create goals to see activity here!</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">⚡</span>
            Quick Actions
          </h3>
          
          <div className="space-y-3">
            <a
              href="/goals"
              className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors group"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">🎯</span>
                <div>
                  <p className="font-medium text-blue-900 dark:text-blue-100">Create New Goal</p>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Set your learning objectives</p>
                </div>
              </div>
              <span className="text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">→</span>
            </a>
            
            <a
              href="/challenges"
              className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors group"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">⚡</span>
                <div>
                  <p className="font-medium text-purple-900 dark:text-purple-100">Explore Challenges</p>
                  <p className="text-sm text-purple-600 dark:text-purple-300">Practice with coding challenges</p>
                </div>
              </div>
              <span className="text-purple-600 dark:text-purple-400 group-hover:translate-x-1 transition-transform">→</span>
            </a>
            
            <a
              href="/progress"
              className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors group"
            >
              <div className="flex items-center">
                <span className="text-2xl mr-3">📈</span>
                <div>
                  <p className="font-medium text-green-900 dark:text-green-100">View Progress</p>
                  <p className="text-sm text-green-600 dark:text-green-300">Track your learning journey</p>
                </div>
              </div>
              <span className="text-green-600 dark:text-green-400 group-hover:translate-x-1 transition-transform">→</span>
            </a>
          </div>
        </div>
      </div>

      {/* Goals Overview */}
      {goals.length > 0 && (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <span className="text-2xl mr-2">🎯</span>
            Your Goals Overview
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {goals.slice(0, 6).map((goal) => (
              <div key={goal.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">
                  {goal.title}
                </h4>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {goal.category || 'general'}
                  </span>
                  <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
                    {goal.progress || 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${goal.progress || 0}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {goal.completedChallenges || 0} / {goal.totalChallenges || 0} challenges
                </p>
              </div>
            ))}
          </div>
          
          {goals.length > 6 && (
            <div className="mt-4 text-center">
              <a
                href="/goals"
                className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View all {goals.length} goals →
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DashboardOverview;

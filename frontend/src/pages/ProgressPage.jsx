import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { progressService } from '../services/progressService';
import { goalService } from '../services/goalService';
import { challengeService } from '../services/challengeService';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const ProgressPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month'); // week, month, quarter, year
  const [progressData, setProgressData] = useState({
    overview: {},
    goals: [],
    challenges: [],
    activityHistory: [],
    categoryProgress: [],
    achievements: [],
  });

  useEffect(() => {
    loadProgressData();
  }, [timeframe]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load various progress metrics
      const [
        goalsResponse,
        challengesResponse,
      ] = await Promise.all([
        goalService.getUserGoals(),
        challengeService.getChallenges(''),
      ]);

      // Process the data
      const goals = goalsResponse.data || [];
      const challenges = challengesResponse.data || [];

      // Generate mock activity data for demonstration
      const activityHistory = generateMockActivityData(timeframe);

      // Calculate category progress
      const categoryProgress = calculateCategoryProgress(goals, challenges);

      // Calculate overview stats
      const overview = calculateOverviewStats(goals, challenges);

      setProgressData({
        overview,
        goals,
        challenges,
        activityHistory,
        categoryProgress,
        achievements: [], // TODO: Implement achievements
      });
    } catch (err) {
      console.error('Error loading progress data:', err);
      setError('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateMockActivityData = (timeframe) => {
    const days = timeframe === 'week' ? 7 : timeframe === 'month' ? 30 : timeframe === 'quarter' ? 90 : 365;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      
      data.push({
        date: date.toISOString().split('T')[0],
        goals_completed: Math.floor(Math.random() * 3),
        challenges_completed: Math.floor(Math.random() * 5),
        points_earned: Math.floor(Math.random() * 100),
      });
    }
    
    return data;
  };

  const calculateOverviewStats = (goals, challenges) => {
    const completedGoals = goals.filter(g => g.is_completed).length;
    const completedChallenges = challenges.filter(c => c.completion_status === 'completed').length;
    const totalPoints = challenges.reduce((sum, c) => sum + (c.points_value || 0), 0);
    
    return {
      total_goals: goals.length,
      completed_goals: completedGoals,
      total_challenges: challenges.length,
      completed_challenges: completedChallenges,
      total_points: totalPoints,
      completion_rate: goals.length > 0 ? Math.round((completedGoals / goals.length) * 100) : 0,
    };
  };

  const calculateCategoryProgress = (goals, challenges) => {
    const categories = {};
    
    // Count goals and challenges by category
    [...goals, ...challenges].forEach(item => {
      const category = item.category || 'Other';
      if (!categories[category]) {
        categories[category] = {
          name: category,
          totalItems: 0,
          completedItems: 0,
        };
      }
      categories[category].totalItems++;
      if (item.is_completed || item.completion_status === 'completed') {
        categories[category].completedItems++;
      }
    });

    return Object.values(categories).map(cat => ({
      ...cat,
      percentage: cat.totalItems > 0 ? Math.round((cat.completedItems / cat.totalItems) * 100) : 0,
    }));
  };

  const formatActivityData = (activityHistory) => {
    // Format activity data for charts
    return activityHistory.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      goals: day.goals_completed || 0,
      challenges: day.challenges_completed || 0,
      total: (day.goals_completed || 0) + (day.challenges_completed || 0),
      points: day.points_earned || 0,
    }));
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  if (loading) {
    return <LoadingSpinner />;
  }

  const chartData = formatActivityData(progressData.activityHistory);
  const { overview } = progressData;

  return (
    <div className="progress-page min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="relative mb-12">
          <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-500 dark:via-purple-500 dark:to-pink-500 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-4">
                <span className="text-5xl">📊</span>
                <div>
                  <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
                    Progress Dashboard
                  </h1>
                  <p className="text-purple-100 dark:text-purple-200 text-lg leading-relaxed">
                    🚀 Track your learning journey and celebrate your achievements
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-6 text-sm">
                <div className="flex items-center gap-2 bg-white/20 dark:bg-white/30 px-4 py-2 rounded-full backdrop-blur-sm">
                  <span>🎯</span>
                  <span className="text-white">{overview.completion_rate || 0}% Completion Rate</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 dark:bg-white/30 px-4 py-2 rounded-full backdrop-blur-sm">
                  <span>⭐</span>
                  <span className="text-white">{overview.total_points || 0} Points Earned</span>
                </div>
                <div className="flex items-center gap-2 bg-white/20 dark:bg-white/30 px-4 py-2 rounded-full backdrop-blur-sm">
                  <span>🏆</span>
                  <span className="text-white">{overview.completed_goals || 0} Goals Completed</span>
                </div>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-pink-400/20 rounded-full blur-2xl"></div>
          </div>
        </div>

        {error && (
          <div className="mb-8 animate-fadeIn">
            <ErrorMessage 
              message={error} 
              onDismiss={() => setError(null)}
              className="shadow-lg"
            />
          </div>
        )}

        {/* Enhanced Timeframe Selector */}
        <div className="mb-8 animate-fadeInUp">
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">📅</span>
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Time Period</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {[
                { value: 'week', label: 'Past Week', emoji: '📅' },
                { value: 'month', label: 'Past Month', emoji: '🗓️' },
                { value: 'quarter', label: 'Past Quarter', emoji: '📊' },
                { value: 'year', label: 'Past Year', emoji: '🗓️' },
              ].map(option => (
                <button
                  key={option.value}
                  onClick={() => setTimeframe(option.value)}
                  className={`px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2 ${
                    timeframe === option.value
                      ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'
                  }`}
                >
                  <span>{option.emoji}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12 animate-fadeInUp" style={{ animationDelay: '0.1s' }}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-blue-400 to-blue-600 rounded-xl shadow-lg">
                    <span className="text-2xl">🎯</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Goals</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{overview.total_goals || 0}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-1000"
                    style={{ width: `${overview.total_goals > 0 ? 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-green-400 to-green-600 rounded-xl shadow-lg">
                    <span className="text-2xl">✅</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Completed Goals</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{overview.completed_goals || 0}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-green-400 to-green-600 rounded-full transition-all duration-1000"
                    style={{ width: `${overview.completion_rate || 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-purple-400 to-purple-600 rounded-xl shadow-lg">
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Challenges Done</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{overview.completed_challenges || 0}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className="h-2 bg-gradient-to-r from-purple-400 to-purple-600 rounded-full transition-all duration-1000"
                    style={{ width: `${overview.total_challenges > 0 ? (overview.completed_challenges / overview.total_challenges) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-6 hover:shadow-2xl transition-all duration-300 hover:scale-105">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-lg">
                    <span className="text-2xl">⭐</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wide">Total Points</p>
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{overview.total_points || 0}</p>
                  </div>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div className="h-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full transition-all duration-1000 animate-shimmer" style={{ width: '85%' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-fadeInUp" style={{ animationDelay: '0.2s' }}>
          {/* Activity Over Time */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📈</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Activity Over Time</h3>
            </div>
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e0e7ff" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="goals" stackId="1" stroke="#3B82F6" fill="url(#blueGradient)" name="Goals" />
                  <Area type="monotone" dataKey="challenges" stackId="1" stroke="#10B981" fill="url(#greenGradient)" name="Challenges" />
                  <defs>
                    <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    </linearGradient>
                    <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Points Earned */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">💎</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Points Earned</h3>
            </div>
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#fef3c7" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'white',
                      borderRadius: '12px',
                      border: 'none',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="points" 
                    stroke="url(#goldGradient)" 
                    strokeWidth={4} 
                    name="Points"
                    dot={{ r: 6, fill: '#F59E0B' }}
                  />
                  <defs>
                    <linearGradient id="goldGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#F59E0B"/>
                      <stop offset="100%" stopColor="#F97316"/>
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Enhanced Category Progress */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">🎨</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Progress by Category</h3>
            </div>
            {progressData.categoryProgress.length > 0 ? (
              <div className="bg-gradient-to-r from-indigo-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={progressData.categoryProgress}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {progressData.categoryProgress.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <span className="text-4xl">📊</span>
                <p className="text-gray-500 mt-4">No category data available</p>
              </div>
            )}
          </div>

          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 hover:shadow-2xl transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📊</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Category Breakdown</h3>
            </div>
            {progressData.categoryProgress.length > 0 ? (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={progressData.categoryProgress}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e0f2fe" />
                    <XAxis dataKey="name" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
                      }}
                    />
                    <Bar dataKey="completedItems" fill="#10B981" name="Completed" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="totalItems" fill="#E5E7EB" name="Total" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                <span className="text-4xl">📈</span>
                <p className="text-gray-500 mt-4">No category data available</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Recent Goals */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 mb-8 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Goals</h3>
            </div>
            <Link 
              to="/goals" 
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 px-4 py-2 rounded-xl transition-all duration-200"
            >
              <span>👁️</span>
              <span>View All Goals</span>
            </Link>
          </div>
          {progressData.goals.length > 0 ? (
            <div className="space-y-4">
              {progressData.goals.slice(0, 5).map((goal, index) => (
                <div 
                  key={goal.id} 
                  className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-102"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="p-2 bg-gradient-to-r from-indigo-100 to-purple-100 rounded-lg">
                      <span className="text-lg">{goal.is_completed ? '🏆' : '🎯'}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-900">{goal.title}</h4>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-gray-600 bg-gray-100 px-2 py-1 rounded-lg">
                          📂 {goal.category}
                        </span>
                        <span className="text-sm font-bold text-indigo-600">
                          {goal.progress_percentage || 0}% complete
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="w-32 bg-gray-200 rounded-full h-3 shadow-inner">
                      <div
                        className={`h-3 rounded-full transition-all duration-1000 ${
                          goal.is_completed 
                            ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                            : 'bg-gradient-to-r from-indigo-400 to-purple-500'
                        }`}
                        style={{ width: `${goal.progress_percentage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
              <span className="text-4xl">🎯</span>
              <p className="text-gray-600 dark:text-gray-400 mt-4 mb-4">No goals yet. Start your journey today!</p>
              <Link 
                to="/goals" 
                className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-bold bg-white dark:bg-gray-700 px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
              >
                <span>✨</span>
                <span>Create your first goal</span>
              </Link>
            </div>
          )}
        </div>

        {/* Enhanced Achievements Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🏆</span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Achievements</h3>
          </div>
          <div className="text-center py-12 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
            <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-3xl">🏆</span>
            </div>
            <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Achievements System Coming Soon!</h4>
            <p className="text-gray-600 dark:text-gray-400 mb-4">Complete goals and challenges to unlock amazing achievements.</p>
            <div className="flex justify-center gap-4 text-sm">
              <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-sm">
                <span>🥉</span>
                <span className="dark:text-gray-200">Bronze Badges</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-sm">
                <span>🥈</span>
                <span className="dark:text-gray-200">Silver Badges</span>
              </div>
              <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-sm">
                <span>🥇</span>
                <span className="dark:text-gray-200">Gold Badges</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgressPage;

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
import DashboardLayout from '../components/common/DashboardLayout';

const ProgressPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('month'); // week, month, quarter, year
  const [goalSortBy, setGoalSortBy] = useState('newest'); // newest, oldest, recently_worked, most_completed, least_completed
  const [progressData, setProgressData] = useState({
    overview: {},
    goals: [],
    challenges: [],
    activityHistory: [],
    categoryProgress: [],
    achievements: [],
  });

  useEffect(() => {
    console.log('🔄 useEffect triggered, loading progress data...');
    loadProgressData();
  }, [timeframe]);

  const loadProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Starting to load progress data...'); // Debug

      // Load real progress data from our new APIs
      const [
        progressResponse,
        activityResponse,
        categoryResponse,
        achievementsResponse,
        timelineResponse,
        goalsResponse
      ] = await Promise.all([
        progressService.getUserProgress(),
        progressService.getActivityData(timeframe),
        progressService.getProgressByCategory(),
        progressService.getAchievements(),
        progressService.getCompletionTimeline(20),
        goalService.getGoals().catch(err => {
          console.error('❌ Error loading goals:', err);
          return [];
        }) // Load all goals with error handling
      ]);

      // Process the real data
      const overview = progressResponse.data || {};
      const activityHistory = activityResponse.data || [];
      const categoryProgress = categoryResponse.data || [];
      const achievements = achievementsResponse.data || [];
      const completionTimeline = timelineResponse.data || [];
      
      console.log('🏆 Raw achievements response:', achievementsResponse);
      console.log('🏆 Processed achievements:', achievements);
      console.log('🏆 Achievements length:', achievements.length);
      
      // Handle goals response properly - same logic as GoalsPage
      let goals = [];
      console.log('🎯 Raw goals response:', goalsResponse);
      
      if (goalsResponse && goalsResponse.success) {
        const goalsData = goalsResponse.data.goals || goalsResponse.data || [];
        goals = goalsData;
        console.log('✅ Processed goals data (success path):', goals);
      } else if (Array.isArray(goalsResponse)) {
        goals = goalsResponse;
        console.log('✅ Processed goals data (array path):', goals);
      } else if (goalsResponse && goalsResponse.data && Array.isArray(goalsResponse.data)) {
        goals = goalsResponse.data;
        console.log('✅ Processed goals data (nested data path):', goals);
      } else if (goalsResponse && goalsResponse.goals && Array.isArray(goalsResponse.goals)) {
        goals = goalsResponse.goals;
        console.log('✅ Processed goals data (nested goals path):', goals);
      } else {
        console.log('❌ No goals found in response');
      }

      console.log('🎯 Goals loaded in Progress page:', goals);
      console.log('📈 Overview data:', overview);

      setProgressData({
        overview,
        goals, // Now contains all goals with full data
        challenges: [], // Will be populated from overview data
        activityHistory,
        categoryProgress,
        achievements,
        completionTimeline
      });
    } catch (err) {
      console.error('❌ Error loading progress data:', err);
      console.error('❌ Error details:', {
        message: err.message,
        stack: err.stack,
        response: err.response
      });
      setError('Failed to load progress data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format activity data for charts
  const formatActivityData = (activityHistory) => {
    return activityHistory.map(day => ({
      date: new Date(day.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      challenges: day.challenges_completed || 0,
      points: day.points_earned || 0,
      total: day.challenges_completed || 0
    }));
  };

  // Format date for display
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get difficulty color dot
  const getDifficultyDot = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Sort goals based on selected criteria
  const sortGoals = (goals, sortBy) => {
    const sortedGoals = [...goals];
    
    switch (sortBy) {
      case 'newest':
        return sortedGoals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      case 'oldest':
        return sortedGoals.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      case 'recently_worked':
        return sortedGoals.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
      case 'most_completed':
        return sortedGoals.sort((a, b) => (b.calculated_progress_percentage || 0) - (a.calculated_progress_percentage || 0));
      case 'least_completed':
        return sortedGoals.sort((a, b) => (a.calculated_progress_percentage || 0) - (b.calculated_progress_percentage || 0));
      default:
        return sortedGoals;
    }
  };

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16'];

  if (loading) {
    return <LoadingSpinner />;
  }

  const chartData = formatActivityData(progressData.activityHistory);
  const { overview } = progressData;

  return (
    <DashboardLayout>
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
                  <span className="text-white">{overview.earned_points || 0} Points Earned</span>
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
                    <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{overview.earned_points || 0}</p>
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
              <span className="text-2xl">✅</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Completed Challenges</h3>
            </div>
            {progressData.completionTimeline && progressData.completionTimeline.filter(item => item.type === 'challenge').length > 0 ? (
              <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 max-h-80 overflow-y-auto">
                <div className="space-y-3">
                  {progressData.completionTimeline
                    .filter(item => item.type === 'challenge')
                    .slice(0, 10)
                    .map((challenge, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                          challenge.difficulty_level === 'easy' ? 'bg-green-500' :
                          challenge.difficulty_level === 'medium' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`}>
                          {challenge.difficulty_level === 'easy' ? '🟢' :
                           challenge.difficulty_level === 'medium' ? '🟡' : '🔴'}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 dark:text-gray-100 text-sm">
                            {challenge.title}
                          </h4>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                              {challenge.category}
                            </span>
                            <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(challenge.difficulty_level)}`}>
                              {challenge.difficulty_level}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-right">
                        <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded font-medium">
                          +{challenge.points} pts
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                {progressData.completionTimeline.filter(item => item.type === 'challenge').length > 10 && (
                  <div className="text-center mt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing 10 of {progressData.completionTimeline.filter(item => item.type === 'challenge').length} completed challenges
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-600 rounded-xl">
                <span className="text-4xl">⚡</span>
                <p className="text-gray-500 dark:text-gray-400 mt-4">No challenges completed yet</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Complete some challenges to see them here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Enhanced Recent Goals */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 mb-8 animate-fadeInUp" style={{ animationDelay: '0.4s' }}>
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🎯</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">All Goals</h3>
            </div>
          {progressData.goals.length > 0 ? (
            <div className="flex items-center gap-4">
              {/* Sort Dropdown */}
              <div className="relative">
                <select
                  value={goalSortBy}
                  onChange={(e) => setGoalSortBy(e.target.value)}
                  className="appearance-none bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                >
                  <option value="newest">📅 Newest First</option>
                  <option value="oldest">🕐 Oldest First</option>
                  <option value="recently_worked">⚡ Recently Worked</option>
                  <option value="most_completed">📈 Most Complete</option>
                  <option value="least_completed">📉 Least Complete</option>
                </select>
              </div>
              <Link 
                to="/goals" 
                className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 px-4 py-2 rounded-xl transition-all duration-200"
              >
                <span>👁️</span>
                <span>View Details</span>
              </Link>
            </div>
          ) : (
            <Link 
              to="/goals" 
              className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:hover:bg-indigo-800/40 px-4 py-2 rounded-xl transition-all duration-200"
            >
              <span>➕</span>
              <span>Create Goal</span>
            </Link>
          )}
          </div>
          
          {progressData.goals.length > 0 ? (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {sortGoals(progressData.goals, goalSortBy).map((goal, index) => (
                <div 
                  key={goal.id} 
                  className="flex items-center gap-4 p-5 bg-gradient-to-r from-gray-50 to-white dark:from-gray-700 dark:to-gray-600 rounded-xl border border-gray-100 dark:border-gray-600 hover:shadow-lg transition-all duration-300 hover:scale-[1.02]"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Difficulty Color Dot */}
                  <div className={`w-4 h-4 rounded-full ${getDifficultyDot(goal.difficulty_level)} shadow-sm flex-shrink-0`}></div>
                  
                  {/* Goal Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h4 className="font-bold text-gray-900 dark:text-gray-100 truncate">{goal.title}</h4>
                      <span className={`px-2 py-1 text-xs rounded-full flex-shrink-0 ${getDifficultyColor(goal.difficulty_level)}`}>
                        {goal.difficulty_level}
                      </span>
                      {goal.is_completed && (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full flex-shrink-0">
                          ✅ Completed
                        </span>
                      )}
                    </div>
                    
                    {/* Progress Bar and Points */}
                    <div className="flex items-center gap-4 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                          <span>Progress</span>
                          <span className="font-medium">{goal.calculated_progress_percentage || 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 shadow-inner">
                          <div
                            className={`h-2 rounded-full transition-all duration-1000 ${
                              goal.is_completed 
                                ? 'bg-gradient-to-r from-green-400 to-emerald-500' 
                                : 'bg-gradient-to-r from-indigo-400 to-purple-500'
                            }`}
                            style={{ width: `${goal.calculated_progress_percentage || 0}%` }}
                          />
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                          {goal.earned_points || 0} / {goal.target_points || 0} pts
                        </div>
                      </div>
                    </div>
                    
                    {/* Dates and Category */}
                    <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                      <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                        📂 {goal.category}
                      </span>
                      <span className="bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                        🗓️ Started: {new Date(goal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                      {goal.target_completion_date && (
                        <span className={`px-2 py-1 rounded ${
                          new Date(goal.target_completion_date) < new Date() && !goal.is_completed
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200'
                        }`}>
                          🎯 Due: {new Date(goal.target_completion_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      )}
                      {goal.updated_at !== goal.created_at && (
                        <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                          ⚡ Updated: {new Date(goal.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No goals available.</p>
            </div>
          )}
        </div>

        {/* Enhanced Achievements Section */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 animate-fadeInUp" style={{ animationDelay: '0.5s' }}>
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🏆</span>
            <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Achievements & Milestones</h3>
          </div>
          
          {progressData.achievements && progressData.achievements.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {progressData.achievements.map((achievement, index) => (
                <div key={index} className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-6 border border-yellow-200 dark:border-gray-500">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-xl">
                        {achievement.achievement_type === 'points' ? '🎯' : 
                         achievement.achievement_type === 'goals' ? '🏆' : 
                         achievement.achievement_type === 'challenges' ? '⚡' : 
                         achievement.achievement_type === 'streak' ? '🔥' : '⭐'}
                      </span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-bold text-gray-800 dark:text-gray-100 mb-1">
                        {achievement.title}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                        {achievement.description}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                        <span className="bg-white dark:bg-gray-800 px-2 py-1 rounded-full">
                          Value: {achievement.value}
                        </span>
                        <span>
                          {formatDate(achievement.achieved_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-gray-700 dark:to-gray-600 rounded-xl">
              <div className="w-20 h-20 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <span className="text-3xl">🏆</span>
              </div>
              <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-3">Start Earning Achievements!</h4>
              <p className="text-gray-600 dark:text-gray-400 mb-4">Complete challenges and goals to unlock your first achievements.</p>
              <div className="flex justify-center gap-4 text-sm">
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-sm">
                  <span>🎯</span>
                  <span className="dark:text-gray-200">Points Milestones</span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-sm">
                  <span>🏆</span>
                  <span className="dark:text-gray-200">Goal Completions</span>
                </div>
                <div className="flex items-center gap-2 bg-white dark:bg-gray-700 px-4 py-2 rounded-full shadow-sm">
                  <span>🔥</span>
                  <span className="dark:text-gray-200">Activity Streaks</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Timeline Section */}
        {progressData.completionTimeline && progressData.completionTimeline.length > 0 && (
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 animate-fadeInUp" style={{ animationDelay: '0.6s' }}>
            <div className="flex items-center gap-3 mb-6">
              <span className="text-2xl">📈</span>
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100">Recent Activity</h3>
            </div>
            
            <div className="relative">
              {/* Timeline with today's date in the middle */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 to-purple-200"></div>
              
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {/* Today's date marker in the middle */}
                {progressData.completionTimeline.length > 2 && (
                  <div className="flex items-center gap-4 py-2" style={{ 
                    order: Math.floor(progressData.completionTimeline.length / 2) 
                  }}>
                    <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg z-10">
                      <span className="text-xs font-bold">📅</span>
                    </div>
                    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 px-4 py-2 rounded-xl border border-indigo-200 dark:border-indigo-700">
                      <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">
                        Today - {new Date().toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </span>
                    </div>
                  </div>
                )}
                
                {progressData.completionTimeline.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 relative">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-lg z-10 ${
                      item.type === 'goal' ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-gradient-to-r from-blue-500 to-cyan-500'
                    }`}>
                      <span className="text-sm">
                        {item.type === 'goal' ? '🎯' : '⚡'}
                      </span>
                    </div>
                    <div className="flex-1 bg-gray-50 dark:bg-gray-700 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-100">
                          {item.type === 'goal' ? 'Goal Completed' : 'Challenge Completed'}
                        </h4>
                        <span className={`px-2 py-1 text-xs rounded-full ${getDifficultyColor(item.difficulty_level)}`}>
                          {item.difficulty_level}
                        </span>
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                          +{item.points} pts
                        </span>
                      </div>
                      <p className="text-gray-700 dark:text-gray-300 mb-2">
                        <strong>{item.title}</strong>
                        {item.type === 'challenge' && item.goal_title && (
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            {' '}in {item.goal_title}
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                          {item.category}
                        </span>
                        <span className="bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                          {formatDate(item.completed_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;

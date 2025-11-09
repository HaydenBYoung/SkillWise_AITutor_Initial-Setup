import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { goalService } from '../services/goalService';

const ChallengesPage = () => {
  const [goals, setGoals] = useState([]);
  const [challengeModules, setChallengeModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState('');

  // Mock challenge modules based on goals
  const generateChallengeModules = (goals) => {
    const modules = [];
    
    goals.forEach(goal => {
      if (goal.category === 'programming') {
        modules.push({
          id: `${goal.id}-python-basics`,
          goalId: goal.id,
          goalTitle: goal.title,
          title: 'Introduction to Python',
          logo: '🐍',
          totalChallenges: 10,
          completedChallenges: Math.floor(Math.random() * 11),
          category: 'Programming',
          description: 'Learn Python fundamentals including variables, data types, and basic operations.',
        });
        modules.push({
          id: `${goal.id}-control-flow`,
          goalId: goal.id,
          goalTitle: goal.title,
          title: 'Control Flow & Logic',
          logo: '🔄',
          totalChallenges: 8,
          completedChallenges: Math.floor(Math.random() * 9),
          category: 'Programming',
          description: 'Master if statements, loops, and conditional logic in Python.',
        });
      } else if (goal.category === 'web development') {
        modules.push({
          id: `${goal.id}-html-basics`,
          goalId: goal.id,
          goalTitle: goal.title,
          title: 'HTML Fundamentals',
          logo: '🌐',
          totalChallenges: 12,
          completedChallenges: Math.floor(Math.random() * 13),
          category: 'Web Development',
          description: 'Learn HTML structure, elements, and semantic markup.',
        });
        modules.push({
          id: `${goal.id}-css-styling`,
          goalId: goal.id,
          goalTitle: goal.title,
          title: 'CSS Styling & Layout',
          logo: '🎨',
          totalChallenges: 15,
          completedChallenges: Math.floor(Math.random() * 16),
          category: 'Web Development',
          description: 'Master CSS selectors, styling, and modern layout techniques.',
        });
      } else if (goal.category === 'data science') {
        modules.push({
          id: `${goal.id}-pandas-basics`,
          goalId: goal.id,
          goalTitle: goal.title,
          title: 'Pandas Data Analysis',
          logo: '📊',
          totalChallenges: 14,
          completedChallenges: Math.floor(Math.random() * 15),
          category: 'Data Science',
          description: 'Learn data manipulation and analysis with Pandas library.',
        });
      } else if (goal.category === 'databases') {
        modules.push({
          id: `${goal.id}-sql-basics`,
          goalId: goal.id,
          goalTitle: goal.title,
          title: 'SQL Fundamentals',
          logo: '🗄️',
          totalChallenges: 16,
          completedChallenges: Math.floor(Math.random() * 17),
          category: 'Databases',
          description: 'Master SQL queries, joins, and database operations.',
        });
      } else {
        // Generic modules for other categories
        modules.push({
          id: `${goal.id}-fundamentals`,
          goalId: goal.id,
          goalTitle: goal.title,
          title: `${goal.title} - Fundamentals`,
          logo: '📚',
          totalChallenges: 10,
          completedChallenges: Math.floor(Math.random() * 11),
          category: goal.category?.charAt(0).toUpperCase() + goal.category?.slice(1),
          description: `Learn the fundamentals of ${goal.title}.`,
        });
      }
    });
    
    return modules;
  };

  // Fetch goals and generate challenge modules
  useEffect(() => {
    fetchGoalsAndChallenges();
  }, []);

  const fetchGoalsAndChallenges = async () => {
    try {
      setLoading(true);
      const response = await goalService.getGoals();
      
      if (response.success) {
        const goalsData = response.data.goals || response.data || [];
        setGoals(goalsData);
        
        // Generate challenge modules based on goals
        const modules = generateChallengeModules(goalsData);
        setChallengeModules(modules);
      }
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleModuleClick = (moduleId) => {
    toast('🚧 Challenge module coming in Sprint 3 with AI integration!', {
      icon: '🚧',
      duration: 4000,
    });
  };

  const getProgressPercentage = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getProgressColor = (percentage) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    if (percentage >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const filteredModules = selectedGoal 
    ? challengeModules.filter(module => module.goalId.toString() === selectedGoal)
    : challengeModules;

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
            ⚡ Challenge Modules
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Complete challenges to make progress on your learning goals
          </p>
        </div>

        {/* Goal Filter */}
        {goals.length > 0 && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Filter by Goal
            </label>
            <select
              value={selectedGoal}
              onChange={(e) => setSelectedGoal(e.target.value)}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white min-w-64"
            >
              <option value="">All Goals</option>
              {goals.map(goal => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Challenge Modules Grid */}
        {filteredModules.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredModules.map((module) => {
              const progressPercentage = getProgressPercentage(module.completedChallenges, module.totalChallenges);
              
              // Dynamic background colors based on category
              const getBackgroundColor = (category) => {
                switch (category.toLowerCase()) {
                  case 'programming':
                    return 'bg-gradient-to-br from-purple-500 to-indigo-600';
                  case 'web development':
                    return 'bg-gradient-to-br from-blue-500 to-cyan-600';
                  case 'data science':
                    return 'bg-gradient-to-br from-green-500 to-emerald-600';
                  case 'databases':
                    return 'bg-gradient-to-br from-orange-500 to-red-600';
                  default:
                    return 'bg-gradient-to-br from-gray-500 to-slate-600';
                }
              };
              
              return (
                <div
                  key={module.id}
                  onClick={() => handleModuleClick(module.id)}
                  className="group cursor-pointer transform hover:scale-105 transition-all duration-300"
                >
                  {/* Course Card */}
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                    {/* Colorful Header */}
                    <div className={`${getBackgroundColor(module.category)} p-6 text-white relative overflow-hidden`}>
                      <div className="absolute top-4 right-4">
                        <button className="text-white/80 hover:text-white transition-colors">
                          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                          </svg>
                        </button>
                      </div>
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="text-4xl">{module.logo}</div>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {module.title}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                              {module.category}
                            </span>
                            <span className="px-2 py-1 bg-white/20 rounded-full text-xs font-medium">
                              Build
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Card Content */}
                    <div className="p-6">
                      <p className="text-gray-600 dark:text-gray-400 text-sm mb-4 line-clamp-2">
                        {module.description}
                      </p>

                      {/* Progress Section */}
                      <div className="space-y-3">
                        <div className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            Progress
                          </span>
                          <span className="text-blue-600 dark:text-blue-400 font-semibold">
                            {progressPercentage}%
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-500 ease-out ${
                              progressPercentage >= 80 ? 'bg-green-500' :
                              progressPercentage >= 50 ? 'bg-yellow-500' :
                              progressPercentage >= 25 ? 'bg-orange-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        
                        {/* Challenge Count */}
                        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {module.completedChallenges} / {module.totalChallenges} challenges
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            🎯 {module.goalTitle}
                          </span>
                          <div className="flex items-center space-x-2">
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                              </svg>
                            </button>
                            <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : goals.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No goals created yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Create learning goals first to unlock challenge modules!
            </p>
            <a
              href="/goals"
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-block"
            >
              ➕ Create Your First Goal
            </a>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No challenge modules for this goal
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Try selecting a different goal or create a new one.
            </p>
          </div>
        )}

        {/* AI Integration Notice */}
        <div className="mt-12 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">🤖</div>
            <div>
              <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                AI-Powered Challenges Coming Soon!
              </h3>
              <p className="text-blue-700 dark:text-blue-300 mt-1">
                In Sprint 3, we'll integrate AI to generate personalized challenges based on your goals. 
                For now, explore the mock challenge modules above to see the structure!
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChallengesPage;
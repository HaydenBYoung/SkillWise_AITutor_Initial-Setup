import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { challengeModuleService } from '../services/challengeModuleService';

const ChallengesPage = () => {
  const [challengeModules, setChallengeModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGoal, setSelectedGoal] = useState('');
  const [expandedModule, setExpandedModule] = useState(null);
  const [challengeAnswers, setChallengeAnswers] = useState({});

  useEffect(() => {
    fetchChallengeModules();
  }, []);

  const fetchChallengeModules = async () => {
    try {
      setLoading(true);
      const response = await challengeModuleService.getChallengeModules();
      
      if (response.success) {
        setChallengeModules(response.data);
        console.log('Challenge modules loaded:', response.data);
      } else {
        toast.error('Failed to load challenge modules');
        setChallengeModules([]);
      }
    } catch (error) {
      console.error('Error fetching challenge modules:', error);
      toast.error('Failed to load challenge modules');
      setChallengeModules([]);
    } finally {
      setLoading(false);
    }
  };

  const handleModuleClick = (moduleId) => {
    setExpandedModule(expandedModule === moduleId ? null : moduleId);
  };

  const handleAnswerChange = (challengeId, answer) => {
    setChallengeAnswers(prev => ({
      ...prev,
      [challengeId]: answer
    }));
  };

  const handleChallengeSubmit = async (module, challenge) => {
    const answer = challengeAnswers[challenge.id];
    
    if (!answer) {
      toast.error('Please enter an answer first!');
      return;
    }

    try {
      const result = await challengeModuleService.completeChallenge(
        module.goalId, 
        challenge.id, 
        answer
      );

      if (result.success) {
        toast.success(result.message);
        // Refresh the modules to show updated progress
        await fetchChallengeModules();
        // Clear the answer
        setChallengeAnswers(prev => ({
          ...prev,
          [challenge.id]: ''
        }));
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error submitting challenge:', error);
      toast.error('Failed to submit challenge');
    }
  };

  const getProgressPercentage = (completed, total) => {
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  const getDifficultyBadge = (difficulty) => {
    const badges = {
      easy: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
      hard: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
    };
    return badges[difficulty] || badges.medium;
  };

  const filteredModules = selectedGoal 
    ? challengeModules.filter(module => module.goalId.toString() === selectedGoal)
    : challengeModules;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🏆 Challenge Modules
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complete challenges to earn points toward your goals!
            </p>
          </div>
        </div>

        {/* Goal Filter */}
        {challengeModules.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-4">
              <label htmlFor="goal-filter" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Filter by Goal:
              </label>
              <select
                id="goal-filter"
                value={selectedGoal}
                onChange={(e) => setSelectedGoal(e.target.value)}
                className="rounded-md border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">All Goals</option>
                {challengeModules.map((module) => (
                  <option key={module.goalId} value={module.goalId}>
                    {module.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Challenge Modules - Canvas-style Cards */}
        {filteredModules.length > 0 ? (
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12 pt-6"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '3rem',
              width: '100%'
            }}
          >
            {filteredModules.map((module) => {
              const progressPercentage = getProgressPercentage(module.completedChallenges, module.totalChallenges);
              const isExpanded = expandedModule === module.id;
              
              return (
                <div key={module.id} className="space-y-4">
                  {/* Module Card */}
                  <div
                    onClick={() => handleModuleClick(module.id)}
                    className="cursor-pointer hover:shadow-lg transition-shadow duration-200 p-4"
                  >
                    {/* Canvas-style Card with Rounded Rectangle Border */}
                    <div className="bg-gray-50 dark:bg-gray-750 rounded-xl border-2 border-gray-600 dark:border-gray-400 hover:border-blue-500 dark:hover:border-blue-400 overflow-hidden transition-all duration-200 shadow-md hover:shadow-lg" style={{
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      backgroundColor: 'var(--bg-tertiary)'
                    }}>
                      
                      {/* Header/Image Section */}
                      <div className="bg-blue-500 h-20 flex items-center justify-center relative">
                        <span className="text-2xl">{module.logo}</span>
                      </div>

                      {/* Content Section */}
                      <div className="p-3">
                        {/* Title */}
                        <h3 className="font-semibold text-sm text-gray-900 dark:text-white mb-1 line-clamp-2">
                          {module.title}
                        </h3>
                        
                        {/* Category */}
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          {module.category}
                        </p>

                        {/* Challenge Count & Points */}
                        <div className="flex justify-between items-center text-xs text-gray-600 dark:text-gray-400 mb-2">
                          <span>{module.totalChallenges} challenges</span>
                          <span className="text-green-600 dark:text-green-400">
                            {module.earnedPoints || 0}/{module.targetPoints || 6} pts
                          </span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${
                              progressPercentage >= 80 ? 'bg-green-500' :
                              progressPercentage >= 50 ? 'bg-yellow-500' :
                              progressPercentage >= 25 ? 'bg-blue-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        
                        {/* Progress Percentage & Goal Progress */}
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                            {progressPercentage}%
                          </span>
                          {module.goalProgress && (
                            <span className="text-xs text-blue-600 dark:text-blue-400">
                              Goal: {module.goalProgress.earned}/{module.goalProgress.target} pts
                            </span>
                          )}
                        </div>
                        
                        {/* Expand indicator */}
                        <div className="text-center mt-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {isExpanded ? '▲ Click to collapse' : '▼ Click to expand challenges'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Challenges */}
                  {isExpanded && module.challenges && (
                    <div className="space-y-3 pl-4">
                      {module.challenges.map((challenge) => (
                        <div 
                          key={challenge.id} 
                          className="bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-300 dark:border-gray-600 p-4 shadow-sm"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-medium text-gray-900 dark:text-white text-sm">
                              {challenge.title}
                            </h4>
                            <div className="flex items-center space-x-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBadge(challenge.difficulty_level)}`}>
                                {challenge.difficulty_level}
                              </span>
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                                {challenge.points_reward} pts
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                            {challenge.instructions}
                          </p>
                          
                          {challenge.status === 'completed' ? (
                            <div className="flex items-center justify-center py-2 bg-green-100 dark:bg-green-900 rounded-md">
                              <span className="text-green-700 dark:text-green-300 font-medium text-sm">
                                ✅ Completed! (+{challenge.points_reward} points)
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex items-center space-x-2">
                                <input
                                  type="text"
                                  value={challengeAnswers[challenge.id] || ''}
                                  onChange={(e) => handleAnswerChange(challenge.id, e.target.value)}
                                  placeholder="Enter your answer..."
                                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
                                />
                                <button
                                  onClick={() => handleChallengeSubmit(module, challenge)}
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors"
                                >
                                  Submit
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🎯</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No challenge modules available
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
        )}
      </div>
    </DashboardLayout>
  );
};

export default ChallengesPage;
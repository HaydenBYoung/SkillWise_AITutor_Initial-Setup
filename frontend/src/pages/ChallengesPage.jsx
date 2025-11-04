import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { challengeService } from '../services/challengeService';
import ChallengeCard from '../components/challenges/ChallengeCard';
import ChallengeForm from '../components/challenges/ChallengeForm';
import DashboardLayout from '../components/common/DashboardLayout';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ConfettiCelebration from '../components/common/ConfettiCelebration';
import { useAuth } from '../hooks/useAuth';

const ChallengesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const { user } = useAuth();

  // Filters
  const [filters, setFilters] = useState({
    difficulty: searchParams.get('difficulty') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || '',
    goalId: searchParams.get('goalId') || '',
  });

  // Load challenges on component mount
  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      setLoading(true);
      const response = await challengeService.getChallenges();
      if (response.success) {
        setChallenges(response.data);
      }
    } catch (error) {
      console.error('Error fetching challenges:', error);
      toast.error('Failed to load challenges');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChallenge = async (challengeData) => {
    try {
      setSubmitting(true);
      const response = await challengeService.createChallenge(challengeData);
      if (response.success) {
        setChallenges(prev => [response.data, ...prev]);
        setShowForm(false);
        
        // 🎉 CELEBRATION PRESERVED! 🎉
        setShowCelebration(true);
        toast.success('⚡ Amazing! Your new challenge is ready to conquer!', {
          duration: 4000,
          icon: '🚀',
        });
      }
    } catch (error) {
      console.error('Error creating challenge:', error);
      toast.error(error.response?.data?.message || 'Failed to create challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateChallenge = async (challengeData) => {
    try {
      setSubmitting(true);
      const response = await challengeService.updateChallenge(editingChallenge.id, challengeData);
      if (response.success) {
        setChallenges(prev => prev.map(challenge => 
          challenge.id === editingChallenge.id ? response.data : challenge
        ));
        setEditingChallenge(null);
        
        // Check if challenge was completed and trigger celebration 🏆
        if (response.data.status === 'completed' && editingChallenge.status !== 'completed') {
          setShowCelebration(true);
          toast.success('🏆 CHALLENGE COMPLETED! You are unstoppable!', {
            duration: 5000,
            icon: '🎊',
          });
        } else {
          toast.success('✨ Challenge updated successfully!');
        }
      }
    } catch (error) {
      console.error('Error updating challenge:', error);
      toast.error(error.response?.data?.message || 'Failed to update challenge');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!confirm('Are you sure you want to delete this challenge? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await challengeService.deleteChallenge(challengeId);
      if (response.success) {
        setChallenges(prev => prev.filter(challenge => challenge.id !== challengeId));
        toast.success('Challenge deleted successfully');
      }
    } catch (error) {
      console.error('Error deleting challenge:', error);
      toast.error(error.response?.data?.message || 'Failed to delete challenge');
    }
  };

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge);
    setShowForm(true);
  };

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingChallenge(null);
  };

  const filteredChallenges = challenges.filter(challenge => {
    if (filters.category && challenge.category !== filters.category) return false;
    if (filters.difficulty && challenge.difficulty_level !== filters.difficulty) return false;
    if (filters.status && challenge.status !== filters.status) return false;
    return true;
  });

  const categories = [...new Set(challenges.map(challenge => challenge.category).filter(Boolean))];
  const completedChallenges = challenges.filter(challenge => challenge.status === 'completed').length;
  const averageProgress = challenges.length > 0 
    ? Math.round(challenges.reduce((sum, challenge) => {
        const progress = challenge.status === 'completed' ? 100 : 
                        challenge.status === 'in_progress' ? 50 : 0;
        return sum + progress;
      }, 0) / challenges.length)
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
      
      <div className="challenges-page relative">
        {/* Enhanced Page Header with Gradient Background */}
        <div className="page-header mb-8 p-8 rounded-2xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 dark:from-purple-600 dark:via-indigo-600 dark:to-blue-600 text-white shadow-xl">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-white mb-2">
                ⚡ My Challenges
              </h1>
              <div className="flex items-center space-x-6 text-white/90 dark:text-white/95">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📊</span>
                  <span className="font-medium">{challenges.length} challenges</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">🏆</span>
                  <span className="font-medium">{completedChallenges} completed</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">📈</span>
                  <span className="font-medium">{averageProgress}% average progress</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowForm(true)}
              className="bg-white dark:bg-gray-100 text-purple-600 dark:text-purple-700 px-8 py-4 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-200 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center space-x-2"
              disabled={showForm}
            >
              <span className="text-xl">✨</span>
              <span>Create New Challenge</span>
            </button>
          </div>
        </div>

        {/* Enhanced Challenge Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-screen overflow-y-auto shadow-2xl animate-slideUp">
              <div className="p-8">
                <div className="flex items-center space-x-3 mb-6">
                  <span className="text-3xl">{editingChallenge ? '✏️' : '⚡'}</span>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
                  </h2>
                </div>
                <ChallengeForm
                  challenge={editingChallenge}
                  onSubmit={editingChallenge ? handleUpdateChallenge : handleCreateChallenge}
                  onCancel={handleCancelForm}
                  isLoading={submitting}
                />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Filters with Glass Effect */}
        <div className="challenges-filters bg-white/80 dark:bg-gray-800/80 backdrop-blur-md p-6 rounded-xl shadow-lg mb-8 border border-white/20 dark:border-gray-600/20">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">🔍</span>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Filter Challenges</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📁 Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                className="form-select w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
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
                ⚡ Difficulty
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                className="form-select w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
              >
                <option value="">All Difficulties</option>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🟠 Hard</option>
                <option value="expert">🔴 Expert</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                📊 Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="form-select w-full rounded-lg border-2 border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:border-purple-500 dark:focus:border-purple-400 transition-colors"
              >
                <option value="">All Statuses</option>
                <option value="not_started">🆕 Not Started</option>
                <option value="in_progress">⏳ In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ category: '', status: '', difficulty: '', goalId: '' })}
                className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
              >
                🗑️ Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Challenges Grid */}
        <div className="challenges-grid">
          {filteredChallenges.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredChallenges.map((challenge, index) => (
                <div 
                  key={challenge.id}
                  className="animate-fadeInUp"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ChallengeCard
                    challenge={challenge}
                    onEdit={() => handleEditChallenge(challenge)}
                    onDelete={() => handleDeleteChallenge(challenge.id)}
                  />
                </div>
              ))}
            </div>
          ) : challenges.length === 0 ? (
            <div className="empty-state text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mb-6 animate-bounce">
                <span className="text-6xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">Ready to Challenge Yourself?</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto text-lg">
                Create your first coding challenge to start building your skills and tracking your progress. 
                Every expert was once a beginner! 🚀
              </p>
              <button
                onClick={() => setShowForm(true)}
                className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                ✨ Create Your First Challenge
              </button>
            </div>
          ) : (
            <div className="empty-state text-center py-16 bg-white dark:bg-gray-800 rounded-2xl shadow-lg">
              <div className="mx-auto w-32 h-32 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 rounded-full flex items-center justify-center mb-6">
                <span className="text-6xl">🔍</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">No Challenges Match Your Filters</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md mx-auto text-lg">
                Try adjusting your filters to discover more challenges, or create a new one!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => setFilters({ category: '', status: '', difficulty: '', goalId: '' })}
                  className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 px-6 py-3 rounded-lg font-medium transition-all duration-200 hover:scale-105"
                >
                  🗑️ Clear Filters
                </button>
                <button
                  onClick={() => setShowForm(true)}
                  className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-600 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  ✨ Create New Challenge
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChallengesPage;
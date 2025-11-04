import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { challengeService } from '../services/challengeService';
import ChallengeCard from '../components/challenges/ChallengeCard';
import ChallengeForm from '../components/challenges/ChallengeForm';
import LoadingSpinner from '../components/common/LoadingSpinner';
import ErrorMessage from '../components/common/ErrorMessage';

const ChallengesPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null);

  // Filters
  const [filters, setFilters] = useState({
    difficulty: searchParams.get('difficulty') || '',
    category: searchParams.get('category') || '',
    status: searchParams.get('status') || 'all',
    goalId: searchParams.get('goalId') || '',
  });

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  // Load challenges
  useEffect(() => {
    loadChallenges();
  }, [filters]);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.difficulty) queryParams.append('difficulty', filters.difficulty);
      if (filters.category) queryParams.append('category', filters.category);
      if (filters.status !== 'all') queryParams.append('status', filters.status);
      if (filters.goalId) queryParams.append('goalId', filters.goalId);

      const response = await challengeService.getChallenges(queryParams.toString());
      setChallenges(response.data);
    } catch (err) {
      console.error('Error loading challenges:', err);
      setError('Failed to load challenges. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        params.set(key, value);
      }
    });
    setSearchParams(params);
  }, [filters, setSearchParams]);

  // Filter challenges based on search term
  const filteredChallenges = challenges.filter(challenge =>
    challenge.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    challenge.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    challenge.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateChallenge = () => {
    setEditingChallenge(null);
    setShowForm(true);
  };

  const handleEditChallenge = (challenge) => {
    setEditingChallenge(challenge);
    setShowForm(true);
  };

  const handleDeleteChallenge = async (challengeId) => {
    if (!window.confirm('Are you sure you want to delete this challenge?')) {
      return;
    }

    try {
      await challengeService.deleteChallenge(challengeId);
      setChallenges(prev => prev.filter(c => c.id !== challengeId));
    } catch (err) {
      console.error('Error deleting challenge:', err);
      setError('Failed to delete challenge. Please try again.');
    }
  };

  const handleFormSubmit = async (challengeData) => {
    try {
      if (editingChallenge) {
        const response = await challengeService.updateChallenge(editingChallenge.id, challengeData);
        setChallenges(prev => prev.map(c => 
          c.id === editingChallenge.id ? response.data : c
        ));
      } else {
        const response = await challengeService.createChallenge(challengeData);
        setChallenges(prev => [response.data, ...prev]);
      }
      setShowForm(false);
      setEditingChallenge(null);
    } catch (err) {
      console.error('Error saving challenge:', err);
      throw err; // Let the form handle the error display
    }
  };

  const handleFormCancel = () => {
    setShowForm(false);
    setEditingChallenge(null);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      difficulty: '',
      category: '',
      status: 'all',
      goalId: '',
    });
    setSearchTerm('');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="challenges-page min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header */}
        <div className="relative mb-12">
          <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 dark:from-purple-500 dark:via-indigo-500 dark:to-blue-500 rounded-3xl p-8 text-white shadow-2xl overflow-hidden">
            <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-4xl">⚡</span>
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-purple-100">
                      Challenges Hub
                    </h1>
                  </div>
                  <p className="text-purple-100 dark:text-purple-200 text-lg leading-relaxed max-w-2xl">
                    🚀 Sharpen your skills with coding challenges designed to push your limits and accelerate your learning journey
                  </p>
                  <div className="flex items-center gap-6 mt-6 text-sm">
                    <div className="flex items-center gap-2 bg-white/20 dark:bg-white/30 px-4 py-2 rounded-full backdrop-blur-sm">
                      <span>📊</span>
                      <span className="text-white">{filteredChallenges.length} Challenges Available</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/20 dark:bg-white/30 px-4 py-2 rounded-full backdrop-blur-sm">
                      <span>🎯</span>
                      <span className="text-white">Multiple Difficulty Levels</span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCreateChallenge}
                  className="bg-white text-purple-600 hover:text-purple-700 dark:bg-gray-100 dark:text-purple-600 font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3"
                >
                  <span className="text-xl">✨</span>
                  <span>Create Challenge</span>
                </button>
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-purple-400/20 rounded-full blur-2xl"></div>
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

        {/* Enhanced Filters and Search */}
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/50 dark:border-gray-600/50 p-8 mb-8 animate-fadeInUp">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-2xl">🔍</span>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Find Your Perfect Challenge</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Enhanced Search */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>🔎</span>
                Search Challenges
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by title, description..."
                  className="w-full pl-4 pr-12 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-400 dark:focus:border-purple-300 focus:ring-4 focus:ring-purple-400/20 transition-all duration-200 placeholder-gray-400 dark:placeholder-gray-500 text-gray-900 dark:text-gray-100"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Enhanced Difficulty Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>⚡</span>
                Difficulty Level
              </label>
              <select
                value={filters.difficulty}
                onChange={(e) => handleFilterChange('difficulty', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-400 dark:focus:border-purple-300 focus:ring-4 focus:ring-purple-400/20 transition-all duration-200 text-gray-900 dark:text-gray-100"
              >
                <option value="">🌟 All Levels</option>
                <option value="easy">🟢 Easy</option>
                <option value="medium">🟡 Medium</option>
                <option value="hard">🟠 Hard</option>
                <option value="expert">🔴 Expert</option>
              </select>
            </div>

            {/* Enhanced Category Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>📂</span>
                Category
              </label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-400 dark:focus:border-purple-300 focus:ring-4 focus:ring-purple-400/20 transition-all duration-200 text-gray-900 dark:text-gray-100"
              >
                <option value="">📁 All Categories</option>
                <option value="programming">💻 Programming</option>
                <option value="web development">🌐 Web Development</option>
                <option value="data science">📊 Data Science</option>
                <option value="algorithms">🧮 Algorithms</option>
                <option value="database">🗄️ Database</option>
                <option value="system design">🏗️ System Design</option>
              </select>
            </div>

            {/* Enhanced Status Filter */}
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-300">
                <span>📈</span>
                Progress Status
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full px-4 py-3 bg-white dark:bg-gray-700 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:border-purple-400 dark:focus:border-purple-300 focus:ring-4 focus:ring-purple-400/20 transition-all duration-200 text-gray-900 dark:text-gray-100"
              >
                <option value="all">📋 All Challenges</option>
                <option value="not_started">🆕 Not Started</option>
                <option value="in_progress">⏳ In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
          </div>

          {/* Enhanced Filter Actions */}
          <div className="flex justify-between items-center pt-6 border-t border-gray-200 dark:border-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <span className="text-lg">📊</span>
                <span className="font-semibold text-gray-800 dark:text-gray-100">{filteredChallenges.length}</span>
                <span>challenge{filteredChallenges.length !== 1 ? 's' : ''} found</span>
              </div>
              {(searchTerm || Object.values(filters).some(v => v && v !== 'all')) && (
                <div className="flex items-center gap-2 text-sm bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full">
                  <span>🔍</span>
                  <span>Filters active</span>
                </div>
              )}
            </div>
            <button
              onClick={clearFilters}
              className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 bg-purple-50 dark:bg-purple-900/50 hover:bg-purple-100 dark:hover:bg-purple-900 px-4 py-2 rounded-xl transition-colors font-medium"
            >
              <span>🧹</span>
              <span>Clear All Filters</span>
            </button>
          </div>
        </div>

        {/* Challenge Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
              <div className="p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="text-2xl">✨</span>
                  <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                    {editingChallenge ? 'Edit Challenge' : 'Create New Challenge'}
                  </h2>
                </div>
                <ChallengeForm
                  challenge={editingChallenge}
                  onSubmit={handleFormSubmit}
                  onCancel={handleFormCancel}
                />
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Challenges Grid */}
        {filteredChallenges.length === 0 ? (
          <div className="text-center py-16 animate-fadeIn">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl p-12 max-w-md mx-auto shadow-lg border border-white/50 dark:border-gray-600/50">
              <div className="text-6xl mb-6">🎯</div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">No challenges found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
                {searchTerm || Object.values(filters).some(v => v && v !== 'all')
                  ? '🔍 Try adjusting your search criteria or clear the filters to see all available challenges.'
                  : '🚀 Ready to start your coding journey? Create your first challenge and begin building your skills!'}
              </p>
              {!searchTerm && !Object.values(filters).some(v => v && v !== 'all') && (
                <button
                  onClick={handleCreateChallenge}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-4 px-8 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center gap-3 mx-auto"
                >
                  <span className="text-xl">✨</span>
                  <span>Create Your First Challenge</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeInUp">
            {filteredChallenges.map((challenge, index) => (
              <div 
                key={challenge.id}
                className="animate-fadeInUp"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <ChallengeCard
                  challenge={challenge}
                  onEdit={() => handleEditChallenge(challenge)}
                  onDelete={() => handleDeleteChallenge(challenge.id)}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChallengesPage;

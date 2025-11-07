import React, { useState, useEffect } from 'react';
import ChallengeCard from '../components/challenges/ChallengeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardLayout from '../components/common/DashboardLayout';
import { challengesService } from '../services/challenges';

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: '',
  });

  // Load challenges on component mount
  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await challengesService.getChallenges();
      setChallenges(response.challenges || []);
    } catch (err) {
      setError('Failed to load challenges. Please try again.');
      console.error('Error loading challenges:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChallenge = (challenge) => {
    // TODO: Navigate to challenge detail or start challenge
    console.log('Starting challenge:', challenge);
  };

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Filter challenges based on current filters
  const filteredChallenges = challenges.filter((challenge) => {
    if (filters.category && challenge.category !== filters.category)
      return false;
    if (filters.difficulty && challenge.difficulty_level !== filters.difficulty)
      return false;
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      return (
        challenge.title.toLowerCase().includes(searchTerm) ||
        challenge.description.toLowerCase().includes(searchTerm) ||
        (challenge.tags &&
          challenge.tags.some((tag) => tag.toLowerCase().includes(searchTerm)))
      );
    }
    return true;
  });

  // Get unique categories and difficulties for filters
  const categories = [
    ...new Set(challenges.map((c) => c.category).filter(Boolean)),
  ];
  const difficulties = ['easy', 'medium', 'hard'];

  return (
    <DashboardLayout>
      <div className="challenges-page">
        <div className="page-header">
          <div>
            <h1>Learning Challenges</h1>
            <p>Enhance your skills with hands-on learning experiences</p>
          </div>
        </div>

        {error && (
          <div className="error-message">
            <p>{error}</p>
          </div>
        )}

        <div className="challenges-filters">
          <div className="filters-row">
            <div className="filter-group">
              <label htmlFor="search">Search Challenges</label>
              <input
                type="text"
                id="search"
                placeholder="Search by title, description, or tags..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
              />
            </div>

            <div className="filter-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                <option value="programming">Programming</option>
                <option value="design">Design</option>
                <option value="backend">Backend</option>
                <option value="data-science">Data Science</option>
                <option value="business">Business</option>
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                id="difficulty"
                value={filters.difficulty}
                onChange={(e) =>
                  handleFilterChange('difficulty', e.target.value)
                }
              >
                <option value="">All Levels</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="results-summary">
            <p>
              Showing {filteredChallenges.length} of {challenges.length}{' '}
              challenges
            </p>
          </div>
        </div>

        <div className="challenges-content">
          {loading ? (
            <LoadingSpinner message="Loading challenges..." />
          ) : filteredChallenges.length > 0 ? (
            <div className="challenges-grid">
              {filteredChallenges.map((challenge) => (
                <ChallengeCard key={challenge.id} challenge={challenge} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <h3>No challenges found</h3>
              <p>Try adjusting your filters or search terms.</p>
              <button
                className="btn-secondary"
                onClick={() =>
                  setFilters({ category: '', difficulty: '', search: '' })
                }
              >
                Clear Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ChallengesPage;

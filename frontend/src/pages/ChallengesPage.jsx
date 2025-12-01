// Challenges browsing and participation page
/* eslint-disable no-console */
import { useState, useEffect } from 'react';
// axios import removed - use apiService for HTTP calls
import ChallengeCard from '../components/challenges/ChallengeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardLayout from '../components/common/DashboardLayout';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSuggestionsModal, setShowSuggestionsModal] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    difficulty: '',
    search: '',
  });

  //If this doesn't work, call apiService.challenges.submit(...) after user action
  const navigate = useNavigate();
  const handleStartChallenge = (challengeId) => {
    navigate(`/challenges/${challengeId}`);
  };

  // Challenges are fetched from backend via apiService.challenges.getAll
  useEffect(() => {
    const fetchChallenges = async () => {
      setLoading(true);
      try {
        // Send current filters as query parameters to API
        const data = await apiService.challenges.getAll({
          category: filters.category,
          difficulty: filters.difficulty,
          search: filters.search,
        });
        // API may return an envelope { success, data }
        const list = data && data.data ? data.data : data || [];
        setChallenges(list);
        setFilteredChallenges(list);
      } catch (error) {
        console.error('Failed to fetch challenges:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [filters]); //re-fetch when filters change

  // Filter challenges based on current filters
  useEffect(() => {
    let filtered = challenges;

    if (filters.category) {
      filtered = filtered.filter(
        (challenge) =>
          challenge.category.toLowerCase() === filters.category.toLowerCase(),
      );
    }

    if (filters.difficulty) {
      filtered = filtered.filter(
        (challenge) =>
          challenge.difficulty.toLowerCase() ===
          filters.difficulty.toLowerCase(),
      );
    }

    if (filters.search) {
      filtered = filtered.filter(
        (challenge) =>
          challenge.title
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          challenge.description
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          challenge.tags.some((tag) =>
            tag.toLowerCase().includes(filters.search.toLowerCase()),
          ),
      );
    }

    setFilteredChallenges(filtered);
  }, [challenges, filters]);

  const handleFilterChange = (filterType, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterType]: value,
    }));
  };

  // Handler: request AI suggestions (3 suggestions), show modal; publish chosen suggestion
  const handleGenerateSuggestions = async () => {
    try {
      setSuggestionsLoading(true);
      // Use the current filters as preferences
      const preferences = { ...filters };
      // Use POST /api/ai/suggestions through apiService
      const resp = await apiService.ai.suggest({ preferences, count: 3 });
      // api returns { success: true, suggestions }
      const list = resp?.suggestions || resp || [];
      setSuggestions(list);
      setShowSuggestionsModal(true);
    } catch (err) {
      console.error('AI suggestions failed:', err);
      alert('Failed to generate suggestions. Please try again later.');
    } finally {
      setSuggestionsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="challenges-page">
        <div className="page-header flex items-center justify-between">
          <div>
            <h1>Learning Challenges</h1>
            <p>Enhance your skills with hands-on learning experiences</p>
          </div>
          <div>
            <button
              onClick={handleGenerateSuggestions}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
              type="button"
              disabled={suggestionsLoading}
              data-testid="generate-suggestions-button"
            >
              {suggestionsLoading ? 'Generating...' : 'Generate Suggestions'}
            </button>
          </div>
        </div>

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
                <ChallengeCard
                  key={challenge.id}
                  challenge={challenge}
                  onStart={() => handleStartChallenge(challenge.id)}
                />
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
      {/* Suggestions Modal */}
      {showSuggestionsModal && (
        <div className="modal-overlay" onClick={() => setShowSuggestionsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>AI Suggested Challenges</h2>
            <p>Pick one challenge to add to your list.</p>
            <div className="suggestions-list">
              {suggestions.length === 0 ? (
                <p>No suggestions returned.</p>
              ) : (
                suggestions.map((s, i) => (
                  <div key={i} className="suggestion-item p-4 border rounded-md mb-3" data-testid={`suggestion-item-${i}`}>
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                    <p className="text-sm text-gray-600">{s.description}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="badge">{s.difficulty}</span>
                      <span className="badge">{s.category}</span>
                      <span className="badge">{s.points} pts</span>
                    </div>
                    <div className="modal-actions mt-3">
                      <button
                        className="btn-primary"
                        onClick={async () => {
                          try {
                            const result = await apiService.ai.publishSuggestion(s);
                            const created = result?.challenge || result || s;
                            // Prepend to the lists so the user immediately sees it
                            setChallenges(prev => [created, ...prev]);
                            setFilteredChallenges(prev => [created, ...prev]);
                            setShowSuggestionsModal(false);
                          } catch (err) {
                            console.error('Publish suggestion failed:', err);
                            alert('Failed to publish suggestion. Please try again later.');
                          }
                        }}
                      data-testid={`publish-suggestion-button-${i}`}>
                        Add this challenge
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => setShowSuggestionsModal(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ChallengesPage;

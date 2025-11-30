// Challenges browsing and participation page
import { useState, useEffect } from 'react';
import ChallengeCard from '../components/challenges/ChallengeCard';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardLayout from '../components/common/DashboardLayout';
import AIGenerateModal from '../components/challenges/AIGenerateModal';
import { apiService } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ChallengesPage = () => {
  const [challenges, setChallenges] = useState([]);
  const [filteredChallenges, setFilteredChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAIModal, setShowAIModal] = useState(false);
  const [userGoals, setUserGoals] = useState([]);
  const [selectedGoalId, setSelectedGoalId] = useState(null);
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

  // Fetch user goals for AI challenge generation
  useEffect(() => {
    const fetchGoals = async () => {
      try {
        const data = await apiService.goals.getAll();
        const goalsList = data && data.data ? data.data : data || [];
        setUserGoals(goalsList);
      } catch (error) {
        console.error('Failed to fetch goals:', error);
      }
    };
    fetchGoals();
  }, []);

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

  const handleAIGenerate = (goalId = null) => {
    setSelectedGoalId(goalId);
    setShowAIModal(true);
  };

  const handleGenerateSuccess = (newChallenge) => {
    // Add the new challenge to the list
    setChallenges(prev => [newChallenge, ...prev]);
    setFilteredChallenges(prev => [newChallenge, ...prev]);
  };

  return (
    <DashboardLayout>
      <div className="challenges-page">
        <div className="page-header">
          <div>
            <h1>Learning Challenges</h1>
            <p>Enhance your skills with hands-on learning experiences</p>
          </div>
          <button 
            className="btn-primary"
            onClick={() => handleAIGenerate()}
            style={{ marginLeft: 'auto' }}
          >
            🤖 Generate AI Challenge
          </button>
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

        <AIGenerateModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onGenerateSuccess={handleGenerateSuccess}
          goalId={selectedGoalId}
          userGoals={userGoals}
        />
      </div>
    </DashboardLayout>
  );
};

export default ChallengesPage;

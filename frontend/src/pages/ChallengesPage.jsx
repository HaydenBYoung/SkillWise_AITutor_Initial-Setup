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
  const [expandedGoals, setExpandedGoals] = useState([]); // Track which goal cards are expanded
  const [skippedChallenges, setSkippedChallenges] = useState(() => {
    // Load skipped challenges from localStorage on mount
    const saved = localStorage.getItem('skippedChallenges');
    return saved ? JSON.parse(saved) : [];
  });
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
        
        // Mark challenges as skipped if they're in the skippedChallenges list
        const listWithSkipped = list.map(c => ({
          ...c,
          status: skippedChallenges.includes(c.id) ? 'skipped' : c.status
        }));
        
        setChallenges(listWithSkipped);
        setFilteredChallenges(listWithSkipped);
      } catch (error) {
        console.error('Failed to fetch challenges:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchChallenges();
  }, [filters, skippedChallenges]); //re-fetch when filters change

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

  const handleDelete = async (challengeId) => {
    try {
      await apiService.challenges.delete(challengeId);
      setChallenges(prev => prev.filter(c => c.id !== challengeId));
      setFilteredChallenges(prev => prev.filter(c => c.id !== challengeId));
    } catch (error) {
      console.error('Failed to delete challenge:', error);
      alert('Failed to delete challenge');
    }
  };

  const handleSkip = (challengeId) => {
    // Add to skipped list and save to localStorage
    const newSkipped = [...skippedChallenges, challengeId];
    setSkippedChallenges(newSkipped);
    localStorage.setItem('skippedChallenges', JSON.stringify(newSkipped));
    
    // Mark as skipped in the UI
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, status: 'skipped' } : c
    ));
    setFilteredChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, status: 'skipped' } : c
    ));
  };

  const handleReopenSkipped = (challengeId) => {
    // Remove from skipped list and save to localStorage
    const newSkipped = skippedChallenges.filter(id => id !== challengeId);
    setSkippedChallenges(newSkipped);
    localStorage.setItem('skippedChallenges', JSON.stringify(newSkipped));
    
    // Remove the skipped status to allow re-attempting
    setChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, status: 'available' } : c
    ));
    setFilteredChallenges(prev => prev.map(c => 
      c.id === challengeId ? { ...c, status: 'available' } : c
    ));
  };

  const toggleGoalExpanded = (goalId) => {
    setExpandedGoals(prev => 
      prev.includes(goalId) 
        ? prev.filter(id => id !== goalId)
        : [...prev, goalId]
    );
  };

  // Group challenges by goal
  const challengesByGoal = filteredChallenges.reduce((acc, challenge) => {
    const goalId = challenge.goal_id || 'ungrouped';
    if (!acc[goalId]) {
      acc[goalId] = [];
    }
    acc[goalId].push(challenge);
    return acc;
  }, {});

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
            <div className="goals-grouped-challenges">
              {/* Render challenges grouped by goals */}
              {Object.entries(challengesByGoal).map(([goalId, goalChallenges]) => {
                const goal = userGoals.find(g => g.id === parseInt(goalId));
                const isExpanded = expandedGoals.includes(goalId);
                
                return (
                  <div key={goalId} className="goal-group-card">
                    <div 
                      className="goal-group-header"
                      onClick={() => toggleGoalExpanded(goalId)}
                      style={{ 
                        cursor: 'pointer', 
                        padding: '20px', 
                        backgroundColor: 'var(--card-bg, #f8f9fa)', 
                        borderRadius: '8px', 
                        marginBottom: '10px',
                        border: '1px solid var(--border-color, #dee2e6)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600', color: '#000' }}>
                            {goal ? goal.title : 'Ungrouped Challenges'}
                          </h3>
                          <p style={{ margin: '5px 0 0 0', color: '#555', fontSize: '0.9rem' }}>
                            {goalChallenges.length} challenge{goalChallenges.length !== 1 ? 's' : ''}
                            {goal && (
                              <>
                                {' • '}<span style={{ textTransform: 'capitalize' }}>{goal.difficulty_level || 'Medium'}</span>
                                {' • '}{goal.points_earned || 0}/{goal.points_required || 100} points
                                {' • '}{goal.progress || 0}% complete
                              </>
                            )}
                          </p>
                        </div>
                        <span style={{ 
                          fontSize: '1.5rem', 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)', 
                          transition: 'transform 0.3s',
                          color: '#000'
                        }}>
                          ▼
                        </span>
                      </div>
                    </div>
                    
                    {isExpanded && (
                      <div className="goal-challenges-list" style={{ marginLeft: '20px', marginTop: '10px' }}>
                        {goalChallenges.map((challenge) => (
                          <div 
                            key={challenge.id} 
                            style={{ 
                              padding: '15px', 
                              backgroundColor: 'var(--card-bg, white)', 
                              border: '1px solid var(--border-color, #dee2e6)', 
                              borderRadius: '6px', 
                              marginBottom: '10px',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                              <div style={{ flex: 1 }}>
                                <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1rem', fontWeight: '500', color: '#000' }}>
                                  {challenge.title}
                                </h4>
                                <p style={{ margin: '0 0 10px 0', color: '#555', fontSize: '0.9rem' }}>
                                  {challenge.description?.substring(0, 150)}
                                  {challenge.description?.length > 150 ? '...' : ''}
                                </p>
                                <div style={{ display: 'flex', gap: '10px', fontSize: '0.85rem', color: '#666' }}>
                                  <span>🎯 {challenge.difficulty_level || 'Medium'}</span>
                                  <span>⏱ {challenge.estimated_time_minutes || 30}m</span>
                                  <span>⭐ {challenge.points_reward || 10} pts</span>
                                  {challenge.status && (
                                    <span style={{ 
                                      color: challenge.status === 'skipped' ? '#ffc107' : '#28a745',
                                      fontWeight: '500'
                                    }}>
                                      {challenge.status}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                                {challenge.status?.toLowerCase() === 'skipped' ? (
                                  <button
                                    onClick={() => handleReopenSkipped(challenge.id)}
                                    style={{
                                      padding: '8px 16px',
                                      backgroundColor: '#28a745',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    Reopen
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleStartChallenge(challenge.id)}
                                    style={{
                                      padding: '8px 16px',
                                      backgroundColor: '#007bff',
                                      color: 'white',
                                      border: 'none',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      fontSize: '0.9rem'
                                    }}
                                  >
                                    Start
                                  </button>
                                )}
                                <button
                                  onClick={() => handleSkip(challenge.id)}
                                  style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#ffc107',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  Skip
                                </button>
                                <button
                                  onClick={() => handleDelete(challenge.id)}
                                  style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    fontSize: '0.9rem'
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
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

// Leaderboard and rankings page UI
import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
// eslint-disable-next-line no-unused-vars
import LoadingSpinner from '../components/common/LoadingSpinner';
// eslint-disable-next-line no-unused-vars
import TrophyCelebration from '../components/common/TrophyCelebration';
// eslint-disable-next-line no-unused-vars
import DashboardLayout from '../components/common/DashboardLayout';
import { useAuth } from '../hooks/useAuth';

const LeaderboardPage = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeframe, setTimeframe] = useState('all-time');
  const [category, setCategory] = useState('overall');
  const [showTrophies, setShowTrophies] = useState(false);
  const [userRank, setUserRank] = useState(null);
  const { user: authUser } = useAuth();

  useEffect(() => {
    const fetchLeaderboardData = async () => {
      if (!apiService?.leaderboard?.getGlobal) {
        console.error('Leaderboard API unavailable');
        setError('Leaderboard service unavailable');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setError(null);

        // Fetch global leaderboard with filters
        const params = {
          timeframe,
          category,
          limit: 50,
        };

        const leaderboardRaw = await apiService.leaderboard.getGlobal(params);
        // backend returns either { success, data } or raw array; apiService normalizes already
        const leaderboard = Array.isArray(leaderboardRaw?.data)
          ? leaderboardRaw.data
          : Array.isArray(leaderboardRaw)
            ? leaderboardRaw
            : leaderboardRaw?.leaderboard || [];

        // Fetch current user's rank
        let currentUserRankData = null;
        try {
          const rankRaw = await apiService.leaderboard.getUserRank();
          currentUserRankData = rankRaw?.data || rankRaw;
          setUserRank(currentUserRankData);
        } catch (err) {
          console.error('Failed to fetch user rank:', err);
        }

        // Transform and mark current user in leaderboard
        const transformedData = leaderboard.map((entry, index) => ({
          id: entry.user_id || entry.id || index + 1,
          rank: entry.rank || index + 1,
          name: entry.name || entry.user_name || `${entry.first_name || ''} ${entry.last_name || ''}`.trim() || 'Anonymous',
          avatar: entry.avatar || '👤',
          points: entry.total_points || entry.points || 0,
          level: entry.level || Math.floor((entry.total_points || 0) / 100) + 1,
          completedChallenges: entry.completed_challenges || entry.challenges_completed || 0,
          isCurrentUser: authUser && (entry.user_id === authUser.id || entry.id === authUser.id),
        }));

        setLeaderboardData(transformedData);
      } catch (err) {
        console.error('Failed to fetch leaderboard:', err);
        setError(err.message || 'Failed to load leaderboard');
        // Fallback to empty data on error
        setLeaderboardData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboardData();
  }, [timeframe, category, authUser]);

  const getRankIcon = (rank) => {
    switch (rank) {
    case 1:
      return '🥇';
    case 2:
      return '🥈';
    case 3:
      return '🥉';
    default:
      return `#${rank}`;
    }
  };

  const currentUserRank = userRank?.rank || 
    leaderboardData.find((u) => u.isCurrentUser)?.rank || 
    0;

  return (
    <DashboardLayout>
      <div className="page-header">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h1>Leaderboard</h1>
            <p>See how you compare with other learners</p>
          </div>
          <button
            className="btn-primary"
            onClick={() => setShowTrophies(true)}
            style={{ marginLeft: 'auto' }}
          >
            🏆 Celebrate Winners!
          </button>
        </div>
      </div>

      <div className="leaderboard-filters">
        <div className="filters-row">
          <div className="filter-group">
            <label htmlFor="timeframe">Timeframe</label>
            <select
              id="timeframe"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              <option value="all-time">All Time</option>
              <option value="this-month">This Month</option>
              <option value="this-week">This Week</option>
              <option value="today">Today</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="overall">Overall Points</option>
              <option value="challenges">Challenges Completed</option>
              <option value="goals">Goals Achieved</option>
              <option value="streak">Learning Streak</option>
            </select>
          </div>
        </div>
      </div>

      {currentUserRank > 0 && (
        <div className="user-rank-summary">
          <div className="rank-card current-user">
            <h3>Your Ranking</h3>
            <div className="rank-info">
              <span className="rank-number">#{currentUserRank}</span>
              <div className="rank-details">
                <p>
                  You're in the top{' '}
                  {Math.round((currentUserRank / leaderboardData.length) * 100)}
                  % of learners!
                </p>
                <small>Keep learning to climb higher!</small>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="leaderboard-content">
        {loading ? (
          <LoadingSpinner message="Loading leaderboard..." />
        ) : error ? (
          <div className="error-message">
            <p>❌ {error}</p>
            <button 
              className="btn-secondary" 
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : leaderboardData.length === 0 ? (
          <div className="empty-state">
            <p>🏆 No leaderboard data available yet.</p>
            <p>Complete some challenges to get on the board!</p>
          </div>
        ) : (
          <>
            <div className="podium-section">
              <h2>Top Performers</h2>
              <div className="podium">
                {leaderboardData.slice(0, 3).map((user, index) => (
                  <div
                    key={user.id}
                    className={`podium-position position-${index + 1}`}
                  >
                    <div className="podium-user">
                      <div className="user-avatar">{user.avatar}</div>
                      <h4>{user.name}</h4>
                      <p>{user.points} points</p>
                      <span className="level-badge">Level {user.level}</span>
                    </div>
                    <div className="podium-rank">{getRankIcon(user.rank)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="full-rankings">
              <h2>Complete Rankings</h2>
              <div className="rankings-table">
                <div className="table-header">
                  <div className="col-rank">Rank</div>
                  <div className="col-user">User</div>
                  <div className="col-points">Points</div>
                  <div className="col-level">Level</div>
                  <div className="col-challenges">Challenges</div>
                </div>

                {leaderboardData.map((user) => (
                  <div
                    key={user.id}
                    className={`table-row ${
                      user.isCurrentUser ? 'current-user' : ''
                    }`}
                  >
                    <div className="col-rank">
                      <span className="rank-icon">
                        {getRankIcon(user.rank)}
                      </span>
                    </div>
                    <div className="col-user">
                      <div className="user-info">
                        <span className="user-avatar">{user.avatar}</span>
                        <span className="user-name">
                          {user.name}
                          {user.isCurrentUser && <small> (You)</small>}
                        </span>
                      </div>
                    </div>
                    <div className="col-points">
                      <strong>{user.points.toLocaleString()}</strong>
                    </div>
                    <div className="col-level">
                      <span className="level-badge">Level {user.level}</span>
                    </div>
                    <div className="col-challenges">
                      {user.completedChallenges}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="achievements-section">
              <h2>Top Achievements This Week</h2>
              <div className="achievements-grid">
                <div className="achievement-card">
                  <div className="achievement-icon">🚀</div>
                  <h4>Challenge Master</h4>
                  <p>Completed 5 challenges in one day</p>
                  <small>Earned by Alex Johnson</small>
                </div>

                <div className="achievement-card">
                  <div className="achievement-icon">🔥</div>
                  <h4>Streak Legend</h4>
                  <p>30-day learning streak</p>
                  <small>Earned by Sarah Kim</small>
                </div>

                <div className="achievement-card">
                  <div className="achievement-icon">🎯</div>
                  <h4>Goal Crusher</h4>
                  <p>Completed 3 learning goals</p>
                  <small>Earned by Mike Chen</small>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {showTrophies && (
        <TrophyCelebration onComplete={() => setShowTrophies(false)} />
      )}
    </DashboardLayout>
  );
};

export default LeaderboardPage;

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import '../styles/Leaderboard.css';

// Simple icon replacements
const Trophy = () => <span style={{ fontSize: '32px' }}>🏆</span>;
const TrendingUp = () => <span>📈</span>;
const Award = () => <span>🏅</span>;
const Users = () => <span>👥</span>;
const Calendar = () => <span>📅</span>;
const Filter = () => <span>🔍</span>;

// Celebration component for trophy rain
const TrophyRain = ({ show, onComplete }) => {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => {
        onComplete();
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  if (!show) return null;

  return (
    <div className="trophy-rain">
      {[...Array(30)].map((_, i) => (
        <div
          key={i}
          className="trophy-emoji"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 2}s`,
            animationDuration: `${2 + Math.random() * 2}s`,
          }}
        >
          🏆
        </div>
      ))}
    </div>
  );
};

const Leaderboard = () => {
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [timeframe, setTimeframe] = useState('all-time');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    fetchLeaderboard();
    fetchUserRank();
  }, [timeframe]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(
        `/leaderboard?timeframe=${timeframe}&limit=50`
      );
      setLeaderboardData(response.data.data.leaderboard);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRank = async () => {
    try {
      const response = await api.get(`/leaderboard/me?timeframe=${timeframe}`);
      setUserRank(response.data.data);
    } catch (err) {
      console.error('Error fetching user rank:', err);
    }
  };

  const getRankIcon = (rank) => {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  };

  const getLevelBadge = (level) => {
    const colors = {
      1: 'badge-bronze',
      2: 'badge-bronze',
      3: 'badge-silver',
      4: 'badge-silver',
      5: 'badge-gold',
      6: 'badge-gold',
      7: 'badge-platinum',
      8: 'badge-platinum',
      9: 'badge-diamond',
      10: 'badge-diamond',
    };
    const color = colors[Math.min(level, 10)] || 'badge-bronze';
    return <span className={`level-badge ${color}`}>Lvl {level}</span>;
  };

  const formatPoints = (points) => {
    return points.toLocaleString();
  };

  const getTimeframeLabel = (tf) => {
    const labels = {
      daily: 'Today',
      weekly: 'This Week',
      monthly: 'This Month',
      'all-time': 'All Time',
    };
    return labels[tf] || tf;
  };

  if (loading && !leaderboardData.length) {
    return (
      <div className="leaderboard-container">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading leaderboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="leaderboard-container">
      {/* Header */}
      <div className="leaderboard-header">
        <div className="header-content">
          <Trophy />
          <div>
            <h1>Leaderboard</h1>
            <p>See how you rank among other learners</p>
          </div>
        </div>
      </div>

      {/* Your Rank Card */}
      {userRank && (
        <div className="user-rank-card">
          <div className="rank-header">
            <Users size={24} />
            <h2>Your Ranking</h2>
          </div>
          <div className="rank-stats">
            <div className="rank-stat">
              <div className="stat-label">Rank</div>
              <div className="stat-value rank-position">
                {getRankIcon(userRank.rank)}
              </div>
              <div className="stat-sublabel">Top {userRank.percentile}%</div>
            </div>
            <div className="rank-stat">
              <div className="stat-label">Points</div>
              <div className="stat-value">{formatPoints(userRank.points)}</div>
              <div className="stat-sublabel">
                {getLevelBadge(userRank.level)}
              </div>
            </div>
            <div className="rank-stat">
              <div className="stat-label">Challenges</div>
              <div className="stat-value">{userRank.challengesCompleted}</div>
              <div className="stat-sublabel">completed</div>
            </div>
            <div className="rank-stat">
              <div className="stat-label">Streak</div>
              <div className="stat-value">{userRank.currentStreak} 🔥</div>
              <div className="stat-sublabel">days</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeframe Filter */}
      <div className="filters-section">
        <button
          className="filters-toggle"
          onClick={() => setShowFilters(!showFilters)}
        >
          <Filter size={20} />
          Filters
        </button>
        {showFilters && (
          <div className="timeframe-filters">
            {['daily', 'weekly', 'monthly', 'all-time'].map((tf) => (
              <button
                key={tf}
                className={`timeframe-btn ${timeframe === tf ? 'active' : ''}`}
                onClick={() => setTimeframe(tf)}
              >
                <Calendar size={16} />
                {getTimeframeLabel(tf)}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Leaderboard Table */}
      <div className="leaderboard-content">
        {error && (
          <div className="error-message">
            <p>{error}</p>
            <button onClick={fetchLeaderboard}>Retry</button>
          </div>
        )}

        {!error && leaderboardData.length === 0 && (
          <div className="empty-state">
            <Trophy />
            <p>No rankings available yet</p>
            <p className="empty-subtitle">
              Complete challenges to appear on the leaderboard!
            </p>
          </div>
        )}

        {!error && leaderboardData.length > 0 && (
          <div className="leaderboard-table">
            <div className="table-header">
              <div className="col-rank">Rank</div>
              <div className="col-user">User</div>
              <div className="col-level">Level</div>
              <div className="col-points">Points</div>
              <div className="col-challenges">Challenges</div>
              <div className="col-streak">Streak</div>
            </div>
            <div className="table-body">
              {leaderboardData.map((user) => (
                <div
                  key={user.userId}
                  className={`table-row ${
                    user.userId === userRank?.userId ? 'current-user' : ''
                  } ${user.rank <= 3 ? 'top-rank' : ''}`}
                >
                  <div className="col-rank">
                    <span className="rank-badge">{getRankIcon(user.rank)}</span>
                  </div>
                  <div className="col-user">
                    <span className="user-name">{user.fullName}</span>
                  </div>
                  <div className="col-level">{getLevelBadge(user.level)}</div>
                  <div className="col-points">
                    <TrendingUp size={16} className="points-icon" />
                    <span className="points-value">
                      {formatPoints(user.points)}
                    </span>
                  </div>
                  <div className="col-challenges">
                    <Award size={16} className="challenge-icon" />
                    {user.challengesCompleted}
                  </div>
                  <div className="col-streak">
                    {user.currentStreak > 0 ? (
                      <span className="streak-value">
                        {user.currentStreak} 🔥
                      </span>
                    ) : (
                      <span className="no-streak">-</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Refresh and Celebrate Buttons */}
      <div className="leaderboard-footer">
        <button
          className="refresh-btn"
          onClick={fetchLeaderboard}
          disabled={loading}
        >
          {loading ? 'Refreshing...' : 'Refresh Leaderboard'}
        </button>
        <button
          className="celebrate-btn"
          onClick={() => setShowCelebration(true)}
        >
          🎉 Celebrate Winners!
        </button>
        <p className="last-updated">Rankings update in real-time</p>
      </div>

      <TrophyRain
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />
    </div>
  );
};

export default Leaderboard;

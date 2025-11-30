// Dashboard overview with real-time statistics and activity
import { useState, useEffect } from 'react';
import { apiService } from '../../services/api';
import LoadingSpinner from '../common/LoadingSpinner';
import { useNavigate } from 'react-router-dom';

const DashboardOverview = () => {
  const [progressData, setProgressData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [progressResponse, goalsResponse] = await Promise.all([
          apiService.progress.getOverview('week'),
          apiService.goals.getAll()
        ]);
        
        const progressPayload = progressResponse?.data?.data || progressResponse?.data || progressResponse;
        const goalsPayload = goalsResponse?.data || goalsResponse;
        
        setProgressData(progressPayload);
        setGoals(goalsPayload);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setProgressData({
          overall: {
            totalPoints: 0,
            level: 1,
            completedGoals: 0,
            completedChallenges: 0,
            currentStreak: 0
          },
          recentActivity: []
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading dashboard..." />;
  }

  const activeGoals = goals.filter(g => !g.is_completed && g.status !== 'completed');
  const completedGoals = goals.filter(g => g.is_completed || g.status === 'completed');

  return (
    <div className="dashboard-overview">
      <div className="welcome-section" style={{ marginBottom: '30px' }}>
        <h2>Welcome back!</h2>
        <p style={{ color: '#999' }}>Here's your learning progress at a glance</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card" onClick={() => navigate('/progress')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <h3>{progressData?.overall?.totalPoints || 0}</h3>
            <p>Total Points</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/progress')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">⭐</div>
          <div className="stat-content">
            <h3>Level {progressData?.overall?.level || 1}</h3>
            <p>Current Level</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/goals')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <h3>{progressData?.overall?.completedGoals || 0}</h3>
            <p>Goals Completed</p>
          </div>
        </div>

        <div className="stat-card" onClick={() => navigate('/challenges')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <h3>{progressData?.overall?.completedChallenges || 0}</h3>
            <p>Challenges Done</p>
          </div>
        </div>
      </div>

      <div className="dashboard-sections" style={{ marginTop: '30px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '30px' }}>
          {/* Active Goals */}
          <div className="section-card" style={{ 
            background: 'var(--card-bg, white)', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#000' }}>Active Goals ({activeGoals.length})</h3>
              <button 
                onClick={() => navigate('/goals')}
                style={{ 
                  padding: '6px 12px', 
                  background: '#1976d2', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                View All
              </button>
            </div>
            {activeGoals.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {activeGoals.slice(0, 3).map(goal => (
                  <div 
                    key={goal.id} 
                    style={{ 
                      padding: '12px', 
                      background: '#f5f5f5', 
                      borderRadius: '6px',
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate('/goals')}
                  >
                    <div style={{ fontWeight: '500', marginBottom: '5px', color: '#000' }}>{goal.title}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div className="progress-bar" style={{ flex: 1, marginRight: '10px' }}>
                        <div 
                          className="progress-fill" 
                          style={{ width: `${goal.progress || 0}%` }}
                        ></div>
                      </div>
                      <span style={{ fontSize: '14px', color: '#555' }}>{goal.progress || 0}%</span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#555', marginTop: '5px' }}>
                      {goal.points_earned || 0}/{goal.points_required || 100} points
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                No active goals. <span onClick={() => navigate('/goals')} style={{ color: '#1976d2', cursor: 'pointer' }}>Create one!</span>
              </p>
            )}
          </div>

          {/* Recent Activity */}
          <div className="section-card" style={{ 
            background: 'var(--card-bg, white)', 
            padding: '20px', 
            borderRadius: '8px', 
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <h3 style={{ color: '#000' }}>Recent Activity</h3>
              <button 
                onClick={() => navigate('/progress')}
                style={{ 
                  padding: '6px 12px', 
                  background: '#1976d2', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '4px', 
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                View All
              </button>
            </div>
            {progressData?.recentActivity && progressData.recentActivity.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {progressData.recentActivity.slice(0, 5).map(activity => (
                  <div 
                    key={activity.id} 
                    style={{ 
                      padding: '12px', 
                      background: '#f5f5f5', 
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span style={{ fontSize: '24px' }}>
                      {activity.type === 'challenge_completed' ? '🚀' : '🎯'}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: '500', fontSize: '14px', color: '#000' }}>{activity.title}</div>
                      <div style={{ fontSize: '12px', color: '#555' }}>
                        {activity.points > 0 && `+${activity.points} points`}
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#999' }}>
                      {new Date(activity.timestamp).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: '#999', textAlign: 'center', padding: '20px' }}>
                No recent activity. <span onClick={() => navigate('/challenges')} style={{ color: '#1976d2', cursor: 'pointer' }}>Start a challenge!</span>
              </p>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions" style={{ 
          background: 'var(--card-bg, white)', 
          padding: '20px', 
          borderRadius: '8px', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ marginBottom: '15px', color: '#000' }}>Quick Actions</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
            <button 
              onClick={() => navigate('/goals')}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '32px' }}>🎯</span>
              Create Goal
            </button>
            <button 
              onClick={() => navigate('/challenges')}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '32px' }}>🚀</span>
              Browse Challenges
            </button>
            <button 
              onClick={() => navigate('/progress')}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '32px' }}>📊</span>
              View Progress
            </button>
            <button 
              onClick={() => navigate('/leaderboard')}
              style={{
                padding: '20px',
                background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: '500',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span style={{ fontSize: '32px' }}>🏆</span>
              Leaderboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardOverview;

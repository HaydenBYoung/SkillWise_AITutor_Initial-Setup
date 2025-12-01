// Progress tracking and analytics page with enhanced goal tracking
import { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardLayout from '../components/common/DashboardLayout';
import { apiService } from '../services/api';
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from 'recharts';

const ProgressPage = () => {
  const [progressData, setProgressData] = useState(null);
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const [progressResponse, goalsResponse] = await Promise.all([
        apiService.progress.getOverview(timeframe),
        apiService.goals.getAll()
      ]);
      
      const progressPayload = progressResponse?.data?.data || progressResponse?.data || progressResponse;
      const goalsPayload = goalsResponse?.data || goalsResponse;
      
      setProgressData(progressPayload);
      setGoals(goalsPayload);
    } catch (error) {
      console.error('Error fetching progress:', error);
      setProgressData({
        overall: {
          totalPoints: 0,
          level: 1,
          experiencePoints: 0,
          nextLevelXP: 100,
          completedGoals: 0,
          completedChallenges: 0,
          currentStreak: 0,
          longestStreak: 0
        },
        weeklyProgress: [],
        skillBreakdown: [],
        recentActivity: []
      });
      setGoals([]);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  if (loading || !progressData) {
    return <LoadingSpinner message="Loading your progress..." />;
  }

  const activeGoals = goals.filter(g => !g.is_completed && g.status !== 'completed');
  const completedGoals = goals.filter(g => g.is_completed || g.status === 'completed');

  return (
    <DashboardLayout>
      <div className="progress-page">
        <div className="page-header">
          <h1>Your Learning Progress</h1>
          <p>Track your journey and celebrate your achievements</p>
        </div>

        <div className="progress-overview">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🎯</div>
              <div className="stat-content">
                <h3>{progressData.overall.totalPoints}</h3>
                <p>Total Points</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">⭐</div>
              <div className="stat-content">
                <h3>Level {progressData.overall.level}</h3>
                <p>Current Level</p>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${
                        (progressData.overall.experiencePoints /
                          progressData.overall.nextLevelXP) *
                        100
                      }%`,
                    }}
                  ></div>
                </div>
                <small>
                  {progressData.overall.experiencePoints}/
                  {progressData.overall.nextLevelXP} XP
                </small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <h3>{progressData.overall.completedGoals}</h3>
                <p>Goals Completed</p>
                <small>{activeGoals.length} active</small>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🚀</div>
              <div className="stat-content">
                <h3>{progressData.overall.completedChallenges}</h3>
                <p>Challenges Done</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-content">
                <h3>{progressData.overall.currentStreak}</h3>
                <p>Day Streak</p>
                <small>
                  Longest: {progressData.overall.longestStreak} days
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Goals Progress Section */}
        {activeGoals.length > 0 && (
          <div className="goals-progress-section" style={{ 
            background: 'var(--card-bg, white)', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#000' }}>Active Goals Progress</h2>
            <div style={{ display: 'grid', gap: '15px' }}>
              {activeGoals.map(goal => (
                <div 
                  key={goal.id}
                  style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '6px',
                    border: '1px solid #dee2e6'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '1.1rem', color: '#000' }}>{goal.title}</h4>
                      <p style={{ margin: '5px 0 0 0', fontSize: '0.9rem', color: '#555' }}>
                        {goal.difficulty_level || 'Medium'} • {goal.points_earned || 0}/{goal.points_required || 100} points
                      </p>
                    </div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#1976d2' }}>
                      {goal.progress || 0}%
                    </div>
                  </div>
                  <div className="progress-bar" style={{ height: '12px' }}>
                    <div
                      className="progress-fill"
                      style={{ 
                        width: `${goal.progress || 0}%`,
                        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)'
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <div className="completed-goals-section" style={{ 
            background: 'var(--card-bg, white)', 
            padding: '20px', 
            borderRadius: '8px', 
            marginBottom: '20px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '20px', color: '#000' }}>🎉 Completed Goals ({completedGoals.length})</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '15px' }}>
              {completedGoals.map(goal => (
                <div 
                  key={goal.id}
                  style={{
                    padding: '15px',
                    background: 'linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%)',
                    borderRadius: '6px',
                    border: '2px solid #4caf50'
                  }}
                >
                  <div style={{ fontSize: '32px', marginBottom: '10px' }}>✅</div>
                  <h4 style={{ margin: '0 0 5px 0', color: '#000' }}>{goal.title}</h4>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#555' }}>
                    {goal.difficulty_level || 'Medium'} • {goal.points_earned || 0} points earned
                  </p>
                  {goal.completion_date && (
                    <p style={{ margin: '5px 0 0 0', fontSize: '0.8rem', color: '#666' }}>
                      Completed {new Date(goal.completion_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="progress-sections">
          <div className="section-row">
            <div className="progress-chart-section">
              <div className="section-header">
                <h2>Weekly Activity</h2>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                >
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="year">This Year</option>
                </select>
              </div>

              <div
                className="chart-container"
                style={{ width: '100%', height: 300 }}
              >
                <ResponsiveContainer>
                  <BarChart
                    data={progressData.weeklyProgress}
                    margin={{ top: 10, right: 20, left: 0, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="points" fill="#8884d8" name="Points Earned" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="recent-activity-section">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {progressData.recentActivity.length > 0 ? (
                  progressData.recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {activity.type === 'challenge_completed' && '🚀'}
                        {activity.type === 'goal_progress' && '🎯'}
                        {activity.type === 'achievement_earned' && '🏆'}
                      </div>
                      <div className="activity-content">
                        <h4>{activity.title}</h4>
                        <p>
                          {activity.points && `+${activity.points} points`}
                          {activity.progress && `${activity.progress}% complete`}
                        </p>
                        <small>
                          {new Date(activity.timestamp).toLocaleDateString()}
                        </small>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ textAlign: 'center', color: '#999', padding: '20px' }}>
                    No recent activity yet. Complete challenges to see your progress!
                  </p>
                )}
              </div>
            </div>
          </div>

          {progressData.skillBreakdown && progressData.skillBreakdown.length > 0 && (
            <div className="skills-section">
              <h2>Skill Breakdown</h2>
              <div className="skills-grid">
                {progressData.skillBreakdown.map((skill, index) => (
                  <div key={index} className="skill-item">
                    <div className="skill-header">
                      <h4>{skill.skill}</h4>
                      <span className="skill-level">Level {skill.level}</span>
                    </div>
                    <div className="skill-progress">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${skill.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{skill.progress}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;

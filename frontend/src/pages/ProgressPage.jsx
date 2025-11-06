// Progress tracking and analytics page (Recharts-based). Replace or extend as needed.
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
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('week');

  // Progress is fetched from backend via apiService.progress.getOverview(timeframe)
  /*
  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.progress.getOverview(timeframe);
      setProgressData(data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);
  */

  const fetchProgress = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiService.progress.getOverview(timeframe);
      setProgressData(response.data.data);
    } catch (error) {
      console.error('Error fetching progress:', error);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  /**
   * Handle dynamic updates (e.g., when a challenge is completed)
   */
  const handleChallengeCompletion = async (challengeId) => {
    try {
      await apiService.progress.update({ challengeId });
      await fetchProgress(); // re-fetch to update stats and charts
    } catch (error) {
      console.error('Error updating progress after completion:', error);
    }
  };

  if (loading || !progressData) {
    return <LoadingSpinner message="Loading your progress..." />;
  }
  const { overall, weeklyProgress, skillBreakdown, recentActivity } =
    progressData;

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

        {/*Weekly--*/}
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
                    data={weeklyProgress}
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

            {/*(Old weekly activity) <div className="weekly-chart">
                {progressData.weeklyProgress.map((day, index) => (
                  <div key={index} className="day-column">
                    <div className="day-label">{day.day}</div>
                    <div
                      className="day-bar"
                      style={{ height: `${Math.max(day.points / 2, 5)}px` }}
                      title={`${day.points} points, ${day.timeSpent} minutes`}
                    ></div>
                    <div className="day-points">{day.points}</div>
                  </div>
                ))}
              </div>
            </div>
            */}

            {/*Recent*/}
            <div className="recent-activity-section">
              <h2>Recent Activity</h2>
              <div className="activity-list">
                {progressData.recentActivity.map((activity) => (
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
                ))}
              </div>
            </div>
          </div>

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
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;

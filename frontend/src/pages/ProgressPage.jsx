import React, { useState, useEffect } from 'react';
import ProgressTracker from '../components/progress/ProgressTracker';
import ProgressCharts from '../components/progress/ProgressCharts';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardLayout from '../components/common/DashboardLayout';
import { apiService } from '../services/api';

const ProgressPage = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [progressData, setProgressData] = useState({
    goals: [],
    challenges: [],
    statistics: {
      totalGoals: 0,
      completedGoals: 0,
      totalChallenges: 0,
      completedChallenges: 0,
    },
  });

  const [chartData, setChartData] = useState({
    progressDistribution: [],
    goalsByCategory: [],
    challengesByDifficulty: [],
    weeklyProgress: [],
  });

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch real progress data from API with timeout handling
      console.log('Fetching progress data from API...');
      const progressResponse = await apiService.progress.getOverview();
      const progressData = progressResponse.data;

      const goals = progressData.goals || [];
      const challenges = progressData.challenges || [];
      const statistics = progressData.statistics || {
        totalGoals: 0,
        completedGoals: 0,
        totalChallenges: 0,
        completedChallenges: 0,
      };

      console.log('Received data:', {
        goalsCount: goals.length,
        challengesCount: challenges.length,
      });

      setProgressData({
        goals,
        challenges,
        statistics,
      });

      // Prepare chart data
      console.log('About to prepare chart data...');
      try {
        prepareChartData(goals, challenges, statistics);
        console.log('Chart data prepared successfully');
      } catch (chartError) {
        console.error('Error preparing chart data:', chartError);
        // Set some basic chart data to avoid crashes
        setChartData({
          progressDistribution: [],
          goalsByCategory: [],
          challengesByDifficulty: [],
          weeklyProgress: [],
        });
      }
    } catch (err) {
      console.error('Error fetching progress data:', err);
      if (err.response?.status === 401) {
        setError(
          'Authentication required. Please log in to view your progress.'
        );
      } else if (err.code === 'ECONNABORTED') {
        setError(
          'Request timeout. Please check your connection and try again.'
        );
      } else {
        setError('Failed to load progress data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const generateWeeklyProgress = (goals = [], challenges = []) => {
    try {
      const now = new Date();
      const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const weekData = [];

      // Get last 7 days
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(now.getDate() - i);
        const dayName = weekDays[date.getDay()];

        // Count goals completed on this day
        const goalsCompleted = goals.filter((goal) => {
          if (!goal || !goal.completion_date) return false;
          try {
            const completionDate = new Date(goal.completion_date);
            return completionDate.toDateString() === date.toDateString();
          } catch {
            return false;
          }
        }).length;

        // Count challenges completed on this day (based on submission dates)
        const challengesCompleted = challenges.reduce((count, challenge) => {
          if (!challenge || !Array.isArray(challenge.submissions)) return count;
          return (
            count +
            challenge.submissions.filter((sub) => {
              if (
                !sub ||
                !sub.submitted_at ||
                (sub.status !== 'passed' && (sub.score || 0) < 70)
              )
                return false;
              try {
                const submissionDate = new Date(sub.submitted_at);
                return submissionDate.toDateString() === date.toDateString();
              } catch {
                return false;
              }
            }).length
          );
        }, 0);

        weekData.push({
          day: dayName,
          goalsCompleted,
          challengesCompleted,
        });
      }

      return weekData;
    } catch (error) {
      console.error('Error generating weekly progress:', error);
      return [];
    }
  };

  const prepareChartData = (goals, challenges, statistics) => {
    // Progress distribution pie chart data
    const totalItems = statistics.totalGoals + statistics.totalChallenges;
    const completedItems =
      statistics.completedGoals + statistics.completedChallenges;
    const inProgressItems =
      goals.filter((g) => !g.is_completed && g.progress_percentage > 0).length +
      challenges.filter(
        (c) =>
          c.submissions &&
          c.submissions.some(
            (sub) => sub.status === 'submitted' || sub.status === 'in_review'
          )
      ).length;
    const notStartedItems = totalItems - completedItems - inProgressItems;

    const progressDistribution = [
      { name: 'completed', value: completedItems, label: 'Completed' },
      { name: 'inProgress', value: inProgressItems, label: 'In Progress' },
      { name: 'notStarted', value: notStartedItems, label: 'Not Started' },
    ].filter((item) => item.value > 0);

    // Goals by category
    const goalCategories = goals.reduce((acc, goal) => {
      const category = goal.category || 'Other';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const goalsByCategory = Object.entries(goalCategories).map(
      ([category, count]) => ({
        name: category,
        value: count,
      })
    );

    // Challenges by difficulty
    const challengeDifficulties = challenges.reduce((acc, challenge) => {
      const difficulty = challenge.difficulty_level || 'medium';
      if (!acc[difficulty]) {
        acc[difficulty] = { total: 0, completed: 0 };
      }
      acc[difficulty].total++;
      // Check if challenge has successful submissions
      const isCompleted =
        challenge.submissions &&
        challenge.submissions.some(
          (sub) => sub.status === 'passed' || sub.score >= 70
        );
      if (isCompleted) {
        acc[difficulty].completed++;
      }
      return acc;
    }, {});

    const challengesByDifficulty = Object.entries(challengeDifficulties).map(
      ([difficulty, data]) => ({
        difficulty,
        total: data.total,
        completed: data.completed,
      })
    );

    // Weekly progress based on actual completion dates
    const weeklyProgress = generateWeeklyProgress(goals, challenges);

    setChartData({
      progressDistribution,
      goalsByCategory,
      challengesByDifficulty,
      weeklyProgress,
    });
  };

  const refreshProgress = () => {
    fetchProgressData();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="progress-page">
          <div className="loading-container">
            <LoadingSpinner message="Loading your progress..." />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="progress-page">
          <div className="error-container">
            <div className="error-message">
              <h3>Unable to Load Progress</h3>
              <p>{error}</p>
              <button onClick={refreshProgress} className="btn btn-primary">
                Retry
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="progress-page">
        <div className="progress-header">
          <div className="header-content">
            <h1>My Learning Progress</h1>
            <p>
              Track your achievements and see how you're advancing toward your
              learning goals.
            </p>
          </div>
          <button onClick={refreshProgress} className="btn btn-secondary">
            Refresh
          </button>
        </div>

        <div className="progress-content">
          <div className="progress-overview">
            <ProgressTracker
              totalGoals={progressData.statistics.totalGoals}
              completedGoals={progressData.statistics.completedGoals}
              totalChallenges={progressData.statistics.totalChallenges}
              completedChallenges={progressData.statistics.completedChallenges}
              showDetails={true}
            />
          </div>

          <div className="progress-insights">
            <h2>Progress Analytics</h2>
            <ProgressCharts
              progressData={chartData.progressDistribution}
              goalsByCategory={chartData.goalsByCategory}
              challengesByDifficulty={chartData.challengesByDifficulty}
              weeklyProgress={chartData.weeklyProgress}
              showPieChart={true}
              showBarChart={true}
              showLineChart={true}
            />
          </div>

          <div className="progress-summary">
            <div className="summary-grid">
              <div className="summary-card">
                <h3>Recent Achievements</h3>
                <div className="achievements-list">
                  {progressData.goals
                    .filter((goal) => goal.status === 'completed')
                    .slice(0, 3)
                    .map((goal) => (
                      <div key={goal.id} className="achievement-item">
                        <span className="achievement-icon">🎯</span>
                        <span className="achievement-text">
                          Completed: {goal.title}
                        </span>
                      </div>
                    ))}
                  {progressData.challenges
                    .filter((challenge) => challenge.status === 'completed')
                    .slice(0, 3)
                    .map((challenge) => (
                      <div key={challenge.id} className="achievement-item">
                        <span className="achievement-icon">🏆</span>
                        <span className="achievement-text">
                          Solved: {challenge.title}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="summary-card">
                <h3>Next Steps</h3>
                <div className="next-steps-list">
                  {progressData.goals
                    .filter(
                      (goal) =>
                        goal.status === 'in_progress' ||
                        goal.status === 'not_started'
                    )
                    .slice(0, 3)
                    .map((goal) => (
                      <div key={goal.id} className="next-step-item">
                        <span className="step-icon">📋</span>
                        <span className="step-text">
                          Continue: {goal.title}
                        </span>
                      </div>
                    ))}
                  {progressData.challenges
                    .filter((challenge) => challenge.status !== 'completed')
                    .slice(0, 2)
                    .map((challenge) => (
                      <div key={challenge.id} className="next-step-item">
                        <span className="step-icon">🎯</span>
                        <span className="step-text">
                          Try: {challenge.title}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ProgressPage;

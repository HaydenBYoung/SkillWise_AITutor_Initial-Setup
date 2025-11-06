// Dashboard overview placeholder: implement stats, recent activity and charts using apiService.progress
import {} from 'react';

const DashboardOverview = () => {
  // Overview should include progress overview, recent activity, quick actions and statistics. Replace placeholders with real data from apiService.progress
  return (
    <div className="dashboard-overview">
      <h1>Welcome to SkillWise</h1>

      <div className="stats-grid">
        {/* Statistics cards (replace placeholders with real data) */}
        <div className="stat-card">
          <h3>Goals Completed</h3>
          <p className="stat-number">0</p>
        </div>

        <div className="stat-card">
          <h3>Challenges Completed</h3>
          <p className="stat-number">0</p>
        </div>

        <div className="stat-card">
          <h3>Current Streak</h3>
          <p className="stat-number">0 days</p>
        </div>
      </div>

      <div className="dashboard-sections">
        {/* Recent activity and progress charts should be added here */}
      </div>
    </div>
  );
};

export default DashboardOverview;

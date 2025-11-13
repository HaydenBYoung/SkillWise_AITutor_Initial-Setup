// Dashboard page (overview component mounted below) — ensure DashboardOverview is completed with real data
import {} from 'react';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import DashboardLayout from '../components/common/DashboardLayout';

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Track your learning progress and achievements</p>
      </div>

      <DashboardOverview />
    </DashboardLayout>
  );
};

export default DashboardPage;

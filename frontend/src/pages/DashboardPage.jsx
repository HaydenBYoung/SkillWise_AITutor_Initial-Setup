import React from 'react';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import DashboardLayout from '../components/common/DashboardLayout';

const DashboardPage = () => {
  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-6">
        <DashboardOverview />
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage;

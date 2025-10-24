// TODO: Implement dashboard page with navigation
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import DashboardOverview from '../components/dashboard/DashboardOverview';
import { useAuth } from '../hooks/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();
  const location = useLocation();

  const navigationItems = [
    { path: '/dashboard', label: 'Overview', icon: '📊' },
    { path: '/goals', label: 'Goals', icon: '🎯' },
    { path: '/challenges', label: 'Challenges', icon: '🚀' },
    { path: '/progress', label: 'Progress', icon: '📈' },
    { path: '/peer-review', label: 'Peer Review', icon: '👥' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      // AuthContext will handle the redirect to login
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-layout">
        <aside className="dashboard-sidebar">
          <div className="sidebar-header">
            <h2>SkillWise</h2>
            <p>Welcome, {user?.firstName || 'Student'}!</p>
          </div>

          <nav className="sidebar-navigation">
            <ul>
              {navigationItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="nav-label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="mt-auto border-t border-gray-200 pt-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 transition-colors duration-200"
            >
              <span className="mr-3">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="dashboard-main">
          <div className="dashboard-header">
            <h1>Dashboard</h1>
            <p>Track your learning progress and achievements</p>
          </div>

          <DashboardOverview />
        </main>
      </div>
    </div>
  );
};

export default DashboardPage;

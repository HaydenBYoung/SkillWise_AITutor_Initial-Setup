import {} from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const DashboardLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const navigationItems = [
    { path: '/dashboard', label: 'Overview', icon: '📊' },
    { path: '/goals', label: 'Goals', icon: '🎯' },
    { path: '/challenges', label: 'Challenges', icon: '🚀' },
    { path: '/progress', label: 'Progress', icon: '📈' },
    { path: '/peer-review', label: 'Peer Review', icon: '👥' },
    { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { path: '/profile', label: 'Profile', icon: '👤' },
  ];

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
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
                  className={`nav-link ${
                    location.pathname === item.path ? 'active' : ''
                  }`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-label">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="sidebar-footer">
          <button onClick={handleLogout} className="logout-button">
            <span className="nav-icon">🚪</span>
            <span className="nav-label">Logout</span>
          </button>
        </div>
      </aside>

      <main className="dashboard-main">{children}</main>
    </div>
  );
};

export default DashboardLayout;

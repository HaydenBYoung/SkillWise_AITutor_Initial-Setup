// Profile management and settings UI (uses mock data for now — replace with real API calls)
import { useState, useEffect } from 'react';
import LoadingSpinner from '../components/common/LoadingSpinner';
import DashboardLayout from '../components/common/DashboardLayout';
import { useAuth } from '../hooks/useAuth';
import { apiService } from '../services/api';

const ProfilePage = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user, updateProfile, logout } = useAuth();

  // Fetch real profile data from API
  useEffect(() => {
    const fetchProfileData = async () => {
      try {
        setLoading(true);
        // Fetch both user profile and statistics
        const [userProfile, stats] = await Promise.all([
          apiService.user.getProfile(),
          apiService.user.getStatistics(),
        ]);

        console.log('=== PROFILE DEBUG ===');
        console.log('User Profile:', userProfile);
        console.log('Stats:', stats);
        console.log('===================');

        const profileData = {
          id: userProfile.id,
          firstName: userProfile.first_name || userProfile.firstName || 'User',
          lastName: userProfile.last_name || userProfile.lastName || 'Name',
          email: userProfile.email || 'user@example.com',
          avatar: '👤',
          bio: '',
          location: '',
          website: '',
          joinedDate:
            userProfile.created_at ||
            userProfile.createdAt ||
            new Date().toISOString(),
          level: stats.level || 1,
          totalPoints: stats.total_points || stats.totalPoints || 0,
          completedChallenges:
            stats.total_challenges_completed ||
            stats.totalChallengesCompleted ||
            0,
          goalsAchieved:
            stats.total_goals_completed || stats.totalGoalsCompleted || 0,
          currentStreak:
            stats.current_streak_days || stats.currentStreakDays || 0,
          longestStreak:
            stats.longest_streak_days || stats.longestStreakDays || 0,
          badges: [
            {
              id: 1,
              name: 'First Steps',
              icon: '🚀',
              description: 'Complete your first challenge',
              earned:
                (stats.total_challenges_completed ||
                  stats.totalChallengesCompleted ||
                  0) >= 1,
            },
            {
              id: 2,
              name: 'Streak Master',
              icon: '🔥',
              description: 'Maintain a 7-day learning streak',
              earned:
                (stats.longest_streak_days || stats.longestStreakDays || 0) >=
                7,
            },
            {
              id: 3,
              name: 'Goal Crusher',
              icon: '🎯',
              description: 'Complete 5 learning goals',
              earned:
                (stats.total_goals_completed ||
                  stats.totalGoalsCompleted ||
                  0) >= 5,
            },
            {
              id: 4,
              name: 'Code Reviewer',
              icon: '👥',
              description: 'Provide 10 peer reviews',
              earned:
                (stats.total_peer_reviews_given ||
                  stats.totalPeerReviewsGiven ||
                  0) >= 10,
            },
            {
              id: 5,
              name: 'Challenge Master',
              icon: '💪',
              description: 'Complete 50 challenges',
              earned:
                (stats.total_challenges_completed ||
                  stats.totalChallengesCompleted ||
                  0) >= 50,
            },
          ],
          skills: [],
          recentActivity: [],
          preferences: {
            emailNotifications: true,
            pushNotifications: false,
            weeklyDigest: true,
            publicProfile: true,
            showProgress: true,
          },
        };

        setProfileData(profileData);
        setFormData(profileData);
      } catch (error) {
        console.error('Failed to fetch profile data:', error);
        // Fallback to basic user data
        const basicProfile = {
          id: user?.id || 1,
          firstName: user?.firstName || 'User',
          lastName: user?.lastName || 'Name',
          email: user?.email || 'user@example.com',
          avatar: '👤',
          level: 1,
          totalPoints: 0,
          completedChallenges: 0,
          goalsAchieved: 0,
          currentStreak: 0,
          longestStreak: 0,
          badges: [],
          skills: [],
          recentActivity: [],
          preferences: {
            emailNotifications: true,
            pushNotifications: false,
            weeklyDigest: true,
            publicProfile: true,
            showProgress: true,
          },
        };
        setProfileData(basicProfile);
        setFormData(basicProfile);
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // TODO: Replace with actual API call to update profile (e.g. apiService.user.updateProfile)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setProfileData(formData);
      setIsEditing(false);
      // Call auth context update if needed
      // await updateProfile(formData);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityIcon = (type) => {
    const icons = {
      challenge: '🏆',
      goal: '🎯',
      review: '👥',
      streak: '🔥',
    };
    return icons[type] || '📝';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);

      // Use the API service instead of manual fetch
      await apiService.user.deleteAccount();

      // Logout and redirect to landing page
      // Attempt server logout, but always clear local session and redirect
      try {
        await logout();
      } catch (e) {
        // ignore logout errors - ensure client-side cleanup proceeds
        console.warn('Logout after delete failed:', e);
      }

      // Redirect user back to the landing page
      window.location.href = '/';
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading && !profileData) {
    return <LoadingSpinner message="Loading profile..." />;
  }

  return (
    <DashboardLayout>
      <div className="profile-header">
        <div className="profile-banner">
          <div className="profile-info">
            <div className="profile-avatar">
              <span className="avatar-icon">{profileData?.avatar}</span>
              <div className="level-badge">Level {profileData?.level}</div>
            </div>

            <div className="profile-details">
              <h1>
                {profileData?.firstName} {profileData?.lastName}
              </h1>
              <p className="profile-bio">{profileData?.bio}</p>
              <div className="profile-meta">
                <span>📍 {profileData?.location}</span>
                <span>📅 Joined {formatDate(profileData?.joinedDate)}</span>
                {profileData?.website && (
                  <span>
                    🌐{' '}
                    <a
                      href={profileData.website}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {profileData.website}
                    </a>
                  </span>
                )}
              </div>
            </div>

            <div className="profile-stats">
              <div className="stat-item">
                <strong>{profileData?.totalPoints.toLocaleString()}</strong>
                <span>Total Points</span>
              </div>
              <div className="stat-item">
                <strong>{profileData?.completedChallenges}</strong>
                <span>Challenges</span>
              </div>
              <div className="stat-item">
                <strong>{profileData?.currentStreak}</strong>
                <span>Day Streak</span>
              </div>
            </div>

            <button
              className="btn-primary"
              onClick={() => setIsEditing(!isEditing)}
            >
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </button>
          </div>
        </div>
      </div>

      <div className="profile-tabs">
        <button
          className={`tab-button ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab-button ${activeTab === 'skills' ? 'active' : ''}`}
          onClick={() => setActiveTab('skills')}
        >
          Skills
        </button>
        <button
          className={`tab-button ${activeTab === 'badges' ? 'active' : ''}`}
          onClick={() => setActiveTab('badges')}
        >
          Badges
        </button>
        <button
          className={`tab-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>

      <div className="profile-content">
        {isEditing && (
          <form onSubmit={handleSubmit} className="edit-profile-form">
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName || ''}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="bio">Bio</label>
                <textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  rows="3"
                  placeholder="Share a bit about yourself and your learning journey..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="location">Location</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    value={formData.location || ''}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="website">Website</label>
                  <input
                    type="url"
                    id="website"
                    name="website"
                    value={formData.website || ''}
                    onChange={handleInputChange}
                    placeholder="https://LadyStarWell.com"
                  />
                </div>
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsEditing(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {activeTab === 'overview' && !isEditing && (
          <div className="overview-tab">
            <div className="overview-grid">
              <div className="recent-activity">
                <h3>Recent Activity</h3>
                <div className="activity-list">
                  {profileData?.recentActivity.map((activity) => (
                    <div key={activity.id} className="activity-item">
                      <div className="activity-icon">
                        {getActivityIcon(activity.type)}
                      </div>
                      <div className="activity-info">
                        <h4>{activity.title}</h4>
                        <div className="activity-meta">
                          <span>{formatTimeAgo(activity.date)}</span>
                          <span className="points">
                            +{activity.points} points
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="achievements-summary">
                <h3>Achievements</h3>
                <div className="achievements-stats">
                  <div className="achievement-stat">
                    <strong>{profileData?.goalsAchieved}</strong>
                    <span>Goals Achieved</span>
                  </div>
                  <div className="achievement-stat">
                    <strong>{profileData?.longestStreak}</strong>
                    <span>Longest Streak</span>
                  </div>
                  <div className="achievement-stat">
                    <strong>
                      {profileData?.badges.filter((b) => b.earned).length}
                    </strong>
                    <span>Badges Earned</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'skills' && !isEditing && (
          <div className="skills-tab">
            <h3>Skill Progress</h3>
            <div className="skills-grid">
              {profileData?.skills.map((skill, index) => (
                <div key={index} className="skill-item">
                  <div className="skill-header">
                    <h4>{skill.name}</h4>
                    <span className="skill-category">{skill.category}</span>
                  </div>
                  <div className="skill-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                    <span className="skill-level">{skill.level}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'badges' && !isEditing && (
          <div className="badges-tab">
            <h3>Badge Collection</h3>
            <div className="badges-grid">
              {profileData?.badges.map((badge) => (
                <div
                  key={badge.id}
                  className={`badge-item ${badge.earned ? 'earned' : 'locked'}`}
                >
                  <div className="badge-icon">{badge.icon}</div>
                  <h4>{badge.name}</h4>
                  <p>{badge.description}</p>
                  {badge.earned ? (
                    <span className="badge-status earned">Earned ✓</span>
                  ) : (
                    <span className="badge-status locked">Locked 🔒</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && !isEditing && (
          <div className="settings-tab">
            <div className="settings-section">
              <h3>Notification Preferences</h3>
              <div className="settings-group">
                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={formData.preferences?.emailNotifications || false}
                    onChange={handleInputChange}
                  />
                  <span>Email notifications</span>
                </label>

                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="pushNotifications"
                    checked={formData.preferences?.pushNotifications || false}
                    onChange={handleInputChange}
                  />
                  <span>Push notifications</span>
                </label>

                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="weeklyDigest"
                    checked={formData.preferences?.weeklyDigest || false}
                    onChange={handleInputChange}
                  />
                  <span>Weekly progress digest</span>
                </label>
              </div>
            </div>

            <div className="settings-section">
              <h3>Privacy Settings</h3>
              <div className="settings-group">
                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="publicProfile"
                    checked={formData.preferences?.publicProfile || false}
                    onChange={handleInputChange}
                  />
                  <span>Public profile</span>
                </label>

                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="showProgress"
                    checked={formData.preferences?.showProgress || false}
                    onChange={handleInputChange}
                  />
                  <span>Show progress on leaderboard</span>
                </label>
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="btn-primary"
                onClick={handleSubmit}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Settings'}
              </button>
            </div>

            <div className="settings-section danger-zone">
              <h3>⚠️ Danger Zone</h3>
              <p>
                Once you delete your account, there is no going back. Please be
                certain.
              </p>
              <button
                className="btn-danger"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={loading}
              >
                Delete Account
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>⚠️ Delete Account?</h2>
            <p>Are you absolutely sure you want to delete your account?</p>
            <p>
              <strong>This action cannot be undone.</strong> All your data,
              progress, and achievements will be permanently deleted.
            </p>

            <div className="modal-actions">
              <button
                className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={loading}
              >
                {loading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                className="btn-secondary"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default ProfilePage;

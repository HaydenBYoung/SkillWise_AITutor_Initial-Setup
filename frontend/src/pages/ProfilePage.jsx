// Profile management and settings UI
/* eslint-disable no-console */
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

  // Fetch profile data from backend if available; otherwise fall back to auth context user or local defaults
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        // Prefer apiService.user.getProfile if token and backend available
        let data = null;
        if (user) {
          // If auth context has user data, use it as primary source
          data = user;
        }

        // Attempt to fetch fresh profile from server (overrides auth user data)
        try {
          const resp = await apiService.user.getProfile();
          if (resp) {
            // Normalize response with defaults for missing fields and convert snake_case to camelCase
            data = {
              ...resp,
              firstName: resp.firstName || resp.first_name || '',
              lastName: resp.lastName || resp.last_name || '',
              email: resp.email || '',
              createdAt: resp.createdAt || resp.created_at,
              updatedAt: resp.updatedAt || resp.updated_at,
              joinedDate: resp.joinedDate || resp.created_at || new Date().toISOString(),
              avatar: resp.avatar ?? '👤',
              bio: resp.bio ?? '',
              location: resp.location ?? '',
              website: resp.website ?? '',
              totalPoints: resp.totalPoints ?? 0,
              completedChallenges: resp.completedChallenges ?? 0,
              goalsAchieved: resp.goalsAchieved ?? 0,
              currentStreak: resp.currentStreak ?? 0,
              longestStreak: resp.longestStreak ?? 0,
              level: resp.level ?? 1,
              badges: resp.badges ?? [],
              skills: resp.skills ?? [],
              recentActivity: resp.recentActivity ?? [],
              preferences: resp.preferences ?? {
                emailNotifications: true,
                pushNotifications: false,
                weeklyDigest: true,
                publicProfile: true,
                showProgress: true,
              },
            };
          }
        } catch (err) {
          // If server call fails, continue using `user` as fallback
          // eslint-disable-next-line no-console
          console.warn('Could not fetch profile from API, using auth context values if present', err?.message || err);
        }

        if (!data) {
          // If still no data, build a minimal local default
          data = {
            id: 0,
            firstName: 'User',
            lastName: 'Name',
            email: 'user@example.com',
            avatar: '👤',
            bio: '',
            location: '',
            website: '',
            joinedDate: new Date().toISOString(),
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
        }

        setProfileData(data);
        setFormData(data);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error fetching profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    // Check if this is a preference field (checkbox settings)
    const preferenceFields = ['emailNotifications', 'pushNotifications', 'weeklyDigest', 'publicProfile', 'showProgress'];
    
    if (preferenceFields.includes(name)) {
      // Update nested preferences object
      setFormData((prev) => ({
        ...prev,
        preferences: {
          ...prev.preferences,
          [name]: checked,
        },
      }));
    } else {
      // Update top-level fields
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleSaveSettings = async () => {
    setLoading(true);

    try {
      // Update profile with new preferences
      const updated = await apiService.user.updateProfile({
        ...profileData,
        preferences: formData.preferences,
      });
      
      // Normalize the updated data
      const normalizedData = {
        ...profileData,
        ...updated,
        preferences: updated.preferences || formData.preferences,
      };
      
      setProfileData(normalizedData);
      setFormData(normalizedData);
      
      alert('Settings saved successfully!');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Failed to save settings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Call backend API to update profile and update local AuthContext
      const updated = await apiService.user.updateProfile(formData);
      setProfileData(updated || formData);
      setIsEditing(false);

      // Update auth context with the latest user info (if function is available)
      try {
        if (updateProfile) await updateProfile(updated || formData);
      } catch (authErr) {
        // eslint-disable-next-line no-console
        console.warn('Could not update auth context after profile update', authErr);
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
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

  // Render page inside the DashboardLayout and show a loading overlay while fetching profile

  return (
    <DashboardLayout>
      {loading && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <LoadingSpinner message="Loading profile..." />
          </div>
        </div>
      )}
      <div className="profile-header">
        <div className="profile-banner">
          <div className="profile-info">
            <div className="profile-avatar">
              <span className="avatar-icon">{profileData?.avatar ?? '👤'}</span>
              <div className="level-badge">Level {profileData?.level ?? 1}</div>
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
                <strong>{(profileData?.totalPoints ?? 0).toLocaleString()}</strong>
                <span>Total Points</span>
              </div>
              <div className="stat-item">
                <strong>{profileData?.completedChallenges ?? 0}</strong>
                <span>Challenges</span>
              </div>
              <div className="stat-item">
                <strong>{profileData?.currentStreak ?? 0}</strong>
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
                  {(profileData?.recentActivity ?? []).map((activity) => (
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
                      {(profileData?.badges ?? []).filter((b) => b.earned).length}
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
              {(profileData?.skills ?? []).map((skill, index) => (
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
              {(profileData?.badges ?? []).map((badge) => (
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
                    checked={formData.preferences?.emailNotifications ?? false}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-label">
                    <span className="checkbox-text">Email notifications</span>
                    <span className="checkbox-status">
                      {formData.preferences?.emailNotifications ? '✓ Enabled' : '○ Disabled'}
                    </span>
                  </span>
                </label>

                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="pushNotifications"
                    checked={formData.preferences?.pushNotifications ?? false}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-label">
                    <span className="checkbox-text">Push notifications</span>
                    <span className="checkbox-status">
                      {formData.preferences?.pushNotifications ? '✓ Enabled' : '○ Disabled'}
                    </span>
                  </span>
                </label>

                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="weeklyDigest"
                    checked={formData.preferences?.weeklyDigest ?? false}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-label">
                    <span className="checkbox-text">Weekly progress digest</span>
                    <span className="checkbox-status">
                      {formData.preferences?.weeklyDigest ? '✓ Enabled' : '○ Disabled'}
                    </span>
                  </span>
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
                    checked={formData.preferences?.publicProfile ?? false}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-label">
                    <span className="checkbox-text">Public profile</span>
                    <span className="checkbox-status">
                      {formData.preferences?.publicProfile ? '✓ Enabled' : '○ Disabled'}
                    </span>
                  </span>
                </label>

                <label className="setting-item">
                  <input
                    type="checkbox"
                    name="showProgress"
                    checked={formData.preferences?.showProgress ?? false}
                    onChange={handleInputChange}
                  />
                  <span className="checkbox-label">
                    <span className="checkbox-text">Show progress on leaderboard</span>
                    <span className="checkbox-status">
                      {formData.preferences?.showProgress ? '✓ Enabled' : '○ Disabled'}
                    </span>
                  </span>
                </label>
              </div>
            </div>

            <div className="settings-actions">
              <button
                className="btn-primary"
                onClick={handleSaveSettings}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Update Settings'}
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

import { apiService } from './api';
import { setAccessToken, getAccessToken, clearTokens } from './api';

// Lightweight helper wrapper around apiService.auth to keep storage keys consistent
export const authService = {
  async login(email, password) {
    const payload = await apiService.auth.login({ email, password });
    // backend returns { user, accessToken } and sets httpOnly refresh cookie
    const { user, accessToken } = payload || {};

    if (accessToken) {
      setAccessToken(accessToken);
    }

    if (user) {
      try {
        localStorage.setItem('user', JSON.stringify(user));
      } catch (e) {
        console.warn('Failed to persist user in localStorage', e);
      }
    }

    return payload;
  },

  async register(userData) {
    const payload = await apiService.auth.register(userData);
    const { user, accessToken } = payload || {};
    if (accessToken) setAccessToken(accessToken);
    if (user) localStorage.setItem('user', JSON.stringify(user));
    return payload;
  },

  async logout() {
    try {
      await apiService.auth.logout();
    } catch (err) {
      console.warn('Logout API failed', err);
    } finally {
      clearTokens();
      localStorage.removeItem('user');
    }
  },

  async refreshToken() {
    const data = await apiService.auth.refresh();
    const { accessToken } = data || {};
    if (accessToken) setAccessToken(accessToken);
    return accessToken;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!getAccessToken();
  },
};

export default authService;

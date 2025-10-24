import api from './api';

const TOKEN_KEY = 'token';
const USER_KEY = 'user';

const authService = {
  async login(email, password) {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user } = response.data;
      return { token, user };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  },

  async register({ firstName, lastName, email, password, confirmPassword }) {
    try {
      console.log('Auth service register payload:', {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
      });
      const response = await api.post('/auth/register', {
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
      });
      const { token, user } = response.data;
      return { token, user };
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  },

  async logout() {
    try {
      const token = this.getToken();
      if (token) {
        await api.post('/auth/logout', null, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      this.clearAuth();
    }
  },

  async validateToken(token) {
    try {
      const response = await api.get('/auth/validate-token', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data.user;
    } catch (error) {
      throw new Error('Invalid token');
    }
  },

  async updateProfile(userData) {
    try {
      const token = this.getToken();
      const response = await api.put('/auth/profile', userData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const updatedUser = response.data.user;
      this.setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Profile update failed');
    }
  },

  setToken(token, rememberMe = false) {
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      sessionStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY);
  },

  setUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  getUser() {
    const userStr = localStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  },

  clearAuth() {
    localStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;

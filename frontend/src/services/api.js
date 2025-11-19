import axios from 'axios';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3001/api',
  withCredentials: true, // Include cookies for httpOnly refresh token
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token management utilities
const TOKEN_KEY = 'access_token';

const getAccessToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const clearTokens = () => {
  localStorage.removeItem(TOKEN_KEY);
  // Note: httpOnly refresh token will be cleared by server
};

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });

  failedQueue = [];
};

// Request interceptor to add Bearer token
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log request in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `🔄 API Request: ${config.method?.toUpperCase()} ${config.url}`
      );
    }

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh logic
api.interceptors.response.use(
  (response) => {
    // Log successful response in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `✅ API Response: ${response.config.method?.toUpperCase()} ${
          response.config.url
        } - ${response.status}`
      );
    }

    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Log error in development
    if (process.env.NODE_ENV === 'development') {
      console.log(
        `❌ API Error: ${originalRequest?.method?.toUpperCase()} ${
          originalRequest?.url
        } - ${error.response?.status}`
      );
    }

    // Handle 401 Unauthorized errors
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using httpOnly refresh cookie
        const refreshResponse = await axios.post(
          `${
            process.env.REACT_APP_API_URL || 'http://localhost:3001/api'
          }/auth/refresh`,
          {},
          {
            withCredentials: true, // Send httpOnly refresh cookie
            timeout: 5000,
          }
        );

        const { accessToken } = refreshResponse.data;

        if (accessToken) {
          // Update stored access token
          setAccessToken(accessToken);

          // Update default authorization header
          api.defaults.headers.Authorization = `Bearer ${accessToken}`;

          // Process queued requests with new token
          processQueue(null, accessToken);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          console.log('✅ Token refreshed successfully');
          return api(originalRequest);
        } else {
          throw new Error('No access token received from refresh');
        }
      } catch (refreshError) {
        console.error('❌ Token refresh failed:', refreshError);

        // Clear tokens and redirect to login
        clearTokens();
        processQueue(refreshError, null);

        // Dispatch logout event for AuthContext to handle
        window.dispatchEvent(
          new CustomEvent('auth:logout', {
            detail: { reason: 'token_refresh_failed' },
          })
        );

        // Redirect to login page
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle other error cases
    if (error.response?.status >= 500) {
      console.error('🚨 Server Error:', error.response.data);
      // Could dispatch global error event here
      window.dispatchEvent(
        new CustomEvent('api:server-error', {
          detail: { error: error.response.data },
        })
      );
    }

    // Network errors
    if (error.code === 'ECONNABORTED') {
      console.error('⏰ Request timeout');
      error.message =
        'Request timeout. Please check your connection and try again.';
    } else if (!error.response) {
      console.error('🔌 Network Error:', error.message);
      error.message =
        'Network error. Please check your connection and try again.';
    }

    return Promise.reject(error);
  }
);

// API service methods
// NOTE: All methods return the response.data payload (not the full axios response)
export const apiService = {
  // Authentication methods
  auth: {
    login: async (credentials) =>
      (await api.post('/auth/login', credentials)).data,
    register: async (userData) =>
      (await api.post('/auth/register', userData)).data,
    logout: async () => (await api.post('/auth/logout')).data,
    refresh: async () => (await api.post('/auth/refresh')).data,
    forgotPassword: async (email) =>
      (await api.post('/auth/forgot-password', { email })).data,
    resetPassword: async (token, password) =>
      (await api.post('/auth/reset-password', { token, password })).data,
  },

  // User methods
  user: {
    getProfile: async () => (await api.get('/users/profile')).data,
    updateProfile: async (data) => (await api.put('/users/profile', data)).data,
    deleteAccount: async () => (await api.delete('/users/account')).data,
    changePassword: async (data) =>
      (await api.put('/users/change-password', data)).data,
  },

  // Goals methods
  goals: {
    getAll: async (params) => (await api.get('/goals', { params })).data,
    create: async (goal) => (await api.post('/goals', goal)).data,
    update: async (id, goal) => (await api.put(`/goals/${id}`, goal)).data,
    delete: async (id) => (await api.delete(`/goals/${id}`)).data,
    getById: async (id) => (await api.get(`/goals/${id}`)).data,
  },

  // Challenges methods
  challenges: {
    getAll: async (params) => (await api.get('/challenges', { params })).data,
    getById: async (id) => (await api.get(`/challenges/${id}`)).data,
    submit: async (id, submission) =>
      (await api.post(`/challenges/${id}/submit`, submission)).data,
    getSubmissions: async (id) =>
      (await api.get(`/challenges/${id}/submissions`)).data,
  },

  // Progress methods
  progress: {
    // Try to support an optional timeframe query (week/month/year)
    getOverview: async (timeframe) =>
      (await api.get('/progress', { params: timeframe ? { timeframe } : {} }))
        .data,
    // Post a progress event (e.g. challenge completed)
    update: async (eventData) =>
      (await api.post('/progress/event', eventData)).data,
    // Convenience: refresh overview
    updateOverview: async (timeframe) =>
      (await api.get('/progress', { params: timeframe ? { timeframe } : {} }))
        .data,
    getSkills: async () => (await api.get('/progress/skills')).data,
    getActivity: async (params) =>
      (await api.get('/progress/activity', { params })).data,
    getStats: async () => (await api.get('/progress/stats')).data,
  },

  // Leaderboard methods
  leaderboard: {
    getGlobal: async (params) =>
      (await api.get('/leaderboard/global', { params })).data,
    getUserRank: async () => (await api.get('/leaderboard/user-rank')).data,
  },

  // Peer Review methods
  peerReview: {
    getReviewQueue: async (params) =>
      (await api.get('/peer-review/queue', { params })).data,
    getMySubmissions: async () =>
      (await api.get('/peer-review/my-submissions')).data,
    submitReview: async (submissionId, review) =>
      (
        await api.post(
          `/peer-review/submissions/${submissionId}/review`,
          review
        )
      ).data,
    getReviewDetails: async (submissionId) =>
      (await api.get(`/peer-review/submissions/${submissionId}`)).data,
  },

  // Notifications methods
  notifications: {
    getAll: async () => (await api.get('/notifications')).data,
    markAsRead: async (id) => (await api.put(`/notifications/${id}/read`)).data,
    markAllAsRead: async () => (await api.put('/notifications/read-all')).data,
  },

  // AI methods
  ai: {
    // Submit text (and optional metadata) for AI feedback. Expects an object
    // with `submission_text` or `submission_id` (and optional `files` metadata).
    // Returns the normalized response from backend: { success, data, ai }
    submitForFeedback: async (payload) =>
      (await api.post('/ai/feedback', payload)).data,
  },
};

// Export utilities for external use
export { getAccessToken, setAccessToken, clearTokens };

// Export configured axios instance
export default api;

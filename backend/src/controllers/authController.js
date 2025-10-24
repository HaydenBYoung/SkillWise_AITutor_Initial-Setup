// TODO: Implement authentication controller with login, register, logout, refresh token endpoints
const authService = require('../services/authService');

const authController = {
  // TODO: Add login endpoint
  login: async (req, res, next) => {
    try {
      // use validated data if available
      const { email, password } = req.validated || req.body;
      const result = await authService.login(email, password);

      // Set httpOnly refresh token cookie
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });
      }

      // Align response with frontend expectations
      res.status(200).json({ accessToken: result.token, user: result.user });
    } catch (err) {
      console.error('Login error:', err);
      res.status(400).json({ error: err.message });
    }
  },

  // TODO: Add register endpoint  
  register: async (req, res, next) => {
    try {
      console.log('Register request body:', req.body);
      console.log('Validated data:', req.validated); // Add this line to see the validated data
      const result = await authService.register(req.body);

      // Set httpOnly refresh token cookie
      if (result.refreshToken) {
        res.cookie('refreshToken', result.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
        });
      }

      res.status(201).json({ accessToken: result.token, user: result.user });
    } catch (err) {
      console.error('Registration error:', err);
      res.status(400).json({ error: err.message });
    }
  },

  logout: async (req, res, next) => {
    try {
      // Expect refresh token in body or cookie
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      if (refreshToken) {
        await authService.revokeRefreshToken(refreshToken);
      }

      // Clear cookie if present
      res.clearCookie('refreshToken');
      res.status(200).json({ message: 'Logged out successfully' });
    } catch (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
    }
  },

  // Refresh token endpoint
  refreshToken: async (req, res, next) => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
      if (!refreshToken) return res.status(400).json({ error: 'Refresh token required' });

      const result = await authService.refreshToken(refreshToken);

      // Return new access token
      res.status(200).json(result);
    } catch (err) {
      console.error('Refresh token error:', err);
      res.status(400).json({ error: err.message });
    }
  }
};

module.exports = authController;
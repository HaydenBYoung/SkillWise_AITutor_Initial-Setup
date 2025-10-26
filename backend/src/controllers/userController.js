const userService = require('../services/userService');

const userController = {
  getProfile: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const user = await userService.getUserById(userId);
      if (!user) return res.status(404).json({ message: 'User not found' });
      return res.json(user);
    } catch (err) {
      return next(err);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const updated = await userService.updateProfile(userId, req.body);
      return res.json(updated);
    } catch (err) {
      return next(err);
    }
  },

  getStatistics: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const stats = await userService.getUserStats(userId);
      return res.json(stats || {});
    } catch (err) {
      return next(err);
    }
  },

  deleteAccount: async (req, res, next) => {
    try {
      const userId = req.user && req.user.id;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      await userService.deleteUser(userId);
      return res.status(204).send();
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = userController;
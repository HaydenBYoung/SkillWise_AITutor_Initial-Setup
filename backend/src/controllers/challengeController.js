const challengeService = require('../services/challengeService');

const challengeController = {
  // Get all challenges
  getChallenges: async (req, res, next) => {
    try {
      const filters = {
        difficulty: req.query.difficulty,
        subject: req.query.category || req.query.subject,
        search: req.query.search,
      };

      const challenges = await challengeService.getChallenges(filters);
      return res.status(200).json({ success: true, data: challenges });
    } catch (err) {
      return next(err);
    }
  },

  // Get challenge by ID
  getChallengeById: async (req, res, next) => {
    try {
      const id = req.params.id;
      const userId = req.user?.id;
      const challenge = await challengeService.getById(id, userId);
      if (!challenge)
        return res
          .status(404)
          .json({ success: false, message: 'Challenge not found' });
      return res.status(200).json({ success: true, data: { challenge } });
    } catch (err) {
      return next(err);
    }
  },

  // Create new challenge
  createChallenge: async (req, res, next) => {
    try {
      const payload = req.body || {};
      const created = await challengeService.createChallenge(payload);
      return res.status(201).json({ success: true, data: created });
    } catch (err) {
      return next(err);
    }
  },

  // Update challenge
  updateChallenge: async (req, res, next) => {
    try {
      const id = req.params.id;
      const updated = await challengeService.updateChallenge(
        id,
        req.body || {},
      );
      if (!updated)
        return res
          .status(404)
          .json({ success: false, message: 'Challenge not found' });
      return res.status(200).json({ success: true, data: updated });
    } catch (err) {
      return next(err);
    }
  },

  // Delete challenge
  deleteChallenge: async (req, res, next) => {
    try {
      const id = req.params.id;
      const deleted = await challengeService.deleteChallenge(id);
      if (!deleted)
        return res
          .status(404)
          .json({ success: false, message: 'Challenge not found' });
      return res.status(200).json({ success: true, data: deleted });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = challengeController;

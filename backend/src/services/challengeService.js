// Basic challenge business logic built on top of Challenge model
const Challenge = require('../models/Challenge');

const challengeService = {
  // Get challenges with optional filters { difficulty, subject, search }
  getChallenges: async (filters = {}) => {
    const { difficulty, subject, search } = filters || {};

    if (difficulty) {
      return await Challenge.findByDifficulty(difficulty);
    }

    if (subject) {
      return await Challenge.findBySubject(subject);
    }

    // If search provided, perform simple client-side filter after fetching all
    const all = await Challenge.findAll();
    if (search) {
      const q = String(search).toLowerCase();
      return all.filter((c) => {
        return (
          (c.title && c.title.toLowerCase().includes(q)) ||
          (c.description && c.description.toLowerCase().includes(q)) ||
          (c.subject && c.subject.toLowerCase().includes(q))
        );
      });
    }

    return all;
  },

  // Create a new challenge
  createChallenge: async (data) => {
    const created = await Challenge.create(data);
    return created;
  },

  // Get single challenge
  getById: async (id) => {
    return await Challenge.findById(id);
  },

  // Update challenge
  updateChallenge: async (id, updateData) => {
    return await Challenge.update(id, updateData);
  },

  // Delete challenge
  deleteChallenge: async (id) => {
    return await Challenge.delete(id);
  },

  // Lightweight difficulty heuristic
  calculateDifficulty: (challenge) => {
    if (!challenge) return 'medium';
    if (challenge.points && challenge.points >= 50) return 'hard';
    if (challenge.points && challenge.points >= 20) return 'medium';
    return 'easy';
  },
};

module.exports = challengeService;

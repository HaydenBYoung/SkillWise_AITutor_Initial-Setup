// TODO: Implement AI integration controller for feedback and hints
const aiService = require('../services/aiService');
const prisma = require('../db/prismaClient');

const aiController = {
  // TODO: Generate AI feedback for submission
  generateFeedback: async (req, res, next) => {
    // Implementation needed
  },

  // TODO: Get AI hints for challenge
  getHints: async (req, res, next) => {
    // Implementation needed
  },

  // TODO: Generate challenge suggestions
  suggestChallenges: async (req, res, next) => {
    try {
      const logger = req.app.get('logger');

      // Accept preferences via query (GET) or body (POST)
      let preferences = {};
      if (req.query && req.query.preferences) {
        try {
          preferences = JSON.parse(req.query.preferences);
        } catch (e) {
          preferences = { q: req.query.preferences };
        }
      } else if (req.body && req.body.preferences) {
        preferences = req.body.preferences;
      }

      const count = Number(req.query?.count || req.body?.count || 3);
      const persist = (req.query?.persist === 'true' || req.body?.persist === true) || false;

      const prompt = `Generate ${count} learning challenges as JSON array with keys: title, description, category, difficulty (Easy|Medium|Hard), points (integer), estimatedTime (minutes integer), tags (array of strings). Preferences: ${JSON.stringify(preferences)}`;
      logger && logger.info && logger.info({ event: 'ai:suggestChallenges:prompt', prompt });

      const createdBy = req.user && req.user.id ? req.user.id : null;

      const suggestions = await aiService.suggestNextChallenges({ preferences, count, persist, createdBy });

      logger && logger.info && logger.info({ event: 'ai:suggestChallenges:response', suggestions });

      return res.json({ success: true, suggestions });
    } catch (err) {
      if (err.message && err.message.includes('OPENAI_API_KEY')) {
        return res.status(500).json({ success: false, error: 'Server misconfiguration: OPENAI_API_KEY not set' });
      }
      return next(err);
    }
  },

  // TODO: Analyze learning progress
  analyzeProgress: async (req, res, next) => {
    // Implementation needed
  },

  generateChallenge: async (req, res, next) => {
    try {
      // We reuse suggestNextChallenges with count 1 and persist true as the server-side implementation
      const logger = req.app.get('logger');
      const preferences = req.body?.preferences || {};
      const createdBy = req.user && req.user.id ? req.user.id : null;

      logger && logger.info && logger.info({ event: 'ai:generateChallenge:prompt', preferences });

      const [challenge] = await aiService.suggestNextChallenges({ preferences, count: 1, persist: true, createdBy });

      logger && logger.info && logger.info({ event: 'ai:generateChallenge:response', challenge });

      return res.json({ success: true, challenge });
    } catch (err) {
      if (err.message && err.message.includes('OPENAI_API_KEY')) {
        return res.status(500).json({ success: false, error: 'Server misconfiguration: OPENAI_API_KEY not set' });
      }
      return next(err);
    }
  },

  // Persist a suggestion selected by the user
  publishSuggestion: async (req, res, next) => {
    try {
      const logger = req.app.get('logger');
      const suggestion = req.body?.suggestion;
      if (!suggestion || typeof suggestion !== 'object') {
        return res.status(400).json({ success: false, error: 'Missing suggestion object' });
      }

      const createdBy = req.user && req.user.id ? req.user.id : null;

      const toCreate = {
        title: suggestion.title || 'Generated Challenge',
        description: suggestion.description || '',
        category: suggestion.category || 'General',
        difficulty: suggestion.difficulty || 'Medium',
        points: Number(suggestion.points ?? 0) || 0,
        estimatedTime: Number(suggestion.estimatedTime ?? 0) || 0,
        tags: suggestion.tags || [],
        metadata: suggestion.metadata || {},
        createdById: createdBy,
      };

      const created = await prisma.challenge.create({ data: toCreate });

      logger && logger.info && logger.info({ event: 'ai:publishSuggestion', createdBy, createdId: created.id });

      return res.json({ success: true, challenge: created });
    } catch (err) {
      return next(err);
    }
  },
};

module.exports = aiController;

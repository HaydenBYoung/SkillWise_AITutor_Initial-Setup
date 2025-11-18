// Lightweight AI service integration that uses parameterized prompt templates.
// The actual OpenAI call is intentionally not executed here to keep tests fast
// and avoid requiring credentials in CI. This module centralizes prompt
// construction so real AI calls can be added consistently later.
const aiPrompts = require('./aiPrompts');

const aiService = {
  // Build a feedback prompt for a submission and return it.
  generateFeedback: async (submissionText, challengeContext = {}) => {
    const prompt = aiPrompts.generateFeedbackPrompt({
      category: challengeContext.category || 'General',
      difficulty: challengeContext.difficulty || 'unspecified',
      learningObjectives: challengeContext.learningObjectives || [],
      submissionText,
      challengeContext,
    });

    // Placeholder: in future, call OpenAI with `prompt` and return the model response.
    return { prompt };
  },

  // Build hints prompt for a challenge and return it.
  generateHints: async (challengeContext = {}, userProgress = '') => {
    const prompt = aiPrompts.generateHintsPrompt({
      category: challengeContext.category || 'General',
      difficulty: challengeContext.difficulty || 'unspecified',
      learningObjectives: challengeContext.learningObjectives || [],
      challengeTitle: challengeContext.title || 'Untitled Challenge',
      userProgress,
    });

    return { prompt };
  },

  // Use templates to suggest next learning activities.
  suggestNextChallenges: async ({
    userProfile = '',
    skillLevel = '',
    targetObjectives = [],
  } = {}) => {
    const prompt = aiPrompts.generateSuggestionPrompt({
      userProfile,
      skillLevel,
      targetObjectives,
    });

    return { prompt };
  },
};

module.exports = aiService;

/**
 * Parameterized AI prompt templates for SkillWise
 * Provides functions that return fully-built prompt strings
 * using consistent templates and placeholders.
 */

function joinObjectives(objectives) {
  if (!objectives || objectives.length === 0)
    return 'No specific learning objectives provided.';
  return objectives.map((o, i) => `${i + 1}. ${o}`).join('\n');
}

const templates = {
  feedback: ({
    category,
    difficulty,
    learningObjectives,
    submissionText,
    challengeContext,
  }) => {
    return `You are an expert tutor for the subject area: ${category}.
Task: Provide constructive, actionable feedback on the student's submission.

Context:
- Challenge title: ${challengeContext?.title || 'Untitled Challenge'}
- Difficulty: ${difficulty || 'unspecified'}
- Learning objectives:\n${joinObjectives(learningObjectives)}

Student submission:
"""
${submissionText}
"""

Instructions:
- Provide a short summary (1-2 sentences) of what the student did well.
- Identify up to 3 areas for improvement with concrete examples.
- Offer 2 actionable next steps or practice items tailored to the learning objectives.
- If applicable, provide a suggested rubric score (0-100) and a brief justification.

Keep the tone encouraging and clear.`;
  },

  hints: ({
    category,
    difficulty,
    learningObjectives,
    challengeTitle,
    userProgress,
  }) => {
    return `You are an expert tutor for ${category}.
Task: Create helpful hints for the challenge: ${challengeTitle}.

Difficulty: ${difficulty || 'unspecified'}
Learning objectives:\n${joinObjectives(learningObjectives)}

User progress summary: ${userProgress || 'No progress provided.'}

Instructions:
- Provide 3 progressive hints from high-level to specific.
- Keep the first hint conceptual, the last hint should be a small, testable suggestion.
- Do not include the full solution. Use an encouraging tone.`;
  },

  suggestNext: ({ userProfile, skillLevel, targetObjectives }) => {
    return `You are an AI learning path recommender.
User profile: ${userProfile || 'No profile provided.'}
Current skill level: ${skillLevel || 'unspecified'}
Target learning objectives:\n${joinObjectives(targetObjectives)}

Task: Suggest 5 next challenges or activities, each with a short reason why it helps reach the objectives. Order them from best match to least.
Format: Provide a numbered list where each item includes the challenge title, difficulty, and 1 sentence rationale.`;
  },
  generateChallenge: ({
    title,
    category,
    difficulty,
    learningObjectives = [],
    constraints = '',
    examples = [],
  }) => {
    return `You are an expert curriculum designer and challenge author.
Task: Generate a single programming challenge that matches the following metadata.

Title: ${title || 'Untitled Challenge'}
Category: ${category || 'General'}
Difficulty: ${difficulty || 'medium'}
Learning objectives:\n${joinObjectives(learningObjectives)}

Constraints or requirements: ${constraints || 'None specified.'}

Examples or starter code: ${
      examples && examples.length ? examples.join('\n---\n') : 'None provided.'
    }

Instructions:
- Provide a JSON object only (no surrounding commentary) with the following fields: 'title', 'description', 'instructions', 'inputDescription', 'outputDescription', 'examples' (array), 'difficulty', 'estimatedTimeMinutes' (integer), and 'tags' (array of short strings).
- Keep descriptions concise but clear. Ensure examples include input and expected output where applicable.
- Set 'difficulty' to one of: easy, medium, hard.
- If constraints affect the solution (e.g., time/memory bounds), include them in 'instructions'.
`;
  },
};

module.exports = {
  generateFeedbackPrompt: (params) => templates.feedback(params),
  generateHintsPrompt: (params) => templates.hints(params),
  generateSuggestionPrompt: (params) => templates.suggestNext(params),
  generateChallengePrompt: (params) => templates.generateChallenge(params),
  // expose raw templates for advanced uses/tests
  templates,
};

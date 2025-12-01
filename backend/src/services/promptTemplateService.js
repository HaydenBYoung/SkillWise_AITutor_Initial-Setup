// backend/src/services/promptTemplateService.js
// Centralized builders for OpenAI prompt templates to ensure consistency.
// Each builder returns a string intended for a single user message to the model.

function buildSingleChallengePrompt (preferences = {}) {
  return [
    'You are an assistant that creates a single learning challenge tailored to the user\'s preferences.',
    'Return ONLY valid JSON with keys:',
    'title (string), description (string), category (string), difficulty (Easy|Medium|Hard),',
    'points (integer), estimatedTime (minutes integer), tags (array of strings).',
    `Preferences: ${JSON.stringify(preferences)}.`,
  ].join(' ');
}

function buildMultiChallengePrompt ({ preferences = {}, count = 3 } = {}) {
  return [
    `You are an assistant that creates ${count} learning challenges tailored to the user\'s preferences.`,
    'Return ONLY valid JSON as an array with each item containing keys:',
    'title (string), description (string), category (string), difficulty (Easy|Medium|Hard),',
    'points (integer), estimatedTime (minutes integer), tags (array of strings).',
    `Preferences: ${JSON.stringify(preferences)}.`,
  ].join(' ');
}

function buildFeedbackPrompt ({ challenge = null, submission = {} } = {}) {
  const parts = [];
  parts.push('You are an AI tutor that reviews student submissions and produces feedback.');
  if (challenge) {
    parts.push(`Challenge Title: ${challenge.title}`);
    parts.push(`Challenge Description: ${challenge.description || ''}`);
    if (challenge.instructions) parts.push(`Instructions: ${challenge.instructions}`);
  }
  parts.push(`Student Submission: ${submission.submission_text || ''}`);
  parts.push('Return ONLY valid JSON with keys: feedback_text (string), score (integer 0-100), confidence_score (0-1 float), strengths (array of strings), improvements (array of strings), suggestions (array of strings).');
  return parts.join('\n');
}

function buildHintsPrompt (challenge) {
  return [
    'You are an AI tutor. For the following challenge produce 3 progressive hints that help a student get unstuck,',
    'without giving the full solution. Return ONLY valid JSON: { "hints": ["first hint","second hint","third hint"] }.',
    `Challenge title: ${challenge.title}. Description: ${challenge.description || ''}.`,
  ].join(' ');
}

module.exports = {
  buildSingleChallengePrompt,
  buildMultiChallengePrompt,
  buildFeedbackPrompt,
  buildHintsPrompt,
};

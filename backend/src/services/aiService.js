// Lightweight AI service integration that uses parameterized prompt templates.
// The actual OpenAI call is intentionally not executed here to keep tests fast
// and avoid requiring credentials in CI. This module centralizes prompt
// construction so real AI calls can be added consistently later.
const aiPrompts = require('./aiPrompts');
const { callOpenAIAPI } = require('./openAIService');
const db = require('../database/connection');

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

    // Call OpenAI Chat Completions to generate structured JSON feedback
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
      const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '800', 10);
      const temperature = parseFloat(process.env.OPENAI_TEMPERATURE || '0.2');

      const systemPrompt =
        'You are an assistant that returns ONLY valid JSON.\nReturn a JSON object with the following keys:\n- suggestions: an array of short suggestion strings\n- strengths: an array of short strengths of the submission\n- improvements: an array of short improvement suggestions\n- confidence: a number between 0 and 1 representing confidence in the feedback\n- summary: a short human-readable summary string\nDo not include extra text outside the JSON.';

      const start = Date.now();

      // Call OpenAI with simple retry/backoff logic to handle transient failures
      const maxAttempts = parseInt(process.env.OPENAI_RETRIES || '2', 10);
      let resp = null;
      let lastErr = null;
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
          resp = await callOpenAIAPI(
            [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: prompt },
            ],
            { model, maxTokens, temperature, timeout: 30000 }
          );
          lastErr = null;
          break;
        } catch (callErr) {
          lastErr = callErr;
          // small exponential backoff before retrying
          const backoffMs = 250 * Math.pow(2, attempt - 1);
          // don't block event loop for long — use setTimeout with Promise
          await new Promise((r) => setTimeout(r, backoffMs));
        }
      }

      const processing_time_ms = Date.now() - start;

      if (!resp && lastErr) {
        throw lastErr;
      }

      const rawContent =
        resp && resp.choices && resp.choices[0] && resp.choices[0].message
          ? resp.choices[0].message.content
          : null;

      // Try to parse JSON from model output
      let parsed = null;
      let parseError = null;
      try {
        parsed = rawContent ? JSON.parse(rawContent) : null;
      } catch (err) {
        parseError = err.message;
        // Attempt to extract JSON substring if the model added surrounding text
        try {
          const firstBrace = rawContent.indexOf('{');
          const lastBrace = rawContent.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            const sub = rawContent.substring(firstBrace, lastBrace + 1);
            parsed = JSON.parse(sub);
          }
        } catch (err2) {
          // leave parsed as null and keep parseError
        }
      }

      // Normalize parsed shape
      const normalized = parsed || {};

      // Log to DB (ai_prompts_log) for traceability — don't fail on logging errors
      try {
        await db.query(
          `INSERT INTO ai_prompts_log (user_id, prompt_text, response_json, ai_model, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [
            challengeContext.created_by || null,
            prompt,
            parsed || rawContent,
            model,
          ]
        );
      } catch (logErr) {
        console.error(
          '[aiService] Failed to log AI feedback prompt/response',
          logErr.message
        );
      }

      return {
        prompt,
        raw: rawContent,
        parsed: normalized,
        parseError: parseError || null,
        model,
        processing_time_ms,
        success: true,
      };
    } catch (err) {
      // Surface friendly error but include the prompt so callers can persist
      console.error('[aiService] OpenAI call failed:', err.message);
      return {
        prompt,
        raw: null,
        parsed: null,
        model: null,
        processing_time_ms: null,
        success: false,
        error: err.message,
      };
    }
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

  // Generate a challenge using OpenAI and log prompt/response to the DB
  generateChallenge: async (
    userId,
    {
      title,
      category,
      difficulty,
      learningObjectives = [],
      constraints = '',
      examples = [],
    } = {}
  ) => {
    const prompt = aiPrompts.generateChallengePrompt({
      title,
      category,
      difficulty,
      learningObjectives,
      constraints,
      examples,
    });

    // Call OpenAI Chat completion
    try {
      const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
      const maxTokens = parseInt(process.env.OPENAI_MAX_TOKENS || '800', 10);

      const resp = await callOpenAIAPI(
        [
          {
            role: 'system',
            content: 'You are a helpful assistant that outputs JSON.',
          },
          { role: 'user', content: prompt },
        ],
        { model, maxTokens, temperature: 0.2 }
      );

      const rawContent =
        resp && resp.choices && resp.choices[0] && resp.choices[0].message
          ? resp.choices[0].message.content
          : null;
      // Debug log for test visibility
      try {
        /* eslint-disable no-console */
        console.debug(
          '[aiService] OpenAI response object:',
          JSON.stringify(resp)
        );
        console.debug(
          '[aiService] OpenAI raw response snippet:',
          rawContent ? rawContent.substring(0, 200) : null
        );
      } catch (e) {
        // ignore
      }

      // Attempt to parse JSON from the model
      let parsed = null;
      try {
        parsed = rawContent ? JSON.parse(rawContent) : null;
      } catch (parseErr) {
        // If parsing fails, still return raw content and mark as parse error
        parsed = { raw: rawContent, parseError: parseErr.message };
      }

      // Log to DB (ai_prompts_log)
      try {
        await db.query(
          `INSERT INTO ai_prompts_log (user_id, prompt_text, response_json, ai_model, created_at)
           VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
          [userId || null, prompt, parsed || rawContent, model]
        );
      } catch (logErr) {
        // Logging failure shouldn't block response; record to console
        console.error(
          '[aiService] Failed to log AI prompt/response',
          logErr.message
        );
      }

      return {
        prompt,
        raw: rawContent,
        parsed,
        model,
        success: true,
      };
    } catch (err) {
      // Surface friendly error
      console.error('[aiService] OpenAI call failed:', err.message);
      throw new Error('AI provider error');
    }
  },
};

module.exports = aiService;

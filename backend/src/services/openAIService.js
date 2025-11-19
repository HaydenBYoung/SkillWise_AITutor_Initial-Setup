const axios = require('axios');

/**
 * callOpenAIAPI - simple helper to call OpenAI Chat Completions via REST
 * @param {string|Array} promptOrMessages - prompt string or an array of message objects for chat API
 * @param {object} options - optional settings: { model, maxTokens, temperature, systemPrompt }
 * @returns {object} response body from OpenAI
 */
async function callOpenAIAPI(promptOrMessages, options = {}) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OPENAI_API_KEY is not set in environment');
  }

  const model = options.model || process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
  const max_tokens = parseInt(
    options.maxTokens || process.env.OPENAI_MAX_TOKENS || '1000',
    10
  );
  const temperature =
    typeof options.temperature === 'number' ? options.temperature : 0.7;

  // Build messages for chat endpoint. Accept either a raw prompt string or full messages array.
  let messages = [];
  if (Array.isArray(promptOrMessages)) {
    messages = promptOrMessages;
  } else {
    const system = options.systemPrompt || 'You are a helpful assistant.';
    messages = [
      { role: 'system', content: system },
      { role: 'user', content: String(promptOrMessages || '') },
    ];
  }

  const body = {
    model,
    messages,
    max_tokens,
    temperature,
  };

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      body,
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        timeout: options.timeout || 20000,
      }
    );

    return response.data;
  } catch (err) {
    // Normalize error for callers
    const errMsg =
      err && err.response && err.response.data
        ? err.response.data.error?.message || JSON.stringify(err.response.data)
        : err.message;
    const error = new Error(`OpenAI API request failed: ${errMsg}`);
    error.original = err;
    throw error;
  }
}

module.exports = {
  callOpenAIAPI,
};

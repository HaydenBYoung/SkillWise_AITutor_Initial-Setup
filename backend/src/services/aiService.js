// backend/src/services/aiService.js
const { OpenAI } = require('openai');
const prisma = require('../db/prismaClient');

// Lazy-instantiated OpenAI client to avoid constructor errors at module load
let _openAIClient = null;
function getOpenAIClient () {
  if (_openAIClient) return _openAIClient;
  if (!process.env.OPENAI_API_KEY) {
    // Keep errors at runtime and with helpful message for debugging
    throw new Error('OPENAI_API_KEY missing; cannot instantiate OpenAI client');
  }
  _openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openAIClient;
}

// Expose setter/resetter for tests to inject a fake client or mock
function setOpenAIClient (client) {
  _openAIClient = client;
}

function resetOpenAIClient () {
  _openAIClient = null;
}

const aiService = {
  // accepts { preferences, createdBy } and will persist the generated challenge
  generateChallenge: async ({ preferences = {}, createdBy = null } = {}) => {
    const prompt = `You are an assistant that creates a single learning challenge tailored to the user's preferences. Return ONLY valid JSON with keys: title (string), description (string), category (string), difficulty (Easy|Medium|Hard), points (integer), estimatedTime (minutes integer), tags (array of strings). Preferences: ${JSON.stringify(preferences)}.`;

    let response;
    try {
      const client = getOpenAIClient();
      response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 400,
        temperature: 0.7,
      });
    } catch (err) {
      // Make this explicit so callers can understand the cause
      throw new Error(`AI generation failed: ${err.message}`);
    }

    const content = response.choices?.[0]?.message?.content || '';

    // Try parsing JSON out of the response
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      const firstBrace = content.indexOf('{');
      const lastBrace = content.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        try {
          parsed = JSON.parse(content.slice(firstBrace, lastBrace + 1));
        } catch (err) {
          parsed = fallback(content);
        }
      } else {
        parsed = fallback(content);
      }
    }

    // Normalize parsed fields to match Prisma schema
    const toCreate = {
      title: parsed.title || 'Generated Challenge',
      description: parsed.description || parsed.description || '',
      category: parsed.category || 'General',
      difficulty: parsed.difficulty || 'Medium',
      points: Number(parsed.points ?? 0) || 0,
      estimatedTime: Number(parsed.estimatedTime ?? parsed.estimated_time ?? 0) || 0,
      tags: parsed.tags || [],
      metadata: {
        rawAIResponse: content,
        preferences,
      },
      createdById: createdBy || null,
    };

    // Persist to DB if prisma is available
    try {
      const created = await prisma.challenge.create({ data: toCreate });
      return created;
    } catch (err) {
      // On DB error, return the parsed object as a fallback
      console.error('Prisma save failed for generated challenge:', err);
      return Object.assign({ saved: false }, parsed);
    }
  },

  // Keep placeholders so other imports don't break
  generateFeedback: async () => { throw new Error('Not implemented'); },
  generateHints: async () => { throw new Error('Not implemented'); },
  analyzePattern: async () => { throw new Error('Not implemented'); },
  // Generate multiple suggested challenges without persisting by default
  suggestNextChallenges: async ({ preferences = {}, count = 3, persist = false, createdBy = null } = {}) => {
    // Build a prompt asking for an array of challenge objects
    const prompt = `You are an assistant that creates ${count} learning challenges tailored to the user's preferences. Return ONLY valid JSON as an array with each item containing keys: title (string), description (string), category (string), difficulty (Easy|Medium|Hard), points (integer), estimatedTime (minutes integer), tags (array of strings). Preferences: ${JSON.stringify(preferences)}.`;

    let response;
    try {
      const client = getOpenAIClient();
      response = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: Math.min(Number(process.env.OPENAI_MAX_TOKENS || 1000), 1500),
        temperature: 0.7,
      });
    } catch (err) {
      throw new Error(`AI generation of suggestions failed: ${err.message}`);
    }

    const content = response.choices?.[0]?.message?.content || '';

    // Try parsing the content as an array of JSON objects
    let parsed = null;
    try {
      parsed = JSON.parse(content);
    } catch (e) {
      // Attempt to extract the first JSON array found in the content
      const firstBracket = content.indexOf('[');
      const lastBracket = content.lastIndexOf(']');
      if (firstBracket !== -1 && lastBracket !== -1) {
        try {
          parsed = JSON.parse(content.slice(firstBracket, lastBracket + 1));
        } catch (err) {
          // fallback: try to extract multiple brace-enclosed objects and parse those
          const rawMatches = content.match(/\{[^]*?\}/g) || [];
          parsed = rawMatches.map((m) => {
            try {
              return JSON.parse(m);
            } catch (err2) {
              return fallback(m);
            }
          });
        }
      } else {
        // Try to split by lines and treat each as a JSON object
        const rawMatches = content.match(/\{[^]*?\}/g) || [];
        parsed = rawMatches.map((m) => {
          try {
            return JSON.parse(m);
          } catch (err2) {
            return fallback(m);
          }
        });
      }
    }

    // Ensure parsed is an array
    if (!Array.isArray(parsed)) {
      parsed = [parsed || fallback(content)];
    }

    // Normalize each item
    const normalized = parsed.slice(0, count).map((item) => ({
      title: item.title || 'Generated Challenge',
      description: item.description || '',
      category: item.category || 'General',
      difficulty: item.difficulty || 'Medium',
      points: Number(item.points ?? 0) || 0,
      estimatedTime: Number(item.estimatedTime ?? item.estimated_time ?? 0) || 0,
      tags: item.tags || [],
      metadata: {
        rawAIResponse: content,
        preferences,
      },
    }));

    // If persist true, create records in DB
    if (persist) {
      try {
        const created = [];
        for (const item of normalized) {
          const createdItem = await prisma.challenge.create({ data: Object.assign({}, item, { createdById: createdBy }) });
          created.push(createdItem);
        }
        return created;
      } catch (err) {
        console.error('Prisma save failed for suggested challenges:', err);
        // return parsed normalized objects with saved=false flag
        return normalized.map((n) => Object.assign({ saved: false }, n));
      }
    }

    return normalized;
  },
};

// Small fallback that wraps raw content into a challenge shape
function fallback (content) {
  return {
    title: 'Generated Challenge',
    description: content,
    category: 'General',
    difficulty: 'Medium',
    points: 50,
    estimatedTime: 30,
    tags: [],
  };
}

module.exports = aiService;

// Export testing helpers
module.exports.setOpenAIClient = setOpenAIClient;
module.exports.resetOpenAIClient = resetOpenAIClient;

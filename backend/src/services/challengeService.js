// Basic challenge business logic built on top of Challenge model
const Challenge = require('../models/Challenge');
const db = require('../database/connection');

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

  // Get single challenge with user's submission if exists
  getById: async (id, userId = null) => {
    const challenge = await Challenge.findById(id);
    if (!challenge) return null;

    // If userId provided, fetch their submission for this challenge
    if (userId) {
      try {
        const submissionQuery = `
          SELECT 
            s.id,
            s.submission_text as content,
            s.status,
            s.score,
            s.submitted_at,
            af.feedback_text,
            af.strengths,
            af.improvements,
            af.suggestions
          FROM submissions s
          LEFT JOIN ai_feedback af ON af.submission_id = s.id
          WHERE s.challenge_id = $1 AND s.user_id = $2
          ORDER BY s.submitted_at DESC
          LIMIT 1
        `;
        const result = await db.query(submissionQuery, [id, userId]);
        
        if (result.rows.length > 0) {
          const sub = result.rows[0];
          challenge.submission = {
            id: sub.id,
            type: 'code',
            content: sub.content,
            explanation: '',
            status: sub.status,
            score: sub.score,
            submittedAt: sub.submitted_at,
            aiFeedback: sub.feedback_text ? {
              overall: sub.feedback_text,
              positive: sub.strengths || [],
              improvements: sub.improvements || [],
              suggestions: sub.suggestions || []
            } : null
          };
        }
      } catch (err) {
        console.error('Error fetching submission:', err);
        // Continue without submission data
      }
    }

    return challenge;
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

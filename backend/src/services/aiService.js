// AI Service using Google Gemini API
const axios = require('axios');
const db = require('../database/connection');
const leaderboardService = require('./leaderboardService');

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_API_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

// Prompt templates for different AI operations
const promptTemplates = {
  challengeGeneration: (category, difficulty, focusAreas, count) => `
You are an expert educational content creator. Generate ${count} high-quality learning challenge(s) for the following:

Category: ${category}
Difficulty Level: ${difficulty}
Focus Areas: ${focusAreas || 'general concepts'}

For each challenge, provide:
1. A clear, engaging title
2. A detailed description explaining what the learner will accomplish
3. Step-by-step instructions
4. Learning objectives (as an array)
5. Estimated time in minutes
6. Points reward (based on difficulty: easy=5, medium=10, hard=15)
7. Relevant tags (as an array)

Return ONLY a valid JSON array with this exact structure:
[{
  "title": "string",
  "description": "string",
  "instructions": "string",
  "category": "${category}",
  "difficulty_level": "${difficulty}",
  "estimated_time_minutes": number,
  "points_reward": number,
  "learning_objectives": ["string"],
  "tags": ["string"]
}]

Make the challenges practical, engaging, and appropriate for the difficulty level.
`,

  feedbackGeneration: (
    submissionText,
    challengeTitle,
    challengeDescription,
    submissionType
  ) => `
You are an expert educational mentor providing constructive feedback. Analyze this submission:

Challenge: ${challengeTitle}
Description: ${challengeDescription}
Submission Type: ${submissionType}
Submission Content:
${submissionText}

Provide detailed feedback in JSON format with this exact structure:
{
  "score": number (0-100),
  "feedback_text": "Overall evaluation in 2-3 sentences",
  "strengths": ["specific positive point 1", "specific positive point 2"],
  "improvements": ["specific improvement suggestion 1", "specific improvement suggestion 2"],
  "suggestions": ["actionable next step 1", "actionable next step 2"],
  "confidence_score": number (0.0-1.0)
}

Be constructive, specific, and encouraging. Focus on both what was done well and how to improve.
`,

  followUpQuestion: (originalFeedback, question) => `
You previously provided this feedback:
${originalFeedback}

The learner has a follow-up question:
${question}

Provide a clear, helpful answer that builds on your previous feedback. Be specific and actionable.
Return only the answer text, no JSON formatting.
`,
};

const aiService = {
  /**
   * Generate AI challenges based on parameters
   * Story 3.2 & 3.3 implementation
   */
  generateChallenges: async (
    category,
    difficulty = 'medium',
    focusAreas = '',
    count = 1
  ) => {
    const startTime = Date.now();
    const prompt = promptTemplates.challengeGeneration(
      category,
      difficulty,
      focusAreas,
      count
    );

    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const processingTime = Date.now() - startTime;
      const generatedText = response.data.candidates[0].content.parts[0].text;

      // Extract JSON from response (remove markdown code blocks if present)
      let jsonText = generatedText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }

      const challenges = JSON.parse(jsonText);

      // Skip logging for challenge generation (submission_id is required for ai_feedback table)
      // Could create a separate logging table for AI operations if needed

      return {
        success: true,
        challenges: Array.isArray(challenges) ? challenges : [challenges],
        processingTime,
      };
    } catch (error) {
      console.error(
        'AI Challenge Generation Error:',
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to generate challenges: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  },

  /**
   * Generate AI feedback for submission
   * Story 3.5 implementation
   */
  generateFeedback: async (
    submissionId,
    submissionText,
    challengeTitle,
    challengeDescription,
    submissionType = 'text'
  ) => {
    const startTime = Date.now();
    const prompt = promptTemplates.feedbackGeneration(
      submissionText,
      challengeTitle,
      challengeDescription,
      submissionType
    );

    try {
      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const processingTime = Date.now() - startTime;
      const generatedText = response.data.candidates[0].content.parts[0].text;

      // Extract JSON from response
      let jsonText = generatedText.trim();
      if (jsonText.startsWith('```json')) {
        jsonText = jsonText
          .replace(/```json\n?/g, '')
          .replace(/```\n?/g, '')
          .trim();
      } else if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```\n?/g, '').trim();
      }

      const feedbackData = JSON.parse(jsonText);

      // Store feedback in database (Story 3.6)
      const result = await db.query(
        `INSERT INTO ai_feedback (
          submission_id, feedback_text, feedback_type, confidence_score,
          suggestions, strengths, improvements, ai_model, processing_time_ms, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
        RETURNING *`,
        [
          submissionId,
          feedbackData.feedback_text,
          'submission_feedback',
          feedbackData.confidence_score,
          feedbackData.suggestions,
          feedbackData.strengths,
          feedbackData.improvements,
          'gemini-2.5-flash',
          processingTime,
        ]
      );

      // Update submission with the score
      await db.query(
        `UPDATE submissions SET score = $1, status = 'graded' WHERE id = $2`,
        [feedbackData.score, submissionId]
      );

      // Get submission details to update goal progress
      const submissionData = await db.query(
        `SELECT user_id, challenge_id FROM submissions WHERE id = $1`,
        [submissionId]
      );

      if (submissionData.rows.length > 0) {
        const { user_id, challenge_id } = submissionData.rows[0];

        // Check if user has already earned points for this challenge
        const existingPointsCheck = await db.query(
          `SELECT points_earned FROM progress_events 
           WHERE user_id = $1 AND related_challenge_id = $2 AND event_type = 'challenge_completed'
           ORDER BY created_at DESC LIMIT 1`,
          [user_id, challenge_id]
        );

        const hasEarnedPoints =
          existingPointsCheck.rows.length > 0 &&
          existingPointsCheck.rows[0].points_earned > 0;

        // Get challenge points and goal_id
        const challengeData = await db.query(
          `SELECT points_reward, goal_id FROM challenges WHERE id = $1`,
          [challenge_id]
        );

        if (challengeData.rows.length > 0) {
          const points = challengeData.rows[0].points_reward || 0;
          const goalId = challengeData.rows[0].goal_id;

          console.log(
            `📊 Challenge ${challenge_id}: goalId=${goalId}, points=${points}, score=${feedbackData.score}, hasEarnedPoints=${hasEarnedPoints}`
          );

          // Only award points if score is 75 or above AND points haven't been earned yet
          if (feedbackData.score >= 75 && !hasEarnedPoints) {
            // Award full challenge points if passing
            const earnedPoints = points;

            // Update user_statistics for leaderboard
            await leaderboardService.updateUserPoints(
              user_id,
              earnedPoints,
              'challenge_completed'
            );
            console.log(
              `🏆 Awarded ${earnedPoints} points to user ${user_id} for challenge ${challenge_id}`
            );

            // Track progress event (even if no goal_id - for general progress tracking)
            await db.query(
              `INSERT INTO progress_events (user_id, related_challenge_id, event_type, event_data, points_earned)
               VALUES ($1, $2, 'challenge_completed', $3, $4)`,
              [
                user_id,
                challenge_id,
                JSON.stringify({ score: feedbackData.score, completed: true }),
                earnedPoints,
              ]
            );

            // Update goal progress if this challenge is linked to a goal
            if (goalId) {
              console.log(`🎯 Updating goal ${goalId} progress...`);

              // Get goal's point requirements
              const goalData = await db.query(
                `SELECT points_required FROM goals WHERE id = $1`,
                [goalId]
              );

              const pointsRequired = goalData.rows[0]?.points_required || 50;

              // Get total points earned for this goal
              const goalProgressResult = await db.query(
                `SELECT COALESCE(SUM(pe.points_earned), 0) as total_points
                 FROM progress_events pe
                 JOIN challenges c ON c.id = pe.related_challenge_id
                 WHERE c.goal_id = $1`,
                [goalId]
              );

              const totalPoints = goalProgressResult.rows[0]?.total_points || 0;
              const progressPercentage = Math.min(
                Math.round((totalPoints / pointsRequired) * 100),
                100
              );

              console.log(
                `🎯 Goal ${goalId}: totalPoints=${totalPoints}/${pointsRequired}, progress=${progressPercentage}%`
              );

              await db.query(
                `UPDATE goals 
                 SET progress_percentage = $1,
                     points_earned = $2,
                     is_completed = $3,
                     completion_date = CASE WHEN $3 = true AND completion_date IS NULL THEN CURRENT_TIMESTAMP ELSE completion_date END,
                     updated_at = CURRENT_TIMESTAMP
                 WHERE id = $4`,
                [
                  progressPercentage,
                  totalPoints,
                  progressPercentage >= 100,
                  goalId,
                ]
              );

              console.log(
                `✅ Goal ${goalId} updated to ${progressPercentage}% (${totalPoints}/${pointsRequired} points)`
              );
            } else {
              console.log(`⚠️ No goal linked to challenge ${challenge_id}`);
            }
          } else if (feedbackData.score < 75 && !hasEarnedPoints) {
            // Track attempt but don't award points if score below 75 and no points earned yet
            await db.query(
              `INSERT INTO progress_events (user_id, related_challenge_id, event_type, event_data, points_earned)
               VALUES ($1, $2, 'challenge_attempted', $3, 0)`,
              [
                user_id,
                challenge_id,
                JSON.stringify({
                  score: feedbackData.score,
                  completed: false,
                  reason: 'Score below 75%',
                }),
              ]
            );
          } else if (hasEarnedPoints) {
            console.log(
              `🔒 Challenge ${challenge_id} already completed with points - no new points awarded`
            );
          }
        }
      }

      return {
        success: true,
        feedback: {
          id: result.rows[0].id,
          score: feedbackData.score,
          feedback_text: feedbackData.feedback_text,
          strengths: feedbackData.strengths,
          improvements: feedbackData.improvements,
          suggestions: feedbackData.suggestions,
          confidence_score: feedbackData.confidence_score,
          processing_time_ms: processingTime,
        },
      };
    } catch (error) {
      console.error(
        'AI Feedback Generation Error:',
        error.response?.data || error.message
      );
      throw new Error(
        `Failed to generate feedback: ${
          error.response?.data?.error?.message || error.message
        }`
      );
    }
  },

  /**
   * Answer follow-up questions about feedback
   */
  answerFollowUp: async (feedbackId, question) => {
    try {
      // Get original feedback
      const feedbackResult = await db.query(
        'SELECT feedback_text, strengths, improvements, suggestions FROM ai_feedback WHERE id = $1',
        [feedbackId]
      );

      if (feedbackResult.rows.length === 0) {
        throw new Error('Feedback not found');
      }

      const originalFeedback = JSON.stringify(feedbackResult.rows[0]);
      const prompt = promptTemplates.followUpQuestion(
        originalFeedback,
        question
      );

      const response = await axios.post(
        `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      const answer = response.data.candidates[0].content.parts[0].text.trim();

      return {
        success: true,
        answer,
      };
    } catch (error) {
      console.error(
        'Follow-up Question Error:',
        error.response?.data || error.message
      );
      throw new Error(`Failed to answer follow-up: ${error.message}`);
    }
  },

  /**
   * Get feedback history for a submission
   */
  getFeedbackHistory: async (submissionId) => {
    try {
      const result = await db.query(
        `SELECT id, feedback_text, confidence_score, suggestions, strengths, improvements,
                ai_model, processing_time_ms, created_at
         FROM ai_feedback
         WHERE submission_id = $1
         ORDER BY created_at DESC`,
        [submissionId]
      );

      return {
        success: true,
        history: result.rows,
      };
    } catch (error) {
      console.error('Get Feedback History Error:', error.message);
      throw new Error('Failed to retrieve feedback history');
    }
  },
};

module.exports = aiService;

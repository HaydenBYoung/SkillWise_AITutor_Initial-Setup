// AI Prompt Templates for consistent challenge generation and feedback
// Story 3.3: Reusable AI prompt templates with placeholders

const aiPromptTemplates = {
  // Challenge generation template
  generateChallenge: ({
    skill = 'JavaScript',
    difficulty = 'intermediate',
    topic = 'general programming',
    type = 'coding',
  }) => {
    return `Generate a ${difficulty} level ${type} challenge for ${skill} focusing on ${topic}.

The challenge should include:
1. A clear title
2. A detailed description of the problem
3. Input/output examples
4. Acceptance criteria
5. Estimated difficulty level (beginner/intermediate/advanced)
6. Suggested time to complete (in minutes)

Format the response as a valid JSON object with these fields:
{
  "title": "string",
  "description": "string",
  "difficulty": "string",
  "category": "string",
  "estimatedTime": number,
  "examples": [{"input": "string", "output": "string"}],
  "acceptanceCriteria": ["string"]
}`;
  },

  // Feedback generation template
  generateFeedback: ({
    submissionCode = '',
    challengeTitle = '',
    challengeDescription = '',
  }) => {
    return `Review the following code submission for the challenge: "${challengeTitle}"

Challenge Description:
${challengeDescription}

Submitted Code:
${submissionCode}

Provide detailed feedback including:
1. Overall assessment (strengths and areas for improvement)
2. Code quality and best practices
3. Specific suggestions for improvement
4. Confidence score (0-1) indicating how well the submission meets requirements
5. List of strengths (what was done well)
6. List of improvements (what could be better)

Format the response as a valid JSON object with these fields:
{
  "feedbackText": "string",
  "confidenceScore": number,
  "strengths": ["string"],
  "improvements": ["string"],
  "suggestions": ["string"]
}`;
  },

  // Simple challenge generation for quick AI responses
  simpleChallenge: (skill) => {
    return `Create a simple coding challenge for ${skill}. Return JSON with title, description, difficulty.`;
  },
};

module.exports = aiPromptTemplates;

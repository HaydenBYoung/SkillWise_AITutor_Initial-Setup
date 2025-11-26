# AI Features Documentation - Sprint 3

## Overview

Sprint 3 introduces AI-powered features to SkillWise using OpenAI's GPT-3.5-turbo model. These features enhance the learning experience by providing personalized challenge generation and intelligent code feedback.

## Features

### 1. AI Challenge Generation (Stories 3.1, 3.2, 3.3)

Generate personalized coding challenges based on:

- **Skill**: Programming language (JavaScript, Python, Java, C++, etc.)
- **Difficulty**: Easy, Medium, Hard
- **Topic**: Specific area (e.g., "Array Manipulation", "Recursion")
- **Type**: Coding, Algorithm, Design, or Debugging

**Frontend Component:**

```javascript
import AIChallengeModal from './components/ai/AIChallengeModal';

<AIChallengeModal
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
  onChallengeCreated={(challenge) => {
    console.log('Generated challenge:', challenge);
    // Save to database or use directly
  }}
/>;
```

**API Endpoint:**

```
POST /api/ai/generateChallenge
Authorization: Bearer <token>

Request Body:
{
  "skill": "JavaScript",
  "difficulty": "medium",
  "topic": "Array Manipulation",
  "type": "coding"
}

Response:
{
  "success": true,
  "data": {
    "title": "Array Deduplication Challenge",
    "description": "Create a function that removes duplicate elements...",
    "difficulty": "medium",
    "category": "JavaScript",
    "estimatedTime": "30 minutes",
    "examples": [
      { "input": "[1, 2, 2, 3]", "output": "[1, 2, 3]" }
    ],
    "acceptanceCriteria": [
      "Function should handle arrays of any type",
      "Should not mutate the original array"
    ],
    "aiModel": "gpt-3.5-turbo",
    "processingTime": 1500
  }
}
```

### 2. AI Code Feedback (Stories 3.4, 3.5)

Submit code for AI-powered review and receive:

- Overall feedback text
- Confidence score (0-1)
- Strengths (array)
- Areas for improvement (array)
- Suggestions (array)

**Frontend Component:**

```javascript
import AIFeedbackForm from './components/ai/AIFeedbackForm';

<AIFeedbackForm
  submissionId={123}
  challengeTitle="Array Manipulation"
  challengeDescription="Remove duplicates from array"
  onFeedbackReceived={(feedback) => {
    console.log('Received feedback:', feedback);
  }}
/>;
```

**API Endpoints:**

```
POST /api/ai/submitForFeedback
Authorization: Bearer <token>

Request Body:
{
  "submissionId": 123,
  "submissionCode": "function removeDups(arr) { return [...new Set(arr)]; }",
  "challengeTitle": "Array Manipulation",
  "challengeDescription": "Remove duplicates"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "feedbackText": "Excellent implementation using modern ES6 Set...",
    "confidenceScore": 0.95,
    "strengths": [
      "Clean and concise solution",
      "Optimal time complexity O(n)"
    ],
    "improvements": [
      "Consider adding input validation"
    ],
    "suggestions": [
      "Add JSDoc comments for better documentation"
    ],
    "aiModel": "gpt-3.5-turbo",
    "processingTime": 1200
  }
}

GET /api/ai/feedback/:submissionId
Authorization: Bearer <token>

Response:
{
  "success": true,
  "data": [
    { /* feedback object */ }
  ]
}
```

### 3. Error Tracking with Sentry (Story 3.8)

Comprehensive error monitoring across frontend and backend.

**Features:**

- Automatic error capture and reporting
- Session replay for debugging
- Performance monitoring
- Error boundary for React errors
- User-friendly error display

**Error Boundary Usage:**

```javascript
// Already integrated in src/index.js
import ErrorBoundary from './components/common/ErrorBoundary';

<ErrorBoundary>
  <App />
</ErrorBoundary>;
```

## Setup Instructions

### 1. Environment Variables

**Backend (.env):**

```bash
# Required for AI features
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxx
OPENAI_MODEL=gpt-3.5-turbo  # Optional, defaults to gpt-3.5-turbo

# Required for error tracking
SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Existing variables
DATABASE_URL=postgresql://...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
CORS_ORIGIN=http://localhost:3000
```

**Frontend (.env):**

```bash
# Required for error tracking
VITE_SENTRY_DSN=https://xxxxx@sentry.io/xxxxx

# Existing variable
VITE_API_URL=http://localhost:3001
```

### 2. Database Migration

Run the migration to add AI feedback columns:

```bash
cd backend
node scripts/migrate.js
```

This adds `prompt` and `response` columns to the `ai_feedback` table for logging AI interactions.

### 3. Install Dependencies

Dependencies are already installed if you ran `npm install`:

**Backend:**

- `openai` - OpenAI API client
- `@sentry/node` - Backend error tracking
- `@sentry/profiling-node` - Performance profiling

**Frontend:**

- `@sentry/react` - Frontend error tracking with React integration

## Testing

### Unit Tests

**Frontend:**

```bash
cd frontend
npm test

# Run specific AI tests
npm test -- AIChallengeModal
npm test -- AIFeedbackForm
```

**Backend:**

```bash
cd backend
npm test

# Run AI service snapshot tests
npm test -- aiService.test.js
```

### Integration Tests

```bash
cd backend
npm test -- ai-features.test.js
```

### E2E Tests (Cypress)

```bash
cd frontend
npm run cypress:open

# Or run headless
npm run cypress:run
```

Test files:

- `cypress/e2e/ai-challenge-generation.cy.js` - 11 tests
- `cypress/e2e/ai-feedback-submission.cy.js` - 15 tests

## Architecture

### Backend Structure

```
backend/src/
├── services/
│   ├── aiService.js              # OpenAI integration
│   ├── aiPromptTemplates.js      # Reusable prompt templates
│   └── __tests__/
│       └── aiService.test.js     # Snapshot tests
├── controllers/
│   └── aiController.js           # HTTP request handlers
└── routes/
    └── ai.js                     # AI endpoint routes
```

### Frontend Structure

```
frontend/src/
├── components/
│   ├── ai/
│   │   ├── AIChallengeModal.jsx      # Challenge generation UI
│   │   ├── AIChallengeModal.css
│   │   ├── AIFeedbackForm.jsx        # Feedback submission UI
│   │   ├── AIFeedbackForm.css
│   │   └── __tests__/
│   │       ├── AIChallengeModal.test.jsx
│   │       └── AIFeedbackForm.test.jsx
│   └── common/
│       ├── ErrorBoundary.jsx         # React error boundary
│       └── ErrorBoundary.css
└── services/
    └── api.js                        # API client with AI methods
```

## Prompt Templates (Story 3.3)

Located in `backend/src/services/aiPromptTemplates.js`, these reusable templates ensure consistent AI responses:

### Challenge Generation Template

```javascript
const prompt = aiPromptTemplates.generateChallenge({
  skill: 'JavaScript',
  difficulty: 'medium',
  topic: 'Closures',
  type: 'coding',
});
```

### Feedback Template

```javascript
const prompt = aiPromptTemplates.generateFeedback({
  submissionCode: 'function test() { ... }',
  challengeTitle: 'Challenge Name',
  challengeDescription: 'Description',
});
```

## Logging

All AI interactions are logged for debugging and monitoring:

**Console Logs:**

- Request parameters
- Generated prompts
- AI responses
- Processing time
- Token usage

**Database Persistence:**

- All feedback is saved to `ai_feedback` table
- Includes `prompt` and `response` columns (after migration)

## Error Handling

### Backend

- Try-catch blocks around all OpenAI calls
- Detailed error messages
- Sentry captures all exceptions
- Graceful degradation

### Frontend

- Loading states during AI processing
- User-friendly error messages
- Error boundary catches React errors
- Automatic retry options

## Performance Considerations

### OpenAI API

- Default model: gpt-3.5-turbo (fast and cost-effective)
- Can upgrade to gpt-4 by changing `OPENAI_MODEL` env var
- Average response time: 1-3 seconds
- Implement rate limiting in production

### Database

- Async operations with proper connection pooling
- Indexed columns for fast feedback retrieval
- Cleanup old feedback data periodically

### Frontend

- Code splitting for AI components
- Lazy loading of modal components
- Debounced form submissions
- Optimistic UI updates

## Security

### Authentication

- All AI endpoints require JWT authentication
- User ID validation on all requests
- Rate limiting recommended for production

### Input Validation

- Sanitize all user inputs before sending to OpenAI
- Limit code submission size (prevent abuse)
- Validate file types for upload

### API Key Protection

- OpenAI API key stored in environment variables
- Never exposed to frontend
- Rotate keys regularly

## Cost Optimization

### Token Usage

- gpt-3.5-turbo: ~$0.002 per 1K tokens
- Average challenge generation: ~400 tokens
- Average feedback: ~500 tokens
- Estimated cost: $0.001-0.002 per interaction

### Strategies

1. Cache common challenges (future enhancement)
2. Use shorter prompts when possible
3. Implement user quotas
4. Monitor usage with OpenAI dashboard

## Troubleshooting

### "OpenAI API Error"

- Check `OPENAI_API_KEY` is set correctly
- Verify API key is active in OpenAI dashboard
- Check for rate limits or quota exceeded

### "Database connection failed"

- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in .env
- Check if migration was run

### "Sentry not capturing errors"

- Verify `SENTRY_DSN` is set
- Check Sentry project is active
- Test with manual error trigger

### Cypress Tests Failing

- Ensure backend and frontend are running
- Check ports (backend: 3001, frontend: 3000)
- Clear browser cache and local storage

## Future Enhancements

1. **Challenge Difficulty Tuning**

   - Learn from user performance
   - Adaptive difficulty adjustment

2. **Feedback History**

   - Show improvement over time
   - Track common mistakes

3. **Multi-language Support**

   - Localized prompts
   - International coding standards

4. **Code Execution**

   - Run submitted code in sandbox
   - Automated test case validation

5. **Collaborative Features**
   - Share AI-generated challenges
   - Peer review with AI assistance

## Support

For issues or questions:

1. Check this documentation
2. Review test files for usage examples
3. Check Sentry dashboard for errors
4. Review OpenAI API logs

## License

Part of the SkillWise AI Tutor project.
Sprint 3 implementation completed November 2025.

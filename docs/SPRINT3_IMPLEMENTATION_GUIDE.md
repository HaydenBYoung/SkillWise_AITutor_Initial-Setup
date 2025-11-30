# Sprint 3: AI Integration & Feedback - Implementation Guide

## Overview

This document provides a comprehensive guide for Sprint 3 implementation, covering AI challenge generation, intelligent feedback, and error monitoring features.

## Table of Contents

1. [Quick Start](#quick-start)
2. [Features Implemented](#features-implemented)
3. [Architecture](#architecture)
4. [API Documentation](#api-documentation)
5. [Testing](#testing)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### Prerequisites

- Node.js 18+ and npm 8+
- PostgreSQL 14+
- Docker and Docker Compose (optional)
- Google Gemini API key

### Installation

1. **Clone and navigate to the repository**
   ```bash
   cd SkillWise_AITutor_Initial-Setup
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Set up environment variables**

   Backend (`backend/.env`):
   ```env
   GEMINI_API_KEY=AIzaSyBQ1vdMPb1LNR-MVKlXv1_5CMIQ0GmAyWI
   DATABASE_URL=postgresql://skillwise_user:skillwise_pass@localhost:5432/skillwise_db
   JWT_SECRET=your-secret-key
   SENTRY_DSN=  # Optional
   NODE_ENV=development
   ```

   Frontend (`frontend/.env`):
   ```env
   REACT_APP_API_URL=http://localhost:3001/api
   REACT_APP_SENTRY_DSN=  # Optional
   ```

5. **Run database migrations**
   ```bash
   cd backend
   npm run migrate
   ```

6. **Start the application**

   Using Docker Compose:
   ```bash
   docker-compose up
   ```

   Or manually:
   ```bash
   # Terminal 1 - Backend
   cd backend
   npm run dev

   # Terminal 2 - Frontend
   cd frontend
   npm start
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001/api

---

## Features Implemented

### 1. AI Challenge Generation (Stories 3.1, 3.2, 3.3)

**User Flow:**
1. Navigate to Challenges page
2. Click "Generate with AI" button
3. Configure generation parameters:
   - Category (required)
   - Difficulty level (easy/medium/hard)
   - Focus areas (optional)
   - Number of challenges (1-5)
4. Review generated challenges
5. Edit challenges if needed
6. Save to database

**Key Components:**
- `frontend/src/components/challenges/AIGenerateModal.jsx`
- `backend/src/services/aiService.js`
- `backend/src/controllers/aiController.js`

**API Endpoint:**
```
POST /api/ai/generateChallenge
```

### 2. AI Feedback System (Stories 3.4, 3.5, 3.6)

**User Flow:**
1. Complete a challenge
2. Submit work (text, code, or link)
3. Select submission type
4. Get AI-powered feedback including:
   - Numerical score (0-100)
   - Overall evaluation
   - Strengths identified
   - Areas for improvement
   - Actionable suggestions
   - Confidence score
5. Ask follow-up questions
6. View feedback history

**Key Components:**
- `frontend/src/components/challenges/AIFeedbackPanel.jsx`
- `backend/src/services/aiService.js`
- Database table: `ai_feedback`

**API Endpoints:**
```
POST /api/ai/submitForFeedback
GET /api/ai/feedback/:submissionId
POST /api/ai/feedback/:feedbackId/followup
```

### 3. Error Monitoring (Story 3.8)

**Features:**
- Automatic error capture in production
- Performance monitoring
- Error boundaries in React
- User-friendly error pages
- Sensitive data filtering

**Key Components:**
- `backend/src/utils/sentry.js`
- `frontend/src/utils/sentry.js`
- `frontend/src/components/common/ErrorBoundary.jsx`

---

## Architecture

### Backend Architecture

```
backend/
├── src/
│   ├── services/
│   │   └── aiService.js          # Gemini API integration
│   ├── controllers/
│   │   └── aiController.js       # Request handling
│   ├── routes/
│   │   └── ai.js                 # Route definitions
│   ├── utils/
│   │   └── sentry.js             # Error tracking
│   └── app.js                    # Express app setup
├── database/
│   └── migrations/
│       ├── 006_create_ai_feedback.sql
│       └── 016_add_ai_fields.sql
└── tests/
    ├── unit/
    │   └── aiService.test.js
    └── integration/
        └── aiController.test.js
```

### Frontend Architecture

```
frontend/
├── src/
│   ├── components/
│   │   ├── challenges/
│   │   │   ├── AIGenerateModal.jsx
│   │   │   └── AIFeedbackPanel.jsx
│   │   └── common/
│   │       └── ErrorBoundary.jsx
│   └── utils/
│       └── sentry.js
└── cypress/
    └── E2E/
        ├── ai-challenge-generation.cy.js
        └── ai-feedback-system.cy.js
```

### Data Flow

```
User Action → React Component → API Call → Express Controller 
→ AI Service → Gemini API → Process Response → Database 
→ Return to User
```

---

## API Documentation

### Generate AI Challenge

**Endpoint:** `POST /api/ai/generateChallenge`

**Request:**
```json
{
  "category": "JavaScript",
  "difficulty": "medium",
  "focusAreas": "async/await, promises",
  "count": 2,
  "goalId": 1
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 2 challenge(s)",
  "challenges": [
    {
      "title": "Master Async JavaScript",
      "description": "Learn asynchronous programming",
      "instructions": "1. Create async functions...",
      "category": "JavaScript",
      "difficulty_level": "medium",
      "estimated_time_minutes": 90,
      "points_reward": 10,
      "learning_objectives": ["async/await", "promises"],
      "tags": ["javascript", "async"],
      "is_ai_generated": true
    }
  ],
  "processing_time_ms": 1500
}
```

### Submit for Feedback

**Endpoint:** `POST /api/ai/submitForFeedback`

**Request:**
```json
{
  "submissionId": 1,
  "submissionText": "function hello() { console.log('Hello'); }",
  "challengeId": 1,
  "submissionType": "code"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Feedback generated successfully",
  "feedback": {
    "id": 1,
    "score": 85,
    "feedback_text": "Great work! Your function is well-structured.",
    "strengths": ["Clean syntax", "Proper naming"],
    "improvements": ["Add error handling", "Include documentation"],
    "suggestions": ["Use arrow functions", "Add type checking"],
    "confidence_score": 0.92,
    "processing_time_ms": 1200
  }
}
```

### Get Feedback History

**Endpoint:** `GET /api/ai/feedback/:submissionId`

**Response:**
```json
{
  "success": true,
  "history": [
    {
      "id": 1,
      "feedback_text": "Good work",
      "confidence_score": 0.9,
      "suggestions": ["..."],
      "strengths": ["..."],
      "improvements": ["..."],
      "ai_model": "gemini-2.0-flash",
      "created_at": "2024-01-15T10:00:00Z"
    }
  ]
}
```

### Ask Follow-up Question

**Endpoint:** `POST /api/ai/feedback/:feedbackId/followup`

**Request:**
```json
{
  "question": "Can you explain the first improvement suggestion?"
}
```

**Response:**
```json
{
  "success": true,
  "answer": "Error handling is important because..."
}
```

---

## Testing

### Running Tests

**Backend Unit Tests:**
```bash
cd backend
npm test
```

**Backend with Coverage:**
```bash
npm run test:coverage
```

**Frontend Unit Tests:**
```bash
cd frontend
npm test
```

**End-to-End Tests:**
```bash
cd frontend
npm run cypress:open  # Interactive mode
npm run cypress:run   # Headless mode
```

### Test Coverage

- **Backend Unit Tests:** 15+ tests for AI service
- **Backend Integration Tests:** 10+ tests for AI endpoints
- **Snapshot Tests:** 2 prompt template snapshots
- **E2E Tests:** 17 scenarios across 2 test suites

### Manual Testing Checklist

#### AI Challenge Generation
- [ ] Modal opens on button click
- [ ] Form validation works
- [ ] Challenges generate successfully
- [ ] Generated challenges can be edited
- [ ] Challenges save to database
- [ ] Error handling displays properly

#### AI Feedback
- [ ] Submission form accepts input
- [ ] Different submission types work (text/code/link)
- [ ] Feedback displays with all components
- [ ] Follow-up questions work
- [ ] Feedback history displays
- [ ] Error messages are user-friendly

#### Error Monitoring
- [ ] Frontend errors are caught by ErrorBoundary
- [ ] Backend errors are logged to Sentry
- [ ] Error pages display properly
- [ ] Sensitive data is filtered

---

## Deployment

### Environment Setup

1. **Production Environment Variables**

   Backend:
   ```env
   NODE_ENV=production
   GEMINI_API_KEY=your-production-key
   DATABASE_URL=your-production-db-url
   SENTRY_DSN=your-sentry-dsn
   ```

   Frontend:
   ```env
   REACT_APP_API_URL=https://api.yourproduction.com/api
   REACT_APP_SENTRY_DSN=your-frontend-sentry-dsn
   ```

2. **Database Migration**
   ```bash
   npm run migrate
   ```

3. **Build Frontend**
   ```bash
   cd frontend
   npm run build
   ```

4. **Start Backend**
   ```bash
   cd backend
   npm start
   ```

### Docker Deployment

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Performance Optimization

- Enable caching for AI responses
- Implement rate limiting for AI endpoints
- Monitor API usage and costs
- Set up CDN for static assets

---

## Troubleshooting

### Common Issues

#### 1. Gemini API Errors

**Problem:** `Failed to generate challenges: API Error`

**Solution:**
- Verify API key is correct
- Check API quota limits
- Ensure network connectivity
- Review API error logs

#### 2. Database Connection Issues

**Problem:** `Cannot connect to database`

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Verify connection string
echo $DATABASE_URL

# Run migrations
npm run migrate
```

#### 3. Frontend-Backend Connection

**Problem:** `Network Error` or CORS issues

**Solution:**
- Verify `REACT_APP_API_URL` is correct
- Check backend CORS configuration
- Ensure backend is running
- Check browser console for errors

#### 4. Tests Failing

**Problem:** Tests fail with timeout errors

**Solution:**
```bash
# Increase test timeout
jest --testTimeout=10000

# Clear Jest cache
jest --clearCache

# Run tests individually
jest aiService.test.js
```

### Debug Mode

Enable verbose logging:

```env
LOG_LEVEL=debug
NODE_ENV=development
```

### Getting Help

- Check logs: `docker-compose logs -f`
- Review Sentry dashboard for production errors
- Check API response times in network tab
- Verify database queries in PostgreSQL logs

---

## Performance Metrics

### Expected Response Times

- AI Challenge Generation: 1-3 seconds
- AI Feedback Generation: 1-2 seconds
- Follow-up Questions: 0.5-1 second
- Feedback History: < 100ms

### API Rate Limits

- Gemini API: Check Google Cloud quotas
- Backend endpoints: 100 requests per 15 minutes per IP

### Database Performance

- ai_feedback table has indexes on:
  - submission_id
  - feedback_type
  - created_at

---

## Security Considerations

### API Key Management

- Never commit API keys to version control
- Use environment variables
- Rotate keys regularly
- Monitor API usage

### Data Privacy

- Feedback content is not shared with third parties
- User submissions are encrypted in transit
- Sensitive data is filtered from error logs
- GDPR compliance maintained

### Rate Limiting

```javascript
// Applied to all AI endpoints
{
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}
```

---

## Future Enhancements

1. **Advanced AI Features**
   - Multi-model support (GPT-4, Claude)
   - Custom fine-tuned models
   - Batch processing

2. **Analytics**
   - AI usage dashboard
   - Feedback quality metrics
   - Cost tracking

3. **Optimization**
   - Response caching
   - Background processing
   - WebSocket for real-time updates

4. **Accessibility**
   - Screen reader improvements
   - Keyboard navigation enhancements
   - High contrast mode

---

## Contributing

When adding new AI features:

1. Update prompt templates in `aiService.js`
2. Add corresponding tests
3. Update API documentation
4. Test with real API calls
5. Monitor error rates in Sentry

---

## License

MIT License - see LICENSE file for details

---

## Support

For issues and questions:
- Create a GitHub issue
- Check documentation in `/docs`
- Review test files for usage examples

---

**Last Updated:** November 29, 2025  
**Version:** 1.0.0  
**Sprint:** 3

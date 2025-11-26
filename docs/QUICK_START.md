# Sprint 3 - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites

- Node.js v22+ installed
- Docker Desktop installed
- Git repository cloned

---

## Step 1: Install Dependencies (1 min)

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

---

## Step 2: Set Environment Variables (2 min)

### Backend (.env)

Create `backend/.env`:

```bash
# Database
DATABASE_URL=postgresql://skillwise:password@localhost:5432/skillwise

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_REFRESH_SECRET=your-refresh-secret-key-change-in-production

# CORS
CORS_ORIGIN=http://localhost:3000

# AI Features (Sprint 3)
OPENAI_API_KEY=sk-proj-your-key-here
OPENAI_MODEL=gpt-3.5-turbo

# Error Tracking (Sprint 3)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

### Frontend (.env)

Create `frontend/.env`:

```bash
# API
VITE_API_URL=http://localhost:3001

# Error Tracking (Sprint 3)
VITE_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project
```

**Get your keys:**

- OpenAI API Key: https://platform.openai.com/api-keys
- Sentry DSN: https://sentry.io/ (create free account)

---

## Step 3: Start Database (30 sec)

```bash
# From project root
docker-compose up -d
```

**Verify it's running:**

```bash
docker ps
# Should show postgres on port 5432
```

---

## Step 4: Run Database Migrations (30 sec)

```bash
cd backend
node scripts/migrate.js
```

**Expected output:**

```
✅ All migrations completed successfully
```

---

## Step 5: Start the Application (1 min)

**Terminal 1 - Backend:**

```bash
cd backend
npm start
```

Backend runs on: http://localhost:3001

**Terminal 2 - Frontend:**

```bash
cd frontend
npm run dev
```

Frontend runs on: http://localhost:3000

---

## 🎉 You're Ready!

Open your browser to http://localhost:3000 and:

1. **Register** a new account
2. **Navigate to Challenges**
3. **Click "AI Generate"** to create a challenge
4. **Submit code** and get AI feedback

---

## 🧪 Run Tests

### Frontend Unit Tests

```bash
cd frontend
npm test
```

### Backend Tests

```bash
cd backend
npm test
```

### E2E Tests (Cypress)

```bash
cd frontend
npm run cypress:open  # Interactive
# OR
npm run cypress:run   # Headless
```

---

## 📚 Key Features to Try

### 1. AI Challenge Generation

1. Go to Challenges page
2. Click "AI Generate" button
3. Fill in:
   - Skill: JavaScript
   - Difficulty: Medium
   - Topic: Array Manipulation
   - Type: Coding
4. Click "Generate Challenge"
5. See AI-generated challenge with examples and criteria!

### 2. AI Code Feedback

1. Open a challenge
2. Submit your code solution
3. Upload a file OR paste code directly
4. Click "Get AI Feedback"
5. See detailed feedback with:
   - Confidence score
   - Strengths
   - Improvements
   - Suggestions

### 3. Error Boundary

Try triggering an error to see the ErrorBoundary component:

- Beautiful error page
- "Return to Home" and "Reload Page" buttons
- Error captured in Sentry dashboard

---

## 🔧 Troubleshooting

### "Database connection failed"

```bash
# Check Docker is running
docker ps

# Restart database
docker-compose down
docker-compose up -d
```

### "OpenAI API Error"

- Check your API key is valid
- Verify you have credits: https://platform.openai.com/usage
- Check key is set in `backend/.env`

### "Port already in use"

```bash
# Backend (3001)
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Frontend (3000)
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Tests failing

```bash
# Make sure database is running
docker ps

# Clear test database
cd backend
node scripts/migrate.js

# Try again
npm test
```

---

## 📖 Documentation

- **Full Guide:** `docs/AI_FEATURES_GUIDE.md`
- **Implementation Details:** `docs/SPRINT_3_IMPLEMENTATION.md`
- **Checklist:** `docs/SPRINT_3_CHECKLIST.md`

---

## 🎯 API Endpoints

All AI endpoints require authentication (`Authorization: Bearer <token>`):

### Generate Challenge

```bash
POST http://localhost:3001/api/ai/generateChallenge
Content-Type: application/json

{
  "skill": "JavaScript",
  "difficulty": "medium",
  "topic": "Array Manipulation",
  "type": "coding"
}
```

### Submit for Feedback

```bash
POST http://localhost:3001/api/ai/submitForFeedback
Content-Type: application/json

{
  "submissionId": 1,
  "submissionCode": "function test() { return true; }",
  "challengeTitle": "Test Challenge",
  "challengeDescription": "Description"
}
```

### Get Feedback

```bash
GET http://localhost:3001/api/ai/feedback/:submissionId
```

---

## ⚡ Performance Tips

1. **First request is slower** - OpenAI cold start (~2-3s)
2. **Subsequent requests** - Usually 1-2s
3. **Consider caching** - Common challenges for production
4. **Rate limiting** - Add per-user limits in production

---

## 💰 Cost Estimates

### OpenAI Usage

- **Model:** gpt-3.5-turbo
- **Cost:** ~$0.002 per 1K tokens
- **Challenge generation:** ~400 tokens (~$0.0008)
- **Feedback generation:** ~500 tokens (~$0.001)
- **100 users/day:** ~$10-20/month

### Sentry

- **Free tier:** 5,000 errors/month
- **Sufficient** for development and small production

---

## 🎓 Next Steps

1. ✅ Complete Sprint 3 (you're almost there!)
2. 🔄 Run all tests
3. 📊 Monitor Sentry for errors
4. 💡 Try different challenge types
5. 🚀 Deploy to production

---

## 📞 Need Help?

1. Check documentation in `docs/`
2. Review test files for examples
3. Check Sentry dashboard for errors
4. Review OpenAI API logs

---

## ✨ Enjoy Your AI-Powered Learning Platform!

**Built with:**

- React 18
- Express.js
- PostgreSQL
- OpenAI GPT-3.5-turbo
- Sentry
- Jest & Cypress

**Sprint 3 Complete! 🎉**

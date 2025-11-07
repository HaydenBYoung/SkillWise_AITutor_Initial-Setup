// Simple test server for E2E testing
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// In-memory storage for mock data
let goals = [
  {
    id: 1,
    title: 'Test Goal',
    description: 'A test goal for E2E testing',
    targetDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

let challenges = [
  {
    id: 1,
    title: 'Test Challenge',
    description: 'A test challenge for E2E testing',
    category: 'programming',
    difficulty_level: 'beginner',
    points_reward: 50,
    status: 'available',
    submissions: [],
    createdAt: new Date().toISOString(),
  },
];

// Middleware
app.use(
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
    ],
    credentials: true,
  })
);
app.use(express.json());

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mock API endpoints for E2E testing
app.get('/api/auth/me', (req, res) => {
  res.json({
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
  });
});

app.post('/api/auth/login', (req, res) => {
  res.json({
    token: 'mock-jwt-token',
    user: {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
    },
  });
});

// Goals endpoints
app.get('/api/goals', (req, res) => {
  console.log('📊 GET /api/goals - Returning goals:', goals.length, 'goals');
  res.json(goals);
});

app.post('/api/goals', (req, res) => {
  const { title, description, targetDate } = req.body;
  console.log('📝 POST /api/goals - Creating goal:', {
    title,
    description,
    targetDate,
  });

  const newGoal = {
    id: Date.now(),
    title,
    description,
    targetDate,
    completed: false,
    createdAt: new Date().toISOString(),
  };

  goals.push(newGoal);
  console.log('✅ Goal created and added to array. Total goals:', goals.length);

  res.status(201).json(newGoal);
});

app.put('/api/goals/:id', (req, res) => {
  const goalId = parseInt(req.params.id);
  const { title, description, targetDate, completed } = req.body;

  const goalIndex = goals.findIndex((g) => g.id === goalId);
  if (goalIndex === -1) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  goals[goalIndex] = {
    ...goals[goalIndex],
    title: title || goals[goalIndex].title,
    description: description || goals[goalIndex].description,
    targetDate: targetDate || goals[goalIndex].targetDate,
    completed: completed !== undefined ? completed : goals[goalIndex].completed,
    updatedAt: new Date().toISOString(),
  };

  console.log('📝 Goal updated:', goals[goalIndex]);
  res.json(goals[goalIndex]);
});

app.delete('/api/goals/:id', (req, res) => {
  const goalId = parseInt(req.params.id);
  const goalIndex = goals.findIndex((g) => g.id === goalId);

  if (goalIndex === -1) {
    return res.status(404).json({ error: 'Goal not found' });
  }

  goals.splice(goalIndex, 1);
  console.log('🗑️ Goal deleted. Remaining goals:', goals.length);
  res.status(204).send();
});

// Challenges endpoints
app.get('/api/challenges', (req, res) => {
  console.log(
    '📊 GET /api/challenges - Returning challenges:',
    challenges.length,
    'challenges'
  );
  res.json(challenges);
});

app.post('/api/challenges', (req, res) => {
  const { title, description, goalId } = req.body;
  console.log('📝 POST /api/challenges - Creating challenge:', {
    title,
    description,
    goalId,
  });

  const newChallenge = {
    id: Date.now(),
    title,
    description,
    goalId,
    category: 'programming',
    difficulty_level: 'beginner',
    points_reward: 50,
    status: 'available',
    submissions: [],
    createdAt: new Date().toISOString(),
  };

  challenges.push(newChallenge);
  console.log(
    '✅ Challenge created and added to array. Total challenges:',
    challenges.length
  );

  res.status(201).json(newChallenge);
});

app.get('/api/progress/overview', (req, res) => {
  res.json({
    totalGoals: 1,
    completedGoals: 0,
    totalChallenges: 1,
    completedChallenges: 0,
    streakDays: 0,
    totalPoints: 0,
    recentActivity: [],
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 Mock SkillWise API Server running on port ${PORT}`);
  console.log(`📊 Health check available at http://localhost:${PORT}/healthz`);
  console.log(`🌐 API endpoints available at http://localhost:${PORT}/api`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

module.exports = app;

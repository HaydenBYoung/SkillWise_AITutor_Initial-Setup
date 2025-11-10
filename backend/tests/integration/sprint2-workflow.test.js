const request = require('supertest');
const app = require('../../src/app');
// REMOVED: No database operations allowed in tests

describe('Sprint 2 User Story Workflow Tests', () => {
  let authToken;
  let userId;
  let goalId;

  beforeEach(async () => {
    // NO DATABASE OPERATIONS - Tests should not modify database
  });

  describe('Story 2.7: Complete User Learning Workflow', () => {
    it('should complete user registration and authentication', async () => {
      console.log('🔄 Testing User Registration & Authentication');
      
      // Test Registration
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'sprint2test@example.com',
          password: 'TestPass123!',
          confirmPassword: 'TestPass123!',
          firstName: 'Sprint',
          lastName: 'Tester'
        });

      expect(registerResponse.status).toBe(201);
      expect(registerResponse.body.success).toBe(true);
      expect(registerResponse.body.user.email).toBe('sprint2test@example.com');
      expect(registerResponse.body.accessToken).toBeDefined();

      authToken = registerResponse.body.accessToken;
      userId = registerResponse.body.user.id;

      // Test Login
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'sprint2test@example.com',
          password: 'TestPass123!'
        });

      expect(loginResponse.status).toBe(200);
      expect(loginResponse.body.success).toBe(true);
      expect(loginResponse.body.accessToken).toBeDefined();

      console.log('✅ Authentication workflow completed successfully');
    });

    it('should create and manage learning goals', async () => {
      console.log('🔄 Testing Goal Creation & Management');
      
      // First register and login
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'goaltest@example.com',
          password: 'TestPass123!',
          confirmPassword: 'TestPass123!',
          firstName: 'Goal',
          lastName: 'Tester'
        });

      authToken = registerResponse.body.accessToken;

      // Test Goal Creation
      const goalResponse = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Learn React Testing',
          description: 'Master unit testing with Jest and React Testing Library',
          category: 'Programming',
          difficulty_level: 'medium'
        });

      expect(goalResponse.status).toBe(201);
      expect(goalResponse.body.success).toBe(true);
      expect(goalResponse.body.data.title).toBe('Learn React Testing');
      expect(goalResponse.body.data.difficulty_level).toBe('medium');

      goalId = goalResponse.body.data.id;

      // Test Goal Retrieval
      const goalsListResponse = await request(app)
        .get('/api/goals')
        .set('Authorization', `Bearer ${authToken}`);

      expect(goalsListResponse.status).toBe(200);
      expect(goalsListResponse.body.success).toBe(true);
      expect(goalsListResponse.body.data.goals).toHaveLength(1);
      expect(goalsListResponse.body.data.goals[0].title).toBe('Learn React Testing');

      console.log('✅ Goal management workflow completed successfully');
    });

    it('should track progress and display achievements', async () => {
      console.log('🔄 Testing Progress Tracking & Achievements');
      
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'progresstest@example.com',
          password: 'TestPass123!',
          confirmPassword: 'TestPass123!',
          firstName: 'Progress',
          lastName: 'Tester'
        });

      authToken = registerResponse.body.accessToken;

      // Test Progress Dashboard
      const progressResponse = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${authToken}`);

      expect(progressResponse.status).toBe(200);
      expect(progressResponse.body.success).toBe(true);
      expect(progressResponse.body.data).toHaveProperty('earned_points');
      expect(progressResponse.body.data).toHaveProperty('completed_challenges');
      expect(progressResponse.body.data).toHaveProperty('total_goals');

      // Test Achievements
      const achievementsResponse = await request(app)
        .get('/api/progress/achievements')
        .set('Authorization', `Bearer ${authToken}`);

      expect(achievementsResponse.status).toBe(200);
      expect(achievementsResponse.body.success).toBe(true);
      expect(Array.isArray(achievementsResponse.body.data)).toBe(true);

      // Test Activity Timeline
      const timelineResponse = await request(app)
        .get('/api/progress/timeline')
        .set('Authorization', `Bearer ${authToken}`);

      expect(timelineResponse.status).toBe(200);
      expect(timelineResponse.body.success).toBe(true);
      expect(Array.isArray(timelineResponse.body.data)).toBe(true);

      console.log('✅ Progress tracking workflow completed successfully');
    });

    it('should handle challenge modules and completion', async () => {
      console.log('🔄 Testing Challenge Module System');
      
      // Register user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'challengetest@example.com',
          password: 'TestPass123!',
          confirmPassword: 'TestPass123!',
          firstName: 'Challenge',
          lastName: 'Tester'
        });

      authToken = registerResponse.body.accessToken;

      // Create a goal first
      const goalResponse = await request(app)
        .post('/api/goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Programming Challenges',
          description: 'Complete programming challenges',
          category: 'Programming',
          difficulty_level: 'easy'
        });

      goalId = goalResponse.body.data.id;

      // Test Challenge Modules
      const modulesResponse = await request(app)
        .get('/api/challenge-modules')
        .set('Authorization', `Bearer ${authToken}`);

      expect(modulesResponse.status).toBe(200);
      expect(Array.isArray(modulesResponse.body)).toBe(true);

      console.log('✅ Challenge module workflow completed successfully');
    });

    it('should provide comprehensive API health checks', async () => {
      console.log('🔄 Testing API Health & Endpoints');
      
      // Test Health Endpoint
      const healthResponse = await request(app)
        .get('/api/health');

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.success).toBe(true);
      expect(healthResponse.body.message).toContain('healthy');

      // Test API Documentation
      const apiDocsResponse = await request(app)
        .get('/api/');

      expect(apiDocsResponse.status).toBe(200);
      expect(apiDocsResponse.body.name).toBe('SkillWise API');
      expect(apiDocsResponse.body.endpoints).toBeDefined();

      console.log('✅ API health check workflow completed successfully');
    });
  });

  describe('Story 2.8: API Endpoint Integration Tests', () => {
    it('should handle authentication errors gracefully', async () => {
      console.log('🔄 Testing Error Handling');
      
      // Test unauthorized access
      const unauthorizedResponse = await request(app)
        .get('/api/goals');

      expect(unauthorizedResponse.status).toBe(401);

      // Test invalid login
      const invalidLoginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword'
        });

      expect(invalidLoginResponse.status).toBe(401);

      console.log('✅ Error handling tests completed successfully');
    });

    it('should validate request data properly', async () => {
      console.log('🔄 Testing Request Validation');
      
      // Test invalid registration data
      const invalidRegisterResponse = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: '123', // too short
          firstName: '',
          lastName: ''
        });

      expect(invalidRegisterResponse.status).toBe(400);

      console.log('✅ Request validation tests completed successfully');
    });
  });
});
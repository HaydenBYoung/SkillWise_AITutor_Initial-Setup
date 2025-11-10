const request = require('supertest');
const app = require('../../src/app');
// REMOVED: No database operations allowed in tests

describe('Complete User Workflow: Login → Create Goal → Add Challenge → Mark Complete', () => {
  let authToken;
  let userId;
  let goalId;
  let challengeId;

  beforeEach(async () => {
    // NO DATABASE OPERATIONS - Tests should not modify database
  });

  it('should complete the full workflow successfully', async () => {
    // Step 1: Register a new user
    console.log('🔄 Step 1: User Registration');
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'workflow@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'Workflow',
        lastName: 'User'
      })
      .expect(201);

    expect(registerResponse.body.success).toBe(true);
    expect(registerResponse.body.user.email).toBe('workflow@example.com');
    expect(registerResponse.body.accessToken).toBeDefined();
    
    authToken = registerResponse.body.accessToken;
    userId = registerResponse.body.user.id;
    console.log('✅ User registered successfully');

    // Step 2: Login with the user
    console.log('🔄 Step 2: User Login');
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'workflow@example.com',
        password: 'Password123!'
      })
      .expect(200);

    expect(loginResponse.body.success).toBe(true);
    expect(loginResponse.body.accessToken).toBeDefined();
    
    authToken = loginResponse.body.accessToken; // Use fresh token
    console.log('✅ User logged in successfully');

    // Step 3: Create a learning goal
    console.log('🔄 Step 3: Create Learning Goal');
    const goalResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Master React Hooks',
        description: 'Learn useState, useEffect, and custom hooks',
        category: 'Programming',
        difficulty_level: 'medium',
        target_completion_date: '2025-12-31'
      })
      .expect(201);

    expect(goalResponse.body.success).toBe(true);
    expect(goalResponse.body.data.title).toBe('Master React Hooks');
    expect(goalResponse.body.data.user_id).toBe(userId);
    expect(goalResponse.body.data.points_reward).toBe(35); // Medium goal = 35 points
    
    goalId = goalResponse.body.data.id;
    console.log('✅ Goal created successfully');

    // Step 4: Verify goal appears in dashboard
    console.log('🔄 Step 4: Verify Goal in Dashboard');
    const goalsListResponse = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(goalsListResponse.body.success).toBe(true);
    expect(goalsListResponse.body.data.goals).toHaveLength(1);
    expect(goalsListResponse.body.data.goals[0].title).toBe('Master React Hooks');
    expect(goalsListResponse.body.data.goals[0].earned_points).toBe(0);
    expect(goalsListResponse.body.data.goals[0].calculated_progress_percentage).toBe(0);
    console.log('✅ Goal appears in dashboard');

    // Step 5: Add challenges to the goal
    console.log('🔄 Step 5: Add Challenges to Goal');
    
    // Add Easy Challenge (1 point)
    const easyChallenge = await request(app)
      .post(`/api/goals/${goalId}/challenges`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Learn useState Hook',
        description: 'Create a counter component using useState',
        difficulty_level: 'easy',
        estimated_time: 60
      })
      .expect(201);

    expect(easyChallenge.body.success).toBe(true);
    expect(easyChallenge.body.data.title).toBe('Learn useState Hook');
    expect(easyChallenge.body.data.points_reward).toBe(1);
    
    // Add Medium Challenge (2 points)
    const mediumChallenge = await request(app)
      .post(`/api/goals/${goalId}/challenges`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Learn useEffect Hook',
        description: 'Create a component that fetches data on mount',
        difficulty_level: 'medium',
        estimated_time: 120
      })
      .expect(201);

    expect(mediumChallenge.body.success).toBe(true);
    expect(mediumChallenge.body.data.points_reward).toBe(2);
    
    // Add Hard Challenge (3 points)
    const hardChallenge = await request(app)
      .post(`/api/goals/${goalId}/challenges`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Create Custom Hook',
        description: 'Build a custom useLocalStorage hook',
        difficulty_level: 'hard',
        estimated_time: 180
      })
      .expect(201);

    expect(hardChallenge.body.success).toBe(true);
    expect(hardChallenge.body.data.points_reward).toBe(3);
    
    challengeId = easyChallenge.body.data.id;
    console.log('✅ All challenges added successfully');

    // Step 6: Verify challenges appear in goal
    console.log('🔄 Step 6: Verify Challenges in Goal');
    const goalDetailsResponse = await request(app)
      .get(`/api/goals/${goalId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(goalDetailsResponse.body.success).toBe(true);
    expect(goalDetailsResponse.body.data.challenges).toHaveLength(3);
    expect(goalDetailsResponse.body.data.challenges.some(c => c.title === 'Learn useState Hook')).toBe(true);
    console.log('✅ Challenges appear in goal');

    // Step 7: Complete the first challenge
    console.log('🔄 Step 7: Complete Challenge');
    const completeResponse = await request(app)
      .patch(`/api/goals/${goalId}/challenges/${challengeId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        submission: 'Here is my useState counter component implementation...'
      })
      .expect(200);

    expect(completeResponse.body.success).toBe(true);
    expect(completeResponse.body.message).toContain('completed');
    console.log('✅ Challenge completed successfully');

    // Step 8: Verify progress updates
    console.log('🔄 Step 8: Verify Progress Updates');
    const updatedGoalResponse = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(updatedGoalResponse.body.success).toBe(true);
    const updatedGoal = updatedGoalResponse.body.data.goals[0];
    expect(updatedGoal.earned_points).toBe(1); // Easy challenge = 1 point
    expect(updatedGoal.calculated_progress_percentage).toBeGreaterThan(0);
    expect(updatedGoal.completed_challenges).toBe(1);
    console.log('✅ Progress updated correctly');

    // Step 9: Verify progress appears in dashboard
    console.log('🔄 Step 9: Verify Progress Dashboard');
    const progressResponse = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(progressResponse.body.success).toBe(true);
    expect(progressResponse.body.data.earned_points).toBe(1);
    expect(progressResponse.body.data.completed_challenges).toBe(1);
    expect(progressResponse.body.data.total_goals).toBe(1);
    console.log('✅ Progress dashboard updated');

    // Step 10: Verify achievements are earned
    console.log('🔄 Step 10: Verify Achievements');
    const achievementsResponse = await request(app)
      .get('/api/progress/achievements')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(achievementsResponse.body.success).toBe(true);
    expect(achievementsResponse.body.data.length).toBeGreaterThan(0);
    
    const pointsAchievement = achievementsResponse.body.data.find(a => 
      a.achievement_type === 'points' && a.description.includes('Welcome')
    );
    expect(pointsAchievement).toBeDefined();
    
    const challengeAchievement = achievementsResponse.body.data.find(a => 
      a.achievement_type === 'challenges' && a.description.includes('First Challenge')
    );
    expect(challengeAchievement).toBeDefined();
    console.log('✅ Achievements earned successfully');

    // Step 11: Complete another challenge and verify further progress
    console.log('🔄 Step 11: Complete Second Challenge');
    const mediumChallengeId = mediumChallenge.body.data.id;
    
    await request(app)
      .patch(`/api/goals/${goalId}/challenges/${mediumChallengeId}/complete`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        submission: 'Here is my useEffect data fetching component...'
      })
      .expect(200);

    // Verify cumulative progress
    const finalGoalResponse = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const finalGoal = finalGoalResponse.body.data.goals[0];
    expect(finalGoal.earned_points).toBe(3); // 1 + 2 points
    expect(finalGoal.completed_challenges).toBe(2);
    expect(finalGoal.calculated_progress_percentage).toBe(9); // 3/35 * 100 = ~8.57, rounded to 9
    console.log('✅ Cumulative progress verified');

    // Step 12: Verify activity timeline
    console.log('🔄 Step 12: Verify Activity Timeline');
    const timelineResponse = await request(app)
      .get('/api/progress/timeline')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(timelineResponse.body.success).toBe(true);
    expect(timelineResponse.body.data.length).toBe(2); // Two completed challenges
    expect(timelineResponse.body.data[0].type).toBe('challenge');
    expect(timelineResponse.body.data[0].title).toBe('Learn useEffect Hook'); // Most recent first
    console.log('✅ Activity timeline verified');

    console.log('🎉 Complete workflow test passed successfully!');
  });

  it('should handle workflow with goal completion', async () => {
    console.log('🔄 Testing goal completion workflow');
    
    // Quick workflow to test goal completion
    const registerResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'completion@example.com',
        password: 'Password123!',
        confirmPassword: 'Password123!',
        firstName: 'Completion',
        lastName: 'User'
      });

    authToken = registerResponse.body.accessToken;

    // Create Easy goal (20 points target)
    const goalResponse = await request(app)
      .post('/api/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Easy Goal',
        description: 'A simple goal to complete',
        category: 'Testing',
        difficulty_level: 'easy'
      });

    goalId = goalResponse.body.data.id;

    // Add challenges that total to goal completion
    const challenges = [];
    for (let i = 0; i < 20; i++) {
      const challengeResponse = await request(app)
        .post(`/api/goals/${goalId}/challenges`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: `Challenge ${i + 1}`,
          description: `Test challenge ${i + 1}`,
          difficulty_level: 'easy'
        });
      challenges.push(challengeResponse.body.data.id);
    }

    // Complete all challenges
    for (const challengeId of challenges) {
      await request(app)
        .patch(`/api/goals/${goalId}/challenges/${challengeId}/complete`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          submission: 'Test submission'
        });
    }

    // Verify goal completion
    const finalGoalResponse = await request(app)
      .get('/api/goals')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const completedGoal = finalGoalResponse.body.data.goals[0];
    expect(completedGoal.earned_points).toBe(20);
    expect(completedGoal.calculated_progress_percentage).toBe(100);
    expect(completedGoal.is_completed).toBe(true);

    console.log('✅ Goal completion workflow verified');
  });
});
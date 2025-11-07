describe('SkillWise E2E Smoke Test - Complete User Workflow', () => {
  const testUser = {
    email: 'test@example.com',
    password: 'password123',
  };

  const testGoal = {
    title: 'Master React Development',
    description: 'Learn React hooks, components, and state management',
    category: 'Frontend',
    target_date: '2024-12-31',
  };

  const testChallenge = {
    title: 'Build a Todo App',
    description: 'Create a functional todo application with React',
    difficulty: 'medium',
  };

  beforeEach(() => {
    // Reset database state (if needed)
    // cy.task('db:seed');

    // Clear any existing authentication
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should complete the full user workflow: login → create goal → add challenge → mark complete', () => {
    // Step 1: Login
    cy.log('🔐 Step 1: User Login');
    cy.login(testUser.email, testUser.password);

    // Verify login success
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('be.visible');

    // Step 2: Create a goal
    cy.log('🎯 Step 2: Create Goal');
    cy.createGoal(testGoal);

    // Verify goal was created
    cy.visit('/goals');
    cy.contains(testGoal.title).should('be.visible');
    cy.contains(testGoal.description).should('be.visible');

    // Step 3: Add a challenge
    cy.log('🚀 Step 3: Add Challenge');
    cy.addChallenge(testChallenge);

    // Verify challenge was created
    cy.visit('/challenges');
    cy.contains(testChallenge.title).should('be.visible');
    cy.contains(testChallenge.description).should('be.visible');

    // Step 4: Complete the challenge
    cy.log('✅ Step 4: Complete Challenge');
    cy.markChallengeComplete(testChallenge.title);

    // Verify challenge completion
    cy.contains(testChallenge.title).parent().should('contain', 'completed');

    // Step 5: Complete the goal
    cy.log('🏆 Step 5: Complete Goal');
    cy.markGoalComplete(testGoal.title);

    // Verify goal completion
    cy.visit('/goals');
    cy.contains(testGoal.title).parent().should('contain', 'completed');

    // Step 6: Check progress page
    cy.log('📊 Step 6: Check Progress');
    cy.checkProgress();

    // Verify progress shows completed items
    cy.get('[data-testid="progress-tracker"]').within(() => {
      cy.contains('1').should('be.visible'); // 1 completed goal
      cy.contains('100%').should('be.visible'); // 100% progress
    });

    // Verify charts are displayed
    cy.get('[data-testid="progress-charts"]').should('be.visible');

    // Step 7: Verify dashboard reflects progress
    cy.log('📈 Step 7: Verify Dashboard');
    cy.visit('/dashboard');

    // Check that dashboard shows recent activity
    cy.contains('Recent Activity').should('be.visible');
    cy.contains(testGoal.title).should('be.visible');
    cy.contains(testChallenge.title).should('be.visible');
  });

  it('should handle error states gracefully', () => {
    cy.log('🚨 Error Handling Test');

    // Test invalid login
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type('invalid@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    // Should show error message
    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');

    // Test creating goal without required fields
    cy.login(testUser.email, testUser.password);
    cy.visit('/goals');
    cy.get('[data-testid="create-goal-button"]').click();

    // Try to save without filling required fields
    cy.get('[data-testid="save-goal-button"]').click();

    // Should show validation errors
    cy.contains('Title is required').should('be.visible');
  });

  it('should be responsive on mobile devices', () => {
    cy.log('📱 Mobile Responsiveness Test');

    // Test on mobile viewport
    cy.viewport('iphone-x');

    cy.login(testUser.email, testUser.password);

    // Test navigation menu works on mobile
    cy.get('[data-testid="mobile-menu-button"]').should('be.visible').click();
    cy.get('[data-testid="mobile-nav"]').should('be.visible');

    // Test that progress page is usable on mobile
    cy.visit('/progress');
    cy.get('[data-testid="progress-tracker"]').should('be.visible');

    // Charts should be responsive
    cy.get('[data-testid="progress-charts"]').should('be.visible');
    cy.get('.recharts-surface').should('have.css', 'width');
  });

  it('should maintain state across page refreshes', () => {
    cy.log('🔄 State Persistence Test');

    cy.login(testUser.email, testUser.password);

    // Create a goal
    cy.createGoal({
      title: 'Persistence Test Goal',
      description: 'Testing state persistence',
    });

    // Refresh the page
    cy.reload();

    // Should still be logged in
    cy.url().should('not.include', '/login');

    // Goal should still exist
    cy.visit('/goals');
    cy.contains('Persistence Test Goal').should('be.visible');
  });
});

describe('SkillWise API Integration Tests', () => {
  it('should handle API failures gracefully', () => {
    cy.log('🌐 API Failure Handling');

    // Mock API failure
    cy.intercept('GET', '/api/goals', { forceNetworkError: true }).as(
      'apiFailure'
    );

    cy.login();
    cy.visit('/goals');

    // Should show error message when API fails
    cy.wait('@apiFailure');
    cy.contains('Failed to load').should('be.visible');
    cy.get('[data-testid="retry-button"]').should('be.visible');
  });

  it('should handle slow API responses', () => {
    cy.log('⏱️ Slow API Response Handling');

    // Mock slow API response
    cy.intercept('GET', '/api/goals', {
      delay: 3000,
      fixture: 'goals.json',
    }).as('slowApi');

    cy.login();
    cy.visit('/goals');

    // Should show loading state
    cy.get('[data-testid="loading-spinner"]').should('be.visible');

    cy.wait('@slowApi');

    // Loading should disappear after response
    cy.get('[data-testid="loading-spinner"]').should('not.exist');
  });
});

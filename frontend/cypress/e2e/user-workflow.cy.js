describe('SkillWise E2E User Workflow', () => {
  beforeEach(() => {
    // Clear any existing data and start fresh
    cy.request({
      method: 'POST',
      url: `${Cypress.env('apiUrl')}/api/test/clear-data`,
      failOnStatusCode: false
    });
  });

  it('should complete the full user workflow: register → login → create goal → add challenge → complete challenge', () => {
    const userEmail = `test-${Date.now()}@example.com`;
    const userPassword = 'Password123!';

    // Step 1: Visit the application
    cy.visit('/');
    cy.contains('SkillWise').should('be.visible');

    // Step 2: Register a new user
    cy.get('[data-cy="register-link"]').click();
    cy.url().should('include', '/register');
    
    cy.get('[data-cy="email-input"]').type(userEmail);
    cy.get('[data-cy="password-input"]').type(userPassword);
    cy.get('[data-cy="first-name-input"]').type('Cypress');
    cy.get('[data-cy="last-name-input"]').type('User');
    cy.get('[data-cy="register-button"]').click();

    // Should redirect to dashboard after successful registration
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('be.visible');

    // Step 3: Navigate to Goals page
    cy.get('[data-cy="goals-nav"]').click();
    cy.url().should('include', '/goals');
    cy.contains('My Learning Goals').should('be.visible');

    // Step 4: Create a new goal
    cy.get('[data-cy="create-goal-button"]').click();
    cy.get('[data-cy="goal-title-input"]').type('Learn React Hooks');
    cy.get('[data-cy="goal-description-input"]').type('Master useState, useEffect, and custom hooks');
    cy.get('[data-cy="goal-category-select"]').select('Programming');
    cy.get('[data-cy="goal-difficulty-select"]').select('medium');
    cy.get('[data-cy="goal-date-input"]').type('2025-12-31');
    cy.get('[data-cy="create-goal-submit"]').click();

    // Verify goal was created
    cy.contains('Learn React Hooks').should('be.visible');
    cy.contains('Programming').should('be.visible');
    cy.contains('Medium').should('be.visible');

    // Step 5: Add challenges to the goal
    cy.contains('Learn React Hooks').parent().find('[data-cy="view-goal-button"]').click();
    
    cy.get('[data-cy="add-challenge-button"]').click();
    cy.get('[data-cy="challenge-title-input"]').type('Learn useState Hook');
    cy.get('[data-cy="challenge-description-input"]').type('Create a counter component using useState');
    cy.get('[data-cy="challenge-difficulty-select"]').select('easy');
    cy.get('[data-cy="challenge-time-input"]').type('60');
    cy.get('[data-cy="add-challenge-submit"]').click();

    // Verify challenge was added
    cy.contains('Learn useState Hook').should('be.visible');
    cy.contains('Easy').should('be.visible');

    // Step 6: Complete the challenge
    cy.contains('Learn useState Hook').parent().find('[data-cy="complete-challenge-button"]').click();
    cy.get('[data-cy="submission-textarea"]').type('Here is my useState counter component implementation:\n\nfunction Counter() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>Count: {count}</p>\n      <button onClick={() => setCount(count + 1)}>Increment</button>\n    </div>\n  );\n}');
    cy.get('[data-cy="submit-challenge-button"]').click();

    // Verify challenge completion
    cy.contains('Completed').should('be.visible');
    cy.contains('✓').should('be.visible');

    // Step 7: Check progress updates
    cy.get('[data-cy="progress-nav"]').click();
    cy.url().should('include', '/progress');
    
    // Verify progress statistics
    cy.get('[data-cy="earned-points"]').should('contain', '1');
    cy.get('[data-cy="completed-challenges"]').should('contain', '1');
    cy.get('[data-cy="total-goals"]').should('contain', '1');

    // Verify achievement was earned
    cy.contains('First Challenge Complete').should('be.visible');
    cy.contains('Welcome to SkillWise').should('be.visible');

    // Step 8: Check activity timeline
    cy.get('[data-cy="timeline-section"]').should('be.visible');
    cy.contains('Learn useState Hook').should('be.visible');
    cy.contains('completed challenge').should('be.visible');

    // Step 9: Verify goal progress updated
    cy.get('[data-cy="goals-nav"]').click();
    cy.contains('Learn React Hooks').parent().should('contain', '1/35'); // 1 point out of 35
    cy.contains('Learn React Hooks').parent().find('[data-cy="progress-bar"]').should('exist');

    // Step 10: Add and complete more challenges
    cy.contains('Learn React Hooks').parent().find('[data-cy="view-goal-button"]').click();
    
    // Add medium challenge
    cy.get('[data-cy="add-challenge-button"]').click();
    cy.get('[data-cy="challenge-title-input"]').type('Learn useEffect Hook');
    cy.get('[data-cy="challenge-description-input"]').type('Create a component that fetches data on mount');
    cy.get('[data-cy="challenge-difficulty-select"]').select('medium');
    cy.get('[data-cy="challenge-time-input"]').type('120');
    cy.get('[data-cy="add-challenge-submit"]').click();

    // Complete medium challenge
    cy.contains('Learn useEffect Hook').parent().find('[data-cy="complete-challenge-button"]').click();
    cy.get('[data-cy="submission-textarea"]').type('Here is my useEffect data fetching component implementation...');
    cy.get('[data-cy="submit-challenge-button"]').click();

    // Verify cumulative progress
    cy.get('[data-cy="progress-nav"]').click();
    cy.get('[data-cy="earned-points"]').should('contain', '3'); // 1 + 2 points
    cy.get('[data-cy="completed-challenges"]').should('contain', '2');

    // Verify activity timeline shows both challenges
    cy.get('[data-cy="timeline-section"]').within(() => {
      cy.contains('Learn useEffect Hook').should('be.visible');
      cy.contains('Learn useState Hook').should('be.visible');
    });

    // Step 11: Test logout
    cy.get('[data-cy="user-menu"]').click();
    cy.get('[data-cy="logout-button"]').click();
    cy.url().should('include', '/login');
    cy.contains('Sign In').should('be.visible');

    // Step 12: Test login with created user
    cy.get('[data-cy="email-input"]').type(userEmail);
    cy.get('[data-cy="password-input"]').type(userPassword);
    cy.get('[data-cy="login-button"]').click();

    // Should redirect back to dashboard
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome back').should('be.visible');

    // Verify data persistence after login
    cy.get('[data-cy="progress-nav"]').click();
    cy.get('[data-cy="earned-points"]').should('contain', '3');
    cy.get('[data-cy="completed-challenges"]').should('contain', '2');
  });

  it('should handle error cases gracefully', () => {
    // Test invalid login
    cy.visit('/login');
    cy.get('[data-cy="email-input"]').type('invalid@example.com');
    cy.get('[data-cy="password-input"]').type('wrongpassword');
    cy.get('[data-cy="login-button"]').click();
    
    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');

    // Test registration with existing email
    cy.get('[data-cy="register-link"]').click();
    cy.get('[data-cy="email-input"]').type('test@example.com');
    cy.get('[data-cy="password-input"]').type('Password123!');
    cy.get('[data-cy="first-name-input"]').type('Test');
    cy.get('[data-cy="last-name-input"]').type('User');
    cy.get('[data-cy="register-button"]').click();

    // If user already exists, should show error
    cy.contains('already exists').should('be.visible');
  });

  it('should be responsive on mobile devices', () => {
    cy.viewport(375, 667); // iPhone SE dimensions
    
    cy.visit('/');
    cy.contains('SkillWise').should('be.visible');
    
    // Test mobile navigation
    cy.get('[data-cy="mobile-menu-button"]').should('be.visible');
    cy.get('[data-cy="mobile-menu-button"]').click();
    
    cy.get('[data-cy="mobile-nav"]').should('be.visible');
    cy.get('[data-cy="mobile-nav"]').contains('Goals').should('be.visible');
    cy.get('[data-cy="mobile-nav"]').contains('Progress').should('be.visible');
  });
});
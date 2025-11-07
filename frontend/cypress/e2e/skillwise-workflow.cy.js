describe('SkillWise E2E Workflow', () => {
  beforeEach(() => {
    // Visit the application
    cy.visit('http://localhost:3000');
  });

  it('completes full user workflow: login → create goal → add challenge → mark complete', () => {
    // Step 1: Login
    cy.contains('Login').click();

    // Fill in login form
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('Password123');
    cy.get('button[type="submit"]').click();

    // Verify successful login by checking for dashboard elements
    cy.url().should('include', '/dashboard');
    cy.contains('Dashboard').should('be.visible');

    // Step 2: Create a learning goal
    cy.contains('Goals').click();
    cy.contains('Create Goal').click();

    // Fill out goal creation form
    cy.get('input[name="title"]').type('Learn React Testing');
    cy.get('textarea[name="description"]').type(
      'Master unit and integration testing in React applications'
    );
    cy.get('select[name="category"]').select('Programming');
    cy.get('select[name="difficulty_level"]').select('Intermediate');

    // Set target completion date (30 days from now)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    cy.get('input[type="date"]').type(futureDate.toISOString().split('T')[0]);

    cy.get('button[type="submit"]').click();

    // Verify goal was created
    cy.contains('Learn React Testing').should('be.visible');
    cy.contains('Goal created successfully').should('be.visible');

    // Step 3: Navigate to challenges and start one
    cy.contains('Challenges').click();

    // Look for available challenges
    cy.get('[data-testid="challenge-card"]')
      .first()
      .within(() => {
        // Verify challenge card displays correctly
        cy.get('[data-testid="challenge-title"]').should('be.visible');
        cy.get('[data-testid="challenge-status"]').should(
          'contain',
          'Available'
        );

        // Start the challenge
        cy.contains('Start Challenge').click();
      });

    // Step 4: Complete challenge submission
    cy.url().should('include', '/challenges/');

    // Fill out challenge submission (this would depend on challenge type)
    cy.get('textarea[name="solution"]').type(
      'This is my solution to the challenge'
    );
    cy.get('input[type="file"]').selectFile('cypress/fixtures/sample-file.txt');

    // Submit the challenge
    cy.contains('Submit Solution').click();

    // Verify submission success
    cy.contains('Solution submitted successfully').should('be.visible');

    // Step 5: Verify progress updates
    cy.contains('Progress').click();

    // Check that progress page shows updated statistics
    cy.get('[data-testid="progress-stats"]').within(() => {
      cy.contains('Challenges Completed: 1').should('be.visible');
    });

    // Verify progress bar or charts are visible
    cy.get('[data-testid="progress-tracker"]').should('be.visible');
    cy.get('[data-testid="progress-charts"]').should('be.visible');

    // Step 6: Verify challenge status changed to completed
    cy.contains('Challenges').click();

    cy.get('[data-testid="challenge-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="challenge-status"]').should(
          'contain',
          'Completed'
        );
        cy.contains('View Results').should('be.visible');
      });
  });

  it('handles authentication errors gracefully', () => {
    cy.contains('Login').click();

    // Try invalid credentials
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();

    // Verify error message appears
    cy.contains('Invalid credentials').should('be.visible');
    cy.url().should('include', '/login');
  });

  it('protects routes requiring authentication', () => {
    // Try to access protected route without login
    cy.visit('http://localhost:3000/dashboard');

    // Should redirect to login
    cy.url().should('include', '/login');
    cy.contains('Please log in').should('be.visible');
  });

  it('displays challenge cards with correct information', () => {
    // Login first
    cy.contains('Login').click();
    cy.get('input[type="email"]').type('test@example.com');
    cy.get('input[type="password"]').type('Password123');
    cy.get('button[type="submit"]').click();

    // Navigate to challenges
    cy.contains('Challenges').click();

    // Verify challenge cards display required information
    cy.get('[data-testid="challenge-card"]').should('have.length.at.least', 1);

    cy.get('[data-testid="challenge-card"]')
      .first()
      .within(() => {
        cy.get('[data-testid="challenge-title"]').should('not.be.empty');
        cy.get('[data-testid="challenge-description"]').should('not.be.empty');
        cy.get('[data-testid="challenge-status"]').should('not.be.empty');
        cy.get('[data-testid="challenge-difficulty"]').should('not.be.empty');
        cy.get('[data-testid="challenge-points"]').should('not.be.empty');
      });
  });
});

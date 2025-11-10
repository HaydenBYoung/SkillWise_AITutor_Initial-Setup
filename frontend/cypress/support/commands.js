// Custom commands for SkillWise E2E tests

// Login command
Cypress.Commands.add('login', (email, password) => {
  cy.visit('/login');
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="login-button"]').click();
  cy.url().should('include', '/dashboard');
});

// Register command
Cypress.Commands.add('register', (email, password, firstName, lastName) => {
  cy.visit('/register');
  cy.get('[data-cy="email-input"]').type(email);
  cy.get('[data-cy="password-input"]').type(password);
  cy.get('[data-cy="first-name-input"]').type(firstName);
  cy.get('[data-cy="last-name-input"]').type(lastName);
  cy.get('[data-cy="register-button"]').click();
  cy.url().should('include', '/dashboard');
});

// Create goal command
Cypress.Commands.add('createGoal', (title, description, category, difficulty) => {
  cy.get('[data-cy="goals-nav"]').click();
  cy.get('[data-cy="create-goal-button"]').click();
  cy.get('[data-cy="goal-title-input"]').type(title);
  cy.get('[data-cy="goal-description-input"]').type(description);
  cy.get('[data-cy="goal-category-select"]').select(category);
  cy.get('[data-cy="goal-difficulty-select"]').select(difficulty);
  cy.get('[data-cy="goal-date-input"]').type('2025-12-31');
  cy.get('[data-cy="create-goal-submit"]').click();
});

// Add challenge command
Cypress.Commands.add('addChallenge', (goalTitle, challengeTitle, description, difficulty, estimatedTime) => {
  cy.contains(goalTitle).parent().find('[data-cy="view-goal-button"]').click();
  cy.get('[data-cy="add-challenge-button"]').click();
  cy.get('[data-cy="challenge-title-input"]').type(challengeTitle);
  cy.get('[data-cy="challenge-description-input"]').type(description);
  cy.get('[data-cy="challenge-difficulty-select"]').select(difficulty);
  cy.get('[data-cy="challenge-time-input"]').type(estimatedTime.toString());
  cy.get('[data-cy="add-challenge-submit"]').click();
});

// Complete challenge command
Cypress.Commands.add('completeChallenge', (challengeTitle, submission) => {
  cy.contains(challengeTitle).parent().find('[data-cy="complete-challenge-button"]').click();
  cy.get('[data-cy="submission-textarea"]').type(submission);
  cy.get('[data-cy="submit-challenge-button"]').click();
});

// Check progress command
Cypress.Commands.add('checkProgress', (expectedPoints, expectedChallenges, expectedGoals) => {
  cy.get('[data-cy="progress-nav"]').click();
  cy.get('[data-cy="earned-points"]').should('contain', expectedPoints.toString());
  cy.get('[data-cy="completed-challenges"]').should('contain', expectedChallenges.toString());
  cy.get('[data-cy="total-goals"]').should('contain', expectedGoals.toString());
});

// Clear test data command (for backend)
Cypress.Commands.add('clearTestData', () => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/api/test/clear-data`,
    failOnStatusCode: false
  });
});
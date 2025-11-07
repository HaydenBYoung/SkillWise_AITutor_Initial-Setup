// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add(
  'login',
  (email = 'test@example.com', password = 'password123') => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();

    // Wait for successful login redirect
    cy.url().should('not.include', '/login');
    cy.window().its('localStorage.token').should('exist');
  }
);

// Custom command for creating a goal
Cypress.Commands.add('createGoal', (goalData) => {
  const defaultGoal = {
    title: 'Test Goal',
    description: 'A test goal for Cypress',
    category: 'Frontend',
    target_date: '2024-12-31',
    ...goalData,
  };

  cy.visit('/goals');
  cy.get('[data-testid="create-goal-button"]').click();

  cy.get('[data-testid="goal-title-input"]').type(defaultGoal.title);
  cy.get('[data-testid="goal-description-input"]').type(
    defaultGoal.description
  );
  cy.get('[data-testid="goal-category-select"]').select(defaultGoal.category);
  cy.get('[data-testid="goal-target-date-input"]').type(
    defaultGoal.target_date
  );

  cy.get('[data-testid="save-goal-button"]').click();

  // Wait for goal to be created
  cy.contains(defaultGoal.title).should('be.visible');
});

// Custom command for adding a challenge
Cypress.Commands.add('addChallenge', (challengeData) => {
  const defaultChallenge = {
    title: 'Test Challenge',
    description: 'A test challenge for Cypress',
    difficulty: 'medium',
    ...challengeData,
  };

  cy.visit('/challenges');
  cy.get('[data-testid="create-challenge-button"]').click();

  cy.get('[data-testid="challenge-title-input"]').type(defaultChallenge.title);
  cy.get('[data-testid="challenge-description-input"]').type(
    defaultChallenge.description
  );
  cy.get('[data-testid="challenge-difficulty-select"]').select(
    defaultChallenge.difficulty
  );

  cy.get('[data-testid="save-challenge-button"]').click();

  // Wait for challenge to be created
  cy.contains(defaultChallenge.title).should('be.visible');
});

// Custom command to mark goal as complete
Cypress.Commands.add('markGoalComplete', (goalTitle) => {
  cy.visit('/goals');
  cy.contains(goalTitle)
    .parent()
    .within(() => {
      cy.get('[data-testid="mark-complete-button"]').click();
    });

  // Wait for completion confirmation
  cy.contains('completed').should('be.visible');
});

// Custom command to mark challenge as complete
Cypress.Commands.add('markChallengeComplete', (challengeTitle) => {
  cy.visit('/challenges');
  cy.contains(challengeTitle)
    .parent()
    .within(() => {
      cy.get('[data-testid="complete-challenge-button"]').click();
    });

  // Wait for completion confirmation
  cy.contains('completed').should('be.visible');
});

// Custom command to check progress
Cypress.Commands.add('checkProgress', () => {
  cy.visit('/progress');
  cy.get('[data-testid="progress-tracker"]').should('be.visible');
  cy.get('[data-testid="progress-charts"]').should('be.visible');
});

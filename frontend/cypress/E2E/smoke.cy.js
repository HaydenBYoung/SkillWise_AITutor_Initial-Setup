/* global Cypress */
// First attempt at smoke test below
// Note: avoid importing from 'cypress' or 'react' in E2E specs — Cypress provides `cy`/`Cypress` globals.

describe('Smoke Test: Login → Create Goal → Add Challenge → Complete', () => {
  const email = Cypress.env('TEST_USER_EMAIL') || 'testuser@example.com';
  const password = Cypress.env('TEST_USER_PASSWORD') || 'Password123!';
  const goalTitle = 'Learn React';
  const challengeTitle = 'Complete first component';

  it('Logs in successfully', () => {
    cy.visit('/login');
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();
    cy.url().should('include', '/dashboard');
  });

  it('Creates a new goal', () => {
    cy.visit('/goals');
    cy.get('[data-testid="create-goal-button"]').click();
    cy.get('[data-testid="goal-title-input"]').type(goalTitle);
    cy.get('[data-testid="goal-submit-button"]').click();
    cy.contains(goalTitle).should('exist');
  });

  it('Adds a challenge to the goal', () => {
    cy.contains(goalTitle).click();
    cy.get('[data-testid="add-challenge-button"]').click();
    cy.get('[data-testid="challenge-title-input"]').type(challengeTitle);
    cy.get('[data-testid="challenge-submit-button"]').click();
    cy.contains(challengeTitle).should('exist');
  });

  it('Marks the challenge as complete', () => {
    cy.contains(challengeTitle)
      .parents('[data-testid="challenge-card"]')
      .find('[data-testid="complete-button"]')
      .click();
    cy.contains('Completed').should('exist');
  });
});

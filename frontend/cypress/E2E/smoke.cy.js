//First attempt at smoke test below
import {} from 'react';
import { cy, it, describe } from 'cypress';

describe('Smoke Test: Login → Create Goal → Add Challenge → Complete', () => {
  const email = 'testuser@example.com';
  const password = 'Password123!';
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

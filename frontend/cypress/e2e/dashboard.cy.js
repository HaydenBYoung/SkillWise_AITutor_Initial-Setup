/* global cy, describe, it */

describe('Dashboard E2E', () => {
  it('shows the three stat cards and grid layout', () => {
    cy.visit('/dashboard');

    cy.contains('Goals Completed').should('be.visible');
    cy.contains('Challenges Completed').should('be.visible');
    cy.contains('Current Streak').should('be.visible');

    // Verify the stats container has the Tailwind 3-column class
    cy.get('.grid-cols-3').should('exist');
  });
});

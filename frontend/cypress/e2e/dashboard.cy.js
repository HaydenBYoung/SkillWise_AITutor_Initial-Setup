/* global cy, describe, it */

describe('Dashboard E2E', () => {
  beforeEach(() => {
    // Stub profile and set fake token so ProtectedRoute allows access
    cy.intercept('GET', '/api/users/profile', {
      statusCode: 200,
      body: { id: 1, firstName: 'Test', lastName: 'User' },
    }).as('getProfile');
    cy.visit('/dashboard', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', 'test-token');
      },
    });
  });

  it('shows the three stat cards and grid layout', () => {
    cy.contains('Goals Completed').should('be.visible');
    cy.contains('Challenges Completed').should('be.visible');
    cy.contains('Current Streak').should('be.visible');

    // Verify the stats container has the Tailwind 3-column class
    cy.get('.grid-cols-3').should('exist');
  });
});

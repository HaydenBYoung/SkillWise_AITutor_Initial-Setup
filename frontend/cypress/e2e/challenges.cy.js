describe('Challenges flows', () => {
  beforeEach(() => {
    // Ensure challenges page loads with sample challenges (mocked)
    // Provide a fake auth token and stub the profile request so ProtectedRoute allows access
    cy.intercept('GET', '/api/users/profile', {
      statusCode: 200,
      body: { id: 1, firstName: 'Test', lastName: 'User' },
    }).as('getProfile');
    cy.visit('/challenges', {
      onBeforeLoad(win) {
        // set the access token the app expects
        win.localStorage.setItem('access_token', 'test-token');
      },
    });
  });

  it('marks a challenge complete and persists after undo window', () => {
    cy.intercept('POST', '/api/progress/event', {
      statusCode: 200,
      body: { success: true },
    }).as('track');

    cy.clock();
    cy.contains('Mark Complete').first().click();

    // Undo button should appear
    cy.contains('Undo').should('exist');

    // Advance time past the undo window (5s)
    cy.tick(5000);

    // Should have sent the persistence request
    cy.wait('@track').its('response.statusCode').should('eq', 200);
  });

  it('allows Undo to cancel persistence', () => {
    cy.intercept('POST', '/api/progress/event', {
      statusCode: 200,
      body: { success: true },
    }).as('track');

    cy.clock();
    cy.contains('Mark Complete').first().click();
    cy.contains('Undo').click();

    // Advance time; since we undid, no request should be made
    cy.tick(5000);

    // The alias should have no matching requests
    cy.get('@track.all').should('have.length', 0);
  });
});

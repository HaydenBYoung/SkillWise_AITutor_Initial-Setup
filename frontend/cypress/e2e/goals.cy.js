describe('Goals flows', () => {
  it('creates a new goal and shows it in the list', () => {
    // Stub profile and set fake token so ProtectedRoute allows access
    cy.intercept('GET', '/api/users/profile', {
      statusCode: 200,
      body: { id: 1, firstName: 'Test', lastName: 'User' },
    }).as('getProfile');
    cy.intercept('GET', '/api/goals', {
      statusCode: 200,
      body: { goals: [] },
    }).as('getGoals');
    cy.intercept('POST', '/api/goals', {
      statusCode: 201,
      body: { goal: { id: 101, title: 'Cypress Goal' } },
    }).as('createGoal');

    cy.visit('/goals', {
      onBeforeLoad(win) {
        win.localStorage.setItem('access_token', 'test-token');
      },
    });

    cy.wait('@getGoals');

    cy.get('input[placeholder="Ex: Learn React Hooks"]').type('Cypress Goal');
    cy.get('textarea[placeholder="Describe your goal..."]').type(
      'Testing via Cypress'
    );
    cy.contains('Create Goal').click();

    cy.wait('@createGoal');
    cy.contains('Cypress Goal').should('exist');
  });
});

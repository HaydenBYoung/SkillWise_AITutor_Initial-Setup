describe('Goals flows', () => {
  it('creates a new goal and shows it in the list', () => {
    cy.intercept('GET', '/api/goals', { statusCode: 200, body: { goals: [] } }).as('getGoals');
    cy.intercept('POST', '/api/goals', { statusCode: 201, body: { goal: { id: 101, title: 'Cypress Goal' } } }).as('createGoal');

    cy.visit('/goals');
    cy.wait('@getGoals');

    cy.get('input[placeholder="Ex: Learn React Hooks"]').type('Cypress Goal');
    cy.get('textarea[placeholder="Describe your goal..."]').type('Testing via Cypress');
    cy.contains('Create Goal').click();

    cy.wait('@createGoal');
    cy.contains('Cypress Goal').should('exist');
  });
});

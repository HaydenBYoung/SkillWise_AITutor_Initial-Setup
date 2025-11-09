describe('Auth flows', () => {
  it('logs in and navigates to dashboard', () => {
    cy.intercept('POST', '/api/auth/login', {
      statusCode: 200,
      body: { user: { id: 1, email: 'test@example.com' }, accessToken: 'test-token' },
      headers: { 'set-cookie': 'refreshToken=abc; HttpOnly' },
    }).as('login');

    cy.visit('/login');
    cy.get('#email').type('test@example.com');
    cy.get('#password').type('password123');
    cy.contains('Sign In').click();

    // fast-forward confetti timeout
    cy.clock();
    cy.tick(1600);

    cy.wait('@login').its('response.statusCode').should('eq', 200);
    cy.url().should('include', '/dashboard');
  });
});

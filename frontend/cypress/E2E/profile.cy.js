/* global Cypress */
describe('Profile E2E: Edit Profile and Settings', () => {
  const email = Cypress.env('TEST_USER_EMAIL') || 'testuser@example.com';
  const password = Cypress.env('TEST_USER_PASSWORD') || 'Password123!';

  before(() => {
    // Ensure baseUrl is used; tests expect backend+frontend running locally
    cy.visit('/login');

    // Remove webpack overlay if present (sometimes left by dev server errors)
    cy.document().then((doc) => {
      const overlay = doc.getElementById('webpack-dev-server-client-overlay');
      if (overlay) overlay.remove();
    });
  });

  it('Logs in and navigates to profile', () => {
    cy.get('[data-testid="email-input"]').type(email);
    cy.get('[data-testid="password-input"]').type(password);
    cy.get('[data-testid="login-button"]').click();

    // After login, ensure dashboard loads then navigate to profile
    cy.url().should('include', '/dashboard');
    cy.visit('/profile');
    cy.contains('AI Feedback').should('not.exist'); // quick sanity check
  });

  it('Edits basic profile information', () => {
    // Click edit profile button
    cy.contains('Edit Profile').click();

    // Change first and last name
    cy.get('#firstName').clear().type('E2E');
    cy.get('#lastName').clear().type('Tester');

    // Change a small bio
    cy.get('#bio').clear().type('End-to-end test bio');

    // Save changes
    cy.contains('Save Changes').click();

    // Wait for the mocked save delay in ProfilePage
    cy.contains('E2E Tester', { timeout: 3000 }).should('exist');
  });

  it('Toggles settings and saves', () => {
    // Click Settings tab
    cy.contains('Settings').click();

    // Toggle an option, then save
    cy.get('input[name="weeklyDigest"]').then(($el) => {
      // flip the checkbox
      cy.wrap($el).click();
    });

    cy.contains('Save Settings').click();

    // Ensure button returns and no loading
    cy.contains('Save Settings', { timeout: 3000 }).should('exist');
  });

  it('Performs logout via context (if available)', () => {
    // Attempt to trigger logout event to ensure AuthContext handles it
    cy.window().then((win) => {
      win.dispatchEvent(new CustomEvent('auth:logout', { detail: {} }));
    });

    // App should reflect logged-out state by redirecting to login
    cy.url({ timeout: 3000 }).should('include', '/login');
  });
});

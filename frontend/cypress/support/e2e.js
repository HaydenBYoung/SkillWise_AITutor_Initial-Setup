// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands';

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Prevent Cypress from failing on uncaught exceptions that might occur in React
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing on React development warnings
  if (err.message.includes('ResizeObserver loop limit exceeded')) {
    return false;
  }
  // returning false here prevents Cypress from
  // failing the test on uncaught exceptions
  return false;
});

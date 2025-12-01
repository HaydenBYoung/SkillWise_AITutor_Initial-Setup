// ***********************************************
// This example commands.js shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************

// Custom command for login
Cypress.Commands.add('login', (email, password) => {
  cy.request('POST', 'http://localhost:3001/api/auth/login', {
    email,
    password,
  }).then((response) => {
    window.localStorage.setItem('accessToken', response.body.accessToken);
  });
});

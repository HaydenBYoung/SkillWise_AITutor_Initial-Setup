const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    // Match the e2e spec files location used in this project
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    // We don't need a support file for these simple tests, keep config minimal
    supportFile: false,
    // Default baseUrl; in CI the workflow overrides this via --config
    baseUrl: 'http://localhost:3000',
    // Reduce default test flakiness instrumentation in CI
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 800,
    setupNodeEvents(on, config) {
      // no-op for now; add plugins or custom reporters here if needed
      return config;
    },
  },
});

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents(on, config) {
      // You can register custom tasks or reporters here
    },
    video: false,
    screenshotOnRunFailure: true,
  },
});

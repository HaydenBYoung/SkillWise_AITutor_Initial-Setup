import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    setupNodeEvents() {
      // You can register custom tasks or reporters here
    },
    video: false,
    screenshotOnRunFailure: true,
  },
});

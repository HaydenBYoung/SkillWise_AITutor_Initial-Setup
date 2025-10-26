// TODO: Implement challenges API integration tests
const request = require('supertest');
const app = require('../../src/app');
const { clearTestData, usingMongoForTests } = require('../setup');

describe('Challenges API Integration', () => {
  let authToken;

  beforeEach(async () => {
    // Ensure tests run against a clean Mongo test DB
    await clearTestData();
    // TODO: Set up authenticated user and token
  });

  describe('GET /api/challenges', () => {
    test('should return available challenges', async () => {
      // TODO: Implement test
      expect(true).toBe(true);
    });
  });

  describe('GET /api/challenges/:id', () => {
    test('should return specific challenge', async () => {
      // TODO: Implement test
      expect(true).toBe(true);
    });
  });

  // TODO: Add more integration test cases
});

module.exports = {};

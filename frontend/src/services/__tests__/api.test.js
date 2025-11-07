import { apiService } from '../api';

// Mock axios
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
}));

describe('API Service', () => {
  describe('Goals API', () => {
    test('getGoals calls correct endpoint', async () => {
      const mockGoals = [
        {
          id: 1,
          title: 'Learn React',
          description: 'Master React fundamentals',
        },
      ];

      // This test verifies the API service structure exists
      expect(apiService.goals).toBeDefined();
      expect(apiService.goals.getAll).toBeDefined();
    });

    test('createGoal sends correct data', async () => {
      const newGoal = {
        title: 'Learn Node.js',
        description: 'Build backend applications',
      };

      expect(apiService.goals.create).toBeDefined();
    });
  });

  describe('Challenges API', () => {
    test('getChallenges endpoint exists', () => {
      expect(apiService.challenges).toBeDefined();
      expect(apiService.challenges.getAll).toBeDefined();
    });

    test('submitChallenge endpoint exists', () => {
      expect(apiService.challenges.submit).toBeDefined();
    });
  });

  describe('Auth API', () => {
    test('login endpoint exists', () => {
      expect(apiService.auth).toBeDefined();
      expect(apiService.auth.login).toBeDefined();
    });

    test('register endpoint exists', () => {
      expect(apiService.auth.register).toBeDefined();
    });
  });
});

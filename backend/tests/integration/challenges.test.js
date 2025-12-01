// TODO: Implement challenges API integration tests
const request = require('supertest');
const app = require('../../src/app');
const jwt = require('../../src/utils/jwt');
const Challenge = require('../../src/models/Challenge');

describe('Challenges API Integration', () => {
  let authToken;

  beforeEach(async () => {
    jest.restoreAllMocks();
    // Create a valid token for authentication
    authToken = jwt.generateToken({
      id: 'test-user',
      email: 'test@example.com',
      role: 'member',
    });
  });

  describe('GET /api/challenges', () => {
    test('should return available challenges', async () => {
      const sample = [
        { id: 'c1', title: 'Challenge 1' },
        { id: 'c2', title: 'Challenge 2' },
      ];
      jest.spyOn(Challenge, 'findAll').mockResolvedValue(sample);

      const res = await request(app)
        .get('/api/challenges')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    test('should filter by difficulty using findByDifficulty', async () => {
      const easy = [{ id: 'e1', difficulty_level: 'easy' }];
      jest.spyOn(Challenge, 'findByDifficulty').mockResolvedValue(easy);

      const res = await request(app)
        .get('/api/challenges')
        .query({ difficulty: 'easy' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(easy);
    });

    test('should support search query filtering client-side', async () => {
      const all = [
        { id: 's1', title: 'Binary Search', description: 'search algorithm' },
        { id: 's2', title: 'Sorting', description: 'sort stuff' },
      ];
      jest.spyOn(Challenge, 'findAll').mockResolvedValue(all);

      const res = await request(app)
        .get('/api/challenges')
        .query({ search: 'search' })
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(1);
      expect(res.body.data[0].id).toBe('s1');
    });
  });

  describe('GET /api/challenges/:id', () => {
    test('should return specific challenge', async () => {
      const challenge = { id: 'c1', title: 'Challenge 1' };
      // Mock Challenge.findById to return challenge with id
      jest.spyOn(Challenge, 'findById').mockResolvedValue(challenge);

      const res = await request(app)
        .get('/api/challenges/c1')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toBeDefined();
      // The id should be present in the response
      expect(res.body.data.id || res.body.data.challenge_id).toBeDefined();
    });

    test('should return 404 when challenge not found', async () => {
      jest.spyOn(Challenge, 'findById').mockResolvedValue(null);

      const res = await request(app)
        .get('/api/challenges/notfound')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);

      expect(res.body.success).toBe(false);
    });
  });
});

module.exports = {};

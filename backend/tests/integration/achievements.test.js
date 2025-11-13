const request = require('supertest');
const app = require('../../src/app');
const db = require('../../src/database/connection');

// Mock database
jest.mock('../../src/database/connection');

// Mock JWT utils with proper module factory
jest.mock('../../src/utils/jwt', () => {
  return {
    verifyToken: jest.fn().mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    }),
  };
});

describe('Achievements API Integration', () => {
  const baseUrl = '/api/achievements';
  let authToken;

  beforeEach(() => {
    jest.clearAllMocks();
    authToken = 'test.jwt.token';
    // Reset all mock implementations to their defaults
    require('../../src/utils/jwt').verifyToken.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    });
  });

  describe('GET /achievements', () => {
    const sampleAchievements = [
      {
        id: 1,
        key: 'first-steps',
        title: 'First Steps',
        description: 'Started your journey',
        points: 10,
      },
      {
        id: 2,
        key: 'level-up',
        title: 'Level Up',
        description: 'Reached level 2',
        points: 20,
      },
    ];

    it('should return all achievements when authenticated', async () => {
      // Mock DB response
      db.query.mockResolvedValueOnce({ rows: sampleAchievements });

      const res = await request(app)
        .get(baseUrl)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('achievements');
      expect(res.body.achievements).toHaveLength(2);
      expect(res.body.achievements[0]).toHaveProperty('key', 'first-steps');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get(baseUrl);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /achievements/user/progress', () => {
    const sampleUserAchievements = [
      {
        id: 1,
        key: 'first-steps',
        title: 'First Steps',
        description: 'Started your journey',
        points: 10,
        achieved_at: new Date().toISOString(),
      },
    ];

    it('should return user achievements when authenticated', async () => {
      // Mock DB response for joined query
      db.query.mockResolvedValueOnce({
        rows: [
          {
            id: 1,
            key: 'first-steps',
            title: 'First Steps',
            description: 'Started your journey',
            points: 10,
            achieved_at: new Date().toISOString(),
          },
        ],
      });

      const res = await request(app)
        .get(`${baseUrl}/user/progress`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('achievements');
      expect(res.body.achievements).toHaveLength(1);
      expect(res.body.achievements[0]).toHaveProperty('achieved_at');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get(`${baseUrl}/user/progress`);

      expect(res.status).toBe(401);
    });
  });

  describe('GET /achievements/:id', () => {
    const sampleAchievement = {
      id: 1,
      key: 'first-steps',
      title: 'First Steps',
      description: 'Started your journey',
      points: 10,
    };

    it('should return a specific achievement when authenticated', async () => {
      // Mock DB response
      db.query.mockResolvedValueOnce({ rows: [sampleAchievement] });

      const res = await request(app)
        .get(`${baseUrl}/1`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('achievement');
      expect(res.body.achievement).toHaveProperty('id', 1);
    });

    it('should return 404 for non-existent achievement', async () => {
      // Mock empty DB response
      db.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .get(`${baseUrl}/999`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(404);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toContain('not found');
    });

    it('should reject unauthenticated requests', async () => {
      const res = await request(app).get(`${baseUrl}/1`);

      expect(res.status).toBe(401);
    });
  });

  if (process.env.NODE_ENV === 'development') {
    describe('POST /achievements/dev/trigger/:id', () => {
      it('should trigger achievement in development mode', async () => {
        // Mock DB query for inserting achievement
        db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

        const res = await request(app)
          .post(`${baseUrl}/dev/trigger/1`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('message', 'Achievement awarded');
      });

      it('should reject invalid achievement ID', async () => {
        // Mock DB error for non-existent achievement
        db.query.mockRejectedValueOnce(new Error('Achievement not found'));

        const res = await request(app)
          .post(`${baseUrl}/dev/trigger/999`)
          .set('Authorization', `Bearer ${authToken}`);

        expect(res.status).toBe(404);
      });
    });
  }
});

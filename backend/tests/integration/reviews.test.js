// Peer review integration tests
const request = require('supertest');
const jwt = require('../../src/utils/jwt');

// Create mock functions for the peer review controller before the app is required
const mockGetReviewAssignments = jest.fn();
const mockSubmitReview = jest.fn();
const mockGetReceivedReviews = jest.fn();
const mockGetReviewHistory = jest.fn();

jest.mock('../../src/controllers/peerReviewController', () => ({
  getReviewAssignments: (req, res, next) =>
    mockGetReviewAssignments(req, res, next),
  submitReview: (req, res, next) => mockSubmitReview(req, res, next),
  getReceivedReviews: (req, res, next) =>
    mockGetReceivedReviews(req, res, next),
  getReviewHistory: (req, res, next) => mockGetReviewHistory(req, res, next),
}));

const app = require('../../src/app');

describe('Peer Review Integration', () => {
  let authToken;
  let reviewerToken;

  beforeEach(async () => {
    jest.clearAllMocks();
    // create two tokens to represent two different authenticated users
    authToken = jwt.generateToken({
      id: 'user1',
      email: 'user1@test.com',
      role: 'member',
    });
    reviewerToken = jwt.generateToken({
      id: 'user2',
      email: 'user2@test.com',
      role: 'member',
    });
  });

  describe('GET /api/reviews/assignments', () => {
    test('should return review assignments for user', async () => {
      const assignments = [
        { id: 'a1', submissionId: 's1', revieweeId: 'user3' },
        { id: 'a2', submissionId: 's2', revieweeId: 'user4' },
      ];

      mockGetReviewAssignments.mockImplementation((req, res) => {
        return res.status(200).json({ success: true, data: assignments });
      });

      const res = await request(app)
        .get('/api/reviews/assignments')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBe(2);
      expect(mockGetReviewAssignments).toHaveBeenCalled();
    });
  });

  describe('POST /api/reviews', () => {
    test('should submit peer review', async () => {
      const newReview = {
        id: 'r1',
        submissionId: 's1',
        reviewerId: 'user2',
        revieweeId: 'user1',
        score: 4,
        comments: 'Nice work',
      };

      mockSubmitReview.mockImplementation((req, res) => {
        // basic assertion inside mock to ensure request body arrives
        if (!req.body || !req.body.submissionId) {
          return res
            .status(400)
            .json({ success: false, message: 'Invalid payload' });
        }
        return res.status(201).json({ success: true, data: newReview });
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ submissionId: 's1', score: 4, comments: 'Nice work' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('r1');
      expect(mockSubmitReview).toHaveBeenCalled();
    });

    test('returns 400 when payload is invalid', async () => {
      mockSubmitReview.mockImplementation((req, res) => {
        if (!req.body || !req.body.submissionId) {
          return res
            .status(400)
            .json({ success: false, message: 'Invalid payload' });
        }
        return res.status(201).json({ success: true });
      });

      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${reviewerToken}`)
        .send({ score: 3 })
        .expect(400);

      expect(res.body.success).toBe(false);
      expect(res.body.message).toMatch(/Invalid payload/);
    });
  });

  // Three additional peer review integration test cases
  test('GET /api/reviews/received returns received reviews for a user', async () => {
    const received = [{ id: 'r1', reviewerId: 'user2', score: 4 }];

    mockGetReceivedReviews.mockImplementation((req, res) => {
      return res.status(200).json({ success: true, data: received });
    });

    const res = await request(app)
      .get('/api/reviews/received')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data[0].reviewerId).toBe('user2');
  });

  test('GET /api/reviews/history returns user review history', async () => {
    const history = [{ id: 'h1', submissionId: 's1', score: 5 }];

    mockGetReviewHistory.mockImplementation((req, res) => {
      return res.status(200).json({ success: true, data: history });
    });

    const res = await request(app)
      .get('/api/reviews/history')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
    expect(res.body.data[0].submissionId).toBe('s1');
  });
});

module.exports = {};

const request = require('supertest');
const app = require('../../src/app');
const jwt = require('../../src/utils/jwt');

const peerReviewService = require('../../src/services/peerReviewService');

describe('Peer Review E2E Controller Tests', () => {
  let authToken;

  beforeEach(async () => {
    jest.restoreAllMocks();
    authToken = jwt.generateToken({ id: 'reviewer1', email: 'r1@test.com', role: 'member' });
  });

  test('GET /api/reviews/assignments returns pending reviews', async () => {
    const rows = [{ id: 1, submission_id: 's1' }, { id: 2, submission_id: 's2' }];
    jest.spyOn(peerReviewService, 'getPendingReviews').mockResolvedValue(rows);

    const res = await request(app)
      .get('/api/reviews/assignments')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(2);
  });

  test('POST /api/reviews creates a review', async () => {
    const created = { id: 3, reviewer_id: 'reviewer1', submission_id: 's10', review_text: 'Nice' };
    jest.spyOn(peerReviewService, 'createReview').mockResolvedValue(created);

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ submissionId: 's10', reviewText: 'Nice', revieweeId: 'user1' })
      .expect(201);

    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(3);
  });

  test('GET /api/reviews/received returns received reviews for user', async () => {
    const rows = [{ id: 3, reviewer_id: 'r2', submission_id: 's10' }];
    const PeerReview = require('../../src/models/PeerReview');
    jest.spyOn(PeerReview, 'findByRevieweeId').mockResolvedValue(rows);

    const token = jwt.generateToken({ id: 'user1', email: 'user1@test.com', role: 'member' });
    const res = await request(app)
      .get('/api/reviews/received')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });

  test('GET /api/reviews/history returns reviewer history', async () => {
    const rows = [{ id: 5, submission_id: 's1' }];
    jest.spyOn(peerReviewService, 'getReviewsByReviewer').mockResolvedValue(rows);

    const res = await request(app)
      .get('/api/reviews/history')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBe(1);
  });
});


module.exports = {};

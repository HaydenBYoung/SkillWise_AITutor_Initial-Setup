const request = require('supertest');
const jwt = require('../../src/utils/jwt');
const { testPool, clearTestData } = require('../setup');

// Ensure DB URL is set to test DB prior to requiring app
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
const app = require('../../src/app');

const Submission = require('../../src/models/Submission');
const PeerReview = require('../../src/models/PeerReview');

describe('Peer Review DB Integration', () => {
  beforeEach(async () => {
    // Ensure a clean DB state
    await clearTestData();
  });

  afterEach(async () => {
    await clearTestData();
  });

  test('Reviewer can see assigned review and complete it; reviewee sees received review', async () => {
    // Create reviewee and reviewer
    const r1 = await testPool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      ['reviewee@test.com', 'hash', 'Reviewee', 'User', 'student'],
    );
    const r2 = await testPool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      ['reviewer@test.com', 'hash', 'Reviewer', 'User', 'student'],
    );
    const reviewee = r1.rows[0];
    const reviewer = r2.rows[0];

    // Create a challenge
    const ch = await testPool.query(
      'INSERT INTO challenges (title, description, instructions, category, difficulty_level, requires_peer_review, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      ['Peer Review Challenge', 'desc', 'do this', 'algorithms', 'Intermediate', true, reviewer.id],
    );
    const challenge = ch.rows[0];

    // Create submission by the reviewee
    const submission = await Submission.create({
      user_id: reviewee.id,
      challenge_id: challenge.id,
      submission_text: 'Sample submission for peer review',
    });

    // Create an assigned pending peer review for reviewer
    const pr = await PeerReview.create({
      reviewer_id: reviewer.id,
      reviewee_id: reviewee.id,
      submission_id: submission.id,
      review_text: 'Assigned',
      is_completed: false,
    });

    // Generate tokens
    const reviewerToken = jwt.generateToken({ id: reviewer.id, email: reviewer.email, role: 'student' });
    const revieweeToken = jwt.generateToken({ id: reviewee.id, email: reviewee.email, role: 'student' });

    // Reviewer sees assignment
    const resQueue = await request(app)
      .get('/api/peer-review/queue')
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(200);
    expect(resQueue.body.success).toBe(true);
    expect(Array.isArray(resQueue.body.data)).toBe(true);
    expect(resQueue.body.data.length).toBeGreaterThanOrEqual(1);

    // Reviewer completes the review using PUT + rating
    const resUpdate = await request(app)
      .put(`/api/peer-review/${pr.id}`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ reviewText: 'Nice job, consider edge cases', rating: 4, isCompleted: true })
      .expect(200);

    expect(resUpdate.body.success).toBe(true);
    expect(resUpdate.body.data.rating).toBe(4);

    // Verify submission details include the review
    const resDetails = await request(app)
      .get(`/api/peer-review/submissions/${submission.id}`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .expect(200);
    expect(resDetails.body.success).toBe(true);
    expect(Array.isArray(resDetails.body.data.reviews)).toBe(true);
    expect(resDetails.body.data.reviews.length).toBeGreaterThanOrEqual(1);

    // Reviewee can fetch received reviews
    const resReceived = await request(app)
      .get('/api/peer-review/received')
      .set('Authorization', `Bearer ${revieweeToken}`)
      .expect(200);
    expect(resReceived.body.success).toBe(true);
    expect(Array.isArray(resReceived.body.data)).toBe(true);
    const found = resReceived.body.data.find((r) => r.id === pr.id);
    expect(found).toBeDefined();
    expect(found.rating).toBe(4);
  });

  test('Reviewer can create a review via POST and it is visible to reviewee', async () => {
    await clearTestData();
    const r1 = await testPool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      ['new_reviewee@test.com', 'hash', 'Reviewee2', 'User', 'student'],
    );
    const r2 = await testPool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      ['new_reviewer@test.com', 'hash', 'Reviewer2', 'User', 'student'],
    );
    const reviewee = r1.rows[0];
    const reviewer = r2.rows[0];

    const ch = await testPool.query(
      'INSERT INTO challenges (title, description, instructions, category, difficulty_level, requires_peer_review, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *',
      ['Peer Review Create', 'desc', 'do this', 'algorithms', 'Intermediate', true, reviewer.id],
    );
    const challenge = ch.rows[0];

    const submission = await Submission.create({
      user_id: reviewee.id,
      challenge_id: challenge.id,
      submission_text: 'Sample submission to be posted review',
    });

    const reviewerToken = jwt.generateToken({ id: reviewer.id, email: reviewer.email, role: 'student' });
    const revieweeToken = jwt.generateToken({ id: reviewee.id, email: reviewee.email, role: 'student' });

    // Post review
    const resPost = await request(app)
      .post(`/api/peer-review/submissions/${submission.id}/review`)
      .set('Authorization', `Bearer ${reviewerToken}`)
      .send({ reviewText: 'A new review', rating: 5, revieweeId: reviewee.id, isCompleted: true })
      .expect(201);
    expect(resPost.body.success).toBe(true);
    expect(resPost.body.data).toHaveProperty('id');

    // Reviewee fetch received reviews
    const resReceived2 = await request(app)
      .get('/api/peer-review/received')
      .set('Authorization', `Bearer ${revieweeToken}`)
      .expect(200);
    expect(resReceived2.body.success).toBe(true);
    const created = resReceived2.body.data.find((r) => r.review_text === 'A new review');
    expect(created).toBeDefined();
    expect(created.rating).toBe(5);
  });
});

module.exports = {};

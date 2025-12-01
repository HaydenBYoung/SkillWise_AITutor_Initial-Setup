const request = require('supertest');
const app = require('../../src/app');
const jwt = require('../../src/utils/jwt');

const Submission = require('../../src/models/Submission');
const Challenge = require('../../src/models/Challenge');
const progressService = require('../../src/services/progressService');
const aiService = require('../../src/services/aiService');

describe('Submissions API Integration', () => {
  let studentToken;
  let instructorToken;

  beforeEach(async () => {
    jest.restoreAllMocks();
    studentToken = jwt.generateToken({ id: '1', email: 's1@example.com', role: 'student' });
    instructorToken = jwt.generateToken({ id: '10', email: 'i1@example.com', role: 'instructor' });
  });

  describe('POST /api/challenges/:id/submit', () => {
    test('should submit a challenge work as student', async () => {
      const sample = { id: 'sub1', user_id: '1', challenge_id: '1', submission_text: 'answer' };
      jest.spyOn(Submission, 'create').mockResolvedValue(sample);
      jest.spyOn(Submission, 'findByUserId').mockResolvedValue([]);
      jest.spyOn(Challenge, 'findById').mockResolvedValue({ id: '1', max_attempts: 0 });

      jest.spyOn(aiService, 'generateFeedback').mockResolvedValue({ id: 1, submission_id: 'sub1', feedback_text: 'Good work' });
      const res = await request(app)
        .post('/api/challenges/1/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ submission_text: 'answer' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.feedback).toBeDefined();
    });

    test('should prevent submission when challenge not found', async () => {
      // We'll simulate Challenge.findById as null to make submission reject in service
      jest.spyOn(Challenge, 'findById').mockResolvedValue(null);
      jest.spyOn(Submission, 'findByUserId').mockResolvedValue([]);

      const res = await request(app)
        .post('/api/challenges/999/submit')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ submission_text: 'answer' })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('POST /api/submissions', () => {
    test('should submit via unified endpoint with challenge_id in body', async () => {
      const sample = { id: 'sub2', user_id: '1', challenge_id: '1', submission_text: 'answer2' };
      jest.spyOn(Submission, 'create').mockResolvedValue(sample);
      jest.spyOn(Submission, 'findByUserId').mockResolvedValue([]);
      jest.spyOn(Challenge, 'findById').mockResolvedValue({ id: '1', max_attempts: 0 });

      jest.spyOn(aiService, 'generateFeedback').mockResolvedValue({ id: 2, submission_id: 'sub2', feedback_text: 'Nice work' });
      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ challenge_id: '1', submission_text: 'answer2' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.feedback).toBeDefined();
    });

    test('should reject when max attempts exceeded', async () => {
      jest.spyOn(Submission, 'findByUserId').mockResolvedValue([{ id: 'old1', attempt_number: 1, challenge_id: '1' }]);
      jest.spyOn(Challenge, 'findById').mockResolvedValue({ id: '1', max_attempts: 1 });

      const res = await request(app)
        .post('/api/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ challenge_id: '1', submission_text: 'answer3' })
        .expect(500);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/submissions/:id', () => {
    test('owner should fetch own submission', async () => {
      const found = { id: 's1', user_id: '1', submission_text: 'my code' };
      jest.spyOn(Submission, 'findById').mockResolvedValue(found);

      const res = await request(app)
        .get('/api/submissions/s1')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe('s1');
    });

    test('instructor should fetch any submission', async () => {
      const found = { id: 's2', user_id: '1', submission_text: 'student code' };
      jest.spyOn(Submission, 'findById').mockResolvedValue(found);

      const res = await request(app)
        .get('/api/submissions/s2')
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('non-owner student should be forbidden', async () => {
      const found = { id: 's3', user_id: '1', submission_text: 'student code' };
      jest.spyOn(Submission, 'findById').mockResolvedValue(found);

      const token = jwt.generateToken({ id: '2', email: 's2@example.com', role: 'student' });
      const res = await request(app)
        .get('/api/submissions/s3')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/submissions/user/:userId', () => {
    test('owner fetches their submissions', async () => {
      const rows = [{ id: 's1' }, { id: 's2' }];
      jest.spyOn(Submission, 'findByUserId').mockResolvedValue(rows);

      const res = await request(app)
        .get('/api/submissions/user/1')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.length).toBe(2);
    });

    test('instructor can fetch other user submissions', async () => {
      const rows = [{ id: 's1' }];
      jest.spyOn(Submission, 'findByUserId').mockResolvedValue(rows);

      const res = await request(app)
        .get('/api/submissions/user/1')
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    test('other students cannot fetch another user submissions', async () => {
      const rows = [{ id: 's1' }];
      jest.spyOn(Submission, 'findByUserId').mockResolvedValue(rows);

      const token = jwt.generateToken({ id: '2', email: 's2@example.com', role: 'student' });
      const res = await request(app)
        .get('/api/submissions/user/1')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/challenges/:id/submissions', () => {
    test('instructor can list submissions for a challenge', async () => {
      const rows = [{ id: 's1' }, { id: 's2' }];
      jest.spyOn(Submission, 'findByChallengeId').mockResolvedValue(rows);

      const res = await request(app)
        .get('/api/challenges/1/submissions')
        .set('Authorization', `Bearer ${instructorToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('student cannot list challenge submissions', async () => {
      jest.spyOn(Submission, 'findByChallengeId').mockResolvedValue([]);

      const res = await request(app)
        .get('/api/challenges/1/submissions')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });

  describe('PUT /api/submissions/:id', () => {
    test('owner can update their submission text', async () => {
      const found = { id: 's4', user_id: '1', submission_text: 'old' };
      const updated = { id: 's4', user_id: '1', submission_text: 'updated' };
      jest.spyOn(Submission, 'findById').mockResolvedValue(found);
      jest.spyOn(Submission, 'update').mockResolvedValue(updated);

      const res = await request(app)
        .put('/api/submissions/s4')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ submission_text: 'updated' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.submission_text).toBe('updated');
    });

    test('owner cannot grade own submission (self-grade forbidden)', async () => {
      const found = { id: 's5', user_id: '1', submission_text: 'old' };
      jest.spyOn(Submission, 'findById').mockResolvedValue(found);

      const res = await request(app)
        .put('/api/submissions/s5')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({ score: 90 })
        .expect(403);

      expect(res.body.success).toBe(false);
    });

    test('instructor can grade and points are awarded', async () => {
      const found = { id: 's6', user_id: '1', challenge_id: 'c1' };
      const updated = { id: 's6', user_id: '1', score: 95, status: 'reviewed' };
      jest.spyOn(Submission, 'findById').mockResolvedValue(found);
      jest.spyOn(Challenge, 'findById').mockResolvedValue({ id: 'c1', points_reward: 100 });
      jest.spyOn(Submission, 'update').mockResolvedValue(updated);
      const trackSpy = jest.spyOn(progressService, 'trackEvent').mockResolvedValue({});

      const res = await request(app)
        .put('/api/submissions/s6')
        .set('Authorization', `Bearer ${instructorToken}`)
        .send({ score: 95 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(trackSpy).toHaveBeenCalled();
    });

    test('student cannot grade someone else submission', async () => {
      const found = { id: 's7', user_id: '1', challenge_id: 'c1' };
      jest.spyOn(Submission, 'findById').mockResolvedValue(found);

      const token = jwt.generateToken({ id: '2', role: 'student' });
      const res = await request(app)
        .put('/api/submissions/s7')
        .set('Authorization', `Bearer ${token}`)
        .send({ score: 45 })
        .expect(403);

      expect(res.body.success).toBe(false);
    });
  });
});

module.exports = {};

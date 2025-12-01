// Unit tests for challengeController
const challengeController = require('../../../src/controllers/challengeController');
const challengeService = require('../../../src/services/challengeService');

describe('ChallengeController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getChallenges', () => {
    test('should return challenges with filters', async () => {
      const sample = [{ id: 'c1', title: 'C1' }];
      jest.spyOn(challengeService, 'getChallenges').mockResolvedValue(sample);

      await challengeController.getChallenges(req, res, next);

      expect(challengeService.getChallenges).toHaveBeenCalledWith({
        difficulty: undefined,
        subject: undefined,
        search: undefined,
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: sample });
    });

    test('should call next on service error', async () => {
      const err = new Error('boom');
      jest.spyOn(challengeService, 'getChallenges').mockRejectedValue(err);

      await challengeController.getChallenges(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('getChallengeById', () => {
    test('returns challenge when found', async () => {
      req.params.id = 'c1';
      const challenge = { id: 'c1', title: 'C1' };
      jest.spyOn(challengeService, 'getById').mockResolvedValue(challenge);

      await challengeController.getChallengeById(req, res, next);

      expect(challengeService.getById).toHaveBeenCalledWith('c1', undefined);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: challenge });
    });

    test('returns 404 when not found', async () => {
      req.params.id = 'notfound';
      jest.spyOn(challengeService, 'getById').mockResolvedValue(null);

      await challengeController.getChallengeById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Challenge not found',
      });
    });
  });

  describe('createChallenge', () => {
    test('creates a challenge and returns 201', async () => {
      const payload = {
        title: 'New',
        description: 'd',
        instructions: 'i',
        category: 'cat',
      };
      req.body = payload;
      const created = { id: 'c-new', ...payload };
      jest
        .spyOn(challengeService, 'createChallenge')
        .mockResolvedValue(created);

      await challengeController.createChallenge(req, res, next);

      expect(challengeService.createChallenge).toHaveBeenCalledWith(payload);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
    });

    test('forwards errors to next', async () => {
      const err = new Error('create fail');
      jest.spyOn(challengeService, 'createChallenge').mockRejectedValue(err);
      req.body = { title: 'x' };

      await challengeController.createChallenge(req, res, next);
      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('updateChallenge', () => {
    test('updates challenge and returns 200', async () => {
      req.params.id = 'c1';
      req.body = { title: 'updated' };
      const updated = { id: 'c1', title: 'updated' };
      jest
        .spyOn(challengeService, 'updateChallenge')
        .mockResolvedValue(updated);

      await challengeController.updateChallenge(req, res, next);

      expect(challengeService.updateChallenge).toHaveBeenCalledWith(
        'c1',
        req.body
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updated });
    });

    test('returns 404 when not found', async () => {
      req.params.id = 'missing';
      jest.spyOn(challengeService, 'updateChallenge').mockResolvedValue(null);

      await challengeController.updateChallenge(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Challenge not found',
      });
    });
  });

  describe('deleteChallenge', () => {
    test('deletes challenge and returns 200', async () => {
      req.params.id = 'c-delete';
      const deleted = { id: 'c-delete' };
      jest
        .spyOn(challengeService, 'deleteChallenge')
        .mockResolvedValue(deleted);

      await challengeController.deleteChallenge(req, res, next);

      expect(challengeService.deleteChallenge).toHaveBeenCalledWith('c-delete');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: deleted });
    });

    test('returns 404 when not found', async () => {
      req.params.id = 'not-here';
      jest.spyOn(challengeService, 'deleteChallenge').mockResolvedValue(null);

      await challengeController.deleteChallenge(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Challenge not found',
      });
    });
  });
});

module.exports = {};

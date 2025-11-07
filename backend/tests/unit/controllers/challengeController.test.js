const challengeController = require('../../../src/controllers/challengeController');
const challengeService = require('../../../src/services/challengeService');

// Mock challenge service
jest.mock('../../../src/services/challengeService');

describe('ChallengeController', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      user: { id: 1, role: 'user' },
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getChallenges', () => {
    test('should return challenges with filters', async () => {
      const mockChallenges = [
        {
          id: 1,
          title: 'Build a React Component',
          difficulty: 'medium',
          category: 'Frontend',
          estimated_time: 30,
        },
        {
          id: 2,
          title: 'Create REST API',
          difficulty: 'hard',
          category: 'Backend',
          estimated_time: 60,
        },
      ];

      req.query = {
        difficulty: 'medium',
        category: 'Frontend',
      };

      challengeService.getChallenges.mockResolvedValue(mockChallenges);

      await challengeController.getChallenges(req, res, next);

      expect(challengeService.getChallenges).toHaveBeenCalledWith({
        category: 'Frontend',
        difficulty_level: 'medium',
        limit: undefined,
      });
      expect(res.json).toHaveBeenCalledWith({
        challenges: mockChallenges,
      });
    });

    test('should handle service errors', async () => {
      const error = new Error('Database error');
      challengeService.getChallenges.mockRejectedValue(error);

      await challengeController.getChallenges(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('createChallenge', () => {
    test('should create new challenge', async () => {
      req.validated = {
        title: 'New Challenge',
        description: 'Test description',
        difficulty: 'medium',
        category: 'Frontend',
        estimated_time: 45,
        points_reward: 100,
      };

      const mockChallenge = {
        id: 3,
        ...req.validated,
        created_at: new Date(),
      };

      challengeService.createChallenge.mockResolvedValue(mockChallenge);

      await challengeController.createChallenge(req, res, next);

      expect(challengeService.createChallenge).toHaveBeenCalledWith(
        req.validated,
        req.user.id
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        challenge: mockChallenge,
      });
    });

    test('should handle service errors', async () => {
      req.validated = { title: 'Test Challenge' };
      const error = new Error('Service error');
      challengeService.createChallenge.mockRejectedValue(error);

      await challengeController.createChallenge(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getChallengeById', () => {
    test('should return challenge by id', async () => {
      req.params.id = '1';
      const mockChallenge = {
        id: 1,
        title: 'Test Challenge',
        description: 'Challenge description',
        difficulty: 'medium',
      };

      challengeService.getChallengeById.mockResolvedValue(mockChallenge);

      await challengeController.getChallengeById(req, res, next);

      expect(challengeService.getChallengeById).toHaveBeenCalledWith('1');
      expect(res.json).toHaveBeenCalledWith({
        challenge: mockChallenge,
      });
    });

    test('should handle service errors', async () => {
      req.params.id = '999';
      const error = new Error('Challenge not found');
      challengeService.getChallengeById.mockRejectedValue(error);

      await challengeController.getChallengeById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateChallenge', () => {
    test('should update challenge', async () => {
      req.params.id = '1';
      req.validated = {
        title: 'Updated Challenge',
        difficulty: 'hard',
      };

      const mockUpdatedChallenge = {
        id: 1,
        title: 'Updated Challenge',
        difficulty: 'hard',
        updated_at: new Date(),
      };

      challengeService.updateChallenge.mockResolvedValue(mockUpdatedChallenge);

      await challengeController.updateChallenge(req, res, next);

      expect(challengeService.updateChallenge).toHaveBeenCalledWith(
        '1',
        req.validated,
        req.user.id
      );
      expect(res.json).toHaveBeenCalledWith({
        challenge: mockUpdatedChallenge,
      });
    });
  });

  describe('deleteChallenge', () => {
    test('should delete challenge', async () => {
      req.params.id = '1';

      challengeService.deleteChallenge.mockResolvedValue(true);

      await challengeController.deleteChallenge(req, res, next);

      expect(challengeService.deleteChallenge).toHaveBeenCalledWith(
        '1',
        req.user.id
      );
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });
  });
});

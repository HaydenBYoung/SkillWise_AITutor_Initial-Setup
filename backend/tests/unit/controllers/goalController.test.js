const goalController = require('../../../src/controllers/goalController');
const goalService = require('../../../src/services/goalService');

describe('GoalController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { params: {}, query: {}, body: {}, user: { id: 1 } };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getGoals', () => {
    test('should return user goals', async () => {
      const goals = [
        { id: 1, title: 'Goal 1', user_id: 1 },
        { id: 2, title: 'Goal 2', user_id: 1 },
      ];
      jest.spyOn(goalService, 'getUserGoals').mockResolvedValue(goals);

      await goalController.getGoals(req, res, next);

      expect(goalService.getUserGoals).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: goals });
    });

    test('should return 401 if user not authenticated', async () => {
      req.user = null;

      await goalController.getGoals(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Unauthorized',
      });
    });
  });

  describe('getGoalById', () => {
    test('should return goal by id', async () => {
      req.params.id = '1';
      const goal = { id: 1, title: 'Goal 1', user_id: 1 };
      jest.spyOn(goalService, 'getGoalById').mockResolvedValue(goal);

      await goalController.getGoalById(req, res, next);

      expect(goalService.getGoalById).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: goal });
    });

    test('should return 404 if goal not found', async () => {
      req.params.id = '999';
      jest.spyOn(goalService, 'getGoalById').mockResolvedValue(null);

      await goalController.getGoalById(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Goal not found',
      });
    });
  });

  describe('createGoal', () => {
    test('should create new goal', async () => {
      req.body = {
        title: 'New Goal',
        description: 'Goal description',
        difficulty: 'medium',
      };
      const createdGoal = { id: 3, ...req.body, user_id: 1 };
      jest.spyOn(goalService, 'createGoal').mockResolvedValue(createdGoal);

      await goalController.createGoal(req, res, next);

      expect(goalService.createGoal).toHaveBeenCalledWith(req.body, 1);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: createdGoal });
    });

    test('should return 401 if user not authenticated', async () => {
      req.user = null;
      req.body = { title: 'Goal' };

      await goalController.createGoal(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    test('should handle service errors', async () => {
      req.body = { title: 'Goal' };
      const error = new Error('Database error');
      jest.spyOn(goalService, 'createGoal').mockRejectedValue(error);

      await goalController.createGoal(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('updateGoal', () => {
    test('should update goal', async () => {
      req.params.id = '1';
      req.body = { title: 'Updated Goal' };
      const updatedGoal = { id: 1, title: 'Updated Goal', user_id: 1 };
      jest.spyOn(goalService, 'updateGoal').mockResolvedValue(updatedGoal);

      await goalController.updateGoal(req, res, next);

      expect(goalService.updateGoal).toHaveBeenCalledWith('1', req.body, 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: updatedGoal });
    });

    test('should return 404 if goal not found', async () => {
      req.params.id = '999';
      req.body = { title: 'Updated' };
      jest.spyOn(goalService, 'updateGoal').mockResolvedValue(null);

      await goalController.updateGoal(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });

  describe('deleteGoal', () => {
    test('should delete goal', async () => {
      req.params.id = '1';
      const deletedGoal = { id: 1, title: 'Deleted Goal' };
      jest.spyOn(goalService, 'deleteGoal').mockResolvedValue(deletedGoal);

      await goalController.deleteGoal(req, res, next);

      expect(goalService.deleteGoal).toHaveBeenCalledWith('1', 1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ success: true, data: deletedGoal });
    });

    test('should return 404 if goal not found', async () => {
      req.params.id = '999';
      jest.spyOn(goalService, 'deleteGoal').mockResolvedValue(null);

      await goalController.deleteGoal(req, res, next);

      expect(res.status).toHaveBeenCalledWith(404);
    });
  });
});

module.exports = {};

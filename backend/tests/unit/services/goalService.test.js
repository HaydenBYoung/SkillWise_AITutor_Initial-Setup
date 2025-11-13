// Implemented goal service unit tests
const goalService = require('../../../src/services/goalService');
const Goal = require('../../../src/models/Goal');

describe('GoalService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  describe('getUserGoals', () => {
    test('throws when no userId', async () => {
      await expect(goalService.getUserGoals()).rejects.toThrow(
        'User ID is required',
      );
    });

    test('returns array from model or empty array when null', async () => {
      jest.spyOn(Goal, 'findByUserId').mockResolvedValue([{ id: 1 }]);
      const res = await goalService.getUserGoals('u1');
      expect(Array.isArray(res)).toBe(true);
      expect(res.length).toBe(1);

      jest.spyOn(Goal, 'findByUserId').mockResolvedValue(null);
      const res2 = await goalService.getUserGoals('u1');
      expect(Array.isArray(res2)).toBe(true);
      expect(res2.length).toBe(0);
    });
  });

  describe('createGoal', () => {
    test('throws when no userId', async () => {
      await expect(goalService.createGoal({ title: 't' })).rejects.toThrow(
        'User ID is required',
      );
    });

    test('throws when title missing', async () => {
      await expect(
        goalService.createGoal({ description: 'x' }, 'u1'),
      ).rejects.toThrow('Goal title is required');
    });

    test('creates and returns created goal', async () => {
      const created = { id: 'g1', title: 'My Goal', user_id: 'u1' };
      jest.spyOn(Goal, 'create').mockResolvedValue(created);
      const res = await goalService.createGoal({ title: 'My Goal' }, 'u1');
      expect(res).toEqual(created);
    });
  });

  describe('getGoalById', () => {
    test('throws when no goalId', async () => {
      await expect(goalService.getGoalById()).rejects.toThrow(
        'Goal ID is required',
      );
    });

    test('returns null when not found', async () => {
      jest.spyOn(Goal, 'findById').mockResolvedValue(null);
      const res = await goalService.getGoalById('g1');
      expect(res).toBeNull();
    });

    test('returns null when user mismatch', async () => {
      jest
        .spyOn(Goal, 'findById')
        .mockResolvedValue({ id: 'g1', user_id: 'other' });
      const res = await goalService.getGoalById('g1', 'u1');
      expect(res).toBeNull();
    });

    test('returns goal when found and owner matches', async () => {
      const goal = { id: 'g1', user_id: 'u1' };
      jest.spyOn(Goal, 'findById').mockResolvedValue(goal);
      const res = await goalService.getGoalById('g1', 'u1');
      expect(res).toEqual(goal);
    });
  });

  describe('updateProgress', () => {
    test('updates progress and returns updated object', async () => {
      const updated = { id: 'g1', progress: 50 };
      jest.spyOn(Goal, 'update').mockResolvedValue(updated);
      const res = await goalService.updateProgress('g1', 50);
      expect(res).toEqual(updated);
    });
  });

  describe('updateGoal', () => {
    test('throws when no goalId', async () => {
      await expect(goalService.updateGoal()).rejects.toThrow(
        'Goal ID is required',
      );
    });

    test('returns null when not found', async () => {
      jest.spyOn(Goal, 'findById').mockResolvedValue(null);
      const res = await goalService.updateGoal('g1', { title: 'x' }, 'u1');
      expect(res).toBeNull();
    });

    test('returns null when user mismatch', async () => {
      jest
        .spyOn(Goal, 'findById')
        .mockResolvedValue({ id: 'g1', user_id: 'other' });
      const res = await goalService.updateGoal('g1', { title: 'x' }, 'u1');
      expect(res).toBeNull();
    });

    test('updates when owner matches', async () => {
      const existing = { id: 'g1', user_id: 'u1' };
      const updated = { id: 'g1', title: 'updated' };
      jest.spyOn(Goal, 'findById').mockResolvedValue(existing);
      jest.spyOn(Goal, 'update').mockResolvedValue(updated);
      const res = await goalService.updateGoal(
        'g1',
        { title: 'updated' },
        'u1',
      );
      expect(res).toEqual(updated);
    });
  });

  describe('deleteGoal', () => {
    test('throws when no goalId', async () => {
      await expect(goalService.deleteGoal()).rejects.toThrow(
        'Goal ID is required',
      );
    });

    test('returns null when not found', async () => {
      jest.spyOn(Goal, 'findById').mockResolvedValue(null);
      const res = await goalService.deleteGoal('g1', 'u1');
      expect(res).toBeNull();
    });

    test('returns null when user mismatch', async () => {
      jest
        .spyOn(Goal, 'findById')
        .mockResolvedValue({ id: 'g1', user_id: 'other' });
      const res = await goalService.deleteGoal('g1', 'u1');
      expect(res).toBeNull();
    });

    test('deletes when owner matches', async () => {
      const existing = { id: 'g1', user_id: 'u1' };
      const deleted = { id: 'g1', title: 'deleted' };
      jest.spyOn(Goal, 'findById').mockResolvedValue(existing);
      jest.spyOn(Goal, 'delete').mockResolvedValue(deleted);
      const res = await goalService.deleteGoal('g1', 'u1');
      expect(res).toEqual(deleted);
    });
  });

  describe('calculateCompletion', () => {
    test('returns 0 for falsy input', () => {
      expect(goalService.calculateCompletion(null)).toBe(0);
    });

    test('uses explicit progress and bounds between 0 and 100', () => {
      expect(goalService.calculateCompletion({ progress: 50 })).toBe(50);
      expect(goalService.calculateCompletion({ progress: 150 })).toBe(100);
      expect(goalService.calculateCompletion({ progress: -10 })).toBe(0);
    });

    test('returns 100 for completed status', () => {
      expect(goalService.calculateCompletion({ status: 'completed' })).toBe(
        100,
      );
      expect(goalService.calculateCompletion({ status: 'done' })).toBe(100);
    });
  });

  // Three extra related test cases
  test('getUserGoals should propagate model errors', async () => {
    jest.spyOn(Goal, 'findByUserId').mockRejectedValue(new Error('db error'));
    await expect(goalService.getUserGoals('u1')).rejects.toThrow('db error');
  });

  test('createGoal should propagate model errors', async () => {
    jest.spyOn(Goal, 'create').mockRejectedValue(new Error('insert failed'));
    await expect(goalService.createGoal({ title: 't' }, 'u1')).rejects.toThrow(
      'insert failed',
    );
  });

  test('updateProgress forwards update result even for zero', async () => {
    const updated = { id: 'g1', progress: 0 };
    jest.spyOn(Goal, 'update').mockResolvedValue(updated);
    const res = await goalService.updateProgress('g1', 0);
    expect(res).toEqual(updated);
  });
});

module.exports = {};

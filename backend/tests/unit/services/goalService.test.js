const goalService = require('../../../src/services/goalService');
const db = require('../../../src/database/connection');

// Mock database connection
jest.mock('../../../src/database/connection');

describe('GoalService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createGoal', () => {
    test('should create goal with valid data', async () => {
      const mockGoalData = {
        title: 'Learn React',
        description: 'Master React fundamentals',
        category: 'Frontend',
        target_completion_date: '2024-12-31',
        difficulty_level: 'medium',
      };
      const userId = 1;

      const mockResult = {
        rows: [
          {
            id: 1,
            user_id: userId,
            ...mockGoalData,
            is_completed: false,
            progress_percentage: 0,
            created_at: new Date(),
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await goalService.createGoal(mockGoalData, userId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO goals'),
        [
          userId,
          mockGoalData.title,
          mockGoalData.description,
          mockGoalData.category,
          'medium',
          mockGoalData.target_completion_date,
        ]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });

    test('should throw error with invalid data', async () => {
      db.query.mockRejectedValue(new Error('Database error'));

      await expect(goalService.createGoal(1, { title: '' })).rejects.toThrow(
        'Database error'
      );
    });
  });

  describe('getUserGoals', () => {
    test('should retrieve user goals', async () => {
      const mockGoals = [
        {
          id: 1,
          user_id: 1,
          title: 'Learn React',
          description: 'Master React fundamentals',
          is_completed: false,
          progress_percentage: 50,
        },
        {
          id: 2,
          user_id: 1,
          title: 'Learn Node.js',
          description: 'Backend development',
          is_completed: false,
          progress_percentage: 0,
        },
      ];

      db.query.mockResolvedValue({ rows: mockGoals });

      const result = await goalService.getUserGoals(1);

      expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'), [
        1,
      ]);
      expect(result).toEqual(mockGoals);
    });
  });

  describe('updateGoal', () => {
    test('should update goal successfully', async () => {
      const goalId = 1;
      const userId = 1;
      const updateData = {
        title: 'Updated Title',
        description: 'Updated Description',
        progress_percentage: 75,
      };

      const mockResult = {
        rows: [
          {
            id: goalId,
            ...updateData,
            user_id: userId,
            updated_at: new Date(),
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await goalService.updateGoal(goalId, updateData, userId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        [
          updateData.title,
          updateData.description,
          undefined,
          undefined,
          undefined,
          updateData.progress_percentage,
          goalId,
          userId,
        ]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });
  });

  describe('markCompleted', () => {
    test('should mark goal as completed', async () => {
      const goalId = 1;
      const userId = 1;

      const mockResult = {
        rows: [
          {
            id: goalId,
            is_completed: true,
            progress_percentage: 100,
            completion_date: new Date(),
            user_id: userId,
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await goalService.markCompleted(goalId, userId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE goals'),
        [goalId, userId]
      );
      expect(result).toEqual(mockResult.rows[0]);
    });
  });

  describe('deleteGoal', () => {
    test('should delete goal successfully', async () => {
      const goalId = 1;
      const userId = 1;

      const mockResult = {
        rows: [
          {
            id: goalId,
          },
        ],
      };

      db.query.mockResolvedValue(mockResult);

      const result = await goalService.deleteGoal(goalId, userId);

      expect(db.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'DELETE FROM goals WHERE id = $1 AND user_id = $2'
        ),
        [goalId, userId]
      );
      expect(result).toEqual({ success: true });
    });

    test('should throw error when goal not found', async () => {
      db.query.mockResolvedValue({ rows: [] });

      await expect(goalService.deleteGoal(999, 1)).rejects.toThrow(
        'Goal not found'
      );
    });
  });
});

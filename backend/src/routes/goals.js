const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const auth = require('../middleware/auth');
const validation = require('../middleware/validation');

// Get all goals for authenticated user
router.get('/', auth, goalController.getGoals);

// Get single goal by ID
router.get('/:id', auth, goalController.getGoalById);

// Create new goal
router.post('/', auth, validation.goalValidation, goalController.createGoal);

// Update existing goal
router.put('/:id', auth, validation.goalValidation, goalController.updateGoal);

// Delete goal
router.delete('/:id', auth, goalController.deleteGoal);

// Mark goal as completed
router.patch('/:id/complete', auth, goalController.markCompleted);

// Update goal progress
router.patch('/:id/progress', auth, goalController.updateProgress);

module.exports = router;

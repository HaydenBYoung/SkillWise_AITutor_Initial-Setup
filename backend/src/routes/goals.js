const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const auth = require('../middleware/auth');

// Get all goals for authenticated user
router.get('/', auth, goalController.getGoals);

// Get goal statistics
router.get('/statistics', auth, goalController.getGoalStatistics);

// Get single goal by ID
router.get('/:id', auth, goalController.getGoalById);

// Create new goal
router.post('/', auth, goalController.createGoal);

// Update existing goal
router.put('/:id', auth, goalController.updateGoal);

// Toggle goal completion status
router.patch('/:id/toggle-completion', auth, goalController.toggleGoalCompletion);

// Delete goal
router.delete('/:id', auth, goalController.deleteGoal);

module.exports = router;

// Goal routes (CRUD) — mounted under /api/goals
const express = require('express');
const router = express.Router();
const goalController = require('../controllers/goalController');
const auth = require('../middleware/auth');

// GET / - user goals
router.get('/', auth, goalController.getGoals);

// GET /:id - single goal
router.get('/:id', auth, goalController.getGoalById);

// POST /:id/complete - mark goal as complete and award points
router.post('/:id/complete', auth, goalController.completeGoal);

// POST / - create goal
router.post('/', auth, goalController.createGoal);

// PUT /:id - update goal
router.put('/:id', auth, goalController.updateGoal);

// DELETE /:id - delete goal
router.delete('/:id', auth, goalController.deleteGoal);

module.exports = router;

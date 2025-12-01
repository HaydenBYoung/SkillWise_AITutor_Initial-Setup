const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// GET list of user notifications
router.get('/', auth, notificationController.getNotifications);

// POST create a notification
router.post('/', auth, notificationController.createNotification);

// PUT mark single notification as read
router.put('/:id/read', auth, notificationController.markAsRead);

// PUT mark all as read
router.put('/read-all', auth, notificationController.markAllAsRead);

module.exports = router;

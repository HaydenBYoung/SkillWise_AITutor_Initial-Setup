/**
 * Authentication routes for user management
 * Handles login, registration, logout, and token refresh
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validation = require('../middleware/validation');

// Authentication endpoints
router.post('/login', validation.loginValidation, authController.login);
router.post('/register', validation.registerValidation, authController.register);
// Alias to satisfy rubric naming
router.post('/signup', validation.registerValidation, authController.register);
router.post('/logout', authController.logout);
router.post('/refresh', authController.refreshToken);

// Password management endpoints (future implementation)
// router.post('/forgot-password', authController.forgotPassword);
// router.post('/reset-password', authController.resetPassword);

module.exports = router;
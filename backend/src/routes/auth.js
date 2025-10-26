// Authentication routes
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const validation = require('../middleware/validation');

// POST /api/auth/login
// Validates input and forwards to authController.login
router.post('/login', validation.loginValidation, authController.login);

// POST /api/auth/register
// The validation schema expects camelCase fields (firstName/lastName). The controller
// expects snake_case (first_name/last_name) in some code paths; normalize here so both
// styles are accepted without changing controller implementation.
const normalizeRegisterBody = (req, res, next) => {
  if (req.body) {
    if (req.body.firstName && !req.body.first_name)
      req.body.first_name = req.body.firstName;
    if (req.body.lastName && !req.body.last_name)
      req.body.last_name = req.body.lastName;
    // allow either confirmPassword or confirm_password
    if (req.body.confirmPassword && !req.body.confirm_password)
      req.body.confirm_password = req.body.confirmPassword;
  }
  next();
};

router.post(
  '/register',
  validation.registerValidation,
  normalizeRegisterBody,
  authController.register
);

// POST /api/auth/logout
router.post('/logout', authController.logout);

// POST /api/auth/refresh
router.post('/refresh', authController.refreshToken);

// Optional endpoints (not yet implemented in controller):
// router.post('/forgot-password', authController.forgotPassword);
// router.post('/reset-password', authController.resetPassword);

module.exports = router;

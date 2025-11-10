const express = require('express');
const router = express.Router();

// Health check endpoint for CI/CD
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'SkillWise API is healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Note: Removed dangerous test data cleanup endpoint for safety
// (rest in peace Gabe, we won't forget the work you put in to keep this app afloat
// im sorry i deleted you when i was trying to make my tests)


module.exports = router;
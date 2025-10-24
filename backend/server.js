#!/usr/bin/env node
// Server entry point with graceful shutdown and error handling

const app = require('./src/app');
const logger = app.get('logger');
const db = require('./src/database/connection'); // Import your DB connection module

const PORT = process.env.PORT || 3001;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 SkillWise API Server running on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/healthz`);
  logger.info(`🌐 API endpoints available at http://localhost:${PORT}/api`);
  logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);

  // Check DB connection asynchronously
  db.query('SELECT NOW()')
    .then(result => {
      logger.info(`✅ Database connected: ${result.rows[0].now}`);
    })
    .catch(err => {
      logger.error('❌ Database connection failed:', err.message || err);
      logger.error(err.stack || '');
      process.exit(1);
    });
});  // <== This closes the app.listen callback function

// Graceful shutdown handling
const gracefulShutdown = (signal) => {
  logger.info(`📴 Received ${signal}. Starting graceful shutdown...`);
  
  server.close((err) => {
    if (err) {
      logger.error('❌ Error during server shutdown:', err);
      process.exit(1);
    }
    
    logger.info('✅ Server closed successfully');
    
    // Close database connections, cleanup resources, etc.
    // TODO: Add database connection cleanup if needed
    
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('⏰ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('💥 Uncaught Exception:', err);
  // Also log to stderr to avoid any transport issues
  try {
    // eslint-disable-next-line no-console
    console.error('Uncaught Exception stack:', err && err.stack ? err.stack : err);
  } catch (_) {}
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  try {
    // eslint-disable-next-line no-console
    console.error('Unhandled Rejection reason:', reason && reason.stack ? reason.stack : reason);
  } catch (_) {}
  process.exit(1);
});

module.exports = server;
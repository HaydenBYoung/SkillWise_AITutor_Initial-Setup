#!/usr/bin/env node
// TODO: Server entry point with graceful shutdown and error handling

const app = require('./src/app');
const logger = app.get('logger');

// Require Sentry so we can capture uncaught/unhandled exceptions from the
// process-level handlers. `app` initializes Sentry, so requiring here will
// reference the same client instance.
const Sentry = require('@sentry/node');

const PORT = process.env.PORT || 3001;

// Environment checks for OpenAI configuration in production-like environments
const nodeEnv = process.env.NODE_ENV || 'development';
if (['production', 'staging'].includes(nodeEnv)) {
  if (!process.env.OPENAI_API_KEY) {
    // Log a visible warning so deploys will notice missing credentials
    logger.warn(
      '⚠️ OPENAI_API_KEY is not set. AI features will fail if invoked.'
    );
  } else {
    logger.info(
      `✅ OPENAI_API_KEY detected. Using model: ${
        process.env.OPENAI_MODEL || 'gpt-3.5-turbo'
      }`
    );
  }

  if (!process.env.OPENAI_MODEL) {
    logger.info('ℹ️ OPENAI_MODEL not set; using default model.');
  }
}

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🚀 SkillWise API Server running on port ${PORT}`);
  logger.info(`📊 Health check available at http://localhost:${PORT}/healthz`);
  logger.info(`🌐 API endpoints available at http://localhost:${PORT}/api`);
  logger.info(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
});

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
    // TODO: Add database connection cleanup

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
process.on('uncaughtException', async (err) => {
  try {
    logger.error('💥 Uncaught Exception:', err);
    // Capture with Sentry if available
    if (Sentry && typeof Sentry.captureException === 'function') {
      Sentry.captureException(err);
      // attempt to flush events (timeout 2s) before exiting
      try {
        await Sentry.flush(2000);
      } catch (e) {
        // ignore flush errors
      }
    }
    // Also print to stdout/stderr so CI/terminals show the full stack
    try {
      console.error(
        'Uncaught Exception (stack):',
        err && err.stack ? err.stack : err
      );
    } catch (e) {
      console.error('Uncaught Exception (error):', err);
    }
  } finally {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason, promise) => {
  try {
    logger.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    if (Sentry && typeof Sentry.captureException === 'function') {
      Sentry.captureException(
        reason instanceof Error ? reason : new Error(String(reason))
      );
      try {
        await Sentry.flush(2000);
      } catch (e) {
        // ignore
      }
    }
    try {
      console.error(
        'Unhandled Rejection reason:',
        reason && reason.stack ? reason.stack : reason
      );
    } catch (e) {
      console.error('Unhandled Rejection reason (error):', reason);
    }
  } finally {
    process.exit(1);
  }
});

module.exports = server;

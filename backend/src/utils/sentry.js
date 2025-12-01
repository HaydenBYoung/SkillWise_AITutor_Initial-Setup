/**
 * Sentry Configuration for Backend
 * Story 3.8: Error tracking and monitoring
 */
const Sentry = require('@sentry/node');

const initSentry = () => {
  const sentryDsn = process.env.SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!sentryDsn) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,
    
    // Enable performance monitoring
    integrations: [
      // Enable HTTP calls tracing
      new Sentry.Integrations.Http({ tracing: true }),
      // Enable Express.js middleware tracing
      new Sentry.Integrations.Express({ app: true }),
    ],

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive headers
      if (event.request?.headers) {
        delete event.request.headers.authorization;
        delete event.request.headers.cookie;
      }

      // Remove sensitive body data
      if (event.request?.data) {
        if (typeof event.request.data === 'object') {
          delete event.request.data.password;
          delete event.request.data.token;
          delete event.request.data.apiKey;
        }
      }

      return event;
    },
  });

  console.log(`✅ Sentry initialized for ${environment} environment`);
};

// Error handler middleware
const sentryErrorHandler = () => {
  return Sentry.Handlers.errorHandler({
    shouldHandleError(error) {
      // Capture all errors with status code >= 500
      return true;
    },
  });
};

// Request handler middleware
const sentryRequestHandler = () => {
  return Sentry.Handlers.requestHandler();
};

// Tracing handler middleware
const sentryTracingHandler = () => {
  return Sentry.Handlers.tracingHandler();
};

// Capture exception manually
const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
};

// Capture message manually
const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
};

module.exports = {
  initSentry,
  sentryErrorHandler,
  sentryRequestHandler,
  sentryTracingHandler,
  captureException,
  captureMessage,
  Sentry,
};

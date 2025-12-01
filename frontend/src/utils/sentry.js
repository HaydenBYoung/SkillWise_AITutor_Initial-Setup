/**
 * Sentry Configuration for Frontend
 * Story 3.8: Error tracking and monitoring
 */
import * as Sentry from '@sentry/react';
import { createBrowserRouter } from 'react-router-dom';

export const initSentry = () => {
  const sentryDsn = process.env.REACT_APP_SENTRY_DSN;
  const environment = process.env.NODE_ENV || 'development';

  if (!sentryDsn) {
    console.warn('⚠️  Sentry DSN not configured. Error tracking disabled.');
    return;
  }

  Sentry.init({
    dsn: sentryDsn,
    environment,
    integrations: [
      new Sentry.BrowserTracing(),
      new Sentry.Replay({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],

    // Performance Monitoring
    tracesSampleRate: environment === 'production' ? 0.1 : 1.0,

    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Filter out sensitive data
    beforeSend(event, hint) {
      // Remove sensitive form data
      if (event.request?.data) {
        if (typeof event.request.data === 'object') {
          delete event.request.data.password;
          delete event.request.data.token;
        }
      }

      return event;
    },
  });

  console.log(`✅ Sentry initialized for ${environment} environment`);
};

// Create Sentry-wrapped router
export const createSentryRouter = (routes) => {
  const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createBrowserRouter);
  return sentryCreateBrowserRouter(routes);
};

// Capture exception manually
export const captureException = (error, context = {}) => {
  Sentry.captureException(error, {
    contexts: {
      custom: context,
    },
  });
};

// Capture message manually
export const captureMessage = (message, level = 'info', context = {}) => {
  Sentry.captureMessage(message, {
    level,
    contexts: {
      custom: context,
    },
  });
};

export default Sentry;

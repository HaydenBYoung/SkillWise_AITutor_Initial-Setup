// Lightweight Sentry wrapper to make client optional and safe in dev
import * as Sentry from '@sentry/react';

const isInitialized = Boolean(process.env.REACT_APP_SENTRY_DSN);

export function addBreadcrumb(breadcrumb) {
  if (isInitialized && typeof Sentry.addBreadcrumb === 'function') {
    Sentry.addBreadcrumb(breadcrumb);
  }
}

export function captureException(err) {
  if (isInitialized && typeof Sentry.captureException === 'function') {
    Sentry.captureException(err);
  } else {
    // Fallback for local dev/tests
    // eslint-disable-next-line no-console
    console.error('Captured exception (Sentry not configured):', err);
  }
}

export default Sentry;

// Lightweight Sentry wrapper to make client optional and safe in dev
let Sentry = null;
let isInitialized = false;

try {
  // Attempt to require so missing optional dependency doesn't break the app
  // (some test environments may not have the package installed)
  // eslint-disable-next-line global-require, import/no-dynamic-require
  Sentry = require('@sentry/react');
  isInitialized = Boolean(process.env.REACT_APP_SENTRY_DSN) && Sentry;
} catch (e) {
  // Sentry isn't available — use noop fallback
  Sentry = {
    addBreadcrumb: () => {},
    captureException: () => {},
  };
  isInitialized = false;
}

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

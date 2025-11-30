import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
let Sentry = null;
let BrowserTracing = null;
let SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || '';

try {
  // Attempt to require optional Sentry packages — guard so missing packages don't break E2E

  Sentry = require('@sentry/react');
  BrowserTracing = require('@sentry/tracing').BrowserTracing;

  if (SENTRY_DSN && Sentry && BrowserTracing) {
    Sentry.init({
      dsn: SENTRY_DSN,
      integrations: [new BrowserTracing()],
      tracesSampleRate: 0.0,
      environment: process.env.NODE_ENV || 'development',
    });
  } else {
    // eslint-disable-next-line no-console
    console.info('Sentry not configured or optional packages unavailable');
  }
} catch (e) {
  // If Sentry is not installed in this environment, keep a noop Sentry
  // eslint-disable-next-line no-console
  console.info('Optional Sentry packages not available in this environment');
  Sentry = null;
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
    {Sentry ? (
      <Sentry.ErrorBoundary
        fallback={({ error, componentStack, resetError }) => (
          <div style={{ padding: 24 }}>
            <h2>Something went wrong.</h2>
            <details style={{ whiteSpace: 'pre-wrap' }}>
              {String(error)}
              {componentStack}
            </details>
            <button onClick={resetError} style={{ marginTop: 12 }}>
              Try again
            </button>
          </div>
        )}
      >
        <App />
      </Sentry.ErrorBoundary>
    ) : (
      <App />
    )}
  </StrictMode>
);

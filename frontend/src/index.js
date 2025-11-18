import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';

// Use CRA environment variable naming convention
const SENTRY_DSN = process.env.REACT_APP_SENTRY_DSN || '';

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    integrations: [new BrowserTracing()],
    // Keep traces disabled by default; enable only for performance testing
    tracesSampleRate: 0.0,
    environment: process.env.NODE_ENV || 'development',
  });
} else {
  // No-op: Sentry will not send events when DSN is not configured
  // Useful for local development where developers don't want production telemetry
  // eslint-disable-next-line no-console
  console.info('Sentry not configured (REACT_APP_SENTRY_DSN not set)');
}

const container = document.getElementById('root');
const root = createRoot(container);

root.render(
  <StrictMode>
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
  </StrictMode>
);

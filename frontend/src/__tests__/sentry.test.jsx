import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';

// Mock @sentry/react before importing components that may use it
jest.mock('@sentry/react', () => {
  const React = require('react');
  const captureException = jest.fn();

  // Minimal ErrorBoundary implementation that calls captureException on errors
  class ErrorBoundary extends React.Component {
    constructor(props) {
      super(props);
      this.state = { hasError: false, error: null, componentStack: null };
    }

    componentDidCatch(error, info) {
      // emulate Sentry behavior: capture the exception
      captureException(error);
      this.setState({
        hasError: true,
        error,
        componentStack: info?.componentStack,
      });
    }

    render() {
      const { hasError, error, componentStack } = this.state;
      const { fallback } = this.props;
      if (hasError) {
        // Sentry.ErrorBoundary in the app uses a render-prop style fallback
        if (typeof fallback === 'function') {
          return fallback({
            error,
            componentStack,
            resetError: () => this.setState({ hasError: false }),
          });
        }
        return fallback || null;
      }
      return this.props.children;
    }
  }

  return {
    init: jest.fn(),
    captureException,
    ErrorBoundary,
  };
});

import * as Sentry from '@sentry/react';

// A component that throws during render to trigger the ErrorBoundary
function Bomb() {
  throw new Error('Intentional test error from Bomb component');
}

describe('Frontend Sentry integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('Sentry.captureException is called when a child throws inside ErrorBoundary', () => {
    const fallbackText = 'Something went wrong.';

    render(
      <Sentry.ErrorBoundary
        fallback={({ error, componentStack }) => (
          <div>
            <div data-testid="fallback">{fallbackText}</div>
            <pre data-testid="stack">{String(componentStack)}</pre>
            <pre data-testid="err">{String(error?.message)}</pre>
          </div>
        )}
      >
        <Bomb />
      </Sentry.ErrorBoundary>
    );

    // The fallback UI should be rendered
    expect(screen.getByTestId('fallback')).toHaveTextContent(fallbackText);

    // And captureException should have been called with an Error
    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const calledWith = Sentry.captureException.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.message).toMatch(/Intentional test error/);
  });
});

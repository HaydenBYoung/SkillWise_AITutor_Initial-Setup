import React from 'react';
import * as Sentry from '@sentry/react';
import './ErrorBoundary.css';

/**
 * Error Boundary Component
 * Story 3.8: User-friendly error handling with Sentry integration
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary-container">
          <div className="error-boundary-content">
            <div className="error-icon">⚠️</div>
            <h1>Oops! Something went wrong</h1>
            <p className="error-message">
              We're sorry for the inconvenience. An unexpected error has occurred.
            </p>
            <p className="error-detail">
              Our team has been notified and is working to fix the issue.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="error-details">
                <summary>Error Details (Development Only)</summary>
                <pre className="error-stack">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div className="error-actions">
              <button onClick={this.handleReload} className="error-btn-primary">
                Reload Page
              </button>
              <button onClick={this.handleGoHome} className="error-btn-secondary">
                Go to Homepage
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// HOC to wrap components with error boundary
export const withErrorBoundary = (Component, options = {}) => {
  return (props) => (
    <ErrorBoundary {...options}>
      <Component {...props} />
    </ErrorBoundary>
  );
};

export default ErrorBoundary;

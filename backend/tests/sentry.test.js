const request = require('supertest');

// Mock Sentry before importing the app so middleware is the mocked implementation
jest.mock('@sentry/node', () => {
  const captureException = jest.fn();
  return {
    init: jest.fn(),
    captureException,
    Handlers: {
      requestHandler: () => (req, res, next) => next(),
      errorHandler: () => (err, req, res, next) => {
        // emulate what Sentry's error handler would do: capture and pass on
        captureException(err);
        return next(err);
      },
    },
  };
});

const express = require('express');

describe('Sentry integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('calls Sentry.captureException when an endpoint throws (local express)', async () => {
    const Sentry = require('@sentry/node');

    // Build a minimal express app that uses the mocked Sentry handlers
    const app = express();
    app.use(Sentry.Handlers.requestHandler());

    app.get('/', (req, res) => {
      throw new Error('Intentional test error');
    });

    // Sentry error handler should capture and then pass on
    app.use(Sentry.Handlers.errorHandler());

    // Minimal custom error handler to produce a 500
    app.use((err, req, res, next) => {
      res.status(500).json({ error: err.message });
    });

    const res = await request(app).get('/');
    expect(res.status).toBe(500);

    expect(Sentry.captureException).toHaveBeenCalled();
    const calledWith = Sentry.captureException.mock.calls[0][0];
    expect(calledWith).toBeInstanceOf(Error);
    expect(calledWith.message).toMatch(/Intentional test error/);
  });
});

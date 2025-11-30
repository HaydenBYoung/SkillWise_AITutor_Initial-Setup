#!/usr/bin/env node
/**
 * Sentry smoke test script
 * Usage:
 *   SENTRY_DSN=<dsn> node scripts/sentry_smoke.js
 *   or
 *   node scripts/sentry_smoke.js <dsn>
 *
 * The script initializes @sentry/node with the provided DSN, sends a test
 * message and flushes the SDK. It exits with code 0 on success and non-zero
 * on failure. If DSN is the literal string `MOCK`, the script will simulate
 * success without making network requests (useful for CI dry-runs).
 */

const Sentry = require('@sentry/node');

async function main() {
  const argDsn = process.argv[2];
  const envDsn = process.env.SENTRY_DSN || process.env.SENTRY_TEST_DSN;
  const dsn = argDsn || envDsn;

  if (!dsn) {
    console.error('No DSN provided. Set SENTRY_DSN or pass as first arg.');
    process.exitCode = 2;
    return;
  }

  if (dsn === 'MOCK') {
    console.log(
      'MOCK DSN provided — simulating successful Sentry initialization.'
    );
    console.log('✅ Sentry smoke test (mock) passed');
    process.exitCode = 0;
    return;
  }

  try {
    Sentry.init({ dsn, tracesSampleRate: 0 });
    console.log('Sentry initialized with DSN:', dsn);

    // Send a test message and flush
    Sentry.captureMessage('Sentry smoke test – captureMessage');

    // Wait for flush (timeout 5s)
    const ok = await Sentry.flush(5000);
    if (ok) {
      console.log('✅ Sentry smoke test succeeded (flush OK)');
      process.exitCode = 0;
    } else {
      console.error('❌ Sentry smoke test failed (flush returned false)');
      process.exitCode = 3;
    }
  } catch (err) {
    console.error(
      '❌ Sentry smoke test encountered an error:',
      err.message || err
    );
    process.exitCode = 4;
  }
}

main();

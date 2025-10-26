// TODO: Test environment setup and configuration
const { Pool } = require('pg');
// Support skipping DB checks or using a Mongo-based TEST_DATABASE_URL for unit tests.
const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL || '';

let testPool = null;
let usingPostgresForTests = false;

if (
  !process.env.SKIP_DB_CHECKS &&
  TEST_DATABASE_URL &&
  !TEST_DATABASE_URL.startsWith('mongodb')
) {
  // Configure Postgres only when TEST_DATABASE_URL is for Postgres
  usingPostgresForTests = true;
  const testDbConfig = {
    connectionString:
      TEST_DATABASE_URL ||
      'postgresql://skillwise_user:skillwise_pass@localhost:5432/skillwise_test_db',
    // Reduce connections for test environment
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 1000,
  };
  testPool = new Pool(testDbConfig);
}

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';

  // Test database connection (skip if using Mongo or SKIP_DB_CHECKS is set)
  if (!usingPostgresForTests) {
    console.log(
      'ℹ️ Skipping Postgres test DB connection (using Mongo or SKIP_DB_CHECKS)'
    );
    return;
  }

  try {
    await testPool.query('SELECT 1');
    console.log('✅ Test database connected');
  } catch (err) {
    console.error('❌ Test database connection failed:', err.message);
    throw err;
  }
});

// Global test cleanup
afterAll(async () => {
  try {
    // Clean up test data if needed
    // await testPool.query('TRUNCATE TABLE users CASCADE');

    // Close database connections (if used)
    if (usingPostgresForTests && testPool) {
      await testPool.end();
      console.log('✅ Test database cleanup completed');
    }
  } catch (err) {
    console.error('❌ Test cleanup failed:', err.message);
  }
});

// Helper function to clear test data between tests
const clearTestData = async () => {
  const tables = [
    'user_achievements',
    'achievements',
    'leaderboard',
    'progress_events',
    'peer_reviews',
    'ai_feedback',
    'submissions',
    'challenges',
    'goals',
    'refresh_tokens',
    'users',
  ];

  for (const table of tables) {
    try {
      await testPool.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE`);
    } catch (err) {
      // Table might not exist, continue
      console.warn(`Warning: Could not truncate table ${table}:`, err.message);
    }
  }
};

// Export test utilities
module.exports = {
  testPool,
  clearTestData,
};

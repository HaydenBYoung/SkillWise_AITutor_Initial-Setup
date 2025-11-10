// TODO: Test environment setup and configuration
const { Pool } = require('pg');

// Test database configuration
const testDbConfig = {
  connectionString: process.env.TEST_DATABASE_URL ||
    'postgresql://skillwise_user:skillwise_pass@localhost:5433/skillwise_db',
  // Reduce connections for test environment
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 1000,
};

const testPool = new Pool(testDbConfig);

// Global test setup
beforeAll(async () => {
  // Set test environment
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-testing-only';

  // Test database connection
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
    // ONLY close database connections - NO DATA DELETION EVER!
    await testPool.end();
    console.log('✅ Test database cleanup completed');
  } catch (err) {
    console.error('❌ Test cleanup failed:', err.message);
  }
});

// Export test utilities - NO DATABASE CLEARING FUNCTIONS
module.exports = {
  testPool,
  // NO DATABASE CLEARING FUNCTIONS - Use the delete account API if tests need cleanup
};

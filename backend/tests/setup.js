// Test environment setup and configuration (Mongo-friendly)
// This setup will:
// - Use POSTGRES tests if TEST_DATABASE_URL is Postgres,
// - Use Mongo tests if TEST_DATABASE_URL starts with 'mongodb' or process.env.MONGO_URL is set,
// - Export clearTestData() to clear the test DB between tests.

require('dotenv').config();
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');

const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  process.env.MONGO_URL ||
  process.env.DATABASE_URL ||
  '';

// Flags and clients
let usingPostgresForTests = false;
let usingMongoForTests = false;

let testPool = null;
let mongoClient = null;
let mongoDb = null;

// If TEST_DATABASE_URL looks like Postgres (starts with 'postgres' or 'postgresql')
if (
  !process.env.SKIP_DB_CHECKS &&
  TEST_DATABASE_URL &&
  !TEST_DATABASE_URL.startsWith('mongodb')
) {
  usingPostgresForTests = true;
  const testDbConfig = {
    connectionString:
      TEST_DATABASE_URL ||
      'postgresql://skillwise_user:skillwise_pass@localhost:5432/skillwise_test_db',
    max: 5,
    idleTimeoutMillis: 10000,
    connectionTimeoutMillis: 1000,
  };
  testPool = new Pool(testDbConfig);
} else if (TEST_DATABASE_URL && TEST_DATABASE_URL.startsWith('mongodb')) {
  usingMongoForTests = true;
}

// Global test setup
beforeAll(async () => {
  // Ensure test env
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET =
    process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only';
  process.env.JWT_REFRESH_SECRET =
    process.env.JWT_REFRESH_SECRET ||
    'test-refresh-secret-key-for-testing-only';

  if (usingPostgresForTests) {
    try {
      await testPool.query('SELECT 1');
      console.log('✅ Test Postgres database connected');
    } catch (err) {
      console.error('❌ Test Postgres DB connection failed:', err.message);
      throw err;
    }
    return;
  }

  if (usingMongoForTests) {
    try {
      mongoClient = new MongoClient(TEST_DATABASE_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      await mongoClient.connect();
      // If DB name is not included in URL, fall back to 'skillwise_test_db'
      const url = new URL(TEST_DATABASE_URL);
      const pathname = url.pathname && url.pathname.replace(/^\//, '');
      const dbName =
        pathname || process.env.MONGO_DB_NAME || 'skillwise_test_db';
      mongoDb = mongoClient.db(dbName);
      console.log('✅ Test MongoDB connected:', dbName);
    } catch (err) {
      console.error('❌ Test MongoDB connection failed:', err.message);
      throw err;
    }
    return;
  }

  // If neither configured, skip DB checks (use in-memory/mocks)
  console.log(
    'ℹ️ Skipping DB checks for tests (no TEST_DATABASE_URL configured)'
  );
});

// Global test cleanup
afterAll(async () => {
  try {
    if (usingPostgresForTests && testPool) {
      await testPool.end();
      console.log('✅ Test Postgres pool closed');
    }
    if (usingMongoForTests && mongoClient) {
      await mongoClient.close();
      console.log('✅ Test Mongo client closed');
    }
  } catch (err) {
    console.error('❌ Test cleanup failed:', err.message);
  }
});

// Helper function to clear test data between tests
const clearTestData = async () => {
  // Collections / tables relevant to auth flow
  const collections = [
    'users',
    'refresh_tokens',
    'submissions',
    'challenges',
    'goals',
    'peer_reviews',
    'ai_feedback',
    'progress_events',
    'leaderboard',
    'achievements',
  ];

  if (usingPostgresForTests && testPool) {
    for (const t of collections) {
      try {
        await testPool.query(`TRUNCATE TABLE ${t} RESTART IDENTITY CASCADE`);
      } catch (err) {
        // Table might not exist; ignore
        // console.warn(`Warning: Could not truncate ${t}: ${err.message}`);
      }
    }
    return;
  }

  if (usingMongoForTests && mongoDb) {
    for (const col of collections) {
      try {
        // If collection exists, remove documents
        const collection = mongoDb.collection(col);
        await collection.deleteMany({});
      } catch (err) {
        // Collection might not exist yet; that's fine
        // console.warn(`Warning: Could not clear collection ${col}: ${err.message}`);
      }
    }
    return;
  }

  // If no DB configured, nothing to do
};

module.exports = {
  testPool,
  clearTestData,
  usingPostgresForTests,
  usingMongoForTests,
  mongoClient,
  mongoDb,
};

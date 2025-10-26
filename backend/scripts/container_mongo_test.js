#!/usr/bin/env node
// Quick connectivity test script for running inside the backend container
(async function () {
  try {
    const { MongoClient } = require('mongodb');
    const url =
      process.env.TEST_DATABASE_URL ||
      'mongodb://mongodb:27017/skillwise_test_db';
    const client = await MongoClient.connect(url, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MONGO CONNECT OK', url);
    await client.close();
    process.exit(0);
  } catch (err) {
    console.error('MONGO CONNECT ERR', err && err.message ? err.message : err);
    process.exit(2);
  }
})();

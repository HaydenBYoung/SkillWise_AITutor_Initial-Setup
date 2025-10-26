require('dotenv').config();
const { MongoClient, ObjectId } = require('mongodb');
const pino = require('pino');

const logger = pino({ name: 'skillwise-mongo' });

const url =
  process.env.MONGO_URL ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27018/skillwise_db';

let client = null;
let db = null;

const connect = async () => {
  if (client && db) return { client, db };

  client = new MongoClient(url, {
    // modern driver options
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  await client.connect();
  db = client.db();
  logger.info('Connected to MongoDB', { db: db.databaseName });
  return { client, db };
};

const getDb = () => {
  if (!db)
    throw new Error('MongoDB client not connected. Call connect() first.');
  return db;
};

const getCollection = (name) => {
  return getDb().collection(name);
};

const getObjectId = (id) => {
  try {
    return new ObjectId(id);
  } catch (e) {
    return null;
  }
};

const close = async () => {
  try {
    if (client) {
      await client.close();
      logger.info('MongoDB connection closed');
    }
  } catch (err) {
    logger.error('Error closing MongoDB client', { error: err.message });
  } finally {
    client = null;
    db = null;
  }
};

module.exports = { connect, getDb, getCollection, getObjectId, close };

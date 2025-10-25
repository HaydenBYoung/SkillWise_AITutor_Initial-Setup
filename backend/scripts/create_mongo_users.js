/*
Script: create_mongo_users.js
Purpose: Connect to MongoDB and create a `users` collection with schema validation
and a unique index on `email`. This is intended for developer/local environments.

Usage:
  # from repo root
  MONGO_URL="mongodb://localhost:27018/skillwise_db" node backend/scripts/create_mongo_users.js

When running in Docker Compose the mongodb service is exposed on host port 27018 by default
(see docker-compose.yml) so the MONGO_URL above should work from the host.
*/

const { MongoClient } = require('mongodb');
const url =
  process.env.MONGO_URL ||
  process.env.DATABASE_URL ||
  'mongodb://localhost:27018/skillwise_db';

async function ensureUsersCollection() {
  const client = new MongoClient(url, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  try {
    await client.connect();
    const dbName =
      client.db().databaseName ||
      new URL(url).pathname.replace(/^\//, '') ||
      'skillwise_db';
    const db = client.db(dbName);

    const collections = await db.listCollections({ name: 'users' }).toArray();
    if (collections.length === 0) {
      console.log('Creating `users` collection with validation...');

      const validator = {
        $jsonSchema: {
          bsonType: 'object',
          required: ['email', 'password_hash', 'createdAt', 'updatedAt'],
          properties: {
            email: {
              bsonType: 'string',
              description: 'user email address',
            },
            password_hash: {
              bsonType: 'string',
              description: 'bcrypt password hash',
            },
            role: {
              bsonType: 'string',
              description: 'user role',
            },
            is_active: {
              bsonType: 'bool',
              description: 'active flag',
            },
            createdAt: {
              bsonType: 'date',
              description: 'creation timestamp',
            },
            updatedAt: {
              bsonType: 'date',
              description: 'last update timestamp',
            },
          },
        },
      };

      await db.createCollection('users', {
        validator,
        validationLevel: 'moderate',
      });
      console.log('Created `users` collection');
    } else {
      console.log('`users` collection already exists');
    }

    // Ensure unique index on email
    const indexes = await db.collection('users').indexes();
    const hasEmailIndex = indexes.some((i) => i.key && i.key.email === 1);
    if (!hasEmailIndex) {
      await db
        .collection('users')
        .createIndex({ email: 1 }, { unique: true, background: true });
      console.log('Created unique index on `email`');
    } else {
      console.log('Unique index on `email` already exists');
    }

    // Developer convenience: show collection info
    const newIndexes = await db.collection('users').indexes();
    console.log(
      'Indexes on users:',
      newIndexes.map((i) => i.name)
    );
  } catch (err) {
    console.error('Error creating users collection:', err);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

if (require.main === module) {
  ensureUsersCollection().then(() => {
    console.log('Done.');
  });
}

module.exports = { ensureUsersCollection };

#!/usr/bin/env node
/*
  Seed script for Cypress smoke tests.
  Usage: from backend folder run: npm run seed:cypress
  It will insert or update a test user with a known password so Cypress can log in.
*/
const bcrypt = require('bcryptjs');
const { query } = require('../src/database/connection');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

async function seedUser (
  email = 'testuser@example.com',
  password = 'Password123!',
  firstName = 'Test',
  lastName = 'User',
) {
  try {
    const { rows } = await query('SELECT id FROM users WHERE email = $1', [
      email,
    ]);
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    if (rows && rows.length > 0) {
      console.log(`User ${email} already exists - updating password.`);
      await query(
        'UPDATE users SET password_hash = $1, first_name = $2, last_name = $3 WHERE email = $4',
        [passwordHash, firstName, lastName, email],
      );
    } else {
      console.log(`Creating user ${email}`);
      await query(
        'INSERT INTO users (email, password_hash, first_name, last_name) VALUES ($1, $2, $3, $4)',
        [email, passwordHash, firstName, lastName],
      );
    }

    console.log('✅ Cypress test user seeded:', email);
  } catch (err) {
    console.error('❌ Failed to seed Cypress user:', err.message || err);
    process.exitCode = 1;
  }
}

if (require.main === module) {
  const email = process.env.CYPRESS_TEST_USER_EMAIL || 'testuser@example.com';
  const password = process.env.CYPRESS_TEST_USER_PASSWORD || 'Password123!';
  const firstName = process.env.CYPRESS_TEST_USER_FIRSTNAME || 'Test';
  const lastName = process.env.CYPRESS_TEST_USER_LASTNAME || 'User';

  seedUser(email, password, firstName, lastName).then(() =>
    process.exit(process.exitCode || 0),
  );
}

module.exports = { seedUser };

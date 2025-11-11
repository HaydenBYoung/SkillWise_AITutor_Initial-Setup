#!/usr/bin/env node
// Database migration script: reads SQL files from database/migrations and records applied migrations

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL ||
    'postgresql://skillwise_user:skillwise_pass@localhost:5433/skillwise_db',
});

const migrationsDir = path.join(__dirname, '../database/migrations');

async function runMigrations () {
  try {
    console.log('Starting database migrations...');

    // Create migrations table if it does not exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL,
        executed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Read migration files and execute in order
    const files = fs.readdirSync(migrationsDir).sort();

    for (const file of files) {
      if (file.endsWith('.sql')) {
        // Check if migration already executed
        const result = await pool.query(
          'SELECT * FROM migrations WHERE filename = $1',
          [file],
        );

        if (result.rows.length === 0) {
          console.log(`Executing migration: ${file}`);
          const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
          try {
            await pool.query(sql);
            await pool.query('INSERT INTO migrations (filename) VALUES ($1)', [
              file,
            ]);
            console.log(`✓ Completed: ${file}`);
          } catch (err) {
            // If migration fails because object already exists, mark it executed and continue.
            // This helps when migrations were partially applied outside this runner.
            const msg = String(err.message || err);
            if (
              err.code === '42P07' ||
              /already exists/i.test(msg) ||
              err.code === '42710'
            ) {
              console.warn(
                `⚠️  Migration ${file} reported 'already exists' - marking as applied and skipping.`,
              );
              try {
                await pool.query(
                  'INSERT INTO migrations (filename) VALUES ($1)',
                  [file],
                );
              } catch (insErr) {
                console.warn(
                  `Could not mark migration ${file} as applied: ${insErr.message}`,
                );
              }
              continue;
            }

            // Re-throw other errors
            throw err;
          }
        } else {
          console.log(`⏭️  Skipping: ${file} (already executed)`);
        }
      }
    }

    console.log('All migrations completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  runMigrations();
}

module.exports = { runMigrations };

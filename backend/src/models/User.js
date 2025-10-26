const db = require('../database/connection');
const bcrypt = require('bcryptjs'); // fix: use bcryptjs (no dot)

const User = {
  async create({
    email,
    password,
    firstName,
    lastName,
    first_name,
    last_name,
  }) {
    // support either camelCase or snake_case names
    const fn = firstName || first_name || '';
    const ln = lastName || last_name || '';

    const passwordHash = await bcrypt.hash(password, 10);
    const query = `
      INSERT INTO users (email, password_hash, first_name, last_name)
      VALUES ($1, $2, $3, $4)
      RETURNING id, email, first_name, last_name, created_at;
    `;
    const values = [email, passwordHash, fn, ln];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await db.query(query, [email]);
    return result.rows[0];
  },
};

module.exports = User;

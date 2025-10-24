const db = require('../database/connection');
const bcrypt = require('bcryptjs');

const User = {
async create({ email, password, firstName, lastName }) {
  console.log('Creating user with:', { email, firstName, lastName }); // <--- add this
  const passwordHash = await bcrypt.hash(password, 10);
  const query = `
    INSERT INTO users (email, password_hash, first_name, last_name)
    VALUES ($1, $2, $3, $4)
    RETURNING id, email, first_name, last_name, created_at;
  `;
  const values = [email, passwordHash, firstName, lastName];
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

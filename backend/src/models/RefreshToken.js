const db = require('../database/connection');

const RefreshToken = {
  async create({ token, userId, expiresAt }) {
    const query = `
      INSERT INTO refresh_tokens (token, user_id, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id, token, user_id, expires_at, is_revoked, created_at;
    `;
    const values = [token, userId, expiresAt];
    const result = await db.query(query, values);
    return result.rows[0];
  },

  async findByToken(token) {
    const query = 'SELECT * FROM refresh_tokens WHERE token = $1';
    const result = await db.query(query, [token]);
    return result.rows[0];
  },

  async revoke(token) {
    const query =
      'UPDATE refresh_tokens SET is_revoked = true, updated_at = CURRENT_TIMESTAMP WHERE token = $1 RETURNING *';
    const result = await db.query(query, [token]);
    return result.rows[0];
  },

  async deleteByUserId(userId) {
    const query = 'DELETE FROM refresh_tokens WHERE user_id = $1';
    const result = await db.query(query, [userId]);
    return result.rowCount;
  },
};

module.exports = RefreshToken;

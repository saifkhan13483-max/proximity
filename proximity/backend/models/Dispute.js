const { pool } = require('../db');

const toDispute = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    userId: row.user_id,
    bureau: row.bureau,
    accountName: row.account_name,
    accountNumber: row.account_number,
    reason: row.reason,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    user: row.user_name ? { name: row.user_name, email: row.user_email } : undefined,
  };
};

const Dispute = {
  async create({ userId, bureau, accountName, accountNumber, reason }) {
    const { rows } = await pool.query(
      `INSERT INTO disputes (user_id, bureau, account_name, account_number, reason)
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [userId, bureau, accountName.trim(), accountNumber ? accountNumber.trim() : null, reason]
    );
    return toDispute(rows[0]);
  },

  async findByUserId(userId) {
    const { rows } = await pool.query(
      `SELECT * FROM disputes WHERE user_id = $1 ORDER BY created_at DESC`,
      [userId]
    );
    return rows.map(toDispute);
  },

  async findAll() {
    const { rows } = await pool.query(
      `SELECT d.*, u.name AS user_name, u.email AS user_email
       FROM disputes d
       LEFT JOIN users u ON d.user_id = u.id
       ORDER BY d.created_at DESC`
    );
    return rows.map(toDispute);
  },

  async findById(id) {
    const { rows } = await pool.query(`SELECT * FROM disputes WHERE id = $1`, [id]);
    return toDispute(rows[0]);
  },

  async updateById(id, { status, notes }) {
    const { rows } = await pool.query(
      `UPDATE disputes SET status = $1, notes = $2, updated_at = NOW() WHERE id = $3 RETURNING *`,
      [status, notes || null, id]
    );
    return toDispute(rows[0]);
  },

  async deleteById(id) {
    const { rows } = await pool.query(`DELETE FROM disputes WHERE id = $1 RETURNING id`, [id]);
    return rows[0] ? true : false;
  },
};

module.exports = Dispute;

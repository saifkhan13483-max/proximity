const { pool } = require('../db');

const toMessage = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    read: row.read,
    createdAt: row.created_at,
  };
};

const ContactMessage = {
  async create({ name, email, phone, message }) {
    const { rows } = await pool.query(
      `INSERT INTO contact_messages (name, email, phone, message) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), email.toLowerCase().trim(), phone ? phone.trim() : null, message]
    );
    return toMessage(rows[0]);
  },

  async findAll() {
    const { rows } = await pool.query(
      `SELECT * FROM contact_messages ORDER BY read ASC, created_at DESC`
    );
    return rows.map(toMessage);
  },

  async markRead(id) {
    const { rows } = await pool.query(
      `UPDATE contact_messages SET read = TRUE WHERE id = $1 RETURNING *`,
      [id]
    );
    return toMessage(rows[0]);
  },
};

module.exports = ContactMessage;

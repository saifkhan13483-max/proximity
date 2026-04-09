const bcrypt = require('bcryptjs');
const { pool } = require('../db');

const toUser = (row) => {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    avatar: row.avatar,
    createdAt: row.created_at,
    password: row.password,
  };
};

const User = {
  async create({ name, email, password, role = 'client' }) {
    const hash = await bcrypt.hash(password, 12);
    const { rows } = await pool.query(
      `INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *`,
      [name.trim(), email.toLowerCase().trim(), hash, role]
    );
    return toUser(rows[0]);
  },

  async findByEmail(email, includePassword = false) {
    const { rows } = await pool.query(
      `SELECT ${includePassword ? '*' : 'id, name, email, role, phone, avatar, created_at'} FROM users WHERE email = $1`,
      [email.toLowerCase().trim()]
    );
    return toUser(rows[0]);
  },

  async findById(id, includePassword = false) {
    const { rows } = await pool.query(
      `SELECT ${includePassword ? '*' : 'id, name, email, role, phone, avatar, created_at'} FROM users WHERE id = $1`,
      [id]
    );
    return toUser(rows[0]);
  },

  async findAll() {
    const { rows } = await pool.query(
      `SELECT id, name, email, role, phone, avatar, created_at FROM users ORDER BY created_at DESC`
    );
    return rows.map(toUser);
  },

  async updateById(id, { name, phone }) {
    const fields = [];
    const values = [];
    let i = 1;
    if (name !== undefined) { fields.push(`name = $${i++}`); values.push(name.trim()); }
    if (phone !== undefined) { fields.push(`phone = $${i++}`); values.push(phone ? phone.trim() : null); }
    if (!fields.length) {
      return User.findById(id);
    }
    values.push(id);
    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${i} RETURNING id, name, email, role, phone, avatar, created_at`,
      values
    );
    return toUser(rows[0]);
  },

  async deleteById(id) {
    const { rows } = await pool.query(`DELETE FROM users WHERE id = $1 RETURNING id`, [id]);
    return rows[0] ? true : false;
  },

  async comparePassword(candidatePassword, hashedPassword) {
    return bcrypt.compare(candidatePassword, hashedPassword);
  },
};

module.exports = User;

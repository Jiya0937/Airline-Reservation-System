import db from '../config/db.js';

class User {
  static async create({ fullName, email, password, mobile, country, city }) {
    const [result] = await db.query(
      'INSERT INTO users (full_name, email, password, mobile, country, city) VALUES (?, ?, ?, ?, ?, ?)',
      [fullName, email, password, mobile, country, city]
    );
    return result.insertId;
  }

  static async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  static async findById(id) {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    return rows[0] || null;
  }

  static async updateProfile(id, { fullName, mobile, country, city }) {
    await db.query(
      'UPDATE users SET full_name = ?, mobile = ?, country = ?, city = ? WHERE id = ?',
      [fullName, mobile, country, city, id]
    );
  }

  static async updatePassword(id, hashedPassword) {
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, id]);
  }
}

export default User;

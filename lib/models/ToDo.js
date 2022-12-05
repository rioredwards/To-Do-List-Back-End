const pool = require('../utils/pool');

module.exports = class ToDo {
  id;
  user_id;
  description;
  complete;
  created_at;

  constructor(row) {
    this.id = row.id;
    this.user_id = row.user_id;
    this.description = row.description;
    this.complete = row.complete;
    this.created_at = row.created_at;
  }

  static async getAll() {
    const { rows } = await pool.query('SELECT * FROM todos');

    return rows.map((row) => new ToDo(row));
  }
};

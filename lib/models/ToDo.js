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

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM todos
      WHERE id=$1
      `,
      [id]
    );
    if (!rows[0]) {
      return null;
    }
    return new ToDo(rows[0]);
  }

  static async insert({ description, user_id }) {
    const { rows } = await pool.query(
      `
      INSERT INTO todos (description, user_id)
      VALUES ($1, $2)
      RETURNING *
    `,
      [description, user_id]
    );

    return new ToDo(rows[0]);
  }

  static async getAll(user_id) {
    const { rows } = await pool.query(
      `
    SELECT *
    FROM todos
    WHERE user_id=$1
    ORDER BY created_at DESC
    `,
      [user_id]
    );

    return rows.map((row) => new ToDo(row));
  }

  static async updateById(id, newAttrs) {
    const todo = await ToDo.getById(id);
    if (!todo) return null;
    const { description, complete } = { ...todo, ...newAttrs };
    const { rows } = await pool.query(
      `
      UPDATE todos
      SET description = $2, complete = $3
      WHERE id = $1
      RETURNING *;
    `,
      [id, description, complete]
    );
    return new ToDo(rows[0]);
  }

  static async delete(id) {
    const { rows } = await pool.query(
      `DELETE FROM todos 
      WHERE id = $1 
      RETURNING *`,
      [id]
    );
    return new ToDo(rows[0]);
  }
};

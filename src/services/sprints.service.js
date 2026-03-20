const pool = require('../config/db');

async function createSprint(data) {
  const { nombre_sprint, fecha_inicio, fecha_fin } = data;

  const query = `
    INSERT INTO sprints (nombre_sprint, fecha_inicio, fecha_fin)
    VALUES ($1, $2, $3)
    RETURNING *
  `;

  const result = await pool.query(query, [
    nombre_sprint,
    fecha_inicio,
    fecha_fin
  ]);

  return result.rows[0];
}

async function getSprints() {
  const query = `
    SELECT *
    FROM sprints
    ORDER BY id_sprint DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function getSprintById(id) {
  const result = await pool.query(
    'SELECT * FROM sprints WHERE id_sprint = $1',
    [id]
  );

  if (result.rows.length === 0) {
    const error = new Error('Sprint no encontrado');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

async function closeSprint(id) {
  const result = await pool.query(
    `
    UPDATE sprints
    SET estado = 'cerrado'
    WHERE id_sprint = $1
    RETURNING *
    `,
    [id]
  );

  if (result.rows.length === 0) {
    const error = new Error('Sprint no encontrado');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  createSprint,
  getSprints,
  getSprintById,
  closeSprint
};
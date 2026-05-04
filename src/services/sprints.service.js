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
    SELECT
      s.id_sprint,
      s.nombre_sprint,
      s.fecha_inicio,
      s.fecha_fin,
      s.estado,
      COUNT(t.id_tarea)::int AS total_tareas
    FROM sprints s
    LEFT JOIN tareas t ON t.id_sprint = s.id_sprint
    GROUP BY
      s.id_sprint,
      s.nombre_sprint,
      s.fecha_inicio,
      s.fecha_fin,
      s.estado
    ORDER BY s.id_sprint DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function getSprintById(id) {
  const query = `
    SELECT
      s.id_sprint,
      s.nombre_sprint,
      s.fecha_inicio,
      s.fecha_fin,
      s.estado,
      COUNT(t.id_tarea)::int AS total_tareas
    FROM sprints s
    LEFT JOIN tareas t ON t.id_sprint = s.id_sprint
    WHERE s.id_sprint = $1
    GROUP BY
      s.id_sprint,
      s.nombre_sprint,
      s.fecha_inicio,
      s.fecha_fin,
      s.estado
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);

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

async function updateSprint(id, data) {
  const { nombre_sprint, fecha_inicio, fecha_fin, estado } = data;

  const result = await pool.query(
    `
    UPDATE sprints
    SET
      nombre_sprint = COALESCE($1, nombre_sprint),
      fecha_inicio = COALESCE($2, fecha_inicio),
      fecha_fin = COALESCE($3, fecha_fin),
      estado = COALESCE($4, estado)
    WHERE id_sprint = $5
    RETURNING *
    `,
    [nombre_sprint ?? null, fecha_inicio ?? null, fecha_fin ?? null, estado ?? null, id]
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
  closeSprint,
  updateSprint
};
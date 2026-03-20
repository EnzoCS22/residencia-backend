const pool = require('../config/db');

async function createTarea(data) {
  const {
    nombre_tarea,
    descripcion,
    fecha_asignacion,
    fecha_limite,
    estatus,
    id_sprint,
    id_empleado
  } = data;

  const query = `
    INSERT INTO tareas (
      nombre_tarea,
      descripcion,
      fecha_asignacion,
      fecha_limite,
      estatus,
      id_sprint,
      id_empleado
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const result = await pool.query(query, [
    nombre_tarea,
    descripcion,
    fecha_asignacion,
    fecha_limite,
    estatus,
    id_sprint,
    id_empleado
  ]);

  return result.rows[0];
}

async function getTareas() {
  const query = `
    SELECT
      t.*,
      u.nombre AS nombre_empleado,
      s.nombre_sprint
    FROM tareas t
    JOIN usuarios u ON u.id_usuario = t.id_empleado
    JOIN sprints s ON s.id_sprint = t.id_sprint
    ORDER BY t.id_tarea DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function getTareasBySprint(id_sprint) {
  const query = `
    SELECT
      t.*,
      u.nombre AS nombre_empleado,
      s.nombre_sprint
    FROM tareas t
    JOIN usuarios u ON u.id_usuario = t.id_empleado
    JOIN sprints s ON s.id_sprint = t.id_sprint
    WHERE t.id_sprint = $1
    ORDER BY t.id_tarea DESC
  `;

  const result = await pool.query(query, [id_sprint]);
  return result.rows;
}

async function getTareasByEmpleado(id_empleado) {
  const query = `
    SELECT
      t.*,
      u.nombre AS nombre_empleado,
      s.nombre_sprint
    FROM tareas t
    JOIN usuarios u ON u.id_usuario = t.id_empleado
    JOIN sprints s ON s.id_sprint = t.id_sprint
    WHERE t.id_empleado = $1
    ORDER BY t.id_tarea DESC
  `;

  const result = await pool.query(query, [id_empleado]);
  return result.rows;
}

async function updateEstatusTarea(id, estatus) {
  const query = `
    UPDATE tareas
    SET estatus = $1
    WHERE id_tarea = $2
    RETURNING *
  `;

  const result = await pool.query(query, [estatus, id]);

  if (result.rows.length === 0) {
    const error = new Error('Tarea no encontrada');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

module.exports = {
  createTarea,
  getTareas,
  getTareasBySprint,
  getTareasByEmpleado,
  updateEstatusTarea
};
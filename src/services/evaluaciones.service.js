const pool = require('../config/db');

async function createEvaluacion(data) {
  const {
    id_empleado,
    id_sprint,
    porcentaje_cumplimiento,
    comentario_general
  } = data;

  const query = `
    INSERT INTO evaluaciones (
      id_empleado,
      id_sprint,
      porcentaje_cumplimiento,
      comentario_general
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id_empleado, id_sprint)
    DO UPDATE SET
      porcentaje_cumplimiento = EXCLUDED.porcentaje_cumplimiento,
      comentario_general = EXCLUDED.comentario_general,
      fecha_evaluacion = NOW()
    RETURNING *
  `;

  const result = await pool.query(query, [
    id_empleado,
    id_sprint,
    porcentaje_cumplimiento,
    comentario_general || null
  ]);

  return result.rows[0];
}

async function getEvaluaciones() {
  const query = `
    SELECT
      e.*,
      u.nombre AS nombre_empleado,
      s.nombre_sprint
    FROM evaluaciones e
    JOIN usuarios u ON u.id_usuario = e.id_empleado
    JOIN sprints s ON s.id_sprint = e.id_sprint
    ORDER BY e.id_evaluacion DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function getEvaluacionesByEmpleado(id_empleado) {
  const query = `
    SELECT
      e.*,
      u.nombre AS nombre_empleado,
      s.nombre_sprint
    FROM evaluaciones e
    JOIN usuarios u ON u.id_usuario = e.id_empleado
    JOIN sprints s ON s.id_sprint = e.id_sprint
    WHERE e.id_empleado = $1
    ORDER BY e.id_evaluacion DESC
  `;

  const result = await pool.query(query, [id_empleado]);
  return result.rows;
}

async function getEvaluacionesBySprint(id_sprint) {
  const query = `
    SELECT
      e.*,
      u.nombre AS nombre_empleado,
      s.nombre_sprint
    FROM evaluaciones e
    JOIN usuarios u ON u.id_usuario = e.id_empleado
    JOIN sprints s ON s.id_sprint = e.id_sprint
    WHERE e.id_sprint = $1
    ORDER BY e.id_evaluacion DESC
  `;

  const result = await pool.query(query, [id_sprint]);
  return result.rows;
}

async function calcularEvaluacion({ id_empleado, id_sprint, comentario_general }) {
  const queryTareas = `
    SELECT
      COUNT(*) AS total_tareas,
      SUM(CASE WHEN estatus = 'hecha' THEN 1 ELSE 0 END) AS tareas_hechas
    FROM tareas
    WHERE id_empleado = $1
      AND id_sprint = $2
  `;

  const tareasResult = await pool.query(queryTareas, [id_empleado, id_sprint]);

  const totalTareas = Number(tareasResult.rows[0].total_tareas || 0);
  const tareasHechas = Number(tareasResult.rows[0].tareas_hechas || 0);

  const porcentaje =
    totalTareas === 0 ? 0 : Number(((tareasHechas / totalTareas) * 100).toFixed(2));

  const queryEvaluacion = `
    INSERT INTO evaluaciones (
      id_empleado,
      id_sprint,
      porcentaje_cumplimiento,
      comentario_general
    )
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (id_empleado, id_sprint)
    DO UPDATE SET
      porcentaje_cumplimiento = EXCLUDED.porcentaje_cumplimiento,
      comentario_general = EXCLUDED.comentario_general,
      fecha_evaluacion = NOW()
    RETURNING *
  `;

  const evaluacionResult = await pool.query(queryEvaluacion, [
    id_empleado,
    id_sprint,
    porcentaje,
    comentario_general || null
  ]);

  return {
    total_tareas: totalTareas,
    tareas_hechas: tareasHechas,
    porcentaje_cumplimiento: porcentaje,
    evaluacion: evaluacionResult.rows[0]
  };
}

module.exports = {
  createEvaluacion,
  getEvaluaciones,
  getEvaluacionesByEmpleado,
  getEvaluacionesBySprint,
  calcularEvaluacion
};
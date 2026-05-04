const pool = require('../config/db');

async function createEvaluacion(data) {
  const {
    id_empleado,
    id_sprint,
    porcentaje_cumplimiento,
    comentario_general = null
  } = data;

  const result = await pool.query(
    `
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
    `,
    [id_empleado, id_sprint, porcentaje_cumplimiento, comentario_general]
  );

  return result.rows[0];
}

async function getEvaluaciones() {
  const result = await pool.query(
    `
    SELECT
      e.id_evaluacion,
      e.id_empleado,
      u.nombre AS nombre_empleado,
      e.id_sprint,
      s.nombre_sprint,
      e.porcentaje_cumplimiento,
      e.comentario_general,
      e.fecha_evaluacion
    FROM evaluaciones e
    INNER JOIN usuarios u ON u.id_usuario = e.id_empleado
    INNER JOIN sprints s ON s.id_sprint = e.id_sprint
    ORDER BY e.fecha_evaluacion DESC
    `
  );

  return result.rows;
}

async function getEvaluacionesByEmpleado(id_empleado) {
  const result = await pool.query(
    `
    SELECT
      e.id_evaluacion,
      e.id_empleado,
      u.nombre AS nombre_empleado,
      e.id_sprint,
      s.nombre_sprint,
      e.porcentaje_cumplimiento,
      e.comentario_general,
      e.fecha_evaluacion
    FROM evaluaciones e
    INNER JOIN usuarios u ON u.id_usuario = e.id_empleado
    INNER JOIN sprints s ON s.id_sprint = e.id_sprint
    WHERE e.id_empleado = $1
    ORDER BY e.fecha_evaluacion DESC
    `,
    [id_empleado]
  );

  return result.rows;
}

async function getEvaluacionesBySprint(id_sprint) {
  const result = await pool.query(
    `
    SELECT
      e.id_evaluacion,
      e.id_empleado,
      u.nombre AS nombre_empleado,
      e.id_sprint,
      s.nombre_sprint,
      e.porcentaje_cumplimiento,
      e.comentario_general,
      e.fecha_evaluacion
    FROM evaluaciones e
    INNER JOIN usuarios u ON u.id_usuario = e.id_empleado
    INNER JOIN sprints s ON s.id_sprint = e.id_sprint
    WHERE e.id_sprint = $1
    ORDER BY u.nombre ASC
    `,
    [id_sprint]
  );

  return result.rows;
}

async function calcularEvaluacion(data) {
  const {
    id_empleado,
    id_sprint,
    comentario_general = null
  } = data;

  const tareasResult = await pool.query(
    `
    SELECT
      COUNT(*)::int AS total_tareas,
      COUNT(*) FILTER (WHERE estatus = 'hecha')::int AS tareas_hechas
    FROM tareas
    WHERE id_empleado = $1
      AND id_sprint = $2
    `,
    [id_empleado, id_sprint]
  );

  const totalTareas = Number(tareasResult.rows[0].total_tareas || 0);
  const tareasHechas = Number(tareasResult.rows[0].tareas_hechas || 0);

  const porcentaje =
    totalTareas === 0 ? 0 : Number(((tareasHechas / totalTareas) * 100).toFixed(2));

  const result = await pool.query(
    `
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
    `,
    [id_empleado, id_sprint, porcentaje, comentario_general]
  );

  return {
    evaluacion: result.rows[0],
    total_tareas: totalTareas,
    tareas_hechas: tareasHechas,
    porcentaje_cumplimiento: porcentaje
  };
}

async function getEvaluacionesBySprintForLeader(id_sprint, id_lider) {
  const liderResult = await pool.query(
    `
    SELECT id_usuario, id_grupo, rol
    FROM usuarios
    WHERE id_usuario = $1
    LIMIT 1
    `,
    [id_lider]
  );

  if (liderResult.rows.length === 0) {
    const error = new Error('Líder no encontrado');
    error.status = 404;
    throw error;
  }

  const lider = liderResult.rows[0];

  if (!lider.id_grupo) {
    return [];
  }

  const result = await pool.query(
    `
    SELECT
      u.id_usuario AS id_empleado,
      u.nombre AS nombre_empleado,
      COUNT(t.id_tarea) FILTER (WHERE t.estatus = 'hecha')::int AS completadas,
      COUNT(t.id_tarea) FILTER (WHERE t.estatus <> 'hecha')::int AS pendientes,
      COALESCE(
        ROUND(
          (
            COUNT(t.id_tarea) FILTER (WHERE t.estatus = 'hecha')::numeric
            / NULLIF(COUNT(t.id_tarea), 0)
          ) * 100,
          2
        ),
        0
      ) AS porcentaje_cumplimiento
    FROM usuarios u
    LEFT JOIN tareas t
      ON t.id_empleado = u.id_usuario
     AND t.id_sprint = $1
    WHERE u.id_grupo = $2
      AND u.rol IN ('empleado', 'lider')
    GROUP BY u.id_usuario, u.nombre
    ORDER BY u.nombre ASC
    `,
    [id_sprint, lider.id_grupo]
  );

  return result.rows;
}

module.exports = {
  createEvaluacion,
  getEvaluaciones,
  getEvaluacionesByEmpleado,
  getEvaluacionesBySprint,
  calcularEvaluacion,
  getEvaluacionesBySprintForLeader
};
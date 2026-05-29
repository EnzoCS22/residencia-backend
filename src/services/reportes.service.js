const pool = require('../config/db');

async function getReporteGeneral() {
  const totalUsuariosQuery = `
    SELECT COUNT(*)::int AS total_usuarios
    FROM usuarios
  `;

  const usuariosActivosQuery = `
    SELECT COUNT(*)::int AS usuarios_activos
    FROM usuarios
    WHERE activo = TRUE
  `;

  const totalSprintsQuery = `
    SELECT COUNT(*)::int AS total_sprints
    FROM sprints
  `;

  const totalTareasQuery = `
    SELECT COUNT(*)::int AS total_tareas
    FROM tareas
  `;

  const tareasPorEstatusQuery = `
    SELECT
      COUNT(*) FILTER (WHERE estatus = 'pendiente')::int AS pendientes,
      COUNT(*) FILTER (WHERE estatus = 'en_progreso')::int AS en_progreso,
      COUNT(*) FILTER (WHERE estatus = 'hecha')::int AS hechas
    FROM tareas
  `;

  const totalEvaluacionesQuery = `
    SELECT COUNT(*)::int AS total_evaluaciones
    FROM evaluaciones
  `;

  const promedioCumplimientoQuery = `
    SELECT COALESCE(AVG(porcentaje_cumplimiento), 0)::numeric(5,2) AS promedio_cumplimiento
    FROM evaluaciones
  `;

  const [
    totalUsuarios,
    usuariosActivos,
    totalSprints,
    totalTareas,
    tareasPorEstatus,
    totalEvaluaciones,
    promedioCumplimiento,
  ] = await Promise.all([
    pool.query(totalUsuariosQuery),
    pool.query(usuariosActivosQuery),
    pool.query(totalSprintsQuery),
    pool.query(totalTareasQuery),
    pool.query(tareasPorEstatusQuery),
    pool.query(totalEvaluacionesQuery),
    pool.query(promedioCumplimientoQuery),
  ]);

  return {
    total_usuarios: totalUsuarios.rows[0].total_usuarios,
    usuarios_activos: usuariosActivos.rows[0].usuarios_activos,
    total_sprints: totalSprints.rows[0].total_sprints,
    total_tareas: totalTareas.rows[0].total_tareas,
    tareas_por_estatus: tareasPorEstatus.rows[0],
    total_evaluaciones: totalEvaluaciones.rows[0].total_evaluaciones,
    promedio_cumplimiento: promedioCumplimiento.rows[0].promedio_cumplimiento,
  };
}

async function getReporteSprint(id_sprint) {
  const sprintQuery = `
    SELECT *
    FROM sprints
    WHERE id_sprint = $1
    LIMIT 1
  `;

  const sprintResult = await pool.query(sprintQuery, [id_sprint]);

  if (sprintResult.rows.length === 0) {
    const error = new Error('Sprint no encontrado');
    error.status = 404;
    throw error;
  }

  const resumenTareasQuery = `
    SELECT
      COUNT(*)::int AS total_tareas,
      COUNT(*) FILTER (WHERE estatus = 'pendiente')::int AS pendientes,
      COUNT(*) FILTER (WHERE estatus = 'en_progreso')::int AS en_progreso,
      COUNT(*) FILTER (WHERE estatus = 'hecha')::int AS hechas
    FROM tareas
    WHERE id_sprint = $1
  `;

  const promedioSprintQuery = `
    SELECT COALESCE(AVG(porcentaje_cumplimiento), 0)::numeric(5,2) AS promedio_cumplimiento
    FROM evaluaciones
    WHERE id_sprint = $1
  `;

  const evaluacionesDetalleQuery = `
    SELECT
      e.id_evaluacion,
      e.id_empleado,
      u.nombre AS nombre_empleado,
      u.correo,
      e.porcentaje_cumplimiento,
      e.comentario_general,
      e.fecha_evaluacion
    FROM evaluaciones e
    JOIN usuarios u ON u.id_usuario = e.id_empleado
    WHERE e.id_sprint = $1
    ORDER BY e.porcentaje_cumplimiento DESC, u.nombre ASC
  `;

  const tareasResult = await pool.query(resumenTareasQuery, [id_sprint]);
  const promedioResult = await pool.query(promedioSprintQuery, [id_sprint]);
  const evaluacionesResult = await pool.query(evaluacionesDetalleQuery, [
    id_sprint,
  ]);

  return {
    sprint: sprintResult.rows[0],
    resumen_tareas: tareasResult.rows[0],
    promedio_cumplimiento: promedioResult.rows[0].promedio_cumplimiento,
    evaluaciones: evaluacionesResult.rows,
  };
}

async function getReporteEmpleado(id_empleado) {
  const empleadoQuery = `
    SELECT
      u.id_usuario,
      u.nombre,
      u.correo,
      u.rol,
      u.activo,
      u.id_grupo,
      g.nombre_grupo
    FROM usuarios u
    LEFT JOIN grupos g ON g.id_grupo = u.id_grupo
    WHERE u.id_usuario = $1
    LIMIT 1
  `;

  const empleadoResult = await pool.query(empleadoQuery, [id_empleado]);

  if (empleadoResult.rows.length === 0) {
    const error = new Error('Empleado no encontrado');
    error.status = 404;
    throw error;
  }

  const resumenTareasQuery = `
    SELECT
      COUNT(DISTINCT id_sprint)::int AS total_sprints,
      COUNT(*)::int AS total_tareas,
      COUNT(*) FILTER (WHERE estatus = 'pendiente')::int AS pendientes,
      COUNT(*) FILTER (WHERE estatus = 'en_progreso')::int AS en_progreso,
      COUNT(*) FILTER (WHERE estatus = 'hecha')::int AS hechas,
      COALESCE(
        ROUND(
          (
            COUNT(*) FILTER (WHERE estatus = 'hecha')::numeric
            / NULLIF(COUNT(*), 0)
          ) * 100,
          2
        ),
        0
      ) AS cumplimiento_tareas
    FROM tareas
    WHERE id_empleado = $1
  `;

  const promedioEmpleadoQuery = `
    SELECT COALESCE(AVG(porcentaje_cumplimiento), 0)::numeric(5,2) AS promedio_cumplimiento
    FROM evaluaciones
    WHERE id_empleado = $1
  `;

  const historialEvaluacionesQuery = `
    SELECT
      e.id_evaluacion,
      e.id_sprint,
      s.nombre_sprint,
      s.fecha_inicio,
      s.fecha_fin,
      e.porcentaje_cumplimiento,
      e.comentario_general,
      e.fecha_evaluacion
    FROM evaluaciones e
    JOIN sprints s ON s.id_sprint = e.id_sprint
    WHERE e.id_empleado = $1
    ORDER BY e.fecha_evaluacion DESC
  `;

  const sprintsAsignadosQuery = `
    SELECT
      s.id_sprint,
      s.nombre_sprint,
      s.fecha_inicio,
      s.fecha_fin,
      s.estado,
      COUNT(t.id_tarea)::int AS total_tareas,
      COUNT(t.id_tarea) FILTER (WHERE t.estatus = 'pendiente')::int AS pendientes,
      COUNT(t.id_tarea) FILTER (WHERE t.estatus = 'en_progreso')::int AS en_progreso,
      COUNT(t.id_tarea) FILTER (WHERE t.estatus = 'hecha')::int AS hechas,
      COALESCE(
        ROUND(
          (
            COUNT(t.id_tarea) FILTER (WHERE t.estatus = 'hecha')::numeric
            / NULLIF(COUNT(t.id_tarea), 0)
          ) * 100,
          2
        ),
        0
      ) AS cumplimiento_tareas
    FROM tareas t
    INNER JOIN sprints s ON s.id_sprint = t.id_sprint
    WHERE t.id_empleado = $1
    GROUP BY
      s.id_sprint,
      s.nombre_sprint,
      s.fecha_inicio,
      s.fecha_fin,
      s.estado
    ORDER BY s.fecha_inicio DESC, s.id_sprint DESC
  `;

  const [
    tareasResult,
    promedioResult,
    historialResult,
    sprintsAsignadosResult,
  ] = await Promise.all([
    pool.query(resumenTareasQuery, [id_empleado]),
    pool.query(promedioEmpleadoQuery, [id_empleado]),
    pool.query(historialEvaluacionesQuery, [id_empleado]),
    pool.query(sprintsAsignadosQuery, [id_empleado]),
  ]);

  return {
    empleado: empleadoResult.rows[0],
    resumen_tareas: tareasResult.rows[0],
    promedio_cumplimiento: promedioResult.rows[0].promedio_cumplimiento,
    sprints_asignados: sprintsAsignadosResult.rows,
    historial_evaluaciones: historialResult.rows,
  };
}

module.exports = {
  getReporteGeneral,
  getReporteSprint,
  getReporteEmpleado,
};
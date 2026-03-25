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
    promedioCumplimiento
  ] = await Promise.all([
    pool.query(totalUsuariosQuery),
    pool.query(usuariosActivosQuery),
    pool.query(totalSprintsQuery),
    pool.query(totalTareasQuery),
    pool.query(tareasPorEstatusQuery),
    pool.query(totalEvaluacionesQuery),
    pool.query(promedioCumplimientoQuery)
  ]);

  return {
    total_usuarios: totalUsuarios.rows[0].total_usuarios,
    usuarios_activos: usuariosActivos.rows[0].usuarios_activos,
    total_sprints: totalSprints.rows[0].total_sprints,
    total_tareas: totalTareas.rows[0].total_tareas,
    tareas_por_estatus: tareasPorEstatus.rows[0],
    total_evaluaciones: totalEvaluaciones.rows[0].total_evaluaciones,
    promedio_cumplimiento: promedioCumplimiento.rows[0].promedio_cumplimiento
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
  const evaluacionesResult = await pool.query(evaluacionesDetalleQuery, [id_sprint]);

  return {
    sprint: sprintResult.rows[0],
    resumen_tareas: tareasResult.rows[0],
    promedio_cumplimiento: promedioResult.rows[0].promedio_cumplimiento,
    evaluaciones: evaluacionesResult.rows
  };
}

async function getReporteEmpleado(id_empleado) {
  const empleadoQuery = `
    SELECT
      id_usuario,
      nombre,
      correo,
      rol,
      activo,
      id_grupo
    FROM usuarios
    WHERE id_usuario = $1
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
      COUNT(*)::int AS total_tareas,
      COUNT(*) FILTER (WHERE estatus = 'pendiente')::int AS pendientes,
      COUNT(*) FILTER (WHERE estatus = 'en_progreso')::int AS en_progreso,
      COUNT(*) FILTER (WHERE estatus = 'hecha')::int AS hechas
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

  const tareasResult = await pool.query(resumenTareasQuery, [id_empleado]);
  const promedioResult = await pool.query(promedioEmpleadoQuery, [id_empleado]);
  const historialResult = await pool.query(historialEvaluacionesQuery, [id_empleado]);

  return {
    empleado: empleadoResult.rows[0],
    resumen_tareas: tareasResult.rows[0],
    promedio_cumplimiento: promedioResult.rows[0].promedio_cumplimiento,
    historial_evaluaciones: historialResult.rows
  };
}

module.exports = {
  getReporteGeneral,
  getReporteSprint,
  getReporteEmpleado
};
const pool = require('../config/db');

async function getMiDesempeno(id_usuario) {
  const usuarioQuery = `
    SELECT
      id_usuario,
      nombre,
      correo,
      rol,
      activo,
      fecha_registro,
      id_grupo
    FROM usuarios
    WHERE id_usuario = $1
    LIMIT 1
  `;

  const usuarioResult = await pool.query(usuarioQuery, [id_usuario]);

  if (usuarioResult.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  const usuario = usuarioResult.rows[0];

  const resumenTareasQuery = `
    SELECT
      COUNT(*)::int AS total_tareas,
      COUNT(*) FILTER (WHERE estatus = 'pendiente')::int AS pendientes,
      COUNT(*) FILTER (WHERE estatus = 'en_progreso')::int AS en_progreso,
      COUNT(*) FILTER (WHERE estatus = 'hecha')::int AS hechas
    FROM tareas
    WHERE id_empleado = $1
  `;

  const promedioQuery = `
    SELECT COALESCE(AVG(porcentaje_cumplimiento), 0)::numeric(5,2) AS promedio_cumplimiento
    FROM evaluaciones
    WHERE id_empleado = $1
  `;

  const evaluacionesQuery = `
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

  const tareasQuery = `
    SELECT
      t.id_tarea,
      t.nombre_tarea,
      t.descripcion,
      t.fecha_asignacion,
      t.fecha_limite,
      t.estatus,
      t.id_sprint,
      s.nombre_sprint
    FROM tareas t
    JOIN sprints s ON s.id_sprint = t.id_sprint
    WHERE t.id_empleado = $1
    ORDER BY t.fecha_asignacion DESC, t.id_tarea DESC
  `;

  const [
    resumenTareasResult,
    promedioResult,
    evaluacionesResult,
    tareasResult
  ] = await Promise.all([
    pool.query(resumenTareasQuery, [id_usuario]),
    pool.query(promedioQuery, [id_usuario]),
    pool.query(evaluacionesQuery, [id_usuario]),
    pool.query(tareasQuery, [id_usuario])
  ]);

  const evaluaciones = evaluacionesResult.rows;
  const comentarioReciente =
    evaluaciones.length > 0 ? evaluaciones[0].comentario_general : null;

  return {
    usuario,
    resumen: {
      total_tareas: resumenTareasResult.rows[0].total_tareas,
      pendientes: resumenTareasResult.rows[0].pendientes,
      en_progreso: resumenTareasResult.rows[0].en_progreso,
      hechas: resumenTareasResult.rows[0].hechas,
      promedio_cumplimiento: promedioResult.rows[0].promedio_cumplimiento,
      comentario_reciente: comentarioReciente
    },
    tareas: tareasResult.rows,
    evaluaciones
  };
}

module.exports = {
  getMiDesempeno
};
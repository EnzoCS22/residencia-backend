const pool = require('../config/db');

async function getMiDesempenoPorSprint(id_usuario, id_sprint) {
  const usuarioResult = await pool.query(
    `
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
    `,
    [id_usuario]
  );

  if (usuarioResult.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  const sprintResult = await pool.query(
    `
    SELECT
      id_sprint,
      nombre_sprint,
      fecha_inicio,
      fecha_fin,
      estado
    FROM sprints
    WHERE id_sprint = $1
    LIMIT 1
    `,
    [id_sprint]
  );

  if (sprintResult.rows.length === 0) {
    const error = new Error('Sprint no encontrado');
    error.status = 404;
    throw error;
  }

  const tareasResult = await pool.query(
    `
    SELECT
      t.id_tarea,
      t.nombre_tarea,
      t.descripcion,
      t.fecha_asignacion,
      t.fecha_limite,
      t.estatus,
      t.id_sprint,
      t.id_empleado
    FROM tareas t
    WHERE t.id_empleado = $1
      AND t.id_sprint = $2
    ORDER BY t.id_tarea ASC
    `,
    [id_usuario, id_sprint]
  );

  const evaluacionResult = await pool.query(
    `
    SELECT
      id_evaluacion,
      id_empleado,
      id_sprint,
      porcentaje_cumplimiento,
      comentario_general,
      fecha_evaluacion
    FROM evaluaciones
    WHERE id_empleado = $1
      AND id_sprint = $2
    LIMIT 1
    `,
    [id_usuario, id_sprint]
  );

  const tareas = tareasResult.rows;
  const totalTareas = tareas.length;
  const tareasHechas = tareas.filter((t) => t.estatus === 'hecha').length;
  const score =
    totalTareas > 0 ? Number(((tareasHechas / totalTareas) * 100).toFixed(2)) : 0;

  let feedback = null;

  if (evaluacionResult.rows.length > 0) {
    feedback = evaluacionResult.rows[0].comentario_general;
  }

  if (!feedback) {
    if (score >= 80) {
      feedback = 'Excelente desempeño. Sigue así.';
    } else if (score >= 50) {
      feedback = 'Buen progreso, pero puedes mejorar.';
    } else {
      feedback = 'Necesitas mejorar tu rendimiento en este sprint.';
    }
  }

  return {
    usuario: usuarioResult.rows[0],
    sprint: sprintResult.rows[0],
    resumen: {
      total_tareas: totalTareas,
      tareas_completadas: tareasHechas,
      score
    },
    feedback,
    evaluacion: evaluacionResult.rows[0] || null,
    tareas
  };
}

module.exports = {
  getMiDesempenoPorSprint
};
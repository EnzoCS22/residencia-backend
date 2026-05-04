const pool = require('../config/db');

async function getRevisionByEmpleadoSprint(id_empleado, id_sprint) {
  const empleadoResult = await pool.query(
    `
    SELECT
      u.id_usuario AS id_empleado,
      u.nombre AS nombre_empleado,
      g.nombre_grupo
    FROM usuarios u
    LEFT JOIN grupos g ON g.id_grupo = u.id_grupo
    WHERE u.id_usuario = $1
    LIMIT 1
    `,
    [id_empleado]
  );

  if (empleadoResult.rows.length === 0) {
    const error = new Error('Empleado no encontrado');
    error.status = 404;
    throw error;
  }

  const evaluacionResult = await pool.query(
    `
    SELECT
      e.id_evaluacion,
      e.comentario_general
    FROM evaluaciones e
    WHERE e.id_empleado = $1
      AND e.id_sprint = $2
    LIMIT 1
    `,
    [id_empleado, id_sprint]
  );

  const evaluacion = evaluacionResult.rows[0] || null;

  const tareasResult = await pool.query(
    `
    SELECT
      t.id_tarea,
      t.nombre_tarea,
      t.fecha_limite,
      t.estatus,
      rt.cumplimiento AS cumplimiento,
      rt.comentario
    FROM tareas t
    LEFT JOIN revision_tareas rt
      ON rt.id_tarea = t.id_tarea
     AND rt.id_evaluacion = $3
    WHERE t.id_empleado = $1
      AND t.id_sprint = $2
    ORDER BY t.id_tarea ASC
    `,
    [id_empleado, id_sprint, evaluacion ? evaluacion.id_evaluacion : null]
  );

  return {
    empleado: empleadoResult.rows[0],
    comentario_general: evaluacion?.comentario_general || '',
    tareas: tareasResult.rows,
  };
}

async function saveRevision(payload) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const {
      id_empleado,
      id_sprint,
      comentario_general = null,
      tareas = [],
    } = payload;

    const tareasValidas = tareas.filter((t) => t.cumplimiento !== 'na');
    const tareasCumplidas = tareas.filter((t) => t.cumplimiento === 'cumplio');

    const porcentaje =
      tareasValidas.length === 0
        ? 0
        : Number(
            ((tareasCumplidas.length / tareasValidas.length) * 100).toFixed(2)
          );

    const evaluacionResult = await client.query(
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
      RETURNING
        id_evaluacion,
        id_empleado,
        id_sprint,
        porcentaje_cumplimiento,
        comentario_general,
        fecha_evaluacion
      `,
      [id_empleado, id_sprint, porcentaje, comentario_general]
    );

    const evaluacion = evaluacionResult.rows[0];

    for (const tarea of tareas) {
      await client.query(
        `
        INSERT INTO revision_tareas (
          id_evaluacion,
          id_tarea,
          cumplimiento,
          comentario
        )
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (id_evaluacion, id_tarea)
        DO UPDATE SET
          cumplimiento = EXCLUDED.cumplimiento,
          comentario = EXCLUDED.comentario
        `,
        [
          evaluacion.id_evaluacion,
          tarea.id_tarea,
          tarea.cumplimiento,
          tarea.comentario || null,
        ]
      );
    }

    await client.query('COMMIT');

    return {
      evaluacion,
      tareas_revisadas: tareas.length,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  getRevisionByEmpleadoSprint,
  saveRevision,
};
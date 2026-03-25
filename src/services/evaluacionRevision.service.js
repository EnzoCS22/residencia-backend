const pool = require('../config/db');

async function getRevisionByEmpleadoSprint(id_empleado, id_sprint) {
  const empleadoResult = await pool.query(
    `
    SELECT id_usuario, nombre, correo, rol, activo, id_grupo
    FROM usuarios
    WHERE id_usuario = $1
    LIMIT 1
    `,
    [id_empleado]
  );

  if (empleadoResult.rows.length === 0) {
    const error = new Error('Empleado no encontrado');
    error.status = 404;
    throw error;
  }

  const sprintResult = await pool.query(
    `
    SELECT id_sprint, nombre_sprint, fecha_inicio, fecha_fin, estado
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
    [id_empleado, id_sprint]
  );

  const tareasResult = await pool.query(
    `
    SELECT
      t.id_tarea,
      t.nombre_tarea,
      t.descripcion,
      t.fecha_asignacion,
      t.fecha_limite,
      t.estatus,
      rt.id_revision_tarea,
      rt.cumplimiento,
      rt.comentario
    FROM tareas t
    LEFT JOIN evaluaciones e
      ON e.id_empleado = t.id_empleado
     AND e.id_sprint = t.id_sprint
    LEFT JOIN revision_tareas rt
      ON rt.id_evaluacion = e.id_evaluacion
     AND rt.id_tarea = t.id_tarea
    WHERE t.id_empleado = $1
      AND t.id_sprint = $2
    ORDER BY t.id_tarea ASC
    `,
    [id_empleado, id_sprint]
  );

  return {
    empleado: empleadoResult.rows[0],
    sprint: sprintResult.rows[0],
    evaluacion: evaluacionResult.rows[0] || null,
    tareas: tareasResult.rows
  };
}

async function saveRevision(data) {
  const {
    id_empleado,
    id_sprint,
    comentario_general = null,
    detalles = []
  } = data;

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const tareasEmpleadoSprint = await client.query(
      `
      SELECT id_tarea
      FROM tareas
      WHERE id_empleado = $1
        AND id_sprint = $2
      `,
      [id_empleado, id_sprint]
    );

    const tareasValidas = new Set(tareasEmpleadoSprint.rows.map((r) => Number(r.id_tarea)));

    for (const detalle of detalles) {
      if (!tareasValidas.has(Number(detalle.id_tarea))) {
        const error = new Error(
          `La tarea ${detalle.id_tarea} no pertenece al empleado ${id_empleado} en el sprint ${id_sprint}`
        );
        error.status = 400;
        throw error;
      }
    }

    const tareasHechasResult = await client.query(
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

    const totalTareas = Number(tareasHechasResult.rows[0].total_tareas || 0);
    const tareasHechas = Number(tareasHechasResult.rows[0].tareas_hechas || 0);
    const porcentaje =
      totalTareas === 0 ? 0 : Number(((tareasHechas / totalTareas) * 100).toFixed(2));

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
      RETURNING *
      `,
      [id_empleado, id_sprint, porcentaje, comentario_general]
    );

    const evaluacion = evaluacionResult.rows[0];

    for (const detalle of detalles) {
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
          detalle.id_tarea,
          detalle.cumplimiento,
          detalle.comentario || null
        ]
      );
    }

    await client.query('COMMIT');

    return {
      evaluacion,
      total_tareas: totalTareas,
      tareas_hechas: tareasHechas,
      porcentaje_cumplimiento: porcentaje
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
  saveRevision
};
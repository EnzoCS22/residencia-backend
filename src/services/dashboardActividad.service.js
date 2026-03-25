const pool = require('../config/db');

async function getDashboardActividadReciente(limit = 10) {
  const safeLimit = Number(limit) > 0 ? Number(limit) : 10;

  const query = `
    SELECT *
    FROM (
      SELECT
        'usuario' AS tipo,
        u.id_usuario::text AS referencia_id,
        ('Nuevo usuario registrado: ' || u.nombre) AS titulo,
        ('Correo: ' || u.correo || ' | Rol: ' || u.rol::text) AS descripcion,
        u.fecha_registro AS fecha
      FROM usuarios u

      UNION ALL

      SELECT
        'sprint' AS tipo,
        s.id_sprint::text AS referencia_id,
        ('Sprint creado: ' || s.nombre_sprint) AS titulo,
        ('Periodo: ' || s.fecha_inicio::text || ' a ' || s.fecha_fin::text) AS descripcion,
        NOW() - ((100000 - s.id_sprint) * INTERVAL '1 second') AS fecha
      FROM sprints s

      UNION ALL

      SELECT
        'tarea' AS tipo,
        t.id_tarea::text AS referencia_id,
        ('Tarea registrada: ' || t.nombre_tarea) AS titulo,
        ('Empleado ID: ' || t.id_empleado::text || ' | Estatus: ' || t.estatus::text) AS descripcion,
        t.fecha_asignacion::timestamp AS fecha
      FROM tareas t

      UNION ALL

      SELECT
        'evaluacion' AS tipo,
        e.id_evaluacion::text AS referencia_id,
        ('Evaluación realizada para empleado ID: ' || e.id_empleado::text) AS titulo,
        ('Sprint ID: ' || e.id_sprint::text || ' | Cumplimiento: ' || e.porcentaje_cumplimiento::text || '%') AS descripcion,
        e.fecha_evaluacion AS fecha
      FROM evaluaciones e
    ) actividad
    ORDER BY fecha DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [safeLimit]);
  return result.rows;
}

module.exports = {
  getDashboardActividadReciente
};
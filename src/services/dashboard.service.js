const pool = require('../config/db');

async function getDashboardResumen(filters) {
  const { sprint, grupo, dateFrom, dateTo } = filters;

  const conditions = [];
  const values = [];
  let index = 1;

  if (sprint) {
    conditions.push(`t.id_sprint = $${index}`);
    values.push(Number(sprint));
    index++;
  }

  if (grupo) {
    conditions.push(`u.id_grupo = $${index}`);
    values.push(Number(grupo));
    index++;
  }

  if (dateFrom) {
    conditions.push(`t.fecha_asignacion >= $${index}`);
    values.push(dateFrom);
    index++;
  }

  if (dateTo) {
    conditions.push(`t.fecha_asignacion <= $${index}`);
    values.push(dateTo);
    index++;
  }

  const whereClause = conditions.length > 0
    ? `WHERE ${conditions.join(' AND ')}`
    : '';

  const statsQuery = `
    SELECT
      COUNT(t.id_tarea)::int AS total_tareas,
      COUNT(*) FILTER (WHERE t.estatus = 'pendiente')::int AS pendientes,
      COUNT(*) FILTER (WHERE t.estatus = 'en_progreso')::int AS en_progreso,
      COUNT(*) FILTER (WHERE t.estatus = 'hecha')::int AS hechas,
      COUNT(DISTINCT u.id_usuario)::int AS total_empleados,
      COUNT(DISTINCT t.id_sprint)::int AS total_sprints,
      COALESCE(
        ROUND(
          (
            COUNT(*) FILTER (WHERE t.estatus = 'hecha')::numeric
            / NULLIF(COUNT(t.id_tarea), 0)
          ) * 100,
          2
        ),
        0
      ) AS cumplimiento_general
    FROM tareas t
    JOIN usuarios u ON u.id_usuario = t.id_empleado
    ${whereClause}
  `;

  const performanceQuery = `
    SELECT
      u.id_usuario,
      u.nombre,
      COUNT(t.id_tarea)::int AS total_tareas,
      COUNT(*) FILTER (WHERE t.estatus = 'hecha')::int AS hechas,
      COALESCE(
        ROUND(
          (
            COUNT(*) FILTER (WHERE t.estatus = 'hecha')::numeric
            / NULLIF(COUNT(t.id_tarea), 0)
          ) * 100,
          2
        ),
        0
      ) AS porcentaje_cumplimiento
    FROM tareas t
    JOIN usuarios u ON u.id_usuario = t.id_empleado
    ${whereClause}
    GROUP BY u.id_usuario, u.nombre
    ORDER BY porcentaje_cumplimiento DESC, u.nombre ASC
  `;

  const groupsQuery = `
    SELECT
      g.id_grupo,
      g.nombre_grupo,
      COUNT(DISTINCT u.id_usuario)::int AS total_miembros,
      COUNT(t.id_tarea)::int AS total_tareas,
      COUNT(*) FILTER (WHERE t.estatus = 'hecha')::int AS tareas_hechas,
      COALESCE(
        ROUND(
          (
            COUNT(*) FILTER (WHERE t.estatus = 'hecha')::numeric
            / NULLIF(COUNT(t.id_tarea), 0)
          ) * 100,
          2
        ),
        0
      ) AS porcentaje_cumplimiento
    FROM grupos g
    LEFT JOIN usuarios u ON u.id_grupo = g.id_grupo
    LEFT JOIN tareas t ON t.id_empleado = u.id_usuario
    ${
      conditions.length > 0
        ? `WHERE ${conditions
            .map((c) => c.replaceAll('u.id_grupo', 'g.id_grupo'))
            .join(' AND ')}`
        : ''
    }
    GROUP BY g.id_grupo, g.nombre_grupo
    ORDER BY g.id_grupo ASC
  `;

  const [statsResult, performanceResult, groupsResult] = await Promise.all([
    pool.query(statsQuery, values),
    pool.query(performanceQuery, values),
    pool.query(groupsQuery, values)
  ]);

  return {
    filtros: {
      sprint: sprint ? Number(sprint) : null,
      grupo: grupo ? Number(grupo) : null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null
    },
    stats: statsResult.rows[0],
    performance: performanceResult.rows,
    groups: groupsResult.rows
  };
}

module.exports = {
  getDashboardResumen
};
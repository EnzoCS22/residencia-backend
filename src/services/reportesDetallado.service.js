const pool = require('../config/db');

async function getReporteDetallado(filters) {
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

  const resumenQuery = `
    SELECT
      COUNT(t.id_tarea)::int AS total_tareas,
      COUNT(*) FILTER (WHERE t.estatus = 'pendiente')::int AS pendientes,
      COUNT(*) FILTER (WHERE t.estatus = 'en_progreso')::int AS en_progreso,
      COUNT(*) FILTER (WHERE t.estatus = 'hecha')::int AS hechas,
      COUNT(DISTINCT u.id_usuario)::int AS total_empleados,
      COUNT(DISTINCT t.id_sprint)::int AS total_sprints
    FROM tareas t
    JOIN usuarios u ON u.id_usuario = t.id_empleado
    ${whereClause}
  `;

  const detalleQuery = `
    SELECT
      u.id_usuario,
      u.nombre,
      u.correo,
      u.rol,
      u.id_grupo,
      g.nombre_grupo,
      COUNT(t.id_tarea)::int AS total_tareas,
      COUNT(*) FILTER (WHERE t.estatus = 'pendiente')::int AS pendientes,
      COUNT(*) FILTER (WHERE t.estatus = 'en_progreso')::int AS en_progreso,
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
    LEFT JOIN grupos g ON g.id_grupo = u.id_grupo
    ${whereClause}
    GROUP BY
      u.id_usuario,
      u.nombre,
      u.correo,
      u.rol,
      u.id_grupo,
      g.nombre_grupo
    ORDER BY porcentaje_cumplimiento DESC, u.nombre ASC
  `;

  const [resumenResult, detalleResult] = await Promise.all([
    pool.query(resumenQuery, values),
    pool.query(detalleQuery, values)
  ]);

  return {
    filtros: {
      sprint: sprint ? Number(sprint) : null,
      grupo: grupo ? Number(grupo) : null,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null
    },
    resumen: resumenResult.rows[0],
    detalle: detalleResult.rows
  };
}

module.exports = {
  getReporteDetallado
};
const pool = require('../config/db');

async function createGrupo(data) {
  const { nombre_grupo, id_lider } = data;

  const liderResult = await pool.query(
    `
    SELECT id_usuario, rol
    FROM usuarios
    WHERE id_usuario = $1
    LIMIT 1
    `,
    [id_lider]
  );

  if (liderResult.rows.length === 0) {
    const error = new Error('El líder indicado no existe');
    error.status = 404;
    throw error;
  }

  if (liderResult.rows[0].rol !== 'lider') {
    const error = new Error('El usuario asignado no tiene rol de líder');
    error.status = 400;
    throw error;
  }

  const query = `
    INSERT INTO grupos (nombre_grupo, id_lider)
    VALUES ($1, $2)
    RETURNING *
  `;

  const result = await pool.query(query, [nombre_grupo, id_lider]);

  return result.rows[0];
}

async function getGrupos() {
  const query = `
    SELECT
      g.id_grupo,
      g.nombre_grupo,
      g.id_lider,
      u.nombre AS nombre_lider,
      u.correo AS correo_lider
    FROM grupos g
    JOIN usuarios u ON u.id_usuario = g.id_lider
    ORDER BY g.id_grupo ASC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function getGrupoById(id) {
  const query = `
    SELECT
      g.id_grupo,
      g.nombre_grupo,
      g.id_lider,
      u.nombre AS nombre_lider,
      u.correo AS correo_lider
    FROM grupos g
    JOIN usuarios u ON u.id_usuario = g.id_lider
    WHERE g.id_grupo = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    const error = new Error('Grupo no encontrado');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

async function asignarLider(id_grupo, id_lider) {
  const grupoResult = await pool.query(
    'SELECT id_grupo FROM grupos WHERE id_grupo = $1 LIMIT 1',
    [id_grupo]
  );

  if (grupoResult.rows.length === 0) {
    const error = new Error('Grupo no encontrado');
    error.status = 404;
    throw error;
  }

  const liderResult = await pool.query(
    `
    SELECT id_usuario, rol
    FROM usuarios
    WHERE id_usuario = $1
    LIMIT 1
    `,
    [id_lider]
  );

  if (liderResult.rows.length === 0) {
    const error = new Error('El líder indicado no existe');
    error.status = 404;
    throw error;
  }

  if (liderResult.rows[0].rol !== 'lider') {
    const error = new Error('El usuario asignado no tiene rol de líder');
    error.status = 400;
    throw error;
  }

  const query = `
    UPDATE grupos
    SET id_lider = $1
    WHERE id_grupo = $2
    RETURNING *
  `;

  const result = await pool.query(query, [id_lider, id_grupo]);

  return result.rows[0];
}

async function getMiembrosByGrupo(id_grupo) {
  const grupoResult = await pool.query(
    'SELECT id_grupo, nombre_grupo FROM grupos WHERE id_grupo = $1 LIMIT 1',
    [id_grupo]
  );

  if (grupoResult.rows.length === 0) {
    const error = new Error('Grupo no encontrado');
    error.status = 404;
    throw error;
  }

  const query = `
    SELECT
      id_usuario,
      nombre,
      correo,
      rol,
      activo,
      fecha_registro,
      id_grupo
    FROM usuarios
    WHERE id_grupo = $1
    ORDER BY id_usuario ASC
  `;

  const result = await pool.query(query, [id_grupo]);

  return {
    grupo: grupoResult.rows[0],
    miembros: result.rows
  };
}

module.exports = {
  createGrupo,
  getGrupos,
  getGrupoById,
  asignarLider,
  getMiembrosByGrupo
};
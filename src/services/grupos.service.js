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

async function asignarMiembros(id_grupo, memberIds) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const grupoResult = await client.query(
      `
      SELECT id_grupo
      FROM grupos
      WHERE id_grupo = $1
      LIMIT 1
      `,
      [id_grupo]
    );

    if (grupoResult.rows.length === 0) {
      const error = new Error('Grupo no encontrado');
      error.status = 404;
      throw error;
    }

    if (!Array.isArray(memberIds)) {
      const error = new Error('memberIds debe ser un arreglo');
      error.status = 400;
      throw error;
    }

    if (memberIds.length > 0) {
      const usuariosResult = await client.query(
        `
        SELECT id_usuario, rol
        FROM usuarios
        WHERE id_usuario = ANY($1::bigint[])
        `,
        [memberIds]
      );

      if (usuariosResult.rows.length !== memberIds.length) {
        const error = new Error('Uno o más usuarios no existen');
        error.status = 404;
        throw error;
      }

      const usuariosInvalidos = usuariosResult.rows.filter(
        (u) => u.rol === 'admin'
      );

      if (usuariosInvalidos.length > 0) {
        const error = new Error('No se puede asignar administradores a un grupo');
        error.status = 400;
        throw error;
      }
    }

    await client.query(
      `
      UPDATE usuarios
      SET id_grupo = NULL
      WHERE id_grupo = $1
        AND rol IN ('lider', 'empleado')
      `,
      [id_grupo]
    );

    if (memberIds.length > 0) {
      await client.query(
        `
        UPDATE usuarios
        SET id_grupo = $1
        WHERE id_usuario = ANY($2::bigint[])
        `,
        [id_grupo, memberIds]
      );
    }

    const miembrosResult = await client.query(
      `
      SELECT
        id_usuario,
        nombre,
        correo,
        rol,
        activo,
        id_grupo
      FROM usuarios
      WHERE id_grupo = $1
      ORDER BY id_usuario ASC
      `,
      [id_grupo]
    );

    await client.query('COMMIT');

    return {
      id_grupo: Number(id_grupo),
      miembros: miembrosResult.rows
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  }

module.exports = {
  createGrupo,
  getGrupos,
  getGrupoById,
  asignarLider,
  getMiembrosByGrupo,
  asignarMiembros
};
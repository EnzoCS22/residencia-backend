const bcrypt = require('bcrypt');
const pool = require('../config/db');

async function createUsuario(data) {
  const {
    nombre,
    correo,
    password,
    rol,
    activo = true,
    id_grupo = null
  } = data;

  const existingUser = await pool.query(
    'SELECT id_usuario FROM usuarios WHERE correo = $1 LIMIT 1',
    [correo]
  );

  if (existingUser.rows.length > 0) {
    const error = new Error('Ya existe un usuario con ese correo');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const query = `
    INSERT INTO usuarios (
      nombre,
      correo,
      password_hash,
      rol,
      activo,
      id_grupo
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id_usuario, nombre, correo, rol, activo, fecha_registro, id_grupo
  `;

  const values = [nombre, correo, passwordHash, rol, activo, id_grupo];
  const result = await pool.query(query, values);

  return result.rows[0];
}

async function getUsuarios() {
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
    ORDER BY id_usuario ASC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function getUsuarioById(id) {
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
    WHERE id_usuario = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

async function updateUsuario(id, data) {
  const usuarioActual = await pool.query(
    `
    SELECT id_usuario, correo, id_grupo
    FROM usuarios
    WHERE id_usuario = $1
    LIMIT 1
    `,
    [id]
  );

  if (usuarioActual.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  const {
    nombre,
    correo,
    password,
    rol,
    activo,
    id_grupo
  } = data;

  if (correo && correo !== usuarioActual.rows[0].correo) {
    const correoExistente = await pool.query(
      `
      SELECT id_usuario
      FROM usuarios
      WHERE correo = $1
        AND id_usuario <> $2
      LIMIT 1
      `,
      [correo, id]
    );

    if (correoExistente.rows.length > 0) {
      const error = new Error('Ya existe un usuario con ese correo');
      error.status = 409;
      throw error;
    }
  }

  let passwordHash = null;
  if (password) {
    passwordHash = await bcrypt.hash(password, 10);
  }

  const query = `
    UPDATE usuarios
    SET
      nombre = COALESCE($1, nombre),
      correo = COALESCE($2, correo),
      password_hash = COALESCE($3, password_hash),
      rol = COALESCE($4, rol),
      activo = COALESCE($5, activo),
      id_grupo = $6
    WHERE id_usuario = $7
    RETURNING id_usuario, nombre, correo, rol, activo, fecha_registro, id_grupo
  `;

  const result = await pool.query(query, [
    nombre ?? null,
    correo ?? null,
    passwordHash,
    rol ?? null,
    typeof activo === 'boolean' ? activo : null,
    id_grupo !== undefined ? id_grupo : usuarioActual.rows[0].id_grupo ?? null,
    id
  ]);

  return result.rows[0];
}

async function desactivarUsuario(id) {
  const query = `
    UPDATE usuarios
    SET activo = FALSE
    WHERE id_usuario = $1
    RETURNING id_usuario, nombre, correo, rol, activo, fecha_registro, id_grupo
  `;

  const result = await pool.query(query, [id]);

  if (result.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

async function updateUsuarioRol(id, data) {
  const { rol, id_grupo } = data;

  const usuarioResult = await pool.query(
    `
    SELECT id_usuario, nombre, correo, rol, activo, fecha_registro, id_grupo
    FROM usuarios
    WHERE id_usuario = $1
    LIMIT 1
    `,
    [id]
  );

  if (usuarioResult.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  if (rol === 'admin' && id_grupo !== null && id_grupo !== undefined) {
    const error = new Error('Un administrador no debe pertenecer a un grupo');
    error.status = 400;
    throw error;
  }

  if (id_grupo !== null && id_grupo !== undefined) {
    const grupoResult = await pool.query(
      `
      SELECT id_grupo
      FROM grupos
      WHERE id_grupo = $1
      LIMIT 1
      `,
      [id_grupo]
    );

    if (grupoResult.rows.length === 0) {
      const error = new Error('El grupo indicado no existe');
      error.status = 404;
      throw error;
    }
  }

  const result = await pool.query(
    `
    UPDATE usuarios
    SET
      rol = $1,
      id_grupo = $2
    WHERE id_usuario = $3
    RETURNING id_usuario, nombre, correo, rol, activo, fecha_registro, id_grupo
    `,
    [rol, id_grupo ?? null, id]
  );

  return result.rows[0];
}

module.exports = {
  createUsuario,
  getUsuarios,
  getUsuarioById,
  updateUsuario,
  desactivarUsuario,
  updateUsuarioRol
};
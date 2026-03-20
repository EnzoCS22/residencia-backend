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

  const result = await pool.query(query, [
    nombre,
    correo,
    passwordHash,
    rol,
    activo,
    id_grupo
  ]);

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

module.exports = {
  createUsuario,
  getUsuarios
};
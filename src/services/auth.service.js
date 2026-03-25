const bcrypt = require('bcrypt');
const pool = require('../config/db');
const { generateToken } = require('../utils/jwt');

async function login({ correo, password }) {
  const query = `
    SELECT
      id_usuario,
      nombre,
      correo,
      password_hash,
      rol,
      activo,
      id_grupo
    FROM usuarios
    WHERE correo = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [correo]);

  if (result.rows.length === 0) {
    const error = new Error('Credenciales incorrectas');
    error.status = 401;
    throw error;
  }

  const usuario = result.rows[0];

  if (!usuario.activo) {
    const error = new Error('La cuenta está inactiva');
    error.status = 403;
    throw error;
  }

  const passwordMatch = await bcrypt.compare(password, usuario.password_hash);

  if (!passwordMatch) {
    const error = new Error('Credenciales incorrectas');
    error.status = 401;
    throw error;
  }

  const token = generateToken({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    rol: usuario.rol
  });

  return {
    token,
    usuario: {
      id_usuario: usuario.id_usuario,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      id_grupo: usuario.id_grupo
    }
  };
}

async function register({ nombre, correo, password, rol = 'empleado' }) {
  const existingUser = await pool.query(
    `
    SELECT id_usuario
    FROM usuarios
    WHERE correo = $1
    LIMIT 1
    `,
    [correo]
  );

  if (existingUser.rows.length > 0) {
    const error = new Error('Ya existe una cuenta con ese correo');
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
    VALUES ($1, $2, $3, $4, TRUE, NULL)
    RETURNING id_usuario, nombre, correo, rol, activo, fecha_registro, id_grupo
  `;

  const result = await pool.query(query, [
    nombre,
    correo,
    passwordHash,
    rol
  ]);

  const usuario = result.rows[0];

  const token = generateToken({
    id_usuario: usuario.id_usuario,
    correo: usuario.correo,
    rol: usuario.rol
  });

  return {
    token,
    usuario
  };
}

async function getMe(id_usuario) {
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

  const result = await pool.query(query, [id_usuario]);

  if (result.rows.length === 0) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  return result.rows[0];
}

async function forgotPassword({ correo }) {
  const query = `
    SELECT id_usuario, correo, activo
    FROM usuarios
    WHERE correo = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [correo]);

  return {
    exists: result.rows.length > 0
  };
}

async function resetPassword({ correo, password }) {
  const userResult = await pool.query(
    `
    SELECT id_usuario
    FROM usuarios
    WHERE correo = $1
    LIMIT 1
    `,
    [correo]
  );

  if (userResult.rows.length === 0) {
    const error = new Error('No existe una cuenta con ese correo');
    error.status = 404;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const result = await pool.query(
    `
    UPDATE usuarios
    SET password_hash = $1
    WHERE correo = $2
    RETURNING id_usuario, nombre, correo, rol, activo, fecha_registro, id_grupo
    `,
    [passwordHash, correo]
  );

  return result.rows[0];
}

module.exports = {
  login,
  register,
  getMe,
  forgotPassword,
  resetPassword
};

  
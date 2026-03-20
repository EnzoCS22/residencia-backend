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

module.exports = {
  login
};
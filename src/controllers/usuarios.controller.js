const Joi = require('joi');
const usuariosService = require('../services/usuarios.service');

const createUsuarioSchema = Joi.object({
  nombre: Joi.string().max(120).required(),
  correo: Joi.string().email().max(160).required(),
  password: Joi.string().min(6).required(),
  rol: Joi.string().valid('admin', 'lider', 'empleado').required(),
  activo: Joi.boolean().optional(),
  id_grupo: Joi.number().integer().allow(null).optional()
});

async function createUsuario(req, res, next) {
  try {
    const { error, value } = createUsuarioSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const usuario = await usuariosService.createUsuario(value);

    res.status(201).json({
      ok: true,
      message: 'Usuario creado correctamente',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
}

async function getUsuarios(req, res, next) {
  try {
    const usuarios = await usuariosService.getUsuarios();

    res.status(200).json({
      ok: true,
      data: usuarios
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUsuario,
  getUsuarios
};
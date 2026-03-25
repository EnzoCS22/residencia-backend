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

const updateUsuarioSchema = Joi.object({
  nombre: Joi.string().max(120).optional(),
  correo: Joi.string().email().max(160).optional(),
  password: Joi.string().min(6).optional(),
  rol: Joi.string().valid('admin', 'lider', 'empleado').optional(),
  activo: Joi.boolean().optional(),
  id_grupo: Joi.number().integer().allow(null).optional()
}).min(1);

const updateUsuarioRolSchema = Joi.object({
  rol: Joi.string().valid('admin', 'lider', 'empleado').required(),
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

async function getUsuarioById(req, res, next) {
  try {
    const usuario = await usuariosService.getUsuarioById(req.params.id);

    res.status(200).json({
      ok: true,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
}

async function updateUsuario(req, res, next) {
  try {
    const { error, value } = updateUsuarioSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const usuario = await usuariosService.updateUsuario(req.params.id, value);

    res.status(200).json({
      ok: true,
      message: 'Usuario actualizado correctamente',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
}

async function desactivarUsuario(req, res, next) {
  try {
    const usuario = await usuariosService.desactivarUsuario(req.params.id);

    res.status(200).json({
      ok: true,
      message: 'Usuario desactivado correctamente',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
}

async function updateUsuarioRol(req, res, next) {
  try {
    const { error, value } = updateUsuarioRolSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const usuario = await usuariosService.updateUsuarioRol(req.params.id, value);

    res.status(200).json({
      ok: true,
      message: 'Rol de usuario actualizado correctamente',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createUsuario,
  getUsuarios,
  getUsuarioById,
  updateUsuario,
  desactivarUsuario,
  updateUsuarioRol
};
const Joi = require('joi');
const gruposService = require('../services/grupos.service');

const createGrupoSchema = Joi.object({
  nombre_grupo: Joi.string().max(120).required(),
  id_lider: Joi.number().integer().required()
});

const asignarLiderSchema = Joi.object({
  id_lider: Joi.number().integer().required()
});

const asignarMiembrosSchema = Joi.object({
  memberIds: Joi.array()
    .items(Joi.number().integer().positive())
    .required()
});

async function createGrupo(req, res, next) {
  try {
    const { error, value } = createGrupoSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const grupo = await gruposService.createGrupo(value);

    res.status(201).json({
      ok: true,
      message: 'Grupo creado correctamente',
      data: grupo
    });
  } catch (error) {
    next(error);
  }
}

async function getGrupos(req, res, next) {
  try {
    const grupos = await gruposService.getGrupos();

    res.status(200).json({
      ok: true,
      data: grupos
    });
  } catch (error) {
    next(error);
  }
}

async function getGrupoById(req, res, next) {
  try {
    const grupo = await gruposService.getGrupoById(req.params.id);

    res.status(200).json({
      ok: true,
      data: grupo
    });
  } catch (error) {
    next(error);
  }
}

async function asignarLider(req, res, next) {
  try {
    const { error, value } = asignarLiderSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const grupo = await gruposService.asignarLider(req.params.id, value.id_lider);

    res.status(200).json({
      ok: true,
      message: 'Líder asignado correctamente',
      data: grupo
    });
  } catch (error) {
    next(error);
  }
}

async function getMiembrosByGrupo(req, res, next) {
  try {
    const data = await gruposService.getMiembrosByGrupo(req.params.id);

    res.status(200).json({
      ok: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function asignarMiembros(req, res, next) {
  try {
    const { error, value } = asignarMiembrosSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const data = await gruposService.asignarMiembros(
      req.params.id,
      value.memberIds
    );

    res.status(200).json({
      ok: true,
      message: 'Miembros actualizados correctamente',
      data
    });
  } catch (error) {
    next(error);
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
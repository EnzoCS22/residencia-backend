const Joi = require('joi');
const sprintsService = require('../services/sprints.service');

const createSprintSchema = Joi.object({
  nombre_sprint: Joi.string().max(140).required(),
  fecha_inicio: Joi.date().required(),
  fecha_fin: Joi.date().required()
});

const updateSprintSchema = Joi.object({
  nombre_sprint: Joi.string().max(140).optional(),
  fecha_inicio: Joi.date().optional(),
  fecha_fin: Joi.date().optional(),
  estado: Joi.string().valid('activo', 'cerrado').optional()
}).min(1);

async function createSprint(req, res, next) {
  try {
    const { error, value } = createSprintSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const sprint = await sprintsService.createSprint(value);

    res.status(201).json({
      ok: true,
      message: 'Sprint creado correctamente',
      data: sprint
    });
  } catch (error) {
    next(error);
  }
}

async function getSprints(req, res, next) {
  try {
    const sprints = await sprintsService.getSprints();

    res.status(200).json({
      ok: true,
      data: sprints
    });
  } catch (error) {
    next(error);
  }
}

async function getSprintById(req, res, next) {
  try {
    const sprint = await sprintsService.getSprintById(req.params.id);

    res.status(200).json({
      ok: true,
      data: sprint
    });
  } catch (error) {
    next(error);
  }
}

async function closeSprint(req, res, next) {
  try {
    const sprint = await sprintsService.closeSprint(req.params.id);

    res.status(200).json({
      ok: true,
      message: 'Sprint cerrado correctamente',
      data: sprint
    });
  } catch (error) {
    next(error);
  }
}

async function updateSprint(req, res, next) {
  try {
    const { error, value } = updateSprintSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const sprint = await sprintsService.updateSprint(req.params.id, value);

    res.status(200).json({
      ok: true,
      message: 'Sprint actualizado correctamente',
      data: sprint
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createSprint,
  getSprints,
  getSprintById,
  closeSprint,
  updateSprint
};
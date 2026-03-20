const Joi = require('joi');
const evaluacionesService = require('../services/evaluaciones.service');

const createEvaluacionSchema = Joi.object({
  id_empleado: Joi.number().integer().required(),
  id_sprint: Joi.number().integer().required(),
  porcentaje_cumplimiento: Joi.number().min(0).max(100).required(),
  comentario_general: Joi.string().allow('', null).optional()
});

const calcularEvaluacionSchema = Joi.object({
  id_empleado: Joi.number().integer().required(),
  id_sprint: Joi.number().integer().required(),
  comentario_general: Joi.string().allow('', null).optional()
});

async function createEvaluacion(req, res, next) {
  try {
    const { error, value } = createEvaluacionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const evaluacion = await evaluacionesService.createEvaluacion(value);

    res.status(201).json({
      ok: true,
      message: 'Evaluación guardada correctamente',
      data: evaluacion
    });
  } catch (error) {
    next(error);
  }
}

async function getEvaluaciones(req, res, next) {
  try {
    const evaluaciones = await evaluacionesService.getEvaluaciones();

    res.status(200).json({
      ok: true,
      data: evaluaciones
    });
  } catch (error) {
    next(error);
  }
}

async function getEvaluacionesByEmpleado(req, res, next) {
  try {
    const evaluaciones = await evaluacionesService.getEvaluacionesByEmpleado(
      req.params.id_empleado
    );

    res.status(200).json({
      ok: true,
      data: evaluaciones
    });
  } catch (error) {
    next(error);
  }
}

async function getEvaluacionesBySprint(req, res, next) {
  try {
    const evaluaciones = await evaluacionesService.getEvaluacionesBySprint(
      req.params.id_sprint
    );

    res.status(200).json({
      ok: true,
      data: evaluaciones
    });
  } catch (error) {
    next(error);
  }
}

async function calcularEvaluacion(req, res, next) {
  try {
    const { error, value } = calcularEvaluacionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const resultado = await evaluacionesService.calcularEvaluacion(value);

    res.status(200).json({
      ok: true,
      message: 'Evaluación calculada correctamente',
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createEvaluacion,
  getEvaluaciones,
  getEvaluacionesByEmpleado,
  getEvaluacionesBySprint,
  calcularEvaluacion
};
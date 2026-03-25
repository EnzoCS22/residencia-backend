const Joi = require('joi');
const dashboardService = require('../services/dashboard.service');
const dashboardActividadService = require('../services/dashboardActividad.service');

const filtrosSchema = Joi.object({
  sprint: Joi.number().integer().positive().optional(),
  grupo: Joi.number().integer().positive().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional()
});

const actividadSchema = Joi.object({
  limit: Joi.number().integer().positive().max(50).optional()
});

async function getDashboardResumen(req, res, next) {
  try {
    const { error, value } = filtrosSchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const data = await dashboardService.getDashboardResumen(value);

    res.status(200).json({
      ok: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

async function getDashboardActividadReciente(req, res, next) {
  try {
    const { error, value } = actividadSchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const data = await dashboardActividadService.getDashboardActividadReciente(
      value.limit || 10
    );

    res.status(200).json({
      ok: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getDashboardResumen,
  getDashboardActividadReciente
};
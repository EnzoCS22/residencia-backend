const Joi = require('joi');
const reportesDetalladoService = require('../services/reportesDetallado.service');

const filtrosSchema = Joi.object({
  sprint: Joi.number().integer().positive().optional(),
  grupo: Joi.number().integer().positive().optional(),
  dateFrom: Joi.date().iso().optional(),
  dateTo: Joi.date().iso().optional()
});

async function getReporteDetallado(req, res, next) {
  try {
    const { error, value } = filtrosSchema.validate(req.query);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const data = await reportesDetalladoService.getReporteDetallado(value);

    res.status(200).json({
      ok: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReporteDetallado
};
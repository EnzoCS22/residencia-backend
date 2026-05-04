const Joi = require("joi");
const evaluacionesRevisionService = require("../services/evaluacionesRevision.service");

const saveRevisionSchema = Joi.object({
  id_empleado: Joi.number().integer().required(),
  id_sprint: Joi.number().integer().required(),
  comentario_general: Joi.string().allow("", null).optional(),
  tareas: Joi.array()
    .items(
      Joi.object({
        id_tarea: Joi.number().integer().required(),
        cumplimiento: Joi.string()
          .valid("cumplio", "no_cumplio", "na")
          .required(),
        comentario: Joi.string().allow("", null).optional(),
      }),
    )
    .required(),
});

async function getRevisionByEmpleadoSprint(req, res, next) {
  try {
    const { id_empleado, id_sprint } = req.params;

    const data = await evaluacionesRevisionService.getRevisionByEmpleadoSprint(
      id_empleado,
      id_sprint,
    );

    res.status(200).json({
      ok: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

async function saveRevision(req, res, next) {
  try {
    const { error, value } = saveRevisionSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message,
      });
    }

    const data = await evaluacionesRevisionService.saveRevision(value);

    res.status(200).json({
      ok: true,
      message: "Revisión guardada correctamente",
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getRevisionByEmpleadoSprint,
  saveRevision,
};

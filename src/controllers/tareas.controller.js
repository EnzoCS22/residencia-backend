const Joi = require('joi');
const tareasService = require('../services/tareas.service');

const createTareaSchema = Joi.object({
  nombre_tarea: Joi.string().max(160).required(),
  descripcion: Joi.string().required(),
  fecha_asignacion: Joi.date().required(),
  fecha_limite: Joi.date().allow(null),
  estatus: Joi.string()
    .valid('pendiente', 'en_progreso', 'hecha')
    .default('pendiente'),
  id_sprint: Joi.number().integer().required(),
  id_empleado: Joi.number().integer().required()
});

const updateEstatusSchema = Joi.object({
  estatus: Joi.string()
    .valid('pendiente', 'en_progreso', 'hecha')
    .required()
});

async function createTarea(req, res, next) {
  try {
    const { error, value } = createTareaSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const tarea = await tareasService.createTarea(value);

    res.status(201).json({
      ok: true,
      message: 'Tarea creada correctamente',
      data: tarea
    });
  } catch (error) {
    next(error);
  }
}

async function getTareas(req, res, next) {
  try {
    const tareas = await tareasService.getTareas();

    res.status(200).json({
      ok: true,
      data: tareas
    });
  } catch (error) {
    next(error);
  }
}

async function getTareasBySprint(req, res, next) {
  try {
    const tareas = await tareasService.getTareasBySprint(req.params.id_sprint);

    res.status(200).json({
      ok: true,
      data: tareas
    });
  } catch (error) {
    next(error);
  }
}

async function getTareasByEmpleado(req, res, next) {
  try {
    const tareas = await tareasService.getTareasByEmpleado(req.params.id_empleado);

    res.status(200).json({
      ok: true,
      data: tareas
    });
  } catch (error) {
    next(error);
  }
}

async function updateEstatusTarea(req, res, next) {
  try {
    const { error, value } = updateEstatusSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const tarea = await tareasService.updateEstatusTarea(
      req.params.id,
      value.estatus
    );

    res.status(200).json({
      ok: true,
      message: 'Estatus actualizado correctamente',
      data: tarea
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createTarea,
  getTareas,
  getTareasBySprint,
  getTareasByEmpleado,
  updateEstatusTarea
};
const miDesempenoSprintService = require('../services/miDesempenoSprint.service');

async function getMiDesempenoPorSprint(req, res, next) {
  try {
    const id_usuario = req.user.id_usuario;
    const { id_sprint } = req.params;

    const data = await miDesempenoSprintService.getMiDesempenoPorSprint(
      id_usuario,
      id_sprint
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
  getMiDesempenoPorSprint
};
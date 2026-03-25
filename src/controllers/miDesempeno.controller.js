const miDesempenoService = require('../services/miDesempeno.service');

async function getMiDesempeno(req, res, next) {
  try {
    const data = await miDesempenoService.getMiDesempeno(req.user.id_usuario);

    res.status(200).json({
      ok: true,
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getMiDesempeno
};
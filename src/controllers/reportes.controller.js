const reportesService = require('../services/reportes.service');

async function getReporteGeneral(req, res, next) {
  try {
    const reporte = await reportesService.getReporteGeneral();

    res.status(200).json({
      ok: true,
      data: reporte
    });
  } catch (error) {
    next(error);
  }
}

async function getReporteSprint(req, res, next) {
  try {
    const reporte = await reportesService.getReporteSprint(req.params.id_sprint);

    res.status(200).json({
      ok: true,
      data: reporte
    });
  } catch (error) {
    next(error);
  }
}

async function getReporteEmpleado(req, res, next) {
  try {
    const reporte = await reportesService.getReporteEmpleado(req.params.id_empleado);

    res.status(200).json({
      ok: true,
      data: reporte
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getReporteGeneral,
  getReporteSprint,
  getReporteEmpleado
};
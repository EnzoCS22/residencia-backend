const express = require('express');
const router = express.Router();

const reportesController = require('../controllers/reportes.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

router.get(
  '/general',
  authenticateToken,
  authorizeRoles('admin'),
  reportesController.getReporteGeneral
);

router.get(
  '/sprint/:id_sprint',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  reportesController.getReporteSprint
);

router.get(
  '/empleado/:id_empleado',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  reportesController.getReporteEmpleado
);

module.exports = router;
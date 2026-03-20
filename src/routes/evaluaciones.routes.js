const express = require('express');
const router = express.Router();

const evaluacionesController = require('../controllers/evaluaciones.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  evaluacionesController.createEvaluacion
);

router.get(
  '/',
  authenticateToken,
  evaluacionesController.getEvaluaciones
);

router.get(
  '/empleado/:id_empleado',
  authenticateToken,
  evaluacionesController.getEvaluacionesByEmpleado
);

router.get(
  '/sprint/:id_sprint',
  authenticateToken,
  evaluacionesController.getEvaluacionesBySprint
);

router.post(
  '/calcular',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  evaluacionesController.calcularEvaluacion
);

module.exports = router;
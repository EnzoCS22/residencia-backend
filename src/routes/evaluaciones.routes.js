const express = require('express');
const router = express.Router();

const evaluacionesController = require('../controllers/evaluaciones.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

// Crear evaluación manual
router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  evaluacionesController.createEvaluacion
);

// Obtener todas las evaluaciones
router.get(
  '/',
  authenticateToken,
  evaluacionesController.getEvaluaciones
);

// Obtener evaluaciones por empleado
router.get(
  '/empleado/:id_empleado',
  authenticateToken,
  evaluacionesController.getEvaluacionesByEmpleado
);

// 🔥 IMPORTANTE: esta es la que usa tu pantalla de Evaluación Admin
router.get(
  '/sprint/:id_sprint',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  evaluacionesController.getEvaluacionesBySprintForLeader
);

// Calcular evaluación automática (basada en tareas)
router.post(
  '/calcular',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  evaluacionesController.calcularEvaluacion
);

module.exports = router;
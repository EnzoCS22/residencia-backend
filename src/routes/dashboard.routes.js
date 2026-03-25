const express = require('express');
const router = express.Router();

const dashboardController = require('../controllers/dashboard.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

router.get(
  '/resumen',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  dashboardController.getDashboardResumen
);

router.get(
  '/actividad-reciente',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  dashboardController.getDashboardActividadReciente
);

module.exports = router;
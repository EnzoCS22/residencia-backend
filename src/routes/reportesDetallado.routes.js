const express = require('express');
const router = express.Router();

const reportesDetalladoController = require('../controllers/reportesDetallado.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  reportesDetalladoController.getReporteDetallado
);

module.exports = router;
const express = require('express');
const router = express.Router();

const evaluacionesRevisionController = require('../controllers/evaluacionesRevision.controller');
const {
  authenticateToken,
  authorizeRoles,
} = require('../middlewares/auth.middleware');

router.get(
  '/:id_empleado/:id_sprint',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  evaluacionesRevisionController.getRevisionByEmpleadoSprint
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  evaluacionesRevisionController.saveRevision
);

module.exports = router;
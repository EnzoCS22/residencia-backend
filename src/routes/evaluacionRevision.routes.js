const express = require('express');
const router = express.Router();

const evaluacionRevisionController = require('../controllers/evaluacionRevision.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

router.get(
  '/:id_empleado/:id_sprint',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  evaluacionRevisionController.getRevisionByEmpleadoSprint
);

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  evaluacionRevisionController.saveRevision
);

module.exports = router;
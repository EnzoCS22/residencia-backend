const express = require('express');
const router = express.Router();

const tareasController = require('../controllers/tareas.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  tareasController.createTarea
);

router.get(
  '/',
  authenticateToken,
  tareasController.getTareas
);

router.get(
  '/sprint/:id_sprint',
  authenticateToken,
  tareasController.getTareasBySprint
);

router.get(
  '/empleado/:id_empleado',
  authenticateToken,
  tareasController.getTareasByEmpleado
);

router.patch(
  '/:id/estatus',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  tareasController.updateEstatusTarea
);

module.exports = router;
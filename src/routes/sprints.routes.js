const express = require('express');
const router = express.Router();

const sprintsController = require('../controllers/sprints.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  sprintsController.createSprint
);

router.get(
  '/',
  authenticateToken,
  sprintsController.getSprints
);

router.get(
  '/:id',
  authenticateToken,
  sprintsController.getSprintById
);

router.patch(
  '/:id/cerrar',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  sprintsController.closeSprint
);

router.patch(
  '/:id',
  authenticateToken,
  authorizeRoles('admin', 'lider'),
  sprintsController.updateSprint
);

module.exports = router;
const express = require('express');
const router = express.Router();

const gruposController = require('../controllers/grupos.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  gruposController.createGrupo
);

router.get(
  '/',
  authenticateToken,
  gruposController.getGrupos
);

router.get(
  '/:id',
  authenticateToken,
  gruposController.getGrupoById
);

router.patch(
  '/:id/asignar-lider',
  authenticateToken,
  authorizeRoles('admin'),
  gruposController.asignarLider
);

router.patch(
  '/:id/miembros',
  authenticateToken,
  authorizeRoles('admin'),
  gruposController.asignarMiembros
);

router.get(
  '/:id/miembros',
  authenticateToken,
  gruposController.getMiembrosByGrupo
);

module.exports = router;
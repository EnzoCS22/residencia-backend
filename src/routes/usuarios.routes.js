const express = require('express');
const router = express.Router();

const usuariosController = require('../controllers/usuarios.controller');
const {
  authenticateToken,
  authorizeRoles
} = require('../middlewares/auth.middleware');

router.post(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  usuariosController.createUsuario
);

router.get(
  '/',
  authenticateToken,
  authorizeRoles('admin'),
  usuariosController.getUsuarios
);

router.get(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  usuariosController.getUsuarioById
);

router.patch(
  '/:id',
  authenticateToken,
  authorizeRoles('admin'),
  usuariosController.updateUsuario
);

router.patch(
  '/:id/desactivar',
  authenticateToken,
  authorizeRoles('admin'),
  usuariosController.desactivarUsuario
);

router.patch(
  '/:id/rol',
  authenticateToken,
  authorizeRoles('admin'),
  usuariosController.updateUsuarioRol
);

module.exports = router;
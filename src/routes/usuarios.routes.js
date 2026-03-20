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

module.exports = router;
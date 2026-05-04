const express = require('express');
const router = express.Router();

const miDesempenoSprintController = require('../controllers/miDesempenoSprint.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get(
  '/:id_sprint',
  authenticateToken,
  miDesempenoSprintController.getMiDesempenoPorSprint
);

module.exports = router;
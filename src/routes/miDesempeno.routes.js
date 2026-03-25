const express = require('express');
const router = express.Router();

const miDesempenoController = require('../controllers/miDesempeno.controller');
const { authenticateToken } = require('../middlewares/auth.middleware');

router.get('/', authenticateToken, miDesempenoController.getMiDesempeno);

module.exports = router;
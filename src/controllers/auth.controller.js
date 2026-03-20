const Joi = require('joi');
const authService = require('../services/auth.service');

const loginSchema = Joi.object({
  correo: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const data = await authService.login(value);

    res.status(200).json({
      ok: true,
      message: 'Inicio de sesión exitoso',
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login
};
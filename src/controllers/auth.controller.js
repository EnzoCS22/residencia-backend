const Joi = require('joi');
const authService = require('../services/auth.service');

const loginSchema = Joi.object({
  correo: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

const registerSchema = Joi.object({
  nombre: Joi.string().max(120).required(),
  correo: Joi.string().email().max(160).required(),
  password: Joi.string().min(6).required(),
  rol: Joi.string().valid('empleado').default('empleado')
});

const forgotPasswordSchema = Joi.object({
  correo: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
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

async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const data = await authService.register(value);

    res.status(201).json({
      ok: true,
      message: 'Registro exitoso',
      data
    });
  } catch (error) {
    next(error);
}


}

async function getMe(req, res, next) {
  try {
    const usuario = await authService.getMe(req.user.id_usuario);

    res.status(200).json({
      ok: true,
      data: usuario
    });
  } catch (error) {
    next(error);
    }
}

async function resetPassword(req, res, next) {
  try {
    const { error, value } = resetPasswordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    const usuario = await authService.resetPassword(value);

    res.status(200).json({
      ok: true,
      message: 'Contraseña actualizada correctamente',
      data: usuario
    });
  } catch (error) {
    next(error);
  }
}

async function forgotPassword(req, res, next) {
  try {
    const { error, value } = forgotPasswordSchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        ok: false,
        message: error.details[0].message
      });
    }

    await authService.forgotPassword(value);

    res.status(200).json({
      ok: true,
      message: 'Si el correo existe, ya puede restablecer su contraseña'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  login,
  register,
  getMe, 
  forgotPassword,
  resetPassword
};

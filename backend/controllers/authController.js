/**
 * Auth Controller mejorado
 * Mejora #2  — Bloqueo por intentos fallidos
 * Mejora #6  — Requisitos mínimos de contraseña
 * Mejora #16 — Errores tipados con AppError
 */
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Usuario = require('../models/Usuario');
const db = require('../database/db');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const MAX_ATTEMPTS = 5;
const LOCK_MINUTES = 15;

const generateToken = (userId, email, rol) =>
  jwt.sign({ userId, email, rol }, process.env.JWT_SECRET, { expiresIn: '7d' });

// Validar requisitos de contraseña
const validatePassword = (password) => {
  const errors = [];
  if (!password || password.length < 8) errors.push('Mínimo 8 caracteres');
  if (!/[A-Z]/.test(password)) errors.push('Al menos una mayúscula');
  if (!/[0-9]/.test(password)) errors.push('Al menos un número');
  if (!/[^A-Za-z0-9]/.test(password)) errors.push('Al menos un símbolo (!@#$%...)');
  return errors;
};

exports.register = async (req, res, next) => {
  try {
    const { nombre, email, password } = req.body;
    const rol = 'estudiante'; // siempre estudiante, el admin asigna otros roles

    if (!nombre || !email || !password)
      return next(AppError.badRequest('Nombre, email y contraseña son obligatorios'));

    // Validar contraseña
    const pwErrors = validatePassword(password);
    if (pwErrors.length > 0)
      return next(AppError.validation(`Contraseña inválida: ${pwErrors.join(', ')}`));

    const existingUser = await Usuario.obtenerPorEmail(email);
    if (existingUser) return next(AppError.conflict('El email ya está registrado'));

    const hashedPassword = await bcrypt.hash(password, 12);
    const result = await Usuario.crear({ nombre, email, password: hashedPassword, rol });

    const token = generateToken(result.insertId, email, rol);
    logger.info(`Nuevo usuario registrado: ${email} (${rol})`);

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      token,
      user: { id: result.insertId, nombre, email, rol },
    });
  } catch (err) { next(err); }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return next(AppError.badRequest('Email y contraseña son obligatorios'));

    const user = await Usuario.obtenerPorEmail(email);

    // Usuario no existe — respuesta genérica para no revelar info
    if (!user) {
      logger.warn(`Intento de login con email inexistente: ${email}`);
      return next(AppError.unauthorized('Credenciales inválidas'));
    }

    // Verificar si la cuenta está bloqueada
    if (user.locked_until && new Date(user.locked_until) > new Date()) {
      const remaining = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
      return next(AppError.unauthorized(
        `Cuenta bloqueada por demasiados intentos fallidos. Intenta en ${remaining} minuto(s).`,
        'ACCOUNT_LOCKED'
      ));
    }

    // Verificar cuenta activa
    if (!user.activo) return next(AppError.unauthorized('Cuenta desactivada. Contacta al administrador.', 'ACCOUNT_DISABLED'));

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      // Incrementar contador de intentos
      const attempts = (user.login_attempts || 0) + 1;
      if (attempts >= MAX_ATTEMPTS) {
        const lockUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
        await db.execute(
          'UPDATE usuarios SET login_attempts = ?, locked_until = ? WHERE id = ?',
          [attempts, lockUntil, user.id]
        );
        logger.warn(`Cuenta bloqueada: ${email} (${attempts} intentos)`);
        return next(AppError.unauthorized(
          `Cuenta bloqueada por ${MAX_ATTEMPTS} intentos fallidos. Intenta en ${LOCK_MINUTES} minutos.`,
          'ACCOUNT_LOCKED'
        ));
      }
      await db.execute('UPDATE usuarios SET login_attempts = ? WHERE id = ?', [attempts, user.id]);
      logger.warn(`Login fallido: ${email} (intento ${attempts}/${MAX_ATTEMPTS})`);
      return next(AppError.unauthorized(`Credenciales inválidas. Intentos restantes: ${MAX_ATTEMPTS - attempts}`));
    }

    // Login exitoso — resetear contador
    await db.execute(
      'UPDATE usuarios SET login_attempts = 0, locked_until = NULL, last_login = NOW() WHERE id = ?',
      [user.id]
    );

    const token = generateToken(user.id, user.email, user.rol);
    logger.info(`Login exitoso: ${email} (${user.rol})`);

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        foto_url: user.foto_url || null,
      },
    });
  } catch (err) { next(err); }
};

exports.getProfile = async (req, res, next) => {
  try {
    const user = await Usuario.obtenerPorId(req.user.userId);
    if (!user) return next(AppError.notFound('Usuario no encontrado'));
    res.json({ success: true, user });
  } catch (err) { next(err); }
};

const jwt = require('jsonwebtoken');
const db  = require('../database/db');

const auth = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer '))
    return res.status(401).json({ success: false, message: 'Token no proporcionado.' });

  try {
    req.user = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Token inválido o expirado.' });
  }

  // Verificar que el usuario sigue activo en la BD
  try {
    const [[user]] = await db.execute(
      'SELECT activo FROM usuarios WHERE id = ?', [req.user.userId]
    );
    if (!user || !user.activo) {
      return res.status(401).json({
        success: false,
        code: 'USER_INACTIVE',
        message: 'Tu cuenta ha sido desactivada. Contacta al administrador.',
      });
    }
  } catch {
    return res.status(500).json({ success: false, message: 'Error de servidor.' });
  }

  next();
};

const requireRole = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user?.rol))
    return res.status(403).json({ success: false, message: 'No tienes permiso para esta acción.' });
  next();
};

module.exports = { auth, requireRole };

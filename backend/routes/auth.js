const router = require('express').Router();
const authController = require('../controllers/authController');
const { auth } = require('../middleware/auth');
const db = require('../database/db');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/profile', auth, authController.getProfile);

// Verifica si el usuario sigue activo — usado por el frontend para detectar desactivación
router.get('/me', auth, async (req, res) => {
  try {
    const [[user]] = await db.execute(
      'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = ?',
      [req.user.userId]
    );
    if (!user || !user.activo)
      return res.status(401).json({ success: false, code: 'USER_INACTIVE', message: 'Cuenta desactivada.' });
    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Error de servidor.' });
  }
});

module.exports = router;

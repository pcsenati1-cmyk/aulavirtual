const db = require('../database/db');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/fotos')),
  filename: (req, file, cb) => cb(null, `foto-${req.user.userId}-${Date.now()}${path.extname(file.originalname)}`),
});
exports.upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Solo se permiten imágenes'));
  },
});

exports.getPerfil = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      'SELECT id, nombre, email, rol, foto_url, created_at FROM usuarios WHERE id=?',
      [req.user.userId]
    );
    if (!rows[0]) return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
};

exports.updatePerfil = async (req, res, next) => {
  try {
    const { nombre } = req.body;
    const foto_url = req.file ? `/uploads/fotos/${req.file.filename}` : null;
    const fields = [];
    const values = [];
    if (nombre) { fields.push('nombre=?'); values.push(nombre); }
    if (foto_url) { fields.push('foto_url=?'); values.push(foto_url); }
    if (!fields.length) return res.json({ success: true, message: 'Sin cambios' });
    values.push(req.user.userId);
    await db.execute(`UPDATE usuarios SET ${fields.join(',')} WHERE id=?`, values);
    const [[user]] = await db.execute('SELECT id, nombre, email, rol, foto_url FROM usuarios WHERE id=?', [req.user.userId]);
    res.json({ success: true, message: 'Perfil actualizado', user });
  } catch (err) { next(err); }
};

exports.changePassword = async (req, res, next) => {
  try {
    const { password_actual, password_nueva, password_nuevo } = req.body;
    const nueva = password_nueva || password_nuevo;
    if (!password_actual || !nueva)
      return res.status(400).json({ success: false, message: 'Ambas contraseñas son requeridas' });
    const [[user]] = await db.execute('SELECT password FROM usuarios WHERE id=?', [req.user.userId]);
    const ok = await bcrypt.compare(password_actual, user.password);
    if (!ok) return res.status(401).json({ success: false, message: 'Contraseña actual incorrecta' });
    const hashed = await bcrypt.hash(nueva, 10);
    await db.execute('UPDATE usuarios SET password=? WHERE id=?', [hashed, req.user.userId]);
    res.json({ success: true, message: 'Contraseña actualizada' });
  } catch (err) { next(err); }
};

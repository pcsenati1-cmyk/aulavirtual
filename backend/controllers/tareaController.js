const db = require('../database/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, '../uploads/entregas')),
  filename: (req, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/\s/g, '_')}`),
});
exports.upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// ── Tareas ────────────────────────────────────────────────────────────────
exports.getTareas = async (req, res, next) => {
  try {
    const { curso_id } = req.query;
    const conditions = [];
    const params = [];

    if (curso_id) { conditions.push('t.curso_id = ?'); params.push(curso_id); }

    // Estudiantes solo ven tareas de sus cursos inscritos
    if (req.user.rol === 'estudiante') {
      conditions.push('t.curso_id IN (SELECT curso_id FROM inscripciones WHERE usuario_id = ?)');
      params.push(req.user.userId);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.execute(
      `SELECT t.*, c.titulo AS curso_titulo,
         (SELECT COUNT(*) FROM entregas e WHERE e.tarea_id = t.id) AS total_entregas
       FROM tareas t JOIN cursos c ON t.curso_id = c.id
       ${where} ORDER BY t.fecha_limite ASC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.createTarea = async (req, res, next) => {
  try {
    const { titulo, descripcion, curso_id, fecha_limite, puntos_maximos } = req.body;
    if (!titulo || !curso_id) return res.status(400).json({ success: false, message: 'Título y curso son requeridos' });
    const [r] = await db.execute(
      'INSERT INTO tareas (titulo, descripcion, curso_id, fecha_limite, puntos_maximos) VALUES (?,?,?,?,?)',
      [titulo, descripcion || null, curso_id, fecha_limite || null, puntos_maximos || 100]
    );
    res.status(201).json({ success: true, data: { id: r.insertId } });
  } catch (err) { next(err); }
};

exports.updateTarea = async (req, res, next) => {
  try {
    const { titulo, descripcion, fecha_limite, puntos_maximos } = req.body;
    await db.execute(
      'UPDATE tareas SET titulo=?, descripcion=?, fecha_limite=?, puntos_maximos=? WHERE id=?',
      [titulo, descripcion || null, fecha_limite || null, puntos_maximos || 100, req.params.id]
    );
    res.json({ success: true, message: 'Tarea actualizada' });
  } catch (err) { next(err); }
};

exports.deleteTarea = async (req, res, next) => {
  try {
    await db.execute('DELETE FROM tareas WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Tarea eliminada' });
  } catch (err) { next(err); }
};

// ── Entregas ──────────────────────────────────────────────────────────────
exports.getEntregas = async (req, res, next) => {
  try {
    const { tarea_id } = req.params;
    const [rows] = await db.execute(
      `SELECT e.*, u.nombre AS usuario_nombre
       FROM entregas e JOIN usuarios u ON e.usuario_id = u.id
       WHERE e.tarea_id = ? ORDER BY e.fecha_entrega DESC`,
      [tarea_id]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

exports.entregar = async (req, res, next) => {
  try {
    const { tarea_id, usuario_id, comentario } = req.body;
    const archivo_url = req.file ? `/uploads/entregas/${req.file.filename}` : null;
    const [r] = await db.execute(
      `INSERT INTO entregas (tarea_id, usuario_id, archivo_url, comentario)
       VALUES (?,?,?,?)
       ON DUPLICATE KEY UPDATE archivo_url=VALUES(archivo_url), comentario=VALUES(comentario), fecha_entrega=NOW(), estado='entregado'`,
      [tarea_id, usuario_id, archivo_url, comentario || null]
    );
    res.status(201).json({ success: true, data: { id: r.insertId } });
  } catch (err) { next(err); }
};

exports.calificarEntrega = async (req, res, next) => {
  try {
    const { calificacion, retroalimentacion } = req.body;
    await db.execute(
      "UPDATE entregas SET calificacion=?, retroalimentacion=?, estado='calificado' WHERE id=?",
      [calificacion, retroalimentacion || null, req.params.id]
    );
    res.json({ success: true, message: 'Entrega calificada' });
  } catch (err) { next(err); }
};

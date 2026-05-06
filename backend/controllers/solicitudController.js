const db = require('../database/db');

// Alumno: enviar solicitud
exports.crear = async (req, res, next) => {
  try {
    const { curso_id, mensaje } = req.body;
    const usuario_id = req.user.userId;
    if (!curso_id) return res.status(400).json({ success: false, message: 'curso_id requerido' });

    // Verificar que no esté ya inscrito
    const [[ins]] = await db.execute(
      'SELECT id FROM inscripciones WHERE usuario_id=? AND curso_id=?', [usuario_id, curso_id]
    );
    if (ins) return res.status(409).json({ success: false, message: 'Ya estás inscrito en este curso' });

    await db.execute(
      'INSERT INTO solicitudes_inscripcion (usuario_id, curso_id, mensaje) VALUES (?,?,?) ON DUPLICATE KEY UPDATE mensaje=VALUES(mensaje), estado="pendiente"',
      [usuario_id, curso_id, mensaje || null]
    );
    res.status(201).json({ success: true, message: 'Solicitud enviada. El administrador la revisará pronto.' });
  } catch (err) { next(err); }
};

// Alumno: ver sus solicitudes
exports.getMias = async (req, res, next) => {
  try {
    const [rows] = await db.execute(
      `SELECT s.*, c.titulo AS curso_titulo, c.categoria
       FROM solicitudes_inscripcion s
       JOIN cursos c ON s.curso_id = c.id
       WHERE s.usuario_id = ? ORDER BY s.created_at DESC`,
      [req.user.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Admin: ver todas las solicitudes pendientes
exports.getAll = async (req, res, next) => {
  try {
    const estado = req.query.estado || 'pendiente';
    const [rows] = await db.execute(
      `SELECT s.*, u.nombre AS usuario_nombre, u.email AS usuario_email,
         c.titulo AS curso_titulo, c.categoria
       FROM solicitudes_inscripcion s
       JOIN usuarios u ON s.usuario_id = u.id
       JOIN cursos c ON s.curso_id = c.id
       WHERE s.estado = ? ORDER BY s.created_at DESC`,
      [estado]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
};

// Admin: aprobar solicitud → crea inscripción
exports.aprobar = async (req, res, next) => {
  try {
    const [[sol]] = await db.execute('SELECT * FROM solicitudes_inscripcion WHERE id=?', [req.params.id]);
    if (!sol) return res.status(404).json({ success: false, message: 'Solicitud no encontrada' });

    await db.execute(
      'INSERT IGNORE INTO inscripciones (usuario_id, curso_id) VALUES (?,?)',
      [sol.usuario_id, sol.curso_id]
    );
    await db.execute('UPDATE solicitudes_inscripcion SET estado="aprobada" WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Solicitud aprobada e inscripción creada' });
  } catch (err) { next(err); }
};

// Admin: rechazar solicitud
exports.rechazar = async (req, res, next) => {
  try {
    await db.execute('UPDATE solicitudes_inscripcion SET estado="rechazada" WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Solicitud rechazada' });
  } catch (err) { next(err); }
};

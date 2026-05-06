const db = require('../database/db');

const PAGE_SIZE = 20;

exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || PAGE_SIZE);
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    // Estudiantes solo ven sus propias calificaciones
    const userId = req.user.rol === 'estudiante' ? req.user.userId : null;

    const conditions = [];
    const params = [];
    if (userId) { conditions.push('cal.usuario_id = ?'); params.push(userId); }
    if (search) { conditions.push('(u.nombre LIKE ? OR c.titulo LIKE ?)'); params.push(search, search); }
    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM calificaciones cal
       JOIN usuarios u ON cal.usuario_id = u.id JOIN cursos c ON cal.curso_id = c.id
       ${whereClause}`, params
    );
    const [rows] = await db.execute(
      `SELECT cal.id, cal.nota, cal.comentario, cal.fecha, cal.updated_at,
         u.id AS usuario_id, u.nombre AS usuario_nombre,
         c.id AS curso_id, c.titulo AS curso_titulo
       FROM calificaciones cal
       JOIN usuarios u ON cal.usuario_id = u.id
       JOIN cursos c ON cal.curso_id = c.id
       ${whereClause} ORDER BY cal.fecha DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ success: true, data: rows, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { usuario_id, curso_id, nota, comentario } = req.body;
    if (!usuario_id || !curso_id || nota === undefined)
      return res.status(400).json({ success: false, message: 'usuario_id, curso_id y nota son requeridos' });
    if (nota < 0 || nota > 100)
      return res.status(400).json({ success: false, message: 'La nota debe estar entre 0 y 100' });
    const [result] = await db.execute(
      'INSERT INTO calificaciones (usuario_id, curso_id, nota, comentario) VALUES (?,?,?,?)',
      [usuario_id, curso_id, nota, comentario || null]
    );
    res.status(201).json({ success: true, message: 'Calificación registrada', data: { id: result.insertId } });
  } catch (err) { next(err); }
};

exports.update = async (req, res, next) => {
  try {
    const { nota, comentario } = req.body;
    // Guardar historial antes de actualizar — Mejora #28
    const [[existing]] = await db.execute('SELECT nota, usuario_id, curso_id FROM calificaciones WHERE id=?', [req.params.id]);
    if (existing) {
      await db.execute(
        'INSERT INTO calificaciones_historial (calificacion_id, usuario_id, curso_id, nota_anterior, nota_nueva, modificado_por) VALUES (?,?,?,?,?,?)',
        [req.params.id, existing.usuario_id, existing.curso_id, existing.nota, nota, req.user?.userId || null]
      ).catch(() => {}); // No fallar si la tabla no existe aún
    }
    await db.execute('UPDATE calificaciones SET nota=?, comentario=? WHERE id=?', [nota, comentario || null, req.params.id]);
    res.json({ success: true, message: 'Calificación actualizada' });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.execute('DELETE FROM calificaciones WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Calificación eliminada' });
  } catch (err) { next(err); }
};

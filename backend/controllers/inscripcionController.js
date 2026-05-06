const db = require('../database/db');

const PAGE_SIZE = 20;

exports.getAll = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || PAGE_SIZE);
    const offset = (page - 1) * limit;
    const search = req.query.search ? `%${req.query.search}%` : null;

    // Estudiantes solo ven sus propias inscripciones
    const userId = req.user.rol === 'estudiante' ? req.user.userId : null;

    const conditions = [];
    const params = [];
    if (userId) { conditions.push('i.usuario_id = ?'); params.push(userId); }
    if (search) { conditions.push('(u.nombre LIKE ? OR c.titulo LIKE ?)'); params.push(search, search); }
    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [[{ total }]] = await db.execute(
      `SELECT COUNT(*) AS total FROM inscripciones i
       JOIN usuarios u ON i.usuario_id = u.id JOIN cursos c ON i.curso_id = c.id
       ${whereClause}`, params
    );
    const [rows] = await db.execute(
      `SELECT i.id, i.fecha_inscripcion, i.estado,
         u.id AS usuario_id, u.nombre AS usuario_nombre, u.email AS usuario_email, u.rol AS usuario_rol,
         c.id AS curso_id, c.titulo AS curso_titulo, c.categoria, c.duracion_horas,
         p.nombre AS profesor_nombre
       FROM inscripciones i
       JOIN usuarios u ON i.usuario_id = u.id
       JOIN cursos c ON i.curso_id = c.id
       LEFT JOIN usuarios p ON c.profesor_id = p.id
       ${whereClause} ORDER BY i.fecha_inscripcion DESC LIMIT ${limit} OFFSET ${offset}`,
      params
    );
    res.json({ success: true, data: rows, meta: { total, page, limit, pages: Math.ceil(total / limit) } });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    const { usuario_id, curso_id } = req.body;
    if (!usuario_id || !curso_id)
      return res.status(400).json({ success: false, message: 'usuario_id y curso_id son requeridos' });
    const [existing] = await db.execute(
      'SELECT id FROM inscripciones WHERE usuario_id=? AND curso_id=?', [usuario_id, curso_id]
    );
    if (existing.length) return res.status(409).json({ success: false, message: 'El usuario ya está inscrito en este curso' });
    const [result] = await db.execute(
      'INSERT INTO inscripciones (usuario_id, curso_id) VALUES (?,?)', [usuario_id, curso_id]
    );
    res.status(201).json({ success: true, message: 'Inscripción creada', data: { id: result.insertId } });
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    await db.execute('DELETE FROM inscripciones WHERE id=?', [req.params.id]);
    res.json({ success: true, message: 'Inscripción eliminada' });
  } catch (err) { next(err); }
};

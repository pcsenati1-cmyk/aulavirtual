require('dotenv').config();

const REQUIRED_ENV = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'];
const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
if (missing.length) { console.error(`❌ Faltan variables de entorno: ${missing.join(', ')}`); process.exit(1); }

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const rateLimit  = require('express-rate-limit');
const compression = require('compression');   // Mejora #18 — gzip
const mysql      = require('mysql2');
const path       = require('path');
const db         = require('./database/db');
const logger     = require('./utils/logger');  // Mejora #98 — Winston
const sanitize   = require('./middleware/sanitize');   // Mejora #4 — XSS
const auditLog   = require('./middleware/auditLog');   // Mejora #7 — Auditoría
const errorHandler = require('./middleware/errorHandler');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Seguridad y middlewares globales ─────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.some(o => origin.startsWith(o)) ? true : new Error('CORS')),
  credentials: true
}));
app.use(compression());                        // Mejora #18
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(sanitize);                             // Mejora #4
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Rate limiting
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500, standardHeaders: true, legacyHeaders: false }));
app.use('/api/auth', rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  message: { success: false, message: 'Demasiados intentos. Espera 15 minutos.' },
}));

// ── Inicialización de BD ──────────────────────────────────────
async function initDatabase() {
  const connection = mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
  });
  await connection.promise().execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
  connection.end();

  const pool = mysql.createPool({
    host: process.env.DB_HOST, port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: parseInt(process.env.DB_POOL_SIZE) || 15,  // Mejora #85
    queueLimit: 0,
  });
  const p = pool.promise();
  db.setPool(p);

  // ── Tablas base ───────────────────────────────────────────
  await p.execute(`CREATE TABLE IF NOT EXISTS usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    rol ENUM('estudiante','profesor','admin') NOT NULL DEFAULT 'estudiante',
    foto_url VARCHAR(255),
    activo TINYINT(1) DEFAULT 1,
    login_attempts INT DEFAULT 0,
    locked_until DATETIME NULL,
    last_login DATETIME NULL,
    deleted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS categorias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    descripcion TEXT,
    color VARCHAR(20) DEFAULT '#4f46e5',
    deleted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS cursos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    profesor_id INT,
    categoria VARCHAR(100),
    duracion_horas INT DEFAULT 0,
    activo TINYINT(1) DEFAULT 1,
    deleted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE SET NULL
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS inscripciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('activa','completada','cancelada') DEFAULT 'activa',
    deleted_at DATETIME NULL,
    UNIQUE KEY unique_inscripcion (usuario_id, curso_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS calificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    nota DECIMAL(5,2) NOT NULL,
    comentario TEXT,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_calificacion (usuario_id, curso_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS anuncios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    contenido TEXT NOT NULL,
    autor_id INT,
    curso_id INT,
    tipo ENUM('general','curso','urgente') DEFAULT 'general',
    activo TINYINT(1) DEFAULT 1,
    deleted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS asistencias (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    fecha DATE NOT NULL,
    presente TINYINT(1) DEFAULT 1,
    observacion TEXT,
    UNIQUE KEY unique_asistencia (usuario_id, curso_id, fecha),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS tareas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,
    curso_id INT NOT NULL,
    fecha_limite DATETIME,
    puntos_maximos INT DEFAULT 100,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS entregas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tarea_id INT NOT NULL,
    usuario_id INT NOT NULL,
    archivo_url VARCHAR(500),
    comentario TEXT,
    calificacion DECIMAL(5,2),
    retroalimentacion TEXT,
    estado ENUM('pendiente','entregado','calificado') DEFAULT 'entregado',
    fecha_entrega TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_entrega (tarea_id, usuario_id),
    FOREIGN KEY (tarea_id) REFERENCES tareas(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS notificaciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    mensaje TEXT NOT NULL,
    link VARCHAR(255),
    leido TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS mensajes (
    id INT PRIMARY KEY AUTO_INCREMENT,
    de_usuario_id INT NOT NULL,
    para_usuario_id INT NOT NULL,
    asunto VARCHAR(200) DEFAULT 'Sin asunto',
    contenido TEXT NOT NULL,
    leido TINYINT(1) DEFAULT 0,
    deleted_at DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (de_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (para_usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
  )`);

  await p.execute(`CREATE TABLE IF NOT EXISTS materiales (
    id INT PRIMARY KEY AUTO_INCREMENT,
    titulo VARCHAR(200) NOT NULL,
    tipo ENUM('enlace','pdf','video','documento','imagen') DEFAULT 'enlace',
    url VARCHAR(500),
    curso_id INT NOT NULL,
    autor_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    FOREIGN KEY (autor_id) REFERENCES usuarios(id) ON DELETE SET NULL
  )`);

  // ── Tabla de auditoría (Mejora #7) ───────────────────────
  await p.execute(`CREATE TABLE IF NOT EXISTS logs_auditoria (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    accion VARCHAR(200) NOT NULL,
    detalle TEXT,
    ip VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
  )`);

  // ── Tabla historial de calificaciones (Mejora #28) ───────
  await p.execute(`CREATE TABLE IF NOT EXISTS calificaciones_historial (
    id INT PRIMARY KEY AUTO_INCREMENT,
    calificacion_id INT NOT NULL,
    usuario_id INT NOT NULL,
    curso_id INT NOT NULL,
    nota_anterior DECIMAL(5,2),
    nota_nueva DECIMAL(5,2) NOT NULL,
    modificado_por INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);

  // ── Tabla de configuración del sistema (Mejora #76) ──────
  await p.execute(`CREATE TABLE IF NOT EXISTS configuracion (
    clave VARCHAR(100) PRIMARY KEY,
    valor TEXT,
    descripcion VARCHAR(255),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
  )`);

  // Insertar configuración por defecto
  await p.execute(`INSERT IGNORE INTO configuracion (clave, valor, descripcion) VALUES
    ('nombre_plataforma', 'Aula Virtual', 'Nombre de la plataforma'),
    ('color_primario', '#4f46e5', 'Color primario del sistema'),
    ('max_intentos_login', '5', 'Máximo de intentos de login'),
    ('timeout_sesion', '60', 'Minutos de inactividad para cerrar sesión'),
    ('permitir_registro', '1', 'Permitir registro de nuevos usuarios')
  `);

  // ── Migraciones seguras ───────────────────────────────────
  const alters = [
    'ALTER TABLE usuarios ADD COLUMN foto_url VARCHAR(255)',
    'ALTER TABLE usuarios ADD COLUMN activo TINYINT(1) DEFAULT 1',
    'ALTER TABLE usuarios ADD COLUMN login_attempts INT DEFAULT 0',
    'ALTER TABLE usuarios ADD COLUMN locked_until DATETIME NULL',
    'ALTER TABLE usuarios ADD COLUMN last_login DATETIME NULL',
    'ALTER TABLE usuarios ADD COLUMN deleted_at DATETIME NULL',
    'ALTER TABLE usuarios ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    'ALTER TABLE usuarios ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'ALTER TABLE cursos ADD COLUMN categoria VARCHAR(100)',
    'ALTER TABLE cursos ADD COLUMN duracion_horas INT DEFAULT 0',
    'ALTER TABLE cursos ADD COLUMN activo TINYINT(1) DEFAULT 1',
    'ALTER TABLE cursos ADD COLUMN deleted_at DATETIME NULL',
    'ALTER TABLE cursos ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    'ALTER TABLE cursos ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'ALTER TABLE inscripciones ADD COLUMN fecha_inscripcion TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    "ALTER TABLE inscripciones ADD COLUMN estado ENUM('activa','completada','cancelada') DEFAULT 'activa'",
    'ALTER TABLE inscripciones ADD COLUMN deleted_at DATETIME NULL',
    'ALTER TABLE calificaciones ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'ALTER TABLE anuncios ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'ALTER TABLE anuncios ADD COLUMN deleted_at DATETIME NULL',
    'ALTER TABLE categorias ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    'ALTER TABLE categorias ADD COLUMN deleted_at DATETIME NULL',
    'ALTER TABLE mensajes ADD COLUMN deleted_at DATETIME NULL',
    // Índices (Mejora #86)
    'ALTER TABLE cursos ADD INDEX idx_profesor (profesor_id)',
    'ALTER TABLE inscripciones ADD INDEX idx_usuario (usuario_id)',
    'ALTER TABLE inscripciones ADD INDEX idx_curso (curso_id)',
    'ALTER TABLE calificaciones ADD INDEX idx_cal_usuario (usuario_id)',
    'ALTER TABLE calificaciones ADD INDEX idx_cal_curso (curso_id)',
    'ALTER TABLE calificaciones ADD UNIQUE KEY unique_calificacion (usuario_id, curso_id)',
    'ALTER TABLE asistencias ADD INDEX idx_asist_fecha (fecha)',
    'ALTER TABLE tareas ADD INDEX idx_tarea_limite (fecha_limite)',
    'ALTER TABLE mensajes ADD INDEX idx_msg_created (created_at)',
    'ALTER TABLE notificaciones ADD INDEX idx_notif_usuario (usuario_id)',
    'ALTER TABLE logs_auditoria ADD INDEX idx_audit_usuario (usuario_id)',
    'ALTER TABLE logs_auditoria ADD INDEX idx_audit_created (created_at)',
  ];
  for (const sql of alters) { try { await p.execute(sql); } catch (_) {} }

  logger.info('✅ Base de datos lista');
}

initDatabase().then(() => {
  // Auditoría global (Mejora #7)
  app.use(auditLog);

  // ── Rutas v1 ─────────────────────────────────────────────
  // Health check (sin auth) — Mejora #99
  app.use('/api/health', require('./routes/health'));

  // Auth
  app.use('/api/auth', require('./routes/auth'));

  // Recursos principales
  app.use('/api/usuarios',       require('./routes/usuarios'));
  app.use('/api/cursos',         require('./routes/cursos'));
  app.use('/api/inscripciones',  require('./routes/inscripciones'));
  app.use('/api/solicitudes',    require('./routes/solicitudes'));
  app.use('/api/calificaciones', require('./routes/calificaciones'));
  app.use('/api/anuncios',       require('./routes/anuncios'));
  app.use('/api/categorias',     require('./routes/categorias'));

  // Módulos extendidos
  app.use('/api/asistencias',    require('./routes/asistencias'));
  app.use('/api/tareas',         require('./routes/tareas'));
  app.use('/api/notificaciones', require('./routes/notificaciones'));
  app.use('/api/mensajes',       require('./routes/mensajes'));
  app.use('/api/materiales',     require('./routes/materiales'));
  app.use('/api/reportes',       require('./routes/reportes'));
  app.use('/api/certificados',   require('./routes/certificados'));
  app.use('/api/perfil',         require('./routes/perfil'));
  app.use('/api/buscar',         require('./routes/buscar'));

  // Nuevos endpoints (Mejoras #21, #22, #29, #76)
  app.use('/api/dashboard',      require('./routes/dashboard'));
  app.use('/api/progreso',       require('./routes/progreso'));
  app.use('/api/configuracion',  require('./routes/configuracion'));

  app.get('/', (req, res) => res.json({
    message: '🎓 Aula Virtual API v5.0',
    health: '/api/health',
    docs: '/api/docs',
  }));

  app.use(errorHandler);

  const server = app.listen(PORT, () => logger.info(`🚀 Servidor en http://localhost:${PORT}`));
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') { logger.error(`❌ Puerto ${PORT} ocupado.`); process.exit(1); }
  });
}).catch((err) => { logger.error('❌ Error BD:', err.message); process.exit(1); });

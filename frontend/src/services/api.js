import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (r) => r,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('auth-storage');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

const list = (p) => p.then((r) => ({ data: Array.isArray(r.data?.data) ? r.data.data : [] }));
const body = (p) => p.then((r) => r.data);
const paged = (p) => p.then((r) => ({ data: r.data?.data ?? [], meta: r.data?.meta ?? {} }));

export const authService = {
  login: (d) => body(api.post('/auth/login', d)),
  register: (d) => body(api.post('/auth/register', d)),
};

export const usuarioService = {
  obtenerTodos: (params) => paged(api.get('/usuarios', { params })),
  crear: (d) => body(api.post('/usuarios', d)),
  actualizar: (id, d) => body(api.put(`/usuarios/${id}`, d)),
  eliminar: (id) => body(api.delete(`/usuarios/${id}`)),
};

export const cursoService = {
  obtenerTodos: (params) => paged(api.get('/cursos', { params })),
  crear: (d) => body(api.post('/cursos', d)),
  actualizar: (id, d) => body(api.put(`/cursos/${id}`, d)),
  eliminar: (id) => body(api.delete(`/cursos/${id}`)),
};

export const inscripcionService = {
  obtenerTodos: (params) => paged(api.get('/inscripciones', { params })),
  crear: (d) => body(api.post('/inscripciones', d)),
  eliminar: (id) => body(api.delete(`/inscripciones/${id}`)),
};

export const calificacionService = {
  obtenerTodos: (params) => paged(api.get('/calificaciones', { params })),
  crear: (d) => body(api.post('/calificaciones', d)),
  actualizar: (id, d) => body(api.put(`/calificaciones/${id}`, d)),
  eliminar: (id) => body(api.delete(`/calificaciones/${id}`)),
};

export const anuncioService = {
  obtenerTodos: (params) => list(api.get('/anuncios', { params })),
  crear: (d) => body(api.post('/anuncios', d)),
  actualizar: (id, d) => body(api.put(`/anuncios/${id}`, d)),
  eliminar: (id) => body(api.delete(`/anuncios/${id}`)),
};

export const categoriaService = {
  obtenerTodos: () => list(api.get('/categorias')),
  crear: (d) => body(api.post('/categorias', d)),
  eliminar: (id) => body(api.delete(`/categorias/${id}`)),
};

export const asistenciaService = {
  getByCurso: (curso_id, params) => list(api.get(`/asistencias/${curso_id}`, { params })),
  getResumen: (curso_id) => list(api.get(`/asistencias/${curso_id}/resumen`)),
  registrar: (d) => body(api.post('/asistencias', d)),
};

export const tareaService = {
  obtenerTodos: (params) => list(api.get('/tareas', { params })),
  crear: (d) => body(api.post('/tareas', d)),
  actualizar: (id, d) => body(api.put(`/tareas/${id}`, d)),
  eliminar: (id) => body(api.delete(`/tareas/${id}`)),
  getEntregas: (tarea_id) => list(api.get(`/tareas/${tarea_id}/entregas`)),
  entregar: (formData) => body(api.post('/tareas/entregas', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  calificarEntrega: (id, d) => body(api.put(`/tareas/entregas/${id}/calificar`, d)),
};

export const notificacionService = {
  getMias: () => body(api.get('/notificaciones')),
  marcarLeida: (id) => body(api.put(`/notificaciones/${id}/leer`)),
  marcarTodasLeidas: () => body(api.put('/notificaciones/leer-todas')),
};

export const mensajeService = {
  getBandeja: () => body(api.get('/mensajes')),
  enviar: (d) => body(api.post('/mensajes', d)),
  marcarLeido: (id) => body(api.put(`/mensajes/${id}/leer`)),
  eliminar: (id) => body(api.delete(`/mensajes/${id}`)),
};

export const materialService = {
  getByCurso: (curso_id) => list(api.get(`/materiales/${curso_id}`)),
  crear: (formData) => body(api.post('/materiales', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  eliminar: (id) => body(api.delete(`/materiales/${id}`)),
};

export const reporteService = {
  exportarCSV: (params) => api.get('/reportes/exportar', { params, responseType: 'blob' }),
  estadisticas: () => body(api.get('/reportes/estadisticas')),
};

export const certificadoService = {
  descargar: (usuario_id, curso_id) => api.get(`/certificados/${usuario_id}/${curso_id}`, { responseType: 'blob' }),
};

export const perfilService = {
  get: () => body(api.get('/perfil')),
  update: (formData) => body(api.put('/perfil', formData, { headers: { 'Content-Type': 'multipart/form-data' } })),
  changePassword: (d) => body(api.put('/perfil/password', d)),
};

export const buscadorService = {
  buscar: (q) => body(api.get('/buscar', { params: { q } })),
};

// ── Nuevos servicios — Mejoras #21, #22, #29, #76 ────────────

export const dashboardService = {
  stats: () => body(api.get('/dashboard/stats')),
};

export const progresoService = {
  alumno: (id) => body(api.get(`/progreso/alumnos/${id}/estadisticas`)),
  curso: (id) => body(api.get(`/progreso/cursos/${id}/progreso`)),
};

export const configuracionService = {
  get: () => body(api.get('/configuracion')),
  update: (data) => body(api.put('/configuracion', data)),
  updateKey: (clave, valor) => body(api.put(`/configuracion/${clave}`, { valor })),
};

export const healthService = {
  check: () => body(api.get('/health')),
};

// ── Upload con progreso — Mejora #44 ─────────────────────────
export const uploadWithProgress = (url, formData, onProgress) =>
  body(api.post(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      const pct = Math.round((e.loaded * 100) / e.total);
      onProgress?.(pct);
    },
  }));

export default api;

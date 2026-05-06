import React, { useEffect, useState } from 'react';
import { BookOpen, Clock, Tag, Send, CheckCircle, Search, AlertCircle } from 'lucide-react';
import { cursoService, solicitudService, inscripcionService } from '../../services/api';
import { SkeletonCard } from '../../components/ui/Skeleton';
import Swal from 'sweetalert2';

const ACCENT = '#059669';

export const StudentEnrollPage = () => {
  const [cursos, setCursos] = useState([]);
  const [inscritos, setInscritos] = useState([]);
  const [solicitudes, setSolicitudes] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    Promise.all([
      cursoService.obtenerTodos({ limit: 100 }),
      inscripcionService.obtenerTodos({ limit: 100 }),
      solicitudService.getMias(),
    ]).then(([c, ins, sol]) => {
      setCursos(Array.isArray(c.data) ? c.data : []);
      setInscritos((ins.data || []).map(i => i.curso_id));
      setSolicitudes(sol || []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleSolicitud = async (curso_id, titulo) => {
    const { value: mensaje, isConfirmed } = await Swal.fire({
      title: `Solicitar inscripción`,
      text: `Curso: "${titulo}"`,
      input: 'textarea',
      inputPlaceholder: 'Mensaje opcional para el administrador...',
      showCancelButton: true,
      confirmButtonColor: ACCENT,
      confirmButtonText: 'Enviar solicitud',
      cancelButtonText: 'Cancelar',
    });
    if (!isConfirmed) return;

    setSending(curso_id);
    try {
      await solicitudService.crear({ curso_id, mensaje: mensaje || '' });
      setSolicitudes(prev => [...prev, { curso_id, estado: 'pendiente' }]);
      Swal.fire({ icon: 'success', title: '¡Solicitud enviada!', text: 'El administrador la revisará pronto.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3500 });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'Error al enviar', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
    } finally { setSending(null); }
  };

  const getSolicitudEstado = (curso_id) => solicitudes.find(s => s.curso_id === curso_id)?.estado;

  const filtered = cursos.filter(c =>
    c.titulo?.toLowerCase().includes(search.toLowerCase()) ||
    c.categoria?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-primary,#111827)', margin: 0 }}>Explorar Cursos</h1>
        <p style={{ fontSize: 13, color: 'var(--text-muted,#6b7280)', marginTop: 4 }}>
          Envía una solicitud al administrador para inscribirte
        </p>
      </div>

      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar cursos..."
          style={{ width: '100%', paddingLeft: 34, paddingRight: 12, height: 38, borderRadius: 9, border: '1px solid #d1fae5', fontSize: 13, outline: 'none', background: '#f0fdf4', boxSizing: 'border-box' }} />
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 16 }}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <BookOpen size={48} color="#d1fae5" style={{ margin: '0 auto 12px', display: 'block' }} />
          <p style={{ color: '#9ca3af', fontSize: 14 }}>No hay cursos disponibles</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px,1fr))', gap: 14 }}>
          {filtered.map(c => {
            const yaInscrito = inscritos.includes(c.id);
            const estado = getSolicitudEstado(c.id);

            return (
              <div key={c.id} style={{ background: 'var(--card-bg,#fff)', borderRadius: 14, border: '1px solid #d1fae5', overflow: 'hidden' }}>
                <div style={{ height: 5, background: `linear-gradient(90deg,${ACCENT},#34d399)` }} />
                <div style={{ padding: 18 }}>
                  <div style={{ width: 40, height: 40, background: '#d1fae5', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <BookOpen size={18} color={ACCENT} />
                  </div>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary,#111827)', margin: '0 0 6px', lineHeight: 1.3 }}>{c.titulo}</h3>
                  {c.descripcion && <p style={{ fontSize: 12, color: '#6b7280', margin: '0 0 12px', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{c.descripcion}</p>}
                  <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                    {c.categoria && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: ACCENT, background: '#d1fae5', padding: '2px 8px', borderRadius: 99 }}><Tag size={10} />{c.categoria}</span>}
                    {c.duracion_horas > 0 && <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' }}><Clock size={10} />{c.duracion_horas}h</span>}
                  </div>

                  {yaInscrito ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', background: '#d1fae5', borderRadius: 9, fontSize: 13, fontWeight: 600, color: ACCENT }}>
                      <CheckCircle size={14} /> Ya inscrito
                    </div>
                  ) : estado === 'pendiente' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', background: '#fef3c7', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#d97706' }}>
                      <AlertCircle size={14} /> Solicitud pendiente
                    </div>
                  ) : estado === 'rechazada' ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 12px', background: '#fee2e2', borderRadius: 9, fontSize: 13, fontWeight: 600, color: '#dc2626' }}>
                      <AlertCircle size={14} /> Solicitud rechazada
                    </div>
                  ) : (
                    <button onClick={() => handleSolicitud(c.id, c.titulo)} disabled={sending === c.id}
                      style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', background: ACCENT, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', opacity: sending === c.id ? 0.7 : 1 }}>
                      <Send size={14} /> {sending === c.id ? 'Enviando...' : 'Solicitar inscripción'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

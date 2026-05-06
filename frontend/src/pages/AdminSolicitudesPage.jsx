import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Clock, User, BookOpen } from 'lucide-react';
import { solicitudService } from '../../services/api';
import Swal from 'sweetalert2';

const estadoBadge = {
  pendiente: { bg: '#fef3c7', color: '#d97706', label: 'Pendiente' },
  aprobada:  { bg: '#d1fae5', color: '#059669', label: 'Aprobada' },
  rechazada: { bg: '#fee2e2', color: '#dc2626', label: 'Rechazada' },
};

export const AdminSolicitudesPage = () => {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtro, setFiltro] = useState('pendiente');
  const [acting, setActing] = useState(null);

  useEffect(() => { load(); }, [filtro]);

  const load = async () => {
    setLoading(true);
    try {
      const data = await solicitudService.getAll(filtro);
      setSolicitudes(data || []);
    } catch { } finally { setLoading(false); }
  };

  const handleAprobar = async (id, nombre, curso) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Aprobar solicitud?',
      text: `${nombre} será inscrito en "${curso}"`,
      icon: 'question', showCancelButton: true,
      confirmButtonColor: '#059669', confirmButtonText: 'Aprobar',
    });
    if (!isConfirmed) return;
    setActing(id);
    try {
      await solicitudService.aprobar(id);
      Swal.fire({ icon: 'success', title: 'Solicitud aprobada', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      load();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'Error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
    } finally { setActing(null); }
  };

  const handleRechazar = async (id) => {
    const { isConfirmed } = await Swal.fire({
      title: '¿Rechazar solicitud?', icon: 'warning', showCancelButton: true,
      confirmButtonColor: '#dc2626', confirmButtonText: 'Rechazar',
    });
    if (!isConfirmed) return;
    setActing(id);
    try {
      await solicitudService.rechazar(id);
      Swal.fire({ icon: 'success', title: 'Solicitud rechazada', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      load();
    } catch { } finally { setActing(null); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Solicitudes de Inscripción</h1>
        <p className="text-slate-500 text-sm mt-0.5">{solicitudes.length} solicitud{solicitudes.length !== 1 ? 'es' : ''} {filtro}</p>
      </div>

      <div className="flex gap-2">
        {['pendiente', 'aprobada', 'rechazada'].map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition-colors ${filtro === e ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
            {e}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-center text-slate-400 py-12">Cargando...</p>
      ) : solicitudes.length === 0 ? (
        <div className="text-center py-16">
          <Clock className="mx-auto text-slate-300 mb-2" size={40} />
          <p className="text-slate-400">No hay solicitudes {filtro}s</p>
        </div>
      ) : (
        <div className="space-y-3">
          {solicitudes.map(s => {
            const badge = estadoBadge[s.estado] || estadoBadge.pendiente;
            return (
              <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4">
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={18} className="text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-800">{s.usuario_nombre}</p>
                  <p className="text-sm text-slate-500 truncate">{s.usuario_email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <BookOpen size={13} className="text-slate-400" />
                    <span className="text-sm text-slate-600">{s.curso_titulo}</span>
                    {s.categoria && <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{s.categoria}</span>}
                  </div>
                  {s.mensaje && <p className="text-xs text-slate-400 mt-1 italic">"{s.mensaje}"</p>}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs font-semibold px-2 py-1 rounded-full" style={{ background: badge.bg, color: badge.color }}>
                    {badge.label}
                  </span>
                  {s.estado === 'pendiente' && (
                    <>
                      <button onClick={() => handleAprobar(s.id, s.usuario_nombre, s.curso_titulo)}
                        disabled={acting === s.id}
                        className="p-2 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Aprobar">
                        <CheckCircle size={16} className="text-emerald-600" />
                      </button>
                      <button onClick={() => handleRechazar(s.id)}
                        disabled={acting === s.id}
                        className="p-2 bg-red-50 hover:bg-red-100 rounded-lg transition-colors" title="Rechazar">
                        <XCircle size={16} className="text-red-500" />
                      </button>
                    </>
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

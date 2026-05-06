import React, { useEffect, useState } from 'react';
import { MessageSquare, Send, Trash2, Mail, MailOpen } from 'lucide-react';
import { mensajeService, usuarioService } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import Swal from 'sweetalert2';

const ACCENT = '#059669';

export const StudentMessagesPage = () => {
  const { user } = useAuthStore();
  const [mensajes, setMensajes] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ para_usuario_id: '', asunto: '', contenido: '' });
  const [selected, setSelected] = useState(null);

  const [tab, setTab] = useState('recibidos');

  useEffect(() => {
    loadMensajes();
    usuarioService.obtenerTodos({ limit: 100 }).then(r => {
      setUsuarios((r.data || []).filter(u => u.id !== user?.id));
    }).catch(() => {});
  }, []);

  const loadMensajes = async () => {
    try {
      const r = await mensajeService.getBandeja();
      setMensajes(r);
    } catch { } finally { setLoading(false); }
  };

  const handleSend = async () => {
    if (!form.para_usuario_id || !form.contenido.trim()) {
      Swal.fire({ icon: 'warning', title: 'Completa destinatario y mensaje', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      return;
    }
    try {
      await mensajeService.enviar(form);
      Swal.fire({ icon: 'success', title: 'Mensaje enviado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      setShowForm(false); setForm({ para_usuario_id: '', asunto: '', contenido: '' });
      loadMensajes();
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'Error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
    }
  };

  const handleDelete = async (id) => {
    await mensajeService.eliminar(id);
    setSelected(null); loadMensajes();
  };

  const handleOpen = async (msg) => {
    setSelected(msg);
    if (!msg.leido && msg.para_usuario_id === user?.id) {
      await mensajeService.marcarLeido(msg.id).catch(() => {});
      loadMensajes();
    }
  };

  const lista = tab === 'recibidos' ? (mensajes.recibidos || []) : (mensajes.enviados || []);
  const noLeidos = (mensajes.recibidos || []).filter(m => !m.leido).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Mensajes</h1>
          <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{noLeidos} sin leer</p>
        </div>
        <button onClick={() => setShowForm(!showForm)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          <Send size={14} /> Nuevo mensaje
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #d1fae5', padding: 20 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 14px' }}>Nuevo Mensaje</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <select value={form.para_usuario_id} onChange={e => setForm({ ...form, para_usuario_id: e.target.value })}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 13, outline: 'none' }}>
              <option value="">Seleccionar destinatario...</option>
              {usuarios.map(u => <option key={u.id} value={u.id}>{u.nombre} ({u.rol})</option>)}
            </select>
            <input value={form.asunto} onChange={e => setForm({ ...form, asunto: e.target.value })}
              placeholder="Asunto (opcional)"
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 13, outline: 'none' }} />
            <textarea value={form.contenido} onChange={e => setForm({ ...form, contenido: e.target.value })}
              placeholder="Escribe tu mensaje..." rows={4}
              style={{ padding: '9px 12px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 13, outline: 'none', resize: 'none' }} />
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleSend}
                style={{ flex: 1, padding: '9px 0', background: ACCENT, color: '#fff', border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Enviar
              </button>
              <button onClick={() => setShowForm(false)}
                style={{ padding: '9px 16px', background: '#f1f5f9', color: '#374151', border: 'none', borderRadius: 8, fontSize: 13, cursor: 'pointer' }}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 8 }}>
        {[['recibidos', 'Recibidos'], ['enviados', 'Enviados']].map(([key, label]) => (
          <button key={key} onClick={() => { setTab(key); setSelected(null); }}
            style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #d1fae5', fontSize: 13, fontWeight: 600, cursor: 'pointer', background: tab === key ? ACCENT : '#fff', color: tab === key ? '#fff' : '#374151' }}>
            {label}{key === 'recibidos' && noLeidos > 0 ? ` (${noLeidos})` : ''}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: 16 }}>
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #d1fae5', overflow: 'hidden' }}>
          <div style={{ padding: '14px 18px', borderBottom: '1px solid #f0fdf4', background: '#f0fdf4' }}>
            <p style={{ fontWeight: 700, fontSize: 13, color: '#064e3b', margin: 0 }}>{tab === 'recibidos' ? '📥 Recibidos' : '📤 Enviados'} ({lista.length})</p>
          </div>
          {loading ? <p style={{ padding: 20, color: '#9ca3af', fontSize: 13 }}>Cargando...</p> :
            lista.length === 0 ? <p style={{ padding: 20, color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>Sin mensajes</p> :
              lista.map(m => (
                <div key={m.id} onClick={() => handleOpen(m)}
                  style={{ padding: '12px 18px', borderBottom: '1px solid #f0fdf4', cursor: 'pointer', background: selected?.id === m.id ? '#f0fdf4' : !m.leido && tab === 'recibidos' ? '#f9fffe' : '#fff', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  {m.leido || tab === 'enviados' ? <MailOpen size={15} color="#9ca3af" style={{ marginTop: 2, flexShrink: 0 }} /> : <Mail size={15} color={ACCENT} style={{ marginTop: 2, flexShrink: 0 }} />}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: !m.leido && tab === 'recibidos' ? 700 : 400, color: '#111827', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tab === 'recibidos' ? m.de_nombre : m.para_nombre}
                    </p>
                    <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.asunto || 'Sin asunto'}</p>
                  </div>
                </div>
              ))
          }
        </div>

        {selected && (
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid #d1fae5', padding: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: '#111827', margin: 0 }}>{selected.asunto || 'Sin asunto'}</p>
                <p style={{ fontSize: 12, color: '#6b7280', margin: '4px 0 0' }}>
                  De: {selected.de_nombre} · {new Date(selected.created_at).toLocaleString('es-ES')}
                </p>
              </div>
              <button onClick={() => handleDelete(selected.id)}
                style={{ padding: 6, background: '#fee2e2', border: 'none', borderRadius: 7, cursor: 'pointer' }}>
                <Trash2 size={14} color="#dc2626" />
              </button>
            </div>
            <div style={{ background: '#f0fdf4', borderRadius: 10, padding: 16, fontSize: 13, color: '#374151', lineHeight: 1.6 }}>
              {selected.contenido}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

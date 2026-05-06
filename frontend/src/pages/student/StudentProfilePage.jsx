import React, { useEffect, useState } from 'react';
import { User, Camera, Lock, Save } from 'lucide-react';
import { perfilService } from '../../services/api';
import { useAuthStore } from '../../store/useAuthStore';
import Swal from 'sweetalert2';

const ACCENT = '#059669';

export const StudentProfilePage = () => {
  const { user, login, token } = useAuthStore();
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nombre: '', email: '' });
  const [pwForm, setPwForm] = useState({ password_actual: '', password_nueva: '', confirmar: '' });
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);

  useEffect(() => {
    perfilService.get().then(r => {
      const p = r.user || r;
      setPerfil(p);
      setForm({ nombre: p.nombre || '', email: p.email || '' });
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append('nombre', form.nombre);
      if (fotoFile) fd.append('foto', fotoFile);
      const r = await perfilService.update(fd);
      login(r.user || { ...user, ...form }, token);
      Swal.fire({ icon: 'success', title: 'Perfil actualizado', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'Error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
    } finally { setSaving(false); }
  };

  const handlePassword = async () => {
    if (pwForm.password_nueva !== pwForm.confirmar) {
      Swal.fire({ icon: 'warning', title: 'Las contraseñas no coinciden', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      return;
    }
    try {
      await perfilService.changePassword({ password_actual: pwForm.password_actual, password_nueva: pwForm.password_nueva });
      Swal.fire({ icon: 'success', title: 'Contraseña actualizada', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000 });
      setPwForm({ password_actual: '', password_nueva: '', confirmar: '' });
    } catch (e) {
      Swal.fire({ icon: 'error', title: 'Error', text: e.response?.data?.message || 'Error', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
    }
  };

  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  const fotoSrc = fotoPreview || (perfil?.foto_url ? `${apiBase}${perfil.foto_url}` : null);
  const initials = user?.nombre?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A';

  if (loading) return <p style={{ color: '#9ca3af', textAlign: 'center', padding: 40 }}>Cargando...</p>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, maxWidth: 600 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#111827', margin: 0 }}>Mi Perfil</h1>
        <p style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>Gestiona tu información personal</p>
      </div>

      {/* Avatar */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d1fae5', padding: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ position: 'relative' }}>
          <div style={{ width: 80, height: 80, background: ACCENT, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: '3px solid #a7f3d0' }}>
            {fotoSrc ? <img src={fotoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: '#fff', fontSize: 24, fontWeight: 700 }}>{initials}</span>}
          </div>
          <label style={{ position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, background: ACCENT, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff' }}>
            <Camera size={12} color="#fff" />
            <input type="file" accept="image/*" onChange={handleFoto} style={{ display: 'none' }} />
          </label>
        </div>
        <div>
          <p style={{ fontSize: 16, fontWeight: 700, color: '#111827', margin: 0 }}>{user?.nombre}</p>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '3px 0 0' }}>{user?.email}</p>
          <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 10px', borderRadius: 99, background: '#d1fae5', color: ACCENT, display: 'inline-block', marginTop: 6 }}>Estudiante</span>
        </div>
      </div>

      {/* Datos */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d1fae5', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <User size={15} color={ACCENT} /> Información Personal
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Nombre completo</label>
            <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #d1fae5', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email</label>
            <input value={form.email} disabled
              style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #e5e7eb', fontSize: 13, background: '#f9fafb', color: '#9ca3af', boxSizing: 'border-box' }} />
          </div>
          <button onClick={handleSave} disabled={saving}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: ACCENT, color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start', opacity: saving ? 0.7 : 1 }}>
            <Save size={14} /> {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </div>
      </div>

      {/* Contraseña */}
      <div style={{ background: '#fff', borderRadius: 16, border: '1px solid #d1fae5', padding: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#111827', margin: '0 0 16px', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={15} color={ACCENT} /> Cambiar Contraseña
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {['password_actual', 'password_nueva', 'confirmar'].map((field, i) => (
            <div key={field}>
              <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>
                {['Contraseña actual', 'Nueva contraseña', 'Confirmar nueva'][i]}
              </label>
              <input type="password" value={pwForm[field]} onChange={e => setPwForm({ ...pwForm, [field]: e.target.value })}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid #d1fae5', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
            </div>
          ))}
          <button onClick={handlePassword}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px', background: '#374151', color: '#fff', border: 'none', borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: 'pointer', alignSelf: 'flex-start' }}>
            <Lock size={14} /> Actualizar contraseña
          </button>
        </div>
      </div>
    </div>
  );
};

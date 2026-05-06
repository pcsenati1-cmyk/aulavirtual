import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard, BookOpen, Award, ClipboardList, FileText,
  MessageSquare, Bell, User, LogOut, Menu, X, ChevronRight,
  CalendarDays, GraduationCap
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { notificacionService } from '../../services/api';
import Swal from 'sweetalert2';

const navItems = [
  { path: '/portal/alumno', icon: LayoutDashboard, label: 'Inicio', end: true },
  { path: '/portal/alumno/cursos', icon: BookOpen, label: 'Mis Cursos' },
  { path: '/portal/alumno/inscribirse', icon: GraduationCap, label: 'Explorar Cursos' },
  { path: '/portal/alumno/calificaciones', icon: Award, label: 'Calificaciones' },
  { path: '/portal/alumno/tareas', icon: ClipboardList, label: 'Tareas' },
  { path: '/portal/alumno/materiales', icon: FileText, label: 'Materiales' },
  { path: '/portal/alumno/mensajes', icon: MessageSquare, label: 'Mensajes' },
  { path: '/portal/alumno/notificaciones', icon: Bell, label: 'Notificaciones' },
  { path: '/portal/alumno/calendario', icon: CalendarDays, label: 'Calendario' },
  { path: '/portal/alumno/certificados', icon: GraduationCap, label: 'Certificados' },
  { path: '/portal/alumno/perfil', icon: User, label: 'Mi Perfil' },
];

// Paleta verde/teal para alumnos
const ACCENT = '#059669';
const ACCENT_LIGHT = '#d1fae5';
const ACCENT_BORDER = '#a7f3d0';
const SIDEBAR_BG = '#f0fdf4';
const HEADER_BG = '#ffffff';

export const StudentLayout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [noLeidas, setNoLeidas] = useState(0);

  useEffect(() => {
    notificacionService.getMias().then(r => setNoLeidas(r.no_leidas || 0)).catch(() => {});
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?',
      text: 'Se cerrará tu sesión actual.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: ACCENT,
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, salir',
      cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) { logout(); navigate('/login'); }
  };

  const initials = user?.nombre?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A';
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
    const fotoSrc = user?.foto_url ? `${apiBase}${user.foto_url}` : null;

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f8fafc', overflow: 'hidden' }}>
      {/* Sidebar */}
      <aside style={{
        width: sidebarOpen ? 240 : 62,
        background: SIDEBAR_BG,
        borderRight: `1px solid ${ACCENT_BORDER}`,
        display: 'flex', flexDirection: 'column', flexShrink: 0,
        transition: 'width 0.25s ease',
      }}>
        {/* Logo */}
        <div style={{
          height: 64, display: 'flex', alignItems: 'center',
          padding: '0 14px', borderBottom: `1px solid ${ACCENT_BORDER}`, gap: 10,
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
            background: '#fff', border: `2px solid ${ACCENT}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <GraduationCap size={20} color={ACCENT} />
          </div>
          {sidebarOpen && (
            <div>
              <p style={{ fontWeight: 700, fontSize: 13, color: '#064e3b', margin: 0 }}>Portal Alumno</p>
              <p style={{ fontSize: 10, color: '#6ee7b7', margin: 0 }}>Aula Virtual</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: 8, overflowY: 'auto' }}>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                textDecoration: 'none', fontSize: 13,
                background: isActive ? ACCENT_LIGHT : 'transparent',
                color: isActive ? ACCENT : '#374151',
                fontWeight: isActive ? 600 : 400,
                border: isActive ? `1px solid ${ACCENT_BORDER}` : '1px solid transparent',
              })}>
              {({ isActive }) => (
                <>
                  <item.icon size={16} />
                  {sidebarOpen && <span style={{ flex: 1 }}>{item.label}</span>}
                  {sidebarOpen && item.path === '/portal/alumno/notificaciones' && noLeidas > 0 && (
                    <span style={{ background: '#ef4444', color: 'white', fontSize: 10, borderRadius: 99, padding: '1px 5px', fontWeight: 700 }}>{noLeidas}</span>
                  )}
                  {sidebarOpen && isActive && <ChevronRight size={12} />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: 10, borderTop: `1px solid ${ACCENT_BORDER}` }}>
          {sidebarOpen && (
            <Link to="/portal/alumno/perfil" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 6, borderRadius: 8, textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {fotoSrc
                  ? <img src={fotoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{initials}</span>}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#064e3b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nombre}</p>
                <p style={{ fontSize: 10, color: ACCENT, margin: 0 }}>Estudiante</p>
              </div>
            </Link>
          )}
          <button onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280', fontSize: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = '#fee2e2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={15} />{sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{
          height: 64, background: HEADER_BG,
          borderBottom: `1px solid #e5e7eb`,
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, gap: 12,
        }}>
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: '#6b7280' }}>
            {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>

          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontSize: 13, color: '#6b7280' }}>
              Bienvenido, <strong style={{ color: '#064e3b' }}>{user?.nombre}</strong>
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link to="/portal/alumno/notificaciones"
              style={{ position: 'relative', padding: 7, borderRadius: 7, color: '#6b7280', textDecoration: 'none', display: 'flex' }}>
              <Bell size={17} />
              {noLeidas > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '1.5px solid white' }} />
              )}
            </Link>
            <Link to="/portal/alumno/perfil" style={{ textDecoration: 'none' }}>
              <div style={{ width: 32, height: 32, background: ACCENT, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {fotoSrc
                  ? <img src={fotoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>{initials}</span>}
              </div>
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: '#f8fafc' }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

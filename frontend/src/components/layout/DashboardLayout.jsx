import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, Link } from 'react-router-dom';
import {
  LogOut, BookOpen, LayoutDashboard, Calendar, Users, Bell, Menu, X,
  ChevronRight, Award, Tag, Megaphone, ClipboardList,
  UserCheck, MessageSquare, FileText, BarChart2, Search, User, CalendarDays,
  Moon, Sun, Settings
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { useThemeStore } from '../../store/useThemeStore';
import { notificacionService, buscadorService } from '../../services/api';
import { useKeyboardShortcuts, useSessionTimeout } from '../../hooks/useKeyboardShortcuts';
import { Breadcrumb } from '../ui/Breadcrumb';
import { NetworkError } from '../ui/NetworkError';
import Swal from 'sweetalert2';

const navItems = [
  { path: '/app', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { path: '/app/cursos', icon: BookOpen, label: 'Cursos' },
  { path: '/app/inscripciones', icon: Calendar, label: 'Inscripciones' },
  { path: '/app/solicitudes', icon: ClipboardList, label: 'Solicitudes' },
  { path: '/app/usuarios', icon: Users, label: 'Usuarios' },
  { path: '/app/calificaciones', icon: Award, label: 'Calificaciones' },
  { path: '/app/anuncios', icon: Megaphone, label: 'Anuncios' },
  { path: '/app/categorias', icon: Tag, label: 'Categorías' },
  { path: '/app/asistencia', icon: UserCheck, label: 'Asistencia' },
  { path: '/app/tareas', icon: ClipboardList, label: 'Tareas' },
  { path: '/app/materiales', icon: FileText, label: 'Materiales' },
  { path: '/app/mensajes', icon: MessageSquare, label: 'Mensajes' },
  { path: '/app/notificaciones', icon: Bell, label: 'Notificaciones' },
  { path: '/app/reportes', icon: BarChart2, label: 'Reportes' },
  { path: '/app/certificados', icon: Award, label: 'Certificados' },
  { path: '/app/calendario', icon: CalendarDays, label: 'Calendario' },
  { path: '/app/configuracion', icon: Settings, label: 'Configuración' },
  { path: '/app/perfil', icon: User, label: 'Mi Perfil' },
];

export const DashboardLayout = () => {
  const { user, logout } = useAuthStore();
  const { darkMode, toggleDarkMode, applyTheme } = useThemeStore();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [noLeidas, setNoLeidas] = useState(0);
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => { applyTheme(); }, []);
  useEffect(() => {
    notificacionService.getMias().then(r => setNoLeidas(r.no_leidas || 0)).catch(() => {});
  }, []);

  // Atajos de teclado — Mejora #42
  useKeyboardShortcuts({
    onSearch: () => searchInputRef.current?.focus(),
    onEscape: () => { setSearchResults(null); setSearchQ(''); },
  });

  // Timeout de sesión — Mejora #9
  useSessionTimeout(() => {
    logout();
    navigate('/login');
    Swal.fire({ icon: 'info', title: 'Sesión expirada', text: 'Tu sesión cerró por inactividad.', toast: true, position: 'top-end', showConfirmButton: false, timer: 5000 });
  }, 60);

  useEffect(() => {
    if (!searchQ.trim() || searchQ.length < 2) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      try {
        const r = await buscadorService.buscar(searchQ);
        setSearchResults(r.data);
      } catch { setSearchResults(null); }
    }, 350);
    return () => clearTimeout(t);
  }, [searchQ]);

  useEffect(() => {
    const handler = (e) => { if (searchRef.current && !searchRef.current.contains(e.target)) setSearchResults(null); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: '¿Cerrar sesión?', text: 'Se cerrará tu sesión actual.', icon: 'question',
      showCancelButton: true, confirmButtonColor: '#4f46e5', cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Sí, salir', cancelButtonText: 'Cancelar',
    });
    if (result.isConfirmed) { logout(); navigate('/login'); }
  };

  const initials = user?.nombre?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const fotoSrc = user?.foto_url ? `http://localhost:3001${user.foto_url}` : null;

  const bg = darkMode ? '#0f172a' : '#f1f5f9';
  const cardBg = darkMode ? '#1e293b' : '#fff';
  const borderColor = darkMode ? '#334155' : '#e2e8f0';
  const textPrimary = darkMode ? '#f1f5f9' : '#1e293b';
  const textMuted = darkMode ? '#94a3b8' : '#64748b';

  return (
    <div style={{ display: 'flex', height: '100vh', background: bg, overflow: 'hidden' }}>
      <NetworkError />

      {/* Sidebar */}
      <aside style={{ width: sidebarOpen ? 240 : 60, background: cardBg, borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', flexShrink: 0, transition: 'width 0.25s' }}>
        <div style={{ height: 64, display: 'flex', alignItems: 'center', padding: '0 14px', borderBottom: `1px solid ${borderColor}`, gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: '50%', flexShrink: 0, background: cardBg, boxShadow: '0 2px 8px rgba(79,70,229,0.25)', border: '2px solid #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 4 }}>
            <img src="/logo.png" alt="Aula Virtual" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          {sidebarOpen && <div><p style={{ fontWeight: 700, fontSize: 13, color: textPrimary, margin: 0 }}>Aula Virtual</p><p style={{ fontSize: 10, color: textMuted, margin: 0 }}>Panel Admin</p></div>}
        </div>

        <nav style={{ flex: 1, padding: 8, overflowY: 'auto' }} role="navigation" aria-label="Menú principal">
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} end={item.end} aria-label={item.label}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                borderRadius: 7, marginBottom: 2, textDecoration: 'none', fontSize: 13,
                background: isActive ? '#eef2ff' : 'transparent',
                color: isActive ? '#4f46e5' : textMuted,
                fontWeight: isActive ? 600 : 400,
                border: isActive ? '1px solid #c7d2fe' : '1px solid transparent',
              })}>
              {({ isActive }) => (
                <>
                  <item.icon size={16} aria-hidden="true" />
                  {sidebarOpen && <span style={{ flex: 1 }}>{item.label}</span>}
                  {sidebarOpen && item.path === '/app/notificaciones' && noLeidas > 0 && (
                    <span style={{ background: '#ef4444', color: 'white', fontSize: 10, borderRadius: 99, padding: '1px 5px', fontWeight: 700 }}>{noLeidas}</span>
                  )}
                  {sidebarOpen && isActive && <ChevronRight size={12} aria-hidden="true" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: 10, borderTop: `1px solid ${borderColor}` }}>
          {sidebarOpen && (
            <Link to="/app/perfil" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', marginBottom: 6, borderRadius: 8, textDecoration: 'none' }}>
              <div style={{ width: 30, height: 30, background: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {fotoSrc ? <img src={fotoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>{initials}</span>}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 12, fontWeight: 600, color: textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.nombre}</p>
                <p style={{ fontSize: 10, color: textMuted, margin: 0, textTransform: 'capitalize' }}>{user?.rol}</p>
              </div>
            </Link>
          )}
          <button onClick={handleLogout} aria-label="Cerrar sesión"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: textMuted, fontSize: 12 }}
            onMouseEnter={e => e.currentTarget.style.background = '#fef2f2'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
            <LogOut size={15} aria-hidden="true" />{sidebarOpen && <span>Cerrar Sesión</span>}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <header style={{ height: 64, background: cardBg, borderBottom: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', flexShrink: 0, gap: 12 }} role="banner">
          <button onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
            style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: textMuted, flexShrink: 0 }}>
            {sidebarOpen ? <X size={17} /> : <Menu size={17} />}
          </button>

          {/* Buscador global — Ctrl+K */}
          <div ref={searchRef} style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} aria-hidden="true" />
            <input ref={searchInputRef} value={searchQ} onChange={e => setSearchQ(e.target.value)}
              placeholder="Buscar... (Ctrl+K)" aria-label="Búsqueda global"
              style={{ width: '100%', paddingLeft: 32, paddingRight: 12, height: 36, borderRadius: 8, border: `1px solid ${borderColor}`, fontSize: 13, outline: 'none', background: bg, color: textPrimary }} />
            {searchResults && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: cardBg, border: `1px solid ${borderColor}`, borderRadius: 10, boxShadow: '0 8px 24px rgba(0,0,0,0.15)', zIndex: 50, marginTop: 4, maxHeight: 320, overflowY: 'auto' }} role="listbox">
                {searchResults.total === 0 ? (
                  <p style={{ padding: '12px 16px', fontSize: 13, color: '#94a3b8' }}>Sin resultados para "{searchQ}"</p>
                ) : (
                  <>
                    {searchResults.cursos?.length > 0 && (
                      <div>
                        <p style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Cursos</p>
                        {searchResults.cursos.map(c => (
                          <button key={c.id} onClick={() => { navigate('/app/cursos'); setSearchQ(''); setSearchResults(null); }}
                            style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, color: textPrimary, background: 'none', border: 'none', cursor: 'pointer', display: 'block' }}>
                            📚 {c.nombre}
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults.usuarios?.length > 0 && (
                      <div>
                        <p style={{ padding: '8px 14px 4px', fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Usuarios</p>
                        {searchResults.usuarios.map(u => (
                          <button key={u.id} onClick={() => { navigate('/app/usuarios'); setSearchQ(''); setSearchResults(null); }}
                            style={{ width: '100%', textAlign: 'left', padding: '8px 14px', fontSize: 13, color: textPrimary, background: 'none', border: 'none', cursor: 'pointer' }}>
                            👤 {u.nombre} <span style={{ color: '#94a3b8', fontSize: 11 }}>({u.tipo})</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            {/* Dark mode toggle — Mejora #31 */}
            <button onClick={toggleDarkMode} aria-label={darkMode ? 'Modo claro' : 'Modo oscuro'} title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              style={{ padding: 7, borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', color: textMuted, display: 'flex' }}>
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link to="/app/notificaciones" style={{ position: 'relative', padding: 7, borderRadius: 7, color: textMuted, textDecoration: 'none', display: 'flex' }} aria-label="Notificaciones">
              <Bell size={17} aria-hidden="true" />
              {noLeidas > 0 && <span style={{ position: 'absolute', top: 2, right: 2, width: 8, height: 8, background: '#ef4444', borderRadius: '50%', border: '1.5px solid white' }} />}
            </Link>
            <Link to="/app/perfil" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }} aria-label="Mi perfil">
              <div style={{ width: 30, height: 30, background: '#4f46e5', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {fotoSrc ? <img src={fotoSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ color: 'white', fontSize: 10, fontWeight: 700 }}>{initials}</span>}
              </div>
            </Link>
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: 24, background: bg }} role="main">
          <Breadcrumb />
          <div className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

/**
 * App.jsx — Enrutamiento principal con lazy loading
 * Mejora #81 — Lazy loading de rutas
 * Mejora #31 — Dark mode aplicado al iniciar
 */
import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useAuthStore } from './store/useAuthStore';
import { useThemeStore } from './store/useThemeStore';
import { useSessionCheck } from './hooks/useSessionCheck';
import { Loader } from './components/ui/Loader';
import { SkeletonDashboard } from './components/ui/Skeleton';

// ── Layouts (no lazy — se necesitan inmediatamente) ──────────
import { DashboardLayout } from './components/layout/DashboardLayout';
import { StudentLayout } from './components/layout/StudentLayout';
import { TeacherLayout } from './components/layout/TeacherLayout';

// ── Páginas públicas ─────────────────────────────────────────
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';

// ── Admin pages (lazy) ───────────────────────────────────────
const DashboardPage      = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const CoursesPage        = lazy(() => import('./pages/CoursesPage').then(m => ({ default: m.CoursesPage })));
const EnrollmentsPage    = lazy(() => import('./pages/EnrollmentsPage').then(m => ({ default: m.EnrollmentsPage })));
const UsersPage          = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const GradesPage         = lazy(() => import('./pages/GradesPage').then(m => ({ default: m.GradesPage })));
const AnnouncementsPage  = lazy(() => import('./pages/AnnouncementsPage').then(m => ({ default: m.AnnouncementsPage })));
const CategoriesPage     = lazy(() => import('./pages/CategoriesPage').then(m => ({ default: m.CategoriesPage })));
const ProfilePage        = lazy(() => import('./pages/ProfilePage').then(m => ({ default: m.ProfilePage })));
const AttendancePage     = lazy(() => import('./pages/AttendancePage').then(m => ({ default: m.AttendancePage })));
const TasksPage          = lazy(() => import('./pages/TasksPage').then(m => ({ default: m.TasksPage })));
const NotificationsPage  = lazy(() => import('./pages/NotificationsPage').then(m => ({ default: m.NotificationsPage })));
const MessagesPage       = lazy(() => import('./pages/MessagesPage').then(m => ({ default: m.MessagesPage })));
const MaterialsPage      = lazy(() => import('./pages/MaterialsPage').then(m => ({ default: m.MaterialsPage })));
const ReportsPage        = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const CertificatesPage   = lazy(() => import('./pages/CertificatesPage').then(m => ({ default: m.CertificatesPage })));
const CalendarPage       = lazy(() => import('./pages/CalendarPage').then(m => ({ default: m.CalendarPage })));
const ConfiguracionPage  = lazy(() => import('./pages/ConfiguracionPage').then(m => ({ default: m.ConfiguracionPage })));

// ── Student pages (lazy) ─────────────────────────────────────
const StudentDashboard        = lazy(() => import('./pages/student/StudentDashboard').then(m => ({ default: m.StudentDashboard })));
const StudentCoursesPage      = lazy(() => import('./pages/student/StudentCoursesPage').then(m => ({ default: m.StudentCoursesPage })));
const StudentGradesPage       = lazy(() => import('./pages/student/StudentGradesPage').then(m => ({ default: m.StudentGradesPage })));
const StudentTasksPage        = lazy(() => import('./pages/student/StudentTasksPage').then(m => ({ default: m.StudentTasksPage })));
const StudentMaterialsPage    = lazy(() => import('./pages/student/StudentMaterialsPage').then(m => ({ default: m.StudentMaterialsPage })));
const StudentMessagesPage     = lazy(() => import('./pages/student/StudentMessagesPage').then(m => ({ default: m.StudentMessagesPage })));
const StudentNotificationsPage = lazy(() => import('./pages/student/StudentNotificationsPage').then(m => ({ default: m.StudentNotificationsPage })));
const StudentCertificatesPage = lazy(() => import('./pages/student/StudentCertificatesPage').then(m => ({ default: m.StudentCertificatesPage })));
const StudentCalendarPage     = lazy(() => import('./pages/student/StudentCalendarPage').then(m => ({ default: m.StudentCalendarPage })));
const StudentProfilePage      = lazy(() => import('./pages/student/StudentProfilePage').then(m => ({ default: m.StudentProfilePage })));
const StudentEnrollPage       = lazy(() => import('./pages/student/StudentEnrollPage').then(m => ({ default: m.StudentEnrollPage })));

// ── Teacher pages (lazy) ─────────────────────────────────────
const TeacherDashboard         = lazy(() => import('./pages/teacher/TeacherDashboard').then(m => ({ default: m.TeacherDashboard })));
const TeacherCoursesPage       = lazy(() => import('./pages/teacher/TeacherCoursesPage').then(m => ({ default: m.TeacherCoursesPage })));
const TeacherStudentsPage      = lazy(() => import('./pages/teacher/TeacherStudentsPage').then(m => ({ default: m.TeacherStudentsPage })));
const TeacherGradesPage        = lazy(() => import('./pages/teacher/TeacherGradesPage').then(m => ({ default: m.TeacherGradesPage })));
const TeacherAttendancePage    = lazy(() => import('./pages/teacher/TeacherAttendancePage').then(m => ({ default: m.TeacherAttendancePage })));
const TeacherTasksPage         = lazy(() => import('./pages/teacher/TeacherTasksPage').then(m => ({ default: m.TeacherTasksPage })));
const TeacherMaterialsPage     = lazy(() => import('./pages/teacher/TeacherMaterialsPage').then(m => ({ default: m.TeacherMaterialsPage })));
const TeacherAnnouncementsPage = lazy(() => import('./pages/teacher/TeacherAnnouncementsPage').then(m => ({ default: m.TeacherAnnouncementsPage })));
const TeacherMessagesPage      = lazy(() => import('./pages/teacher/TeacherMessagesPage').then(m => ({ default: m.TeacherMessagesPage })));
const TeacherNotificationsPage = lazy(() => import('./pages/teacher/TeacherNotificationsPage').then(m => ({ default: m.TeacherNotificationsPage })));
const TeacherCalendarPage      = lazy(() => import('./pages/teacher/TeacherCalendarPage').then(m => ({ default: m.TeacherCalendarPage })));
const TeacherProfilePage       = lazy(() => import('./pages/teacher/TeacherProfilePage').then(m => ({ default: m.TeacherProfilePage })));
const TeacherStatsPage         = lazy(() => import('./pages/teacher/TeacherStatsPage').then(m => ({ default: m.TeacherStatsPage })));

// ── Fallback de carga ────────────────────────────────────────
const PageLoader = () => (
  <div style={{ padding: 24 }}>
    <SkeletonDashboard />
  </div>
);

// ── Guards ───────────────────────────────────────────────────
const RoleRedirect = () => {
  const user = useAuthStore((s) => s.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.rol === 'admin') return <Navigate to="/app" replace />;
  if (user.rol === 'profesor') return <Navigate to="/portal/profesor" replace />;
  return <Navigate to="/portal/alumno" replace />;
};

const RequireAuth = ({ children }) => {
  const { isAuthenticated, _hydrated } = useAuthStore();
  if (!_hydrated) return null;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const RequireRole = ({ roles, children }) => {
  const { isAuthenticated, user, _hydrated } = useAuthStore();
  if (!_hydrated) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!roles.includes(user?.rol)) return <RoleRedirect />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, _hydrated } = useAuthStore();
  if (!_hydrated) return null;
  if (isAuthenticated) return <RoleRedirect />;
  return children;
};

// ── App ──────────────────────────────────────────────────────
function App() {
  const [splash, setSplash] = useState(true);
  const { applyTheme } = useThemeStore();
  useSessionCheck();

  useEffect(() => {
    applyTheme();
    const t = setTimeout(() => setSplash(false), 1200);
    return () => clearTimeout(t);
  }, []);

  if (splash) return <Loader fullScreen text="Iniciando plataforma..." />;

  return (
    <div style={{ minHeight: '100vh' }}>
      <Toaster position="top-right" richColors closeButton duration={4000} />
      <Routes>
        {/* Públicas */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/admin" element={<PublicRoute><LoginPage /></PublicRoute>} />
        <Route path="/admin/register" element={<RegisterPage />} />
        <Route path="/register" element={<Navigate to="/admin/register" replace />} />
        <Route path="/redirect" element={<RequireAuth><RoleRedirect /></RequireAuth>} />

        {/* ── ADMIN ── */}
        <Route path="/app" element={<RequireRole roles={['admin']}><DashboardLayout /></RequireRole>}>
          <Route index element={<Suspense fallback={<PageLoader />}><DashboardPage /></Suspense>} />
          <Route path="cursos" element={<Suspense fallback={<PageLoader />}><CoursesPage /></Suspense>} />
          <Route path="inscripciones" element={<Suspense fallback={<PageLoader />}><EnrollmentsPage /></Suspense>} />
          <Route path="usuarios" element={<Suspense fallback={<PageLoader />}><UsersPage /></Suspense>} />
          <Route path="calificaciones" element={<Suspense fallback={<PageLoader />}><GradesPage /></Suspense>} />
          <Route path="anuncios" element={<Suspense fallback={<PageLoader />}><AnnouncementsPage /></Suspense>} />
          <Route path="categorias" element={<Suspense fallback={<PageLoader />}><CategoriesPage /></Suspense>} />
          <Route path="perfil" element={<Suspense fallback={<PageLoader />}><ProfilePage /></Suspense>} />
          <Route path="asistencia" element={<Suspense fallback={<PageLoader />}><AttendancePage /></Suspense>} />
          <Route path="tareas" element={<Suspense fallback={<PageLoader />}><TasksPage /></Suspense>} />
          <Route path="notificaciones" element={<Suspense fallback={<PageLoader />}><NotificationsPage /></Suspense>} />
          <Route path="mensajes" element={<Suspense fallback={<PageLoader />}><MessagesPage /></Suspense>} />
          <Route path="materiales" element={<Suspense fallback={<PageLoader />}><MaterialsPage /></Suspense>} />
          <Route path="reportes" element={<Suspense fallback={<PageLoader />}><ReportsPage /></Suspense>} />
          <Route path="certificados" element={<Suspense fallback={<PageLoader />}><CertificatesPage /></Suspense>} />
          <Route path="calendario" element={<Suspense fallback={<PageLoader />}><CalendarPage /></Suspense>} />
          <Route path="configuracion" element={<Suspense fallback={<PageLoader />}><ConfiguracionPage /></Suspense>} />
        </Route>

        {/* ── ALUMNO ── */}
        <Route path="/portal/alumno" element={<RequireRole roles={['estudiante']}><StudentLayout /></RequireRole>}>
          <Route index element={<Suspense fallback={<PageLoader />}><StudentDashboard /></Suspense>} />
          <Route path="cursos" element={<Suspense fallback={<PageLoader />}><StudentCoursesPage /></Suspense>} />
          <Route path="inscribirse" element={<Suspense fallback={<PageLoader />}><StudentEnrollPage /></Suspense>} />
          <Route path="calificaciones" element={<Suspense fallback={<PageLoader />}><StudentGradesPage /></Suspense>} />
          <Route path="tareas" element={<Suspense fallback={<PageLoader />}><StudentTasksPage /></Suspense>} />
          <Route path="materiales" element={<Suspense fallback={<PageLoader />}><StudentMaterialsPage /></Suspense>} />
          <Route path="mensajes" element={<Suspense fallback={<PageLoader />}><StudentMessagesPage /></Suspense>} />
          <Route path="notificaciones" element={<Suspense fallback={<PageLoader />}><StudentNotificationsPage /></Suspense>} />
          <Route path="certificados" element={<Suspense fallback={<PageLoader />}><StudentCertificatesPage /></Suspense>} />
          <Route path="calendario" element={<Suspense fallback={<PageLoader />}><StudentCalendarPage /></Suspense>} />
          <Route path="perfil" element={<Suspense fallback={<PageLoader />}><StudentProfilePage /></Suspense>} />
        </Route>

        {/* ── PROFESOR ── */}
        <Route path="/portal/profesor" element={<RequireRole roles={['profesor']}><TeacherLayout /></RequireRole>}>
          <Route index element={<Suspense fallback={<PageLoader />}><TeacherDashboard /></Suspense>} />
          <Route path="cursos" element={<Suspense fallback={<PageLoader />}><TeacherCoursesPage /></Suspense>} />
          <Route path="alumnos" element={<Suspense fallback={<PageLoader />}><TeacherStudentsPage /></Suspense>} />
          <Route path="calificaciones" element={<Suspense fallback={<PageLoader />}><TeacherGradesPage /></Suspense>} />
          <Route path="asistencia" element={<Suspense fallback={<PageLoader />}><TeacherAttendancePage /></Suspense>} />
          <Route path="tareas" element={<Suspense fallback={<PageLoader />}><TeacherTasksPage /></Suspense>} />
          <Route path="materiales" element={<Suspense fallback={<PageLoader />}><TeacherMaterialsPage /></Suspense>} />
          <Route path="anuncios" element={<Suspense fallback={<PageLoader />}><TeacherAnnouncementsPage /></Suspense>} />
          <Route path="mensajes" element={<Suspense fallback={<PageLoader />}><TeacherMessagesPage /></Suspense>} />
          <Route path="notificaciones" element={<Suspense fallback={<PageLoader />}><TeacherNotificationsPage /></Suspense>} />
          <Route path="calendario" element={<Suspense fallback={<PageLoader />}><TeacherCalendarPage /></Suspense>} />
          <Route path="estadisticas" element={<Suspense fallback={<PageLoader />}><TeacherStatsPage /></Suspense>} />
          <Route path="perfil" element={<Suspense fallback={<PageLoader />}><TeacherProfilePage /></Suspense>} />
        </Route>

        <Route path="*" element={<RequireAuth><RoleRedirect /></RequireAuth>} />
      </Routes>
    </div>
  );
}

export default App;

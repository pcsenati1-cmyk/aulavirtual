import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { GraduationCap, Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { gsap } from 'gsap';
import { useAuthStore } from '../store/useAuthStore';
import { authService } from '../services/api';
import { Button } from '../components/ui/Button';

export const LoginPage = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuthStore();

  useEffect(() => {
    gsap.fromTo('.login-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await authService.login(data);
      login(response.user, response.token);
      Swal.fire({ icon: 'success', title: `¡Bienvenido, ${response.user.nombre}!`, toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
      const rol = response.user.rol;
      if (rol === 'admin') navigate('/app');
      else if (rol === 'profesor') navigate('/portal/profesor');
      else navigate('/portal/alumno');
    } catch (error) {
      Swal.fire({ icon:"error", title:"Error", text:error.response?.data?.message || 'Credenciales incorrectas', toast:true, position:"top-end", showConfirmButton:false, timer:4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-indigo-600 flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-700 to-violet-700" />

        {/* Botón volver al inicio — esquina superior izquierda */}
        <Link to="/"
          className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/80 hover:text-white text-sm font-medium transition-colors"
          style={{ textDecoration: 'none' }}>
          <ArrowLeft size={16} />
          Volver al inicio
        </Link>

        <div className="relative z-10 text-center text-white">
          <div className="w-20 h-20 rounded-full mx-auto mb-6 shadow-xl login-logo" style={{ background:'#fff', border:'3px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', padding:'6px' }}>
            <img src="/logo.png" alt="Aula Virtual" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Aula Virtual</h1>
          <p className="text-indigo-100 text-lg max-w-sm">
            Sistema de gestión educativa
          </p>
          <div className="mt-10 grid grid-cols-3 gap-4 text-center">
            {[['100+', 'Cursos'], ['500+', 'Estudiantes'], ['50+', 'Profesores']].map(([num, label]) => (
              <div key={label} className="bg-white/10 rounded-xl p-4">
                <p className="text-2xl font-bold">{num}</p>
                <p className="text-indigo-200 text-sm">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md login-card">

          {/* Botón volver — visible en móvil */}
          <div className="lg:hidden mb-4">
            <Link to="/"
              className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 text-sm font-medium transition-colors"
              style={{ textDecoration: 'none' }}>
              <ArrowLeft size={15} />
              Volver al inicio
            </Link>
          </div>

          <div className="lg:hidden text-center mb-8">
            <div className="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-3">
              <GraduationCap className="text-white" size={28} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Aula Virtual</h1>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <h2 className="text-2xl font-bold text-slate-800 mb-1">Iniciar Sesión</h2>
            <p className="text-slate-500 text-sm mb-6">Ingresa tus credenciales para continuar</p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label className="form-label">Correo electrónico</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('email', { required: 'El email es requerido' })}
                    type="email"
                    placeholder="tu@email.com"
                    className="form-input pl-9"
                  />
                </div>
                {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="form-label">Contraseña</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    {...register('password', { required: 'La contraseña es requerida' })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    className="form-input pl-9 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
              </div>

              <Button type="submit" className="w-full" size="lg" loading={loading}>
                Iniciar Sesión
              </Button>
            </form>

            <p className="text-center mt-6 text-sm text-slate-600">
              ¿No tienes cuenta?{' '}
              <Link to="/admin/register" className="text-indigo-600 hover:text-indigo-700 font-semibold">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

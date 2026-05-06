import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import Swal from 'sweetalert2';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle, XCircle } from 'lucide-react';
import { gsap } from 'gsap';
import { authService } from '../services/api';
import { Button } from '../components/ui/Button';

// Indicador de fortaleza de contraseña en tiempo real — Mejora #35
const PasswordStrength = ({ password = '' }) => {
  const rules = [
    { label: 'Mínimo 8 caracteres',    ok: password.length >= 8 },
    { label: 'Una mayúscula',           ok: /[A-Z]/.test(password) },
    { label: 'Un número',               ok: /[0-9]/.test(password) },
    { label: 'Un símbolo (!@#$...)',    ok: /[^A-Za-z0-9]/.test(password) },
  ];
  if (!password) return null;
  return (
    <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
      {rules.map(r => (
        <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
          {r.ok
            ? <CheckCircle size={12} color="#059669" />
            : <XCircle size={12} color="#dc2626" />}
          <span style={{ color: r.ok ? '#059669' : '#dc2626' }}>{r.label}</span>
        </div>
      ))}
    </div>
  );
};

export const RegisterPage = () => {
  const { register, handleSubmit, formState: { errors }, watch } = useForm();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const passwordValue = watch('password', '');

  useEffect(() => {
    gsap.fromTo('.register-card', { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' });
  }, []);

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      await authService.register(data);
      Swal.fire({ icon: 'success', title: '¡Cuenta creada! Inicia sesión.', toast: true, position: 'top-end', showConfirmButton: false, timer: 3000, timerProgressBar: true });
      navigate('/admin');
    } catch (error) {
      Swal.fire({ icon: 'error', title: 'Error', text: error.response?.data?.message || 'Error al registrarse', toast: true, position: 'top-end', showConfirmButton: false, timer: 4000 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md register-card">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full mx-auto mb-3 shadow-lg" style={{ background: '#fff', border: '2px solid #e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px' }}>
            <img src="/logo.png" alt="Aula Virtual" className="w-full h-full object-contain" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Crear Cuenta</h1>
          <p className="text-slate-500 text-sm mt-1">Únete al sistema educativo</p>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Nombre */}
            <div>
              <label className="form-label">Nombre completo</label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('nombre', {
                    required: 'El nombre es requerido',
                    minLength: { value: 2, message: 'Mínimo 2 caracteres' },
                  })}
                  placeholder="Juan Pérez"
                  className="form-input pl-9"
                />
              </div>
              {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="form-label">Correo electrónico</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('email', {
                    required: 'El email es requerido',
                    pattern: { value: /^\S+@\S+\.\S+$/i, message: 'Email inválido' },
                  })}
                  type="email"
                  placeholder="tu@email.com"
                  className="form-input pl-9"
                />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            {/* Contraseña */}
            <div>
              <label className="form-label">Contraseña</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  {...register('password', {
                    required: 'La contraseña es requerida',
                    minLength: { value: 8, message: 'Mínimo 8 caracteres' },
                    validate: {
                      hasUpper:  v => /[A-Z]/.test(v)        || 'Necesita una mayúscula',
                      hasNumber: v => /[0-9]/.test(v)        || 'Necesita un número',
                      hasSymbol: v => /[^A-Za-z0-9]/.test(v) || 'Necesita un símbolo',
                    },
                  })}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="form-input pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <PasswordStrength password={passwordValue} />
              {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
            </div>

            <Button type="submit" className="w-full mt-2" size="lg" loading={loading}>
              Crear Cuenta
            </Button>
          </form>

          <p className="text-center mt-5 text-sm text-slate-600">
            ¿Ya tienes cuenta?{' '}
            <Link to="/admin" className="text-indigo-600 hover:text-indigo-700 font-semibold">
              Inicia sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

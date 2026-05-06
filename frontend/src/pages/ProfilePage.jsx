import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { User, Mail, Lock, Camera, Save } from 'lucide-react';
import { perfilService } from '../services/api';
import { useAuthStore } from '../store/useAuthStore';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

export const ProfilePage = () => {
  const { user, login } = useAuthStore();
  const [perfil, setPerfil] = useState(null);
  const [fotoPreview, setFotoPreview] = useState(null);
  const [fotoFile, setFotoFile] = useState(null);
  const [loadingPerfil, setLoadingPerfil] = useState(false);
  const [loadingPass, setLoadingPass] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const { register: regPass, handleSubmit: handlePass, reset: resetPass, formState: { errors: errPass } } = useForm();

  useEffect(() => {
    perfilService.get().then(r => {
      setPerfil(r.data);
      reset({ nombre: r.data.nombre, email: r.data.email });
      // Sincronizar foto_url al store para que los avatares del sidebar se actualicen
      login({ ...user, nombre: r.data.nombre, foto_url: r.data.foto_url }, localStorage.getItem('token'));
    });
  }, []);

  const onSubmitPerfil = async (data) => {
    setLoadingPerfil(true);
    try {
      const fd = new FormData();
      fd.append('nombre', data.nombre);
      fd.append('email', data.email);
      if (fotoFile) fd.append('foto', fotoFile);
      await perfilService.update(fd);
      toast.success('Perfil actualizado');
      const r = await perfilService.get();
      setPerfil(r.data);
      login({ ...user, nombre: r.data.nombre, foto_url: r.data.foto_url }, localStorage.getItem('token'));
    } catch (e) { toast.error(e.response?.data?.message || 'Error al actualizar'); }
    finally { setLoadingPerfil(false); }
  };

  const onSubmitPass = async (data) => {
    setLoadingPass(true);
    try {
      await perfilService.changePassword(data);
      toast.success('Contraseña actualizada');
      resetPass();
    } catch (e) { toast.error(e.response?.data?.message || 'Error'); }
    finally { setLoadingPass(false); }
  };

  const handleFoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setFotoFile(file);
    setFotoPreview(URL.createObjectURL(file));
  };

  const initials = perfil?.nombre?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3001';
  const fotoSrc = fotoPreview || (perfil?.foto_url ? `${apiBase}${perfil.foto_url}` : null);

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gestiona tu información personal</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit(onSubmitPerfil)} className="space-y-5">
            {/* Foto */}
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center overflow-hidden">
                  {fotoSrc
                    ? <img src={fotoSrc} alt="foto" className="w-full h-full object-cover" />
                    : <span className="text-indigo-700 text-2xl font-bold">{initials}</span>}
                </div>
                <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-indigo-700 transition-colors">
                  <Camera size={13} color="white" />
                  <input type="file" accept="image/*" className="hidden" onChange={handleFoto} />
                </label>
              </div>
              <div>
                <p className="font-semibold text-slate-800">{perfil?.nombre}</p>
                <p className="text-sm text-slate-500 capitalize">{perfil?.rol}</p>
              </div>
            </div>

            <div>
              <label className="form-label">Nombre completo</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('nombre', { required: 'Requerido' })} className="form-input pl-9" />
              </div>
              {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre.message}</p>}
            </div>

            <div>
              <label className="form-label">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input {...register('email', { required: 'Requerido' })} type="email" className="form-input pl-9" />
              </div>
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
            </div>

            <Button type="submit" loading={loadingPerfil}>
              <Save size={15} className="mr-2" /> Guardar cambios
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Lock size={16} /> Cambiar contraseña
          </h2>
          <form onSubmit={handlePass(onSubmitPass)} className="space-y-4">
            <div>
              <label className="form-label">Contraseña actual</label>
              <input {...regPass('password_actual', { required: 'Requerido' })} type="password" className="form-input" placeholder="••••••••" />
              {errPass.password_actual && <p className="mt-1 text-xs text-red-600">{errPass.password_actual.message}</p>}
            </div>
            <div>
              <label className="form-label">Nueva contraseña</label>
              <input {...regPass('password_nuevo', { required: 'Requerido', minLength: { value: 6, message: 'Mínimo 6 caracteres' } })} type="password" className="form-input" placeholder="••••••••" />
              {errPass.password_nuevo && <p className="mt-1 text-xs text-red-600">{errPass.password_nuevo.message}</p>}
            </div>
            <Button type="submit" variant="outline" loading={loadingPass}>Actualizar contraseña</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

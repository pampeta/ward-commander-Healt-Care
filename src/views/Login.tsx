import { useState } from 'react';
import { supabase } from '../Services/supabase';
import { Mail, Lock, LogIn, UserPlus, Stethoscope } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cargando, setCargando] = useState(false);
  const [esRegistro, setEsRegistro] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);

    if (esRegistro) {
      const { data, error } = await supabase.auth.signUp({ email, password });
      if (error) {
        alert(`Error al registrarse: ${error.message}`);
      } else if (!data.session) {
        alert('¡Registro exitoso! Revisa tu correo para confirmar la cuenta.');
        setEsRegistro(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        alert(`Error al iniciar sesión: ${error.message}`);
      }
    }
    setCargando(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Fondo Aesthetic (Igual a la barra lateral de la app) */}
      <div 
        className="absolute inset-0 opacity-[0.04] pointer-events-none" 
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}
      ></div>
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Tarjeta de Login Adaptativa */}
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative z-10 animate-in zoom-in-95 duration-300">
        
        <div className="text-center mb-8 space-y-3">
          <div className="mx-auto w-14 h-14 sm:w-16 sm:h-16 bg-slate-950 rounded-2xl flex items-center justify-center shadow-lg mb-4 transform rotate-3">
            <Stethoscope className="w-7 h-7 sm:w-8 sm:h-8 text-emerald-400 -rotate-3" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-cyan-600 font-serif italic drop-shadow-sm leading-tight">
            El Rincón del Interno
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 font-medium px-2">
            {esRegistro ? 'Crea tu cuenta para sincronizar tus pacientes en todos tus dispositivos.' : 'Inicia sesión para acceder a tu censo y apuntes en la nube.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Correo Electrónico</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 focus:bg-white outline-none text-sm transition-all text-gray-800"
                placeholder="tu.correo@hospital.cl"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] sm:text-xs font-bold text-gray-500 uppercase mb-1.5 tracking-wider">Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 focus:border-emerald-400 focus:bg-white outline-none text-sm transition-all text-gray-800"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={cargando}
            className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3.5 rounded-xl transition-all shadow-md disabled:opacity-70 disabled:cursor-not-allowed text-sm mt-2"
          >
            {cargando ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Procesando...
              </span>
            ) : esRegistro ? (
              <><UserPlus className="w-4 h-4" /> Crear Cuenta</>
            ) : (
              <><LogIn className="w-4 h-4" /> Iniciar Sesión</>
            )}
          </button>
        </form>

        <div className="mt-8 text-center border-t border-gray-100 pt-6">
          <p className="text-[11px] sm:text-xs text-gray-500 mb-2">
            {esRegistro ? '¿Ya tienes una cuenta?' : '¿Eres nuevo en El Rincón del Interno?'}
          </p>
          <button
            onClick={() => setEsRegistro(!esRegistro)}
            className="text-xs sm:text-sm text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
          >
            {esRegistro ? 'Inicia sesión aquí' : 'Regístrate gratis aquí'}
          </button>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { Settings, Key, ShieldCheck, Save, PhoneCall, HeartPulse } from 'lucide-react';

export const YoModule: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    const config = localStorage.getItem('wc_config');
    if (config) {
      setApiKey(JSON.parse(config).apiKey || '');
    }
  }, []);

  const handleSave = () => {
    const config = { apiKey };
    localStorage.setItem('wc_config', JSON.stringify(config));
    setStatus('API Key guardada correctamente.');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    // Reducción de paddings en celular (p-3 md:p-6)
    <div className="p-3 md:p-6 max-w-xl mx-auto space-y-4 md:space-y-6 bg-gray-50 min-h-full">
      
      {/* CABECERA ADAPTATIVA */}
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-3 md:gap-4">
        <div className="bg-slate-900 p-2.5 rounded-xl shrink-0">
          <Settings className="w-5 h-5 md:w-6 md:h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight leading-tight">Control & Configuración</h1>
          <p className="text-xs md:text-sm text-gray-500">Ajustes locales y accesos de emergencia.</p>
        </div>
      </div>
      
      {/* TARJETA DE CONFIGURACIÓN API */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4 md:space-y-5">
        
        <div>
          <label className="flex items-center gap-1.5 text-[11px] md:text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
            <Key className="w-3.5 h-3.5" /> Google AI Studio API Key (Gemini)
          </label>
          <input
            type="password"
            className="w-full p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-sm md:text-base font-mono focus:ring-2 focus:ring-blue-400 outline-none transition-shadow text-gray-800"
            placeholder="Pega aquí tu clave AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          
          <div className="mt-2.5 flex items-start gap-1.5 bg-blue-50/50 p-2.5 rounded-lg border border-blue-100">
            <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
            <p className="text-[10px] md:text-[11px] text-gray-500 leading-relaxed">
              Esta clave permanece en el <strong className="text-gray-700">almacenamiento local de este dispositivo</strong> y nunca se envía a servidores externos.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {status ? (
            <p className="text-xs text-green-600 font-bold animate-in fade-in flex items-center gap-1 order-2 sm:order-1 bg-green-50 px-3 py-1.5 rounded-lg w-fit">
              ✓ {status}
            </p>
          ) : (
            <div className="order-2 sm:order-1"></div> // Espaciador
          )}
          
          <button
            onClick={handleSave}
            className="w-full sm:w-auto order-1 sm:order-2 flex items-center justify-center gap-2 bg-slate-900 text-white font-bold py-3 px-5 md:py-2.5 rounded-xl text-sm hover:bg-slate-800 transition-colors shadow-md"
          >
            <Save className="w-4 h-4" /> Guardar Configuración
          </button>
        </div>
      </div>

      {/* TARJETA DE EMERGENCIA (Diseño nativo de alerta) */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white p-5 md:p-6 rounded-2xl shadow-lg border border-red-500 flex flex-col items-center text-center space-y-3 relative overflow-hidden">
        
        {/* Fondo decorativo sutil */}
        <HeartPulse className="absolute -right-4 -bottom-4 w-32 h-32 text-red-500 opacity-20 pointer-events-none" />
        <HeartPulse className="absolute -left-4 -top-4 w-24 h-24 text-red-500 opacity-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center space-y-2">
          <div className="bg-red-500/50 p-3 rounded-full mb-1">
            <PhoneCall className="w-6 h-6 md:w-8 md:h-8 text-white" />
          </div>
          <p className="text-[10px] md:text-xs uppercase tracking-widest font-semibold text-red-100">
            Urgencia e Impacto Emocional
          </p>
          <p className="text-2xl md:text-3xl font-black tracking-tight drop-shadow-md">
            Salud Responde
          </p>
          <a 
            href="tel:6003607777" 
            className="mt-2 bg-white text-red-700 font-black text-lg md:text-xl py-2 px-6 rounded-full shadow-lg hover:bg-gray-50 transition-transform active:scale-95"
          >
            600 360 7777
          </a>
          <p className="text-[10px] text-red-200 mt-2">Toca el número para llamar directamente</p>
        </div>
      </div>
      
    </div>
  );
};
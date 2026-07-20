import React, { useState, useEffect } from 'react';

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
    setStatus('✓ API Key guardada localmente en tu navegador.');
    setTimeout(() => setStatus(''), 3000);
  };

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <h2 className="text-xl font-bold tracking-tight text-gray-800">Control & Configuración Local</h2>
      
      <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
            Google AI Studio API Key (Gemini)
          </label>
          <input
            type="password"
            className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-blue-500"
            placeholder="Pega aquí tu clave AIzaSy..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Esta clave permanece en el almacenamiento local de este navegador y nunca se envía a servidores externos.
          </p>
        </div>

        <button
          onClick={handleSave}
          className="bg-slate-900 text-white font-bold py-2 px-4 rounded-lg text-sm hover:bg-slate-800 transition-colors"
        >
          Guardar Configuración
        </button>

        {status && (
          <p className="text-xs text-green-600 font-semibold animate-fadeIn">{status}</p>
        )}
      </div>

      <div className="bg-red-900 text-white p-4 rounded-xl text-center shadow">
        <p className="text-xs uppercase tracking-wider opacity-70">Urgencia e Impacto Emocional</p>
        <p className="text-lg font-black">Salud Responde: 600 360 7777</p>
      </div>
    </div>
  );
};
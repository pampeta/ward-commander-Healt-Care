import React, { useState, useEffect } from 'react';
import { Users, CheckSquare, BookOpen, User, BrainCircuit, Calendar, FileText, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DesktopLayout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  // Estado para el modo nocturno (persiste en el navegador)
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('wc_dark_mode');
    return saved ? JSON.parse(saved) : true; // Por defecto lo iniciamos en modo nocturno ideal para guardias
  });

  useEffect(() => {
    localStorage.setItem('wc_dark_mode', JSON.stringify(darkMode));
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  const menuItems = [
    { id: 'censo', label: 'Censo Pacientes', icon: Users },
    { id: 'tareas', label: 'Tareas y Flujos', icon: CheckSquare },
    { id: 'estudio', label: 'Plan EUNACOM', icon: BookOpen },
    { id: 'tutor', label: 'Instructor Clínico', icon: BrainCircuit },
    { id: 'calendario', label: 'Calendario y Pruebas', icon: Calendar },
    { id: 'epicrisis', label: 'Generador Docs', icon: FileText },
    { id: 'yo', label: 'Control & Métricas', icon: User },
  ];

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans ${darkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-gray-100 text-gray-950'}`}>
      <aside className={`w-64 flex flex-col justify-between shadow-xl z-20 shrink-0 transition-colors duration-200 ${darkMode ? 'bg-slate-900 text-slate-200 border-r border-slate-800' : 'bg-slate-900 text-slate-200'}`}>
        <div>
          {/* CABECERA: EL RINCÓN DEL INTERNO */}
          <div className="p-6 bg-slate-950 border-b border-slate-800 text-center">
            <h1 className="text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-serif italic drop-shadow-md leading-tight">
              El Rincón del Interno
            </h1>
          </div>

          <nav className="p-3 space-y-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                    isActive ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* PIE DE PÁGINA CON SELECTOR DE MODO NOCTURNO */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 space-y-3 text-xs text-slate-400">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-300">Magallanes • Zona Austral</span>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors border border-slate-700"
            title="Cambiar modo de visualización"
          >
            {darkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Modo Día</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-cyan-400" />
                <span>Modo Nocturno 🌙</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <main className={`flex-1 h-full overflow-y-auto transition-colors duration-200 ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-gray-50 text-gray-900'}`}>
        {children}
      </main>
    </div>
  );
};
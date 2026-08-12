import React from 'react';
import { Users, CheckSquare, BookOpen, User, BrainCircuit, Calendar, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const DesktopLayout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
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
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 text-gray-950 font-sans">
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between shadow-xl z-20 shrink-0">
        <div>
          {/* CABECERA AESTHETIC ABSTRACTA */}
          <div className="relative pt-10 pb-12 bg-slate-950 text-center overflow-hidden">
            
            {/* 1. Cuadrícula sutil inspirada en estética de diseño (Grid) */}
            <div 
              className="absolute inset-0 opacity-[0.04] pointer-events-none" 
              style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}
            ></div>

            {/* 2. Luces ambientales (Esmeralda clínico + Oro Rosado floral) */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-rose-400/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* 3. Título en 2 líneas */}
            <div className="relative z-10 px-4">
              <h1 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-serif italic drop-shadow-xl leading-tight">
                El Rincón del<br />Interno
              </h1>
            </div>

            {/* 4. Ola geométrica en la parte inferior */}
            <svg 
              className="absolute bottom-0 left-0 w-full text-slate-900 pointer-events-none translate-y-[1px]" 
              viewBox="0 0 1440 120" 
              fill="currentColor" 
              preserveAspectRatio="none" 
              style={{ height: '28px' }}
            >
              <path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path>
            </svg>
          </div>

          {/* MENÚ */}
          <nav className="p-3 space-y-1.5 pt-4">
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

        {/* PIE DE PÁGINA */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Magallanes • Zona Austral</p>
        </div>
      </aside>

      <main className="flex-1 h-full overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
};
import React from 'react';
import { Users, CheckSquare, BookOpen, Cpu, User, BrainCircuit } from 'lucide-react'; // 1. Agregué BrainCircuit

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
    { id: 'ia', label: 'Generador IA Gemini', icon: Cpu },
    { id: 'tutor', label: 'Instructor Clínico IA', icon: BrainCircuit }, // 2. Botón añadido
    { id: 'yo', label: 'Control & Métricas', icon: User },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 text-gray-950 font-sans">
      <aside className="w-64 bg-slate-900 text-slate-200 flex flex-col justify-between shadow-xl z-20 shrink-0">
        <div>
          <div className="p-5 bg-slate-950 flex items-center gap-3 border-b border-slate-800">
            <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
            <div>
              <h1 className="text-md font-black tracking-wider uppercase text-white">WardCommander</h1>
              <p className="text-[10px] text-slate-400 font-mono">v2.0.0 • Internado HCM</p>
            </div>
          </div>
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-lg transition-all ${
                    isActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
          <p className="font-semibold text-slate-300">Residencia Magallanes</p>
          <p className="opacity-75">Modo Local: IndexedDB</p>
        </div>
      </aside>
      <main className="flex-1 h-full overflow-y-auto bg-gray-50">
        {children}
      </main>
    </div>
  );
};
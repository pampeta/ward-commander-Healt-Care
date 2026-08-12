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
          {/* CABECERA CON FONDO AESTHETIC / PAPEL ANEXO VINTAGE MÉDICO */}
          <div className="relative p-6 bg-slate-950 border-b border-slate-800 text-center overflow-hidden">
            {/* Capa de textura aesthetic tipo papel de libro anatómico con sutil tono sepia/rosado */}
            <div 
              className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-cover bg-center"
              style={{
                backgroundImage: `url("https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&q=80&w=400")`
              }}
            ></div>
            
            {/* Marco decorativo sutil estilo vintage */}
            <div className="absolute inset-1 border border-emerald-500/20 rounded pointer-events-none"></div>

            {/* Título Principal Estilizado */}
            <h1 className="relative z-10 text-lg font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 font-serif italic drop-shadow-md leading-snug">
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
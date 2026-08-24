import React, { useState, useEffect } from 'react';
import { Users, CheckSquare, BookOpen, User, BrainCircuit, Calendar, FileText, Menu, X, Calculator, GraduationCap, Activity, Moon, Sun } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  // Estado para controlar si el menú móvil está abierto o cerrado
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Estado del Modo Noche Clínico
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const guardado = localStorage.getItem('wardcommander_theme');
    if (guardado) return guardado === 'dark';
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('wardcommander_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('wardcommander_theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  const menuItems = [
    { id: 'censo', label: 'Censo Pacientes', icon: Users },
    { id: 'ia', label: 'Generador Docs (IA)', icon: FileText },
    { id: 'examenOral', label: 'Examen Oral Clínico', icon: GraduationCap },
    { id: 'calculadoras', label: 'Calculadoras Médicas', icon: Calculator },
    { id: 'ecg', label: 'ECG & Reuniones', icon: Activity },
    { id: 'estudio', label: 'Plan EUNACOM & Tests', icon: BookOpen },
    { id: 'tareas', label: 'Tareas y Flujos', icon: CheckSquare },
    { id: 'tutor', label: 'Instructor Clínico', icon: BrainCircuit },
    { id: 'calendario', label: 'Calendario & Turnos', icon: Calendar },
    { id: 'yo', label: 'Control & Configuración', icon: User },
  ];

  // Función para cerrar el menú móvil al seleccionar una pestaña
  const handleTabSelect = (tabId: string) => {
    setActiveTab(tabId);
    setIsMobileMenuOpen(false); // Cierra el menú en móvil
  };

  return (
    // Estructura principal adaptativa: flex-col en móvil, flex-row en PC (md: breakpoint)
    <div className="flex h-screen w-screen overflow-hidden bg-gray-100 dark:bg-slate-950 text-gray-950 dark:text-slate-100 font-sans flex-col md:flex-row">
      
      {/* --- CABECERA MÓVIL (MOBILE HEADER) --- */}
      {/* Se muestra SOLO en móvil/tablet (<768px). md:hidden lo oculta en PC */}
      <header className="md:hidden bg-slate-950 text-slate-200 p-3.5 border-b border-slate-800 flex items-center justify-between z-30 shadow-lg shrink-0">
        <h1 className="text-sm font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-serif italic drop-shadow-md">
          El Rincón del Interno
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-amber-300 transition-colors"
            title={isDarkMode ? "Cambiar a Modo Día" : "Cambiar a Modo Noche / Turno"}
          >
            {isDarkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-300" />}
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 bg-slate-800 rounded-lg text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* --- BARRA LATERAL ADAPTATIVA (RESPONSIVE ASIDE) --- */}
      {/* Ocupa ancho completo sobre la pantalla en móvil (absolute) y ancho fijo a la izquierda en PC (relative) */}
      <aside className={`
        ${isMobileMenuOpen ? 'flex absolute inset-0 top-[60px] z-20 h-[calc(100vh-60px)] w-screen bg-slate-950 overflow-y-auto' : 'hidden md:flex'}
        md:relative md:top-0 md:h-screen md:w-64 md:flex-col md:shadow-xl md:bg-slate-900 md:shrink-0
        text-slate-200 justify-between transition-all duration-300
      `}>
        <div className="md:border-r md:border-slate-800 flex-1 flex flex-col">
          {/* CABECERA ESTÉTICA DESKTOP (se oculta en móvil) */}
          <div className="hidden md:flex relative pt-8 pb-10 bg-slate-950 text-center overflow-hidden border-b border-slate-800">
            {/* Cuadrícula sutil */}
            <div 
              className="absolute inset-0 opacity-[0.04] pointer-events-none" 
              style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }}
            ></div>
            {/* Luces ambientales */}
            <div className="absolute -top-6 -left-6 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-rose-400/10 rounded-full blur-3xl pointer-events-none"></div>
            {/* Título en 2 líneas Desktop */}
            <div className="relative z-10 px-4 w-full">
              <h1 className="text-2xl font-black tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 font-serif italic drop-shadow-xl leading-tight">
                El Rincón del<br />Interno
              </h1>
            </div>
            {/* Ola geométrica inferior */}
            <svg className="absolute bottom-0 left-0 w-full text-slate-900 pointer-events-none translate-y-[1px]" viewBox="0 0 1440 120" fill="currentColor" preserveAspectRatio="none" style={{ height: '28px' }}><path d="M0,64L80,69.3C160,75,320,85,480,80C640,75,800,53,960,48C1120,43,1280,53,1360,58.7L1440,64L1440,120L1360,120C1280,120,1120,120,960,120C800,120,640,120,480,120C320,120,160,120,80,120L0,120Z"></path></svg>
          </div>

          {/* MENÚ DE NAVEGACIÓN (adaptado para móvil y PC) */}
          <nav className="p-3 space-y-1 pt-3 md:pt-4 flex-1 overflow-y-auto">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabSelect(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-xs md:text-sm font-semibold rounded-xl transition-all ${
                    isActive ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 md:hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4 md:w-5 md:h-5 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* PIE DE PÁGINA (Footer en PC con Toggle de Modo Noche) */}
        <div className="p-3.5 bg-slate-950 border-t border-slate-800 text-xs text-slate-400 flex items-center justify-between">
          <button
            onClick={toggleDarkMode}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 rounded-xl font-bold transition-all text-xs shadow-sm"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-400" />
                <span>☀️ Modo Día</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-slate-300" />
                <span>🌙 Modo Noche (Turno)</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* --- ÁREA DE CONTENIDO PRINCIPAL (MAIN CONTENT) --- */}
      {/* Se ajusta p-3/p-4 y blur si el menú móvil está abierto */}
      <main className={`flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-slate-950 transition-all p-3 md:p-4 ${isMobileMenuOpen ? 'blur-sm md:blur-none pointer-events-none md:pointer-events-auto' : ''}`}>
        {children}
      </main>
    </div>
  );
};
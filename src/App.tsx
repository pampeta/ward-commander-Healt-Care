import { useState, useEffect } from "react";
import { supabase } from "./Services/supabase";
import Login from "./views/Login";
import { Layout } from './components/Layout';
import { IAModuleDesktop } from "./views/IA";
import { YoModule } from "./views/Yo";
import Censo from './views/Censo';
import Tareas from './views/Tareas';
import PlanEunacom from './views/PlanEunacom';
import TutorClinico from "./views/TutorClinico";
import CalendarioPruebas from "./views/CalendarioPruebas";
import ExamenOral from "./views/ExamenOral";
import CalculadorasMedicas from "./views/CalculadorasMedicas";
import EcgReunionClinica from "./views/EcgReunionClinica";
import { Moon, Sun } from "lucide-react";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("censo");

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const guardado = localStorage.getItem('wardcommander_theme');
    if (guardado) return guardado === 'dark';
    return false;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const nextVal = !prev;
      if (nextVal) {
        document.documentElement.classList.add('dark');
        localStorage.setItem('wardcommander_theme', 'dark');
      } else {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('wardcommander_theme', 'light');
      }
      return nextVal;
    });
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCargandoSesion(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setCargandoSesion(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (cargandoSesion) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-medium">
        Cargando WardCommander...
      </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "ia":
        return <IAModuleDesktop />;
      case "yo":
        return <YoModule />;
      case "censo":
        return <Censo />;
      case "tareas":
        return <Tareas />;
      case "estudio":
        return <PlanEunacom />;
      case "tutor":
        return <TutorClinico />;
      case "calendario":
        return <CalendarioPruebas />;
      case "examenOral":
        return <ExamenOral />;
      case "calculadoras":
        return <CalculadorasMedicas />;
      case "ecg":
        return <EcgReunionClinica />;
      default:
        return <Censo />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="relative h-full flex flex-col">
        <div className="absolute top-2 right-4 z-50 flex items-center gap-2">
          <button
            onClick={toggleDarkMode}
            className="text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-amber-300 border border-slate-300 dark:border-slate-700 px-2.5 py-1.5 rounded-lg font-bold transition-all shadow-sm flex items-center gap-1.5"
            title={isDarkMode ? "Cambiar a Modo Día" : "Cambiar a Modo Noche"}
          >
            {isDarkMode ? <><Sun className="w-3.5 h-3.5 text-amber-400" /><span className="hidden sm:inline">Día</span></> : <><Moon className="w-3.5 h-3.5 text-slate-600" /><span className="hidden sm:inline">Noche</span></>}
          </button>

          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
          >
            Salir 🚪
          </button>
        </div>
        {renderContent()}
      </div>
    </Layout>
  );
}
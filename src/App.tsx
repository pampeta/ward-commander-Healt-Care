import { useState, useEffect } from "react";
import { supabase } from "./Services/supabase";
import Login from "./views/Login";
import { DesktopLayout } from "./components/Layout";
import { IAModuleDesktop } from "./views/IA";
import { YoModule } from "./views/Yo";
import Censo from './views/Censo';
import Tareas from './views/Tareas';
import PlanEunacom from './views/PlanEunacom';
import TutorClinico from "./views/TutorClinico";

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("ia");

  useEffect(() => {
    // 1. Obtener la sesión actual al cargar la app
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setCargandoSesion(false);
    });

    // 2. Escuchar cambios de sesión (login, logout)
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

  // Si no ha iniciado sesión, mostramos la pantalla de Login
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
      default:
        return <IAModuleDesktop />;
    }
  };

  return (
    <DesktopLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      <div className="relative h-full flex flex-col">
        {/* Botón flotante para cerrar sesión de forma segura */}
        <div className="absolute top-2 right-4 z-50">
          <button
            onClick={() => supabase.auth.signOut()}
            className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-bold transition-all shadow-sm"
          >
            Cerrar Sesión 🚪
          </button>
        </div>
        {renderContent()}
      </div>
    </DesktopLayout>
  );
}
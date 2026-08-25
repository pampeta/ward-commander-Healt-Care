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
export default function App() {
  const [session, setSession] = useState<any>(null);
  const [cargandoSesion, setCargandoSesion] = useState(true);
  const [activeTab, setActiveTab] = useState<string>("censo");

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
      <div className="h-full flex flex-col min-h-0 overflow-y-auto">
        {renderContent()}
      </div>
    </Layout>
  );
}
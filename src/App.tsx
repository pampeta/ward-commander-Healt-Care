import { useState } from "react";
import { DesktopLayout } from "./components/Layout";
import { IAModuleDesktop } from "./views/IA";
import { YoModule } from "./views/Yo";
import Censo from './views/Censo';
import Tareas from './views/Tareas';
import PlanEunacom from './views/PlanEunacom';
import TutorClinico from "./views/TutorClinico"; // <-- Ya está importado

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("ia");

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
      case "tutor": // <-- NUEVO CASO AÑADIDO
        return <TutorClinico />;
      default:
        return <IAModuleDesktop />;
    }
  };

  return (
    <DesktopLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </DesktopLayout>
  );
}
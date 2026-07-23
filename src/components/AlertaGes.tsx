import { useState, useEffect } from "react";
import { LISTA_GES } from "../data/gesList";
import type { PatologiaGes } from "../data/gesList";
import { AlertTriangle } from "lucide-react";

interface AlertaGesProps {
  textoClinico: string;
  pacienteId: string;
}

export default function AlertaGes({ textoClinico, pacienteId }: AlertaGesProps) {
  const [patologiasDetectadas, setPatologiasDetectadas] = useState<PatologiaGes[]>([]);
  const [estadoGes, setEstadoGes] = useState<Record<number, string>>(() => {
    try {
      const guardado = localStorage.getItem(`ges_estado_${pacienteId}`);
      return guardado ? JSON.parse(guardado) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    if (!textoClinico) return;
    const textoLower = textoClinico.toLowerCase();
    
    const encontradas = LISTA_GES.filter(ges => 
      ges.keywords.some(keyword => textoLower.includes(keyword))
    );
    
    setPatologiasDetectadas(encontradas);
  }, [textoClinico]);

  const actualizarEstado = (numeroGes: number, respuesta: "Sí" | "No") => {
    const nuevoEstado = { ...estadoGes, [numeroGes]: respuesta };
    setEstadoGes(nuevoEstado);
    localStorage.setItem(`ges_estado_${pacienteId}`, JSON.stringify(nuevoEstado));
  };

  if (patologiasDetectadas.length === 0) return null;

  return (
    <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-sm space-y-2">
      <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Alerta GES Detectada:</span>
      </div>

      <div className="space-y-2">
        {patologiasDetectadas.map((ges) => {
          const respuestaActual = estadoGes[ges.numero];
          return (
            <div key={ges.numero} className="bg-white p-2 rounded-lg border border-amber-200 flex flex-col gap-1.5 text-xs">
              <div>
                <span className="font-extrabold text-gray-900">GES Nº {ges.numero}:</span>{" "}
                <span className="text-gray-700">{ges.nombre}</span>
              </div>
              
              <div className="flex justify-between items-center pt-1 border-t border-amber-50">
                <span className="text-[11px] text-gray-500 font-medium">¿Activado GES?</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => actualizarEstado(ges.numero, "Sí")}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                      respuestaActual === "Sí" 
                        ? "bg-green-600 text-white shadow" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => actualizarEstado(ges.numero, "No")}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                      respuestaActual === "No" 
                        ? "bg-red-600 text-white shadow" 
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from "react";
import { LISTA_GES, PatologiaGes } from "../data/gesList";

interface AlertaGesProps {
  textoClinico: string; // Diagnósticos o antecedentes del paciente en el censo
  pacienteId: string;
}

export default function AlertaGes({ textoClinico, pacienteId }: AlertaGesProps) {
  const [patologiasDetectadas, setPatologiasDetectadas] = useState<PatologiaGes[]>([]);
  const [estadoGes, setEstadoGes] = useState<Record<number, string>>(() => {
    const guardado = localStorage.getItem(`ges_estado_${pacienteId}`);
    return guardado ? JSON.parse(guardado) : {};
  });

  useEffect(() => {
    if (!textoClinico) return;
    const textoLower = textoClinico.toLowerCase();
    
    // Detectar qué patologías hacen match con el texto del censo
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
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-3 my-2 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-amber-600 font-bold text-sm">⚠️ Alerta GES Detectada:</span>
        <span className="text-xs text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full font-semibold">
          Verificar Garantías Explícitas
        </span>
      </div>

      <div className="space-y-2">
        {patologiasDetectadas.map((ges) => {
          const respuestaActual = estadoGes[ges.numero];
          return (
            <div key={ges.numero} className="bg-white p-2.5 rounded-lg border border-amber-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
              <div>
                <span className="font-bold text-gray-800">GES Nº {ges.numero}:</span> {ges.nombre}
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-gray-500 font-medium">¿Activado GES?</span>
                <button
                  onClick={() => actualizarEstado(ges.numero, "Sí")}
                  className={`px-3 py-1 rounded font-bold transition-all ${
                    respuestaActual === "Sí" 
                      ? "bg-green-600 text-white shadow" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Sí
                </button>
                <button
                  onClick={() => actualizarEstado(ges.numero, "No")}
                  className={`px-3 py-1 rounded font-bold transition-all ${
                    respuestaActual === "No" 
                      ? "bg-red-600 text-white shadow" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  No
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
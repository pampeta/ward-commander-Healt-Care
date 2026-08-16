import React, { useState, useEffect } from "react";
import { CheckSquare, Trash2, PlusCircle, AlertCircle, ClipboardList } from "lucide-react";

interface Tarea {
  id: number;
  texto: string;
  prioridad: "Urgente" | "Procedimiento" | "Gestión";
  completada: boolean;
}

export default function Tareas() {
  // Inicializar estado con localStorage para persistencia
  const [tareas, setTareas] = useState<Tarea[]>(() => {
    try {
      const guardadas = localStorage.getItem("ward_commander_tareas");
      return guardadas ? JSON.parse(guardadas) : [];
    } catch {
      return [];
    }
  });

  const [texto, setTexto] = useState("");
  const [prioridad, setPrioridad] = useState<"Urgente" | "Procedimiento" | "Gestión">("Gestión");

  // Guardar cambios en localStorage automáticamente
  useEffect(() => {
    localStorage.setItem("ward_commander_tareas", JSON.stringify(tareas));
  }, [tareas]);

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto.trim()) return;
    setTareas([{ id: Date.now(), texto: texto.trim(), prioridad, completada: false }, ...tareas]);
    setTexto("");
  };

  const toggle = (id: number) => {
    setTareas(tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
  };

  const borrar = (id: number) => {
    setTareas(tareas.filter(t => t.id !== id));
  };

  // Contadores para estadísticas rápidas
  const pendientes = tareas.filter(t => !t.completada).length;
  const urgentes = tareas.filter(t => !t.completada && t.prioridad === "Urgente").length;

  return (
    // Reducción de paddings en celular (p-3 md:p-6)
    <div className="p-3 md:p-6 max-w-5xl mx-auto space-y-4 md:space-y-6 bg-gray-50 min-h-full">
      
      {/* CABECERA ADAPTATIVA */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <CheckSquare className="w-6 h-6 md:w-7 md:h-7 text-blue-600" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Tareas y Flujos</h1>
          </div>
          <p className="text-xs md:text-sm text-gray-500">Lista centralizada de procedimientos, gestión y prioridades clínicas.</p>
        </div>

        {/* Estadísticas rápidas superiores */}
        <div className="flex gap-2 self-start md:self-center shrink-0">
          <div className="bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200">
            <span className="text-xs font-bold text-gray-600">Pendientes:</span>
            <span className="ml-1.5 text-sm font-black text-blue-600">{pendientes}</span>
          </div>
          {urgentes > 0 && (
            <div className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-200 animate-pulse">
              <span className="text-xs font-bold text-red-600 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" /> {urgentes} Urgente{urgentes !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* FORMULARIO DE INGRESO (Mobile-First: Apilado en móvil, en línea en PC) */}
      <form onSubmit={agregar} className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-3">
        <input 
          type="text" 
          value={texto} 
          onChange={e => setTexto(e.target.value)} 
          placeholder="Ej. Solicitar interconsulta a Cardiología..." 
          className="flex-1 bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition-all text-gray-800" 
        />
        <div className="flex gap-3">
            <select 
              value={prioridad} 
              onChange={e => setPrioridad(e.target.value as any)} 
              className="w-full md:w-auto bg-gray-50 border border-gray-200 p-3 rounded-xl text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer appearance-none px-4"
            >
              <option value="Urgente">🔴 Urgente</option>
              <option value="Procedimiento">🟡 Procedimiento</option>
              <option value="Gestión">🔵 Gestión</option>
            </select>
            <button type="submit" disabled={!texto.trim()} className="bg-blue-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0">
              <PlusCircle className="w-4 h-4 md:w-5 md:h-5" />
              <span className="hidden xs:inline">Agregar</span>
            </button>
        </div>
      </form>

      {/* LISTA INTERACTIVA DE TAREAS */}
      <div className="space-y-3 pb-8">
        {tareas.length === 0 ? (
          <div className="text-center p-12 bg-white rounded-2xl border-2 border-dashed border-gray-200 shadow-sm flex flex-col items-center gap-3">
            <div className="bg-blue-50 p-4 rounded-full">
              <ClipboardList className="w-8 h-8 text-blue-300" />
            </div>
            <p className="text-gray-500 font-medium text-sm">No hay tareas registradas.</p>
            <p className="text-gray-400 text-xs">Agrega nuevas tareas arriba para empezar a organizar tu turno.</p>
          </div>
        ) : (
          tareas.map(t => (
            <div 
              key={t.id} 
              className={`flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-white rounded-xl border shadow-sm transition-all gap-3 sm:gap-4 ${t.completada ? 'opacity-60 bg-gray-50/50 border-gray-200' : 'border-gray-200 hover:shadow-md hover:border-blue-200'}`}
            >
              {/* Sección Izquierda: Checkbox y Texto */}
              <div className="flex items-start sm:items-center gap-3 md:gap-4 flex-1">
                <div className="pt-0.5 sm:pt-0 shrink-0">
                    <input 
                    type="checkbox" 
                    checked={t.completada} 
                    onChange={() => toggle(t.id)} 
                    className="w-5 h-5 cursor-pointer accent-blue-600 rounded" 
                    />
                </div>
                <span className={`text-sm md:text-base font-medium leading-snug flex-1 ${t.completada ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                  {t.texto}
                </span>
              </div>

              {/* Sección Derecha: Etiqueta y Botón Borrar (Apilados abajo en móvil, alineados derecha en PC) */}
              <div className="flex items-center justify-between sm:justify-end gap-3 pl-8 sm:pl-0 border-t sm:border-t-0 border-gray-100 pt-2 sm:pt-0 shrink-0">
                <span className={`text-[10px] md:text-xs px-2.5 py-1 rounded-md font-bold tracking-wide uppercase border ${
                  t.prioridad === 'Urgente' ? 'bg-red-50 border-red-200 text-red-700' : 
                  t.prioridad === 'Procedimiento' ? 'bg-yellow-50 border-yellow-200 text-yellow-800' : 
                  'bg-blue-50 border-blue-200 text-blue-700'
                }`}>
                  {t.prioridad}
                </span>
                
                <button 
                  onClick={() => borrar(t.id)} 
                  className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1.5 rounded-lg transition-colors border border-transparent hover:border-red-100 flex items-center justify-center shrink-0"
                  title="Eliminar tarea"
                >
                  <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
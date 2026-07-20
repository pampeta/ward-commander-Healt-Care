import { useState } from "react";

interface Tarea {
  id: number;
  texto: string;
  prioridad: "Urgente" | "Procedimiento" | "Gestión";
  completada: boolean;
}

export default function Tareas() {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [texto, setTexto] = useState("");
  const [prioridad, setPrioridad] = useState<"Urgente" | "Procedimiento" | "Gestión">("Gestión");

  const agregar = (e: React.FormEvent) => {
    e.preventDefault();
    if (!texto) return;
    setTareas([...tareas, { id: Date.now(), texto, prioridad, completada: false }]);
    setTexto("");
  };

  const toggle = (id: number) => {
    setTareas(tareas.map(t => t.id === id ? { ...t, completada: !t.completada } : t));
  };

  const borrar = (id: number) => {
    setTareas(tareas.filter(t => t.id !== id));
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Tareas Documentales y Lista de Revisión</h1>
      
      {/* FORMULARIO DE INGRESO RÁPIDO */}
      <form onSubmit={agregar} className="flex gap-4 mb-8 bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <input 
          type="text" 
          value={texto} 
          onChange={e => setTexto(e.target.value)} 
          placeholder="Ej. Solicitar interconsulta a Cardiología..." 
          className="flex-1 border p-2 rounded outline-none focus:ring-2 focus:ring-blue-500" 
        />
        <select 
          value={prioridad} 
          onChange={e => setPrioridad(e.target.value as any)} 
          className="border p-2 rounded outline-none font-medium cursor-pointer"
        >
          <option value="Urgente">🔴 Urgente</option>
          <option value="Procedimiento">🟡 Procedimiento</option>
          <option value="Gestión">🔵 Gestión</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded font-semibold hover:bg-blue-700 transition">
          + Agregar
        </button>
      </form>

      {/* LISTA INTERACTIVA */}
      <div className="space-y-3">
        {tareas.length === 0 ? (
          <div className="text-center p-10 bg-slate-50 rounded-lg border border-dashed border-gray-300">
            <p className="text-gray-500 font-medium">No hay tareas pendientes. ¡Todo al día en la sala!</p>
          </div>
        ) : (
          tareas.map(t => (
            <div 
              key={t.id} 
              className={`flex items-center justify-between p-4 bg-white rounded-lg border shadow-sm transition-all ${t.completada ? 'opacity-50 grayscale bg-gray-50' : 'hover:shadow-md'}`}
            >
              <div className="flex items-center gap-4 flex-1">
                <input 
                  type="checkbox" 
                  checked={t.completada} 
                  onChange={() => toggle(t.id)} 
                  className="w-5 h-5 cursor-pointer accent-blue-600" 
                />
                <span className={`font-medium flex-1 ${t.completada ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                  {t.texto}
                </span>
                <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                  t.prioridad === 'Urgente' ? 'bg-red-100 text-red-700' : 
                  t.prioridad === 'Procedimiento' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-blue-100 text-blue-800'
                }`}>
                  {t.prioridad}
                </span>
              </div>
              <button 
                onClick={() => borrar(t.id)} 
                className="ml-6 text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded transition"
                title="Eliminar tarea"
              >
                ✖
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
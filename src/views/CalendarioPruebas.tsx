import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Trash2, BookOpen, Clock, AlertCircle } from "lucide-react";

interface EventoAcademico {
  id: string;
  titulo: string;
  fecha: string; // YYYY-MM-DD
  tipo: "Prueba / Solemne" | "Rotación / Turno" | "Examen Beca / EUNACOM" | "Entrega / Tarea";
  contenidos: string;
}

export default function CalendarioPruebas() {
  const [eventos, setEventos] = useState<EventoAcademico[]>(() => {
    try {
      const guardados = localStorage.getItem("ward_commander_calendario");
      if (guardados) {
        const parsed = JSON.parse(guardados);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: "1",
        titulo: "Examen EUNACOM Sección Medicina Interna",
        fecha: new Date().toISOString().split("T")[0],
        tipo: "Examen Beca / EUNACOM",
        contenidos: "Cardiología (Insuficiencia cardíaca, IAM), Neumonía, EPOC, Nefrología (ERC)."
      }
    ];
  });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split("T")[0]);
  const [nuevoTipo, setNuevoTipo] = useState<EventoAcademico["tipo"]>("Prueba / Solemne");
  const [nuevosContenidos, setNuevosContenidos] = useState("");

  useEffect(() => {
    localStorage.setItem("ward_commander_calendario", JSON.stringify(eventos));
  }, [eventos]);

  const agregarEvento = () => {
    if (!nuevoTitulo.trim() || !nuevaFecha) {
      alert("Por favor ingresa un título y una fecha.");
      return;
    }

    const evento: EventoAcademico = {
      id: Date.now().toString(),
      titulo: nuevoTitulo.trim(),
      fecha: nuevaFecha,
      tipo: nuevoTipo,
      contenidos: nuevosContenidos.trim()
    };

    setEventos(prev => [...prev, evento].sort((a, b) => a.fecha.localeCompare(b.fecha)));
    setNuevoTitulo("");
    setNuevosContenidos("");
    setModalAbierto(false);
  };

  const eliminarEvento = (id: string) => {
    if (confirm("¿Eliminar este evento o prueba?")) {
      setEventos(prev => prev.filter(e => e.id !== id));
    }
  };

  const hoyStr = new Date().toISOString().split("T")[0];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-7 h-7 text-purple-600" /> Calendario, Pruebas & Contenidos
          </h1>
          <p className="text-sm text-gray-500">Organiza tus turnos, exámenes, pruebas y revisa exactamente qué contenidos entran.</p>
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow"
        >
          <Plus className="w-4 h-4" /> Agregar Prueba / Evento
        </button>
      </div>

      {/* LISTA DE EVENTOS Y PRUEBAS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {eventos.map((ev) => {
          const esHoy = ev.fecha === hoyStr;

          return (
            <div key={ev.id} className={`bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between space-y-4 relative overflow-hidden ${esHoy ? 'border-2 border-purple-500 bg-purple-50/20' : 'border-gray-200'}`}>
              {esHoy && (
                <span className="absolute top-0 right-0 bg-purple-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl uppercase tracking-wider">
                  ¡Es Hoy! 🎯
                </span>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    ev.tipo === 'Examen Beca / EUNACOM' ? 'bg-red-100 text-red-800' :
                    ev.tipo === 'Prueba / Solemne' ? 'bg-blue-100 text-blue-800' :
                    ev.tipo === 'Rotación / Turno' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {ev.tipo}
                  </span>
                </div>

                <h3 className="font-bold text-gray-900 text-base leading-tight">{ev.titulo}</h3>

                <div className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                  <Clock className="w-3.5 h-3.5 text-purple-600" /> Fecha: {ev.fecha}
                </div>

                <div className="mt-3 bg-slate-50 p-3 rounded-lg border text-xs space-y-1">
                  <span className="font-bold text-slate-700 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-blue-600" /> Contenidos / Materia Evaluada:
                  </span>
                  <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {ev.contenidos || "Sin contenidos detallados registrados."}
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t flex justify-end">
                <button
                  onClick={() => eliminarEvento(ev.id)}
                  className="text-gray-400 hover:text-red-600 p-1 flex items-center gap-1 text-xs font-bold transition-colors"
                >
                  <Trash2 className="w-4 h-4" /> Eliminar
                </button>
              </div>
            </div>
          );
        })}

        {eventos.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
            No hay pruebas o eventos agendados. Haz clic en "Agregar Prueba / Evento" para comenzar.
          </div>
        )}
      </div>

      {/* MODAL PARA AGREGAR */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600" /> Agendar Nuevo Evento o Prueba
            </h2>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Título de la Prueba / Evento *</label>
              <input
                type="text"
                placeholder="Ej. Examen final de Pediatría o Turno UCI"
                value={nuevoTitulo}
                onChange={e => setNuevoTitulo(e.target.value)}
                className="w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Fecha *</label>
                <input
                  type="date"
                  value={nuevaFecha}
                  onChange={e => setNuevaFecha(e.target.value)}
                  className="w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Tipo de Evento</label>
                <select
                  value={nuevoTipo}
                  onChange={e => setNuevoTipo(e.target.value as any)}
                  className="w-full p-2 border rounded text-sm outline-none bg-white focus:ring-1 focus:ring-purple-500"
                >
                  <option value="Prueba / Solemne">Prueba / Solemne</option>
                  <option value="Examen Beca / EUNACOM">Examen Beca / EUNACOM</option>
                  <option value="Rotación / Turno">Rotación / Turno</option>
                  <option value="Entrega / Tarea">Entrega / Tarea</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Contenidos que entran en la prueba</label>
              <textarea
                rows={4}
                placeholder="Ej. Temas: Asma infantil, neumonía, crisis obstructiva, reanimación neonatal..."
                value={nuevosContenidos}
                onChange={e => setNuevosContenidos(e.target.value)}
                className="w-full p-2 border rounded text-sm outline-none focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setModalAbierto(false)} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-bold rounded-lg">Cancelar</button>
              <button onClick={agregarEvento} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-lg shadow">
                Guardar Evento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
import { useState, useEffect } from "react";
import { Calendar as CalendarIcon, Plus, Trash2, BookOpen, Clock, AlertCircle, ChevronLeft, ChevronRight, CloudCloud } from "lucide-react";
import { guardarEnNube, cargarDeNube } from "../Services/cloudSync";

interface EventoAcademico { id: string; titulo: string; fecha: string; tipo: "Prueba / Solemne" | "Rotación / Turno" | "Examen Beca / EUNACOM" | "Entrega / Tarea"; contenidos: string; }

export default function CalendarioPruebas() {
  const [eventos, setEventos] = useState<EventoAcademico[]>([]);
  const [descargando, setDescargando] = useState(true);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split("T")[0]);
  const [nuevoTipo, setNuevoTipo] = useState<EventoAcademico["tipo"]>("Prueba / Solemne");
  const [nuevosContenidos, setNuevosContenidos] = useState("");
  const [fechaActualVisual, setFechaActualVisual] = useState(new Date());

  useEffect(() => {
    async function sincronizarCalendario() {
      const datosNube = await cargarDeNube('calendario');
      
      if (datosNube && Array.isArray(datosNube) && datosNube.length > 0) {
        setEventos(datosNube);
      } else {
        const guardados = localStorage.getItem("ward_commander_calendario");
        if (guardados) {
          try { setEventos(JSON.parse(guardados)); } catch(e) { setEventos([]); }
        } else {
          setEventos([{ id: "1", titulo: "Examen EUNACOM Sección Medicina Interna", fecha: new Date().toISOString().split("T")[0], tipo: "Examen Beca / EUNACOM", contenidos: "Cardiología, Neumonía, EPOC, Nefrología." }]);
        }
      }
      setDescargando(false);
    }
    sincronizarCalendario();
  }, []);

  useEffect(() => {
    if (!descargando) {
      localStorage.setItem("ward_commander_calendario", JSON.stringify(eventos));
      guardarEnNube('calendario', eventos);
    }
  }, [eventos, descargando]);

  const agregarEvento = () => {
    if (!nuevoTitulo.trim() || !nuevaFecha) { alert("Por favor ingresa un título y una fecha."); return; }
    const evento: EventoAcademico = { id: Date.now().toString(), titulo: nuevoTitulo.trim(), fecha: nuevaFecha, tipo: nuevoTipo, contenidos: nuevosContenidos.trim() };
    setEventos(prev => [...prev, evento].sort((a, b) => a.fecha.localeCompare(b.fecha)));
    setNuevoTitulo(""); setNuevosContenidos(""); setModalAbierto(false);
  };

  const eliminarEvento = (id: string) => {
    if (window.confirm("¿Eliminar este evento o prueba?")) {
      setEventos(prev => prev.filter(e => e.id !== id));
    }
  };

  const hoyStr = new Date().toISOString().split("T")[0];
  const anioVisual = fechaActualVisual.getFullYear();
  const mesVisual = fechaActualVisual.getMonth(); 
  const primerDiaMes = new Date(anioVisual, mesVisual, 1);
  const ultimoDiaMes = new Date(anioVisual, mesVisual + 1, 0);
  const diasEnMes = ultimoDiaMes.getDate();
  let diaInicioSemana = primerDiaMes.getDay() - 1;
  if (diaInicioSemana === -1) diaInicioSemana = 6;
  const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
  const cambiarMes = (direccion: number) => { setFechaActualVisual(new Date(anioVisual, mesVisual + direccion, 1)); };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-5 md:space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 md:w-7 md:h-7 text-purple-600 shrink-0" /> 
            <span>Calendario, Pruebas & Contenidos</span>
          </h1>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <span>Visualiza tus fechas importantes.</span>
            {!descargando && <span className="flex items-center gap-1 bg-purple-50 text-purple-700 font-semibold px-2 py-0.5 rounded-md border border-purple-200 ml-2"><CloudCloud className="w-3 h-3"/> Nube</span>}
          </div>
        </div>
        <button onClick={() => setModalAbierto(true)} className="w-full md:w-auto bg-purple-600 hover:bg-purple-700 text-white px-5 py-3 rounded-xl md:rounded-lg text-sm font-bold flex justify-center items-center gap-2 shadow transition-colors shrink-0"><Plus className="w-5 h-5 md:w-4 md:h-4" /> Agregar Prueba / Evento</button>
      </div>

      {descargando ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold text-sm">Sincronizando calendario...</p>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6 space-y-4 overflow-hidden">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h2 className="text-base md:text-xl font-bold text-gray-800 capitalize">{nombresMeses[mesVisual]} {anioVisual}</h2>
              <div className="flex items-center gap-1.5 md:gap-2">
                <button onClick={() => setFechaActualVisual(new Date())} className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs md:text-sm font-bold text-gray-700">Hoy</button>
                <div className="flex bg-gray-100 rounded-lg p-0.5">
                  <button onClick={() => cambiarMes(-1)} className="p-1.5 md:p-2 hover:bg-white rounded-md text-gray-700"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /></button>
                  <button onClick={() => cambiarMes(1)} className="p-1.5 md:p-2 hover:bg-white rounded-md text-gray-700"><ChevronRight className="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
              </div>
            </div>
            <div className="w-full overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0">
              <div className="min-w-[280px]">
                <div className="grid grid-cols-7 gap-1 md:gap-2 text-center font-bold text-[10px] md:text-xs text-gray-400 uppercase tracking-wider mb-2">
                  <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {Array.from({ length: diaInicioSemana }).map((_, index) => (<div key={`empty-${index}`} className="min-h-[60px] md:min-h-[96px] bg-gray-50/50 rounded-lg md:rounded-xl border border-transparent"></div>))}
                  {Array.from({ length: diasEnMes }).map((_, index) => {
                    const numeroDia = index + 1;
                    const mesStr = String(mesVisual + 1).padStart(2, '0');
                    const diaStr = String(numeroDia).padStart(2, '0');
                    const fechaFormateada = `${anioVisual}-${mesStr}-${diaStr}`;
                    const esHoy = fechaFormateada === hoyStr;
                    const eventosDelDia = eventos.filter(ev => ev.fecha === fechaFormateada);
                    return (
                      <div key={fechaFormateada} className={`min-h-[60px] md:min-h-[96px] p-1 md:p-2 rounded-lg md:rounded-xl border flex flex-col justify-start md:justify-between overflow-hidden transition-all relative ${esHoy ? 'border-purple-500 bg-purple-50/40 ring-1 md:ring-2 ring-purple-200' : 'border-gray-200 bg-white'}`}>
                        <div className="flex justify-center md:justify-between items-start md:items-center w-full">
                          <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded ${esHoy ? 'bg-purple-600 text-white shadow-sm' : 'text-gray-700'}`}>{numeroDia}</span>
                          {eventosDelDia.length > 0 && (<span className="hidden sm:inline-flex text-[9px] md:text-[10px] font-bold bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded-full absolute top-1 right-1 md:relative md:top-0 md:right-0">{eventosDelDia.length}</span>)}
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5 w-full">
                          {eventosDelDia.map(ev => {
                            let colorPunto = 'bg-gray-400'; let colorFondo = 'bg-gray-100'; let colorTexto = 'text-gray-800';
                            if (ev.tipo === 'Examen Beca / EUNACOM') { colorPunto = 'bg-red-500'; colorFondo = 'bg-red-50'; colorTexto = 'text-red-800'; }
                            else if (ev.tipo === 'Prueba / Solemne') { colorPunto = 'bg-blue-500'; colorFondo = 'bg-blue-50'; colorTexto = 'text-blue-800'; }
                            else if (ev.tipo === 'Rotación / Turno') { colorPunto = 'bg-green-500'; colorFondo = 'bg-green-50'; colorTexto = 'text-green-800'; }
                            else if (ev.tipo === 'Entrega / Tarea') { colorPunto = 'bg-amber-500'; colorFondo = 'bg-amber-50'; colorTexto = 'text-amber-800'; }
                            return (
                              <div key={ev.id} className="w-full flex justify-center md:justify-start" title={`${ev.titulo} (${ev.tipo})`}>
                                  <div className={`md:hidden w-2.5 h-2.5 rounded-full ${colorPunto}`}></div>
                                  <div className={`hidden md:block w-full text-[9px] md:text-[10px] font-semibold px-1 py-0.5 rounded truncate ${colorFondo} ${colorTexto}`}>{ev.titulo}</div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm md:text-base font-bold text-gray-800 mb-3 md:mb-4 px-1">Detalle de Pruebas, Turnos y Contenidos</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {eventos.map((ev) => {
                const esHoy = ev.fecha === hoyStr;
                return (
                  <div key={ev.id} className={`bg-white rounded-xl md:rounded-2xl border shadow-sm p-4 md:p-5 flex flex-col justify-between space-y-3 md:space-y-4 relative overflow-hidden ${esHoy ? 'border-2 border-purple-500 bg-purple-50/20' : 'border-gray-100'}`}>
                    {esHoy && (<span className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] md:text-[10px] font-bold px-2 md:px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">¡Es Hoy! 🎯</span>)}
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] md:text-xs font-bold px-2 py-0.5 md:px-2.5 md:py-1 rounded-full border ${ev.tipo === 'Examen Beca / EUNACOM' ? 'bg-red-50 border-red-200 text-red-800' : ev.tipo === 'Prueba / Solemne' ? 'bg-blue-50 border-blue-200 text-blue-800' : ev.tipo === 'Rotación / Turno' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>{ev.tipo}</span>
                      </div>
                      <h3 className="font-bold text-gray-950 text-sm md:text-base leading-snug">{ev.titulo}</h3>
                      <div className="flex items-center gap-1.5 text-xs text-gray-600 font-mono bg-gray-50 w-fit px-2 py-1 rounded-md border border-gray-100"><Clock className="w-3.5 h-3.5 text-purple-600" /> {ev.fecha.split('-').reverse().join('/')}</div>
                      <div className="mt-3 bg-gray-50/80 p-3 rounded-xl border border-gray-100 text-xs space-y-1.5">
                        <span className="font-bold text-gray-800 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5 text-blue-600" /> Contenidos / Materia Evaluada:</span>
                        <p className="text-gray-600 leading-relaxed whitespace-pre-wrap pl-5">{ev.contenidos || "Sin contenidos detallados registrados."}</p>
                      </div>
                    </div>
                    <div className="pt-3 border-t border-gray-100 flex justify-end">
                      <button onClick={() => eliminarEvento(ev.id)} className="text-gray-400 hover:text-red-600 p-1.5 flex items-center gap-1.5 text-xs font-semibold transition-colors rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4" /> Eliminar</button>
                    </div>
                  </div>
                );
              })}
              {eventos.length === 0 && (
                <div className="col-span-full text-center py-12 md:py-16 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                  <div className="flex flex-col items-center gap-2"><CalendarIcon className="w-10 h-10 text-gray-300" /><p className="text-sm font-medium">No hay pruebas o eventos agendados.</p></div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white sm:rounded-2xl rounded-t-2xl max-w-lg w-full p-5 md:p-6 space-y-4 md:space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-base md:text-lg font-extrabold text-gray-900 border-b border-gray-100 pb-3 flex items-center gap-2"><AlertCircle className="w-5 h-5 text-purple-600" /> Agendar Nuevo Evento</h2>
            <div className="space-y-4">
                <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1.5">Título <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Ej. Examen final" value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1.5">Fecha <span className="text-red-500">*</span></label>
                    <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400" />
                </div>
                <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1.5">Tipo de Evento</label>
                    <select value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value as any)} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400">
                    <option value="Prueba / Solemne">Prueba / Solemne</option>
                    <option value="Examen Beca / EUNACOM">Examen Beca / EUNACOM</option>
                    <option value="Rotación / Turno">Rotación / Turno</option>
                    <option value="Entrega / Tarea">Entrega / Tarea</option>
                    </select>
                </div>
                </div>
                <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1.5">Contenidos</label>
                <textarea rows={4} placeholder="Ej. Temas: Asma infantil..." value={nuevosContenidos} onChange={e => setNuevosContenidos(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100">
              <button onClick={() => setModalAbierto(false)} className="order-2 sm:order-1 w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl">Cancelar</button>
              <button onClick={agregarEvento} className="order-1 sm:order-2 w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-md">Guardar Evento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
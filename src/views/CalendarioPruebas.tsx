import { useState, useEffect } from "react";
import { 
  Calendar as CalendarIcon, Plus, Trash2, BookOpen, Clock, 
  AlertCircle, ChevronLeft, ChevronRight, Cloud, ExternalLink, 
  Download, Stethoscope, RefreshCw, Filter, CheckCircle2
} from "lucide-react";
import { guardarEnNube, cargarDeNube } from "../Services/cloudSync";

export interface EventoAcademico { 
  id: string; 
  titulo: string; 
  fecha: string; 
  tipo: "Prueba / Solemne" | "Rotación / Turno" | "Examen Beca / EUNACOM" | "Entrega / Tarea"; 
  contenidos: string; 
}

export function generarCicloTurnos(
  fechaInicioStr: string = "2026-08-30", 
  intervaloDias: number = 8, 
  repeticiones: number = 16, 
  lugar: string = "Hospital Clínico de Magallanes (HCM)"
): EventoAcademico[] {
  const [y, m, d] = fechaInicioStr.split('-').map(Number);
  const diasSemana = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  
  const nuevosTurnos: EventoAcademico[] = [];
  
  for (let i = 0; i < repeticiones; i++) {
    const fechaObj = new Date(y, m - 1, d);
    fechaObj.setDate(fechaObj.getDate() + (i * intervaloDias));
    
    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObj.getDate()).padStart(2, '0');
    const fechaFormateada = `${year}-${month}-${day}`;
    const nombreDia = diasSemana[fechaObj.getDay()];

    nuevosTurnos.push({
      id: `turno_${fechaFormateada}`,
      titulo: `Turno de Guardia (${nombreDia}) - ${lugar.split('(')[0].trim()}`,
      fecha: fechaFormateada,
      tipo: "Rotación / Turno",
      contenidos: `Turno de residencia médica / internado en ${lugar}.\n• Frecuencia: Cada ${intervaloDias} días.\n• Día: ${nombreDia} ${day}/${month}/${year}.\n• Funciones: Ingresos, evolución clínica de sala, entrega de turno y urgencias.`
    });
  }
  return nuevosTurnos;
}

function generarGoogleCalendarUrl(evento: EventoAcademico) {
  const [year, month, day] = evento.fecha.split('-');
  const fechaInicio = `${year}${month}${day}`;
  
  const fechaObj = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
  fechaObj.setDate(fechaObj.getDate() + 1);
  const nextYear = fechaObj.getFullYear();
  const nextMonth = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const nextDay = String(fechaObj.getDate()).padStart(2, '0');
  const fechaFin = `${nextYear}${nextMonth}${nextDay}`;

  const titulo = `[${evento.tipo}] ${evento.titulo}`;
  const detalles = `Tipo: ${evento.tipo}\nFecha: ${evento.fecha}\n\nDetalles:\n${evento.contenidos || 'Sin detalles'}\n\nOrganizado desde El Rincón del Interno`;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: `${fechaInicio}/${fechaFin}`,
    details: detalles,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function exportarTodosIcs(eventos: EventoAcademico[]) {
  if (eventos.length === 0) {
    alert("No hay eventos para exportar.");
    return;
  }

  const vevents = eventos.map(ev => {
    const [year, month, day] = ev.fecha.split('-');
    const fechaFormateada = `${year}${month}${day}`;
    return [
      'BEGIN:VEVENT',
      `UID:${ev.id}@rincon-del-interno`,
      `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z`,
      `DTSTART;VALUE=DATE:${fechaFormateada}`,
      `SUMMARY:[${ev.tipo}] ${ev.titulo}`,
      `DESCRIPTION:${(ev.contenidos || 'Sin contenidos').replace(/\n/g, '\\n')}`,
      'END:VEVENT'
    ].join('\r\n');
  }).join('\r\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//El Rincon del Interno//Calendario Academico//ES',
    'CALSCALE:GREGORIAN',
    vevents,
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.setAttribute('download', `turnos_y_calendario_medico_${new Date().toISOString().split('T')[0]}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default function CalendarioPruebas() {
  const [eventos, setEventos] = useState<EventoAcademico[]>([]);
  const [descargando, setDescargando] = useState(true);
  const [filtroTipo, setFiltroTipo] = useState<string>("todos");

  // Modal evento único
  const [modalAbierto, setModalAbierto] = useState(false);
  const [nuevoTitulo, setNuevoTitulo] = useState("");
  const [nuevaFecha, setNuevaFecha] = useState(new Date().toISOString().split("T")[0]);
  const [nuevoTipo, setNuevoTipo] = useState<EventoAcademico["tipo"]>("Rotación / Turno");
  const [nuevosContenidos, setNuevosContenidos] = useState("");

  // Modal generador de turnos recurrentes
  const [modalTurnosAbierto, setModalTurnosAbierto] = useState(false);
  const [fechaPrimerTurno, setFechaPrimerTurno] = useState("2026-08-30"); // Domingo de esta semana
  const [intervaloTurnoDias, setIntervaloTurnoDias] = useState<number>(8); // Cada 8 días
  const [cantidadTurnos, setCantidadTurnos] = useState<number>(16);
  const [lugarTurno, setLugarTurno] = useState("Hospital Clínico de Magallanes (HCM)");

  const [fechaActualVisual, setFechaActualVisual] = useState(new Date());

  // 1. CARGA INICIAL Y GENERACIÓN DE TURNOS
  useEffect(() => {
    async function sincronizarCalendario() {
      const turnosGenerados = generarCicloTurnos("2026-08-30", 8, 16, "Hospital Clínico de Magallanes (HCM)");
      
      try {
        const datosNube = await cargarDeNube('calendario');
        
        if (datosNube && Array.isArray(datosNube) && datosNube.length > 0) {
          // Fusionar con los turnos si no existen
          const idsExistentes = new Set(datosNube.map((e: EventoAcademico) => e.id || e.fecha));
          const turnosFaltantes = turnosGenerados.filter(t => !idsExistentes.has(t.id) && !idsExistentes.has(t.fecha));
          const combinados = [...datosNube, ...turnosFaltantes].sort((a, b) => a.fecha.localeCompare(b.fecha));
          setEventos(combinados);
        } else {
          const guardados = localStorage.getItem("ward_commander_calendario");
          if (guardados) {
            try {
              const parsed = JSON.parse(guardados);
              const idsExistentes = new Set(parsed.map((e: EventoAcademico) => e.id || e.fecha));
              const turnosFaltantes = turnosGenerados.filter(t => !idsExistentes.has(t.id) && !idsExistentes.has(t.fecha));
              const combinados = [...parsed, ...turnosFaltantes].sort((a, b) => a.fecha.localeCompare(b.fecha));
              setEventos(combinados);
            } catch(e) {
              setEventos(turnosGenerados);
            }
          } else {
            setEventos(turnosGenerados);
          }
        }
      } catch (err) {
        setEventos(turnosGenerados);
      } finally {
        setDescargando(false);
      }
    }
    sincronizarCalendario();
  }, []);

  // 2. SINCRONIZACIÓN CON LOCALSTORAGE Y SUPABASE
  useEffect(() => {
    if (!descargando && eventos.length > 0) {
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

  const aplicarCicloTurnosPersonalizado = () => {
    if (!fechaPrimerTurno) {
      alert("Por favor selecciona la fecha del primer turno.");
      return;
    }
    const nuevosTurnos = generarCicloTurnos(fechaPrimerTurno, Number(intervaloTurnoDias), Number(cantidadTurnos), lugarTurno);
    
    // Reemplazar o fusionar los turnos
    setEventos(prev => {
      const otrosEventos = prev.filter(e => !e.id.startsWith('turno_'));
      const combinados = [...otrosEventos, ...nuevosTurnos].sort((a, b) => a.fecha.localeCompare(b.fecha));
      return combinados;
    });

    setModalTurnosAbierto(false);
    alert(`¡Se programaron con éxito ${nuevosTurnos.length} turnos (cada ${intervaloTurnoDias} días) comenzando el ${fechaPrimerTurno}!`);
  };

  const eliminarEvento = (id: string) => {
    if (window.confirm("¿Eliminar este evento o turno?")) {
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

  const eventosFiltrados = filtroTipo === "todos"
    ? eventos
    : eventos.filter(e => e.tipo === filtroTipo);

  const turnosCount = eventos.filter(e => e.tipo === "Rotación / Turno").length;

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      
      {/* Cabecera Principal */}
      <div className="flex flex-col lg:flex-row lg:justify-between items-start lg:items-center gap-4 bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-black text-gray-900 dark:text-white flex items-center gap-2.5">
            <CalendarIcon className="w-6 h-6 md:w-7 md:h-7 text-purple-600 dark:text-purple-400 shrink-0" /> 
            <span>Calendario, Turnos & Pruebas</span>
          </h1>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 dark:text-slate-400">
            <span>Rotación hospitalaria cada 8 días y evaluaciones académicas.</span>
            {!descargando && (
              <span className="flex items-center gap-1 bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 font-semibold px-2 py-0.5 rounded-md border border-purple-200 dark:border-purple-800 text-xs">
                <Cloud className="w-3 h-3"/> Nube
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
          <button 
            onClick={() => setModalTurnosAbierto(true)}
            className="flex-1 sm:flex-none bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-2 transition-colors shadow-xs"
            title="Ajustar o programar la rotación de turnos cada 8 días"
          >
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>Turnos ({turnosCount})</span>
          </button>

          {eventos.length > 0 && (
            <button 
              onClick={() => exportarTodosIcs(eventos)} 
              className="flex-1 sm:flex-none bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-3.5 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 transition-colors"
              title="Descargar archivo para importar a Google Calendar o Apple Calendar"
            >
              <Download className="w-4 h-4" /> Exportar (.ics)
            </button>
          )}

          <button 
            onClick={() => setModalAbierto(true)} 
            className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2.5 rounded-xl text-xs md:text-sm font-bold flex justify-center items-center gap-1.5 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" /> Agregar Evento
          </button>
        </div>
      </div>

      {descargando ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 dark:text-slate-400 font-semibold text-xs">Sincronizando turnos y calendario con la nube...</p>
        </div>
      ) : (
        <>
          {/* Barra de Filtros Rápidos */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-gray-400 dark:text-slate-500 font-bold text-[11px] uppercase mr-1 flex items-center gap-1">
              <Filter className="w-3 h-3" /> Filtrar:
            </span>
            {[
              { id: 'todos', label: `Todos (${eventos.length})` },
              { id: 'Rotación / Turno', label: `🩺 Turnos de Guardia (${turnosCount})` },
              { id: 'Prueba / Solemne', label: '📘 Pruebas' },
              { id: 'Examen Beca / EUNACOM', label: '🎯 EUNACOM' },
              { id: 'Entrega / Tarea', label: '📋 Entregas' }
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFiltroTipo(f.id)}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                  filtroTipo === f.id
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-100'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Calendario Mensual Interactivo */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm p-4 md:p-6 space-y-4 overflow-hidden">
            <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-700 pb-4">
              <h2 className="text-base md:text-xl font-bold text-gray-900 dark:text-white capitalize flex items-center gap-2">
                <span>{nombresMeses[mesVisual]} {anioVisual}</span>
              </h2>
              <div className="flex items-center gap-1.5 md:gap-2">
                <button onClick={() => setFechaActualVisual(new Date())} className="px-3 md:px-4 py-1.5 md:py-2 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 dark:hover:bg-slate-600 rounded-lg text-xs md:text-sm font-bold text-gray-700 dark:text-slate-200">Hoy</button>
                <div className="flex bg-gray-100 dark:bg-slate-700 rounded-lg p-0.5">
                  <button onClick={() => cambiarMes(-1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-slate-600 rounded-md text-gray-700 dark:text-slate-200"><ChevronLeft className="w-4 h-4 md:w-5 md:h-5" /></button>
                  <button onClick={() => cambiarMes(1)} className="p-1.5 md:p-2 hover:bg-white dark:hover:bg-slate-600 rounded-md text-gray-700 dark:text-slate-200"><ChevronRight className="w-4 h-4 md:w-5 md:h-5" /></button>
                </div>
              </div>
            </div>

            <div className="w-full overflow-x-auto pb-2 -mx-2 px-2 md:mx-0 md:px-0">
              <div className="min-w-[280px]">
                <div className="grid grid-cols-7 gap-1 md:gap-2 text-center font-bold text-[10px] md:text-xs text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-2">
                  <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div><div>Sáb</div><div>Dom</div>
                </div>
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                  {Array.from({ length: diaInicioSemana }).map((_, index) => (<div key={`empty-${index}`} className="min-h-[60px] md:min-h-[96px] bg-gray-50/50 dark:bg-slate-850/50 rounded-lg md:rounded-xl border border-transparent"></div>))}
                  {Array.from({ length: diasEnMes }).map((_, index) => {
                    const numeroDia = index + 1;
                    const mesStr = String(mesVisual + 1).padStart(2, '0');
                    const diaStr = String(numeroDia).padStart(2, '0');
                    const fechaFormateada = `${anioVisual}-${mesStr}-${diaStr}`;
                    const esHoy = fechaFormateada === hoyStr;
                    const eventosDelDia = eventos.filter(ev => ev.fecha === fechaFormateada);
                    const tieneTurno = eventosDelDia.some(ev => ev.tipo === 'Rotación / Turno');

                    return (
                      <div key={fechaFormateada} className={`min-h-[60px] md:min-h-[96px] p-1 md:p-2 rounded-lg md:rounded-xl border flex flex-col justify-start md:justify-between overflow-hidden transition-all relative ${
                        esHoy 
                          ? 'border-purple-500 bg-purple-50/40 dark:bg-purple-950/30 ring-1 md:ring-2 ring-purple-200' 
                          : tieneTurno 
                          ? 'border-emerald-200 dark:border-emerald-800/80 bg-emerald-50/30 dark:bg-emerald-950/20' 
                          : 'border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800'
                      }`}>
                        <div className="flex justify-center md:justify-between items-start md:items-center w-full">
                          <span className={`text-[10px] md:text-xs font-bold px-1.5 md:px-2 py-0.5 rounded ${
                            esHoy 
                              ? 'bg-purple-600 text-white shadow-sm' 
                              : tieneTurno 
                              ? 'bg-emerald-600 text-white shadow-xs' 
                              : 'text-gray-700 dark:text-slate-300'
                          }`}>
                            {numeroDia}
                          </span>
                          {eventosDelDia.length > 0 && (
                            <span className="hidden sm:inline-flex text-[9px] md:text-[10px] font-bold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded-full absolute top-1 right-1 md:relative md:top-0 md:right-0">
                              {eventosDelDia.length}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-col gap-0.5 w-full">
                          {eventosDelDia.map(ev => {
                            let colorPunto = 'bg-gray-400'; 
                            let colorFondo = 'bg-gray-100 dark:bg-slate-700'; 
                            let colorTexto = 'text-gray-800 dark:text-slate-200';
                            
                            if (ev.tipo === 'Examen Beca / EUNACOM') { colorPunto = 'bg-red-500'; colorFondo = 'bg-red-50 dark:bg-red-950/60'; colorTexto = 'text-red-800 dark:text-red-300'; }
                            else if (ev.tipo === 'Prueba / Solemne') { colorPunto = 'bg-blue-500'; colorFondo = 'bg-blue-50 dark:bg-blue-950/60'; colorTexto = 'text-blue-800 dark:text-blue-300'; }
                            else if (ev.tipo === 'Rotación / Turno') { colorPunto = 'bg-emerald-500'; colorFondo = 'bg-emerald-100 dark:bg-emerald-950/80'; colorTexto = 'text-emerald-900 dark:text-emerald-200 font-bold'; }
                            else if (ev.tipo === 'Entrega / Tarea') { colorPunto = 'bg-amber-500'; colorFondo = 'bg-amber-50 dark:bg-amber-950/60'; colorTexto = 'text-amber-800 dark:text-amber-300'; }
                            
                            return (
                              <div key={ev.id} className="w-full flex justify-center md:justify-start" title={`${ev.titulo} (${ev.tipo})`}>
                                <div className={`md:hidden w-2.5 h-2.5 rounded-full ${colorPunto}`}></div>
                                <div className={`hidden md:block w-full text-[9px] md:text-[10px] font-semibold px-1 py-0.5 rounded truncate ${colorFondo} ${colorTexto}`}>
                                  {ev.tipo === 'Rotación / Turno' ? `🩺 ${ev.titulo.replace('Turno de Guardia', 'Turno')}` : ev.titulo}
                                </div>
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

          {/* Tarjetas de Detalle */}
          <div>
            <h3 className="text-sm md:text-base font-bold text-gray-900 dark:text-white mb-3 md:mb-4 px-1 flex items-center justify-between">
              <span>Detalle de Pruebas, Turnos y Contenidos ({eventosFiltrados.length})</span>
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {eventosFiltrados.map((ev) => {
                const esHoy = ev.fecha === hoyStr;
                const esTurno = ev.tipo === "Rotación / Turno";

                return (
                  <div key={ev.id} className={`bg-white dark:bg-slate-800 rounded-xl md:rounded-2xl border shadow-sm p-4 md:p-5 flex flex-col justify-between space-y-3 md:space-y-4 relative overflow-hidden ${
                    esHoy 
                      ? 'border-2 border-purple-500 bg-purple-50/20 dark:bg-purple-950/30' 
                      : esTurno
                      ? 'border-emerald-200 dark:border-emerald-800/70 bg-emerald-50/10'
                      : 'border-gray-100 dark:border-slate-700'
                  }`}>
                    {esHoy && (<span className="absolute top-0 right-0 bg-purple-600 text-white text-[9px] md:text-[10px] font-bold px-2 md:px-3 py-1 rounded-bl-xl uppercase tracking-wider shadow-sm">¡Es Hoy! 🎯</span>)}
                    
                    <div className="space-y-2.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] md:text-xs font-bold px-2.5 py-1 rounded-full border ${
                          ev.tipo === 'Examen Beca / EUNACOM' ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-800 dark:text-red-300' : 
                          ev.tipo === 'Prueba / Solemne' ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-300' : 
                          ev.tipo === 'Rotación / Turno' ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300' : 
                          'bg-amber-50 dark:bg-amber-950/50 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300'
                        }`}>
                          {ev.tipo}
                        </span>
                      </div>

                      <h3 className="font-bold text-gray-950 dark:text-white text-sm md:text-base leading-snug">
                        {ev.titulo}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-slate-300 font-mono bg-gray-50 dark:bg-slate-900 w-fit px-2 py-1 rounded-md border border-gray-100 dark:border-slate-700">
                        <Clock className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> 
                        <span>{ev.fecha.split('-').reverse().join('/')}</span>
                      </div>

                      <div className="mt-3 bg-gray-50/80 dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-slate-700 text-xs space-y-1.5">
                        <span className="font-bold text-gray-800 dark:text-slate-200 flex items-center gap-1.5">
                          <BookOpen className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" /> Detalle / Pauta:
                        </span>
                        <p className="text-gray-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap pl-5">
                          {ev.contenidos || "Sin contenidos detallados registrados."}
                        </p>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-gray-100 dark:border-slate-700 flex items-center justify-between gap-2">
                      <a 
                        href={generarGoogleCalendarUrl(ev)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
                        title="Abrir y guardar en Google Calendar"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Google Calendar
                      </a>
                      <button 
                        onClick={() => eliminarEvento(ev.id)} 
                        className="text-gray-400 hover:text-red-600 p-1.5 flex items-center gap-1.5 text-xs font-semibold transition-colors rounded-lg hover:bg-red-50 dark:hover:bg-slate-750"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                );
              })}

              {eventosFiltrados.length === 0 && (
                <div className="col-span-full text-center py-12 md:py-16 text-gray-400 dark:text-slate-500 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl bg-gray-50/50 dark:bg-slate-900">
                  <div className="flex flex-col items-center gap-2">
                    <CalendarIcon className="w-10 h-10 text-gray-300 dark:text-slate-600" />
                    <p className="text-sm font-medium">No hay eventos o turnos bajo este filtro.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* MODAL PROGRAMADOR DE TURNOS RECURRENTES */}
      {modalTurnosAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-slate-800 sm:rounded-2xl rounded-t-2xl max-w-lg w-full p-5 md:p-6 space-y-4 shadow-2xl border border-gray-100 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-gray-100 dark:border-slate-700 pb-3">
              <h2 className="text-base md:text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-emerald-600" />
                <span>Programador de Turnos Recurrentes</span>
              </h2>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
                Genera automáticamente toda tu rotación de guardias e internado.
              </p>
            </div>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">Fecha del Primer Turno</label>
                <input 
                  type="date" 
                  value={fechaPrimerTurno} 
                  onChange={e => setFechaPrimerTurno(e.target.value)} 
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl font-mono text-sm text-gray-900 dark:text-white"
                />
                <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-semibold block mt-1">
                  📅 Primer turno: Domingo 30 de Agosto de 2026
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">Frecuencia (Días)</label>
                  <input 
                    type="number" 
                    value={intervaloTurnoDias} 
                    onChange={e => setIntervaloTurnoDias(Number(e.target.value))} 
                    min={1} 
                    max={30}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white"
                  />
                  <span className="text-[10px] text-gray-400">Cada {intervaloTurnoDias} días</span>
                </div>
                <div>
                  <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">Cantidad de Turnos</label>
                  <input 
                    type="number" 
                    value={cantidadTurnos} 
                    onChange={e => setCantidadTurnos(Number(e.target.value))} 
                    min={1} 
                    max={50}
                    className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm font-bold text-gray-900 dark:text-white"
                  />
                  <span className="text-[10px] text-gray-400">Ej: 16 turnos (~4 meses)</span>
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 dark:text-slate-300 mb-1">Hospital / Recinto</label>
                <input 
                  type="text" 
                  value={lugarTurno} 
                  onChange={e => setLugarTurno(e.target.value)} 
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-950/40 p-3 rounded-xl border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Rotación calculada (Ejemplo de fechas):
                </p>
                <p className="font-mono">
                  • 30/08 (Dom) ➔ 07/09 (Lun) ➔ 15/09 (Mar) ➔ 23/09 (Mié) ➔ 01/10 (Jue) ➔ 09/10 (Vie)...
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100 dark:border-slate-700">
              <button onClick={() => setModalTurnosAbierto(false)} className="px-4 py-2 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-bold rounded-xl">
                Cancelar
              </button>
              <button onClick={aplicarCicloTurnosPersonalizado} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5">
                <RefreshCw className="w-3.5 h-3.5" />
                Guardar Ciclo de Turnos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EVENTO ÚNICO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white dark:bg-slate-800 sm:rounded-2xl rounded-t-2xl max-w-lg w-full p-5 md:p-6 space-y-4 md:space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto border border-gray-100 dark:border-slate-700">
            <h2 className="text-base md:text-lg font-extrabold text-gray-900 dark:text-white border-b border-gray-100 dark:border-slate-700 pb-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-purple-600" /> Agendar Nuevo Evento
            </h2>
            <div className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 mb-1.5">Título <span className="text-red-500">*</span></label>
                  <input type="text" placeholder="Ej. Examen final" value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 mb-1.5">Fecha <span className="text-red-500">*</span></label>
                    <input type="date" value={nuevaFecha} onChange={e => setNuevaFecha(e.target.value)} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white" />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 mb-1.5">Tipo de Evento</label>
                    <select value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value as any)} className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-900 dark:text-white">
                      <option value="Rotación / Turno">Rotación / Turno</option>
                      <option value="Prueba / Solemne">Prueba / Solemne</option>
                      <option value="Examen Beca / EUNACOM">Examen Beca / EUNACOM</option>
                      <option value="Entrega / Tarea">Entrega / Tarea</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase text-gray-500 dark:text-slate-400 mb-1.5">Contenidos / Descripción</label>
                  <textarea rows={4} placeholder="Ej. Temas: Asma infantil..." value={nuevosContenidos} onChange={e => setNuevosContenidos(e.target.value)} className="w-full p-3 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none text-gray-900 dark:text-white" />
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-4 border-t border-gray-100 dark:border-slate-700">
              <button onClick={() => setModalAbierto(false)} className="order-3 sm:order-1 w-full sm:w-auto px-4 py-2.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-gray-700 dark:text-slate-200 text-sm font-bold rounded-xl">Cancelar</button>
              <button 
                onClick={() => {
                  if (!nuevoTitulo.trim() || !nuevaFecha) { alert("Por favor ingresa un título y una fecha."); return; }
                  const evTemp: EventoAcademico = { id: Date.now().toString(), titulo: nuevoTitulo.trim(), fecha: nuevaFecha, tipo: nuevoTipo, contenidos: nuevosContenidos.trim() };
                  agregarEvento();
                  window.open(generarGoogleCalendarUrl(evTemp), '_blank');
                }}
                className="order-2 sm:order-2 w-full sm:w-auto px-4 py-2.5 bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-colors"
              >
                <ExternalLink className="w-4 h-4" /> Guardar y Abrir en Google
              </button>
              <button onClick={agregarEvento} className="order-1 sm:order-3 w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl shadow-md">Guardar Evento</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
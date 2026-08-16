import { useState, useEffect } from "react";
import { consultarGeminiConArchivo } from "../Services/gemini";
import { TEMARIO_BASE } from "../data/temasEunacom";
import { BookOpen, FileText, BrainCircuit, Paperclip, CheckCircle, Cloud } from 'lucide-react';
import { guardarEnNube, cargarDeNube } from "../Services/cloudSync";

interface Flashcard { pregunta: string; respuesta: string; }
interface Tema { id: number; categoria: string; titulo: string; estado: "🔴 Pendiente" | "🟡 Repasando" | "🟢 Dominado"; apuntes: string; flashcards: Flashcard[]; }

export default function PlanEunacom() {
  const [temas, setTemas] = useState<Tema[]>([]);
  const [descargando, setDescargando] = useState(true);

  // DESCARGA DESDE LA NUBE AL INICIAR
  useEffect(() => {
    async function sincronizarEunacom() {
      const datosNube = await cargarDeNube('plan_eunacom');
      
      if (datosNube && Array.isArray(datosNube) && datosNube.length > 0) {
        setTemas(datosNube);
      } else {
        const guardado = localStorage.getItem("wardcommander_temas_eunacom");
        if (guardado) {
          try { setTemas(JSON.parse(guardado)); } catch(e) { setTemas(TEMARIO_BASE as Tema[]); }
        } else {
          setTemas(TEMARIO_BASE as Tema[]);
        }
      }
      setDescargando(false);
    }
    sincronizarEunacom();
  }, []);

  // SUBE A LA NUBE CADA VEZ QUE HAY CAMBIOS
  useEffect(() => {
    if (!descargando && temas.length > 0) {
      localStorage.setItem("wardcommander_temas_eunacom", JSON.stringify(temas));
      guardarEnNube('plan_eunacom', temas);
    }
  }, [temas, descargando]);

  const [temaSeleccionado, setTemaSeleccionado] = useState<Tema>(TEMARIO_BASE[0] as Tema);
  const [modo, setModo] = useState<"apuntes" | "flashcards">("apuntes");
  const [cargando, setCargando] = useState(false);
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string, base64: string, mimeType: string } | null>(null);
  
  const [indiceTarjeta, setIndiceTarjeta] = useState(0);
  const [mostrarRespuesta, setMostrarRespuesta] = useState(false);

  const [loteNuevo, setLoteNuevo] = useState<Flashcard[]>([]);
  const [indiceLoteNuevo, setIndiceLoteNuevo] = useState(0);
  const [mostrarRespuestaLote, setMostrarRespuestaLote] = useState(false);

  // Mantiene el tema seleccionado actualizado cuando los temas cambian
  useEffect(() => {
    if (temas.length > 0) {
      const temaActualizado = temas.find(t => t.id === (temaSeleccionado?.id || 1));
      if (temaActualizado) setTemaSeleccionado(temaActualizado);
      else setTemaSeleccionado(temas[0]);
    }
  }, [temas]);

  const seleccionarTema = (tema: Tema) => {
    setTemaSeleccionado(tema); setIndiceTarjeta(0); setMostrarRespuesta(false); setLoteNuevo([]); setIndiceLoteNuevo(0); setMostrarRespuestaLote(false);
  };

  const handleSubirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) { alert("Archivo muy pesado (máx 15MB)."); return; }
    const reader = new FileReader();
    reader.onloadend = () => { setArchivoAdjunto({ nombre: file.name, base64: reader.result as string, mimeType: file.type }); };
    reader.readAsDataURL(file);
  };

  const cambiarEstadoTema = (nuevoEstado: "🔴 Pendiente" | "🟡 Repasando" | "🟢 Dominado") => {
    setTemas(temas.map(t => t.id === temaSeleccionado.id ? { ...t, estado: nuevoEstado } : t));
  };

  const generarFlashcards = async () => {
    setCargando(true);
    try {
      let prompt = `Actúa como tutor EUNACOM. Genera 5 flashcards avanzadas sobre: "${temaSeleccionado.titulo}". Apuntes previos: "${temaSeleccionado.apuntes}". `;
      if (archivoAdjunto) prompt += "Usa también el documento adjunto como fuente principal. ";
      prompt += `REGLA: Devuelve ÚNICAMENTE un arreglo JSON válido (sin markdown): [{"pregunta": "...", "respuesta": "..."}]`;
      const resText = await consultarGeminiConArchivo(prompt, undefined, archivoAdjunto || undefined);
      const textoLimpio = resText.replace(/```json/g, '').replace(/```/g, '').trim();
      const nuevasGeneradas: Flashcard[] = JSON.parse(textoLimpio);
      setLoteNuevo(nuevasGeneradas); setIndiceLoteNuevo(0); setMostrarRespuestaLote(false); setArchivoAdjunto(null);
    } catch (e: any) { alert(`Error al generar con Gemini: ${e.message}`); }
    setCargando(false);
  };

  const guardarLoteEnMazo = () => {
    if (loteNuevo.length === 0) return;
    const existentes = temaSeleccionado.flashcards || [];
    const preguntasExistentes = new Set(existentes.map(f => f.pregunta.trim().toLowerCase()));
    const tarjetasUnicas = loteNuevo.filter(nueva => !preguntasExistentes.has(nueva.pregunta.trim().toLowerCase()));
    const combinadas = [...existentes, ...tarjetasUnicas];
    setTemas(temas.map(t => t.id === temaSeleccionado.id ? { ...t, flashcards: combinadas } : t));
    setLoteNuevo([]);
    alert(`✅ Se han guardado ${tarjetasUnicas.length} tarjetas nuevas al mazo principal (${loteNuevo.length - tarjetasUnicas.length} omitidas por estar repetidas).`);
  };

  const actualizarApuntes = (texto: string) => setTemas(temas.map(t => t.id === temaSeleccionado.id ? { ...t, apuntes: texto } : t));
  const calculoProgreso = temas.length > 0 ? Math.round((temas.filter(t => t.estado === "🟢 Dominado").length / temas.length) * 100) : 0;

  if (descargando) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-3 bg-gray-50">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 font-semibold text-sm">Sincronizando apuntes...</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto md:h-full flex flex-col space-y-5 md:space-y-6 bg-gray-50 md:overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-emerald-600" />
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-950 tracking-tight">Plan EUNACOM</h1>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <span>{temas.length} Temas • Gestión de estudio personal con IA.</span>
            {!descargando && <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 ml-2"><Cloud className="w-3 h-3"/> Nube</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-100 p-2 rounded-full border border-gray-200 shrink-0 self-start sm:self-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-100 flex items-center justify-center border-2 border-emerald-200">
                <span className="text-lg md:text-xl font-bold text-emerald-700">{calculoProgreso}%</span>
            </div>
            <div className="pr-3">
                <p className="text-sm md:text-base font-semibold text-gray-900">Dominado</p>
                <p className="text-[11px] md:text-xs text-gray-500">De {temas.length} temas totales</p>
            </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5 md:gap-6 items-start flex-1 md:overflow-hidden min-h-0 w-full">
        <div className="w-full md:w-80 flex-shrink-0 flex flex-col h-[350px] md:h-full">
          <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden flex-1 min-h-0">
            <h2 className="text-base font-bold text-gray-950 mb-3 flex items-center gap-2 shrink-0"><FileText className="w-4 h-4 text-gray-500" /> Índice Temático</h2>
            <nav className="space-y-2.5 overflow-y-auto pr-2 -mr-2 flex-1 min-h-0 pb-2">
              {temas.map(tema => (
                <button key={tema.id} onClick={() => seleccionarTema(tema)} className={`w-full text-left p-3.5 rounded-xl transition-all border shrink-0 ${temaSeleccionado?.id === tema.id ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'hover:bg-gray-50 border-gray-100'}`}>
                  <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider mb-1">{tema.categoria}</p>
                  <p className="text-sm font-semibold text-gray-950 leading-tight mb-2">{tema.titulo}</p>
                  <div className="flex justify-between items-center gap-2 pt-1 border-t border-gray-100 text-xs">
                    <span className="font-bold text-gray-700">{tema.estado}</span>
                    <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">🧠 {tema.flashcards?.length || 0} guardadas</span>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {temaSeleccionado && (
          <div className="flex-1 w-full bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 space-y-5 md:space-y-6 flex flex-col md:overflow-hidden min-h-0 md:h-full">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-100 pb-4 shrink-0">
              <div className="space-y-0.5">
                  <p className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">{temaSeleccionado.categoria}</p>
                  <h2 className="text-lg md:text-xl font-extrabold text-gray-950 tracking-tight leading-tight">{temaSeleccionado.titulo}</h2>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                  <select value={temaSeleccionado.estado} onChange={(e) => cambiarEstadoTema(e.target.value as any)} className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-full text-xs font-semibold text-gray-900 transition-colors outline-none cursor-pointer shadow-sm">
                      <option value="🔴 Pendiente">🔴 Pendiente</option>
                      <option value="🟡 Repasando">🟡 Repasando</option>
                      <option value="🟢 Dominado">🟢 Dominado</option>
                  </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-gray-100 rounded-xl border border-gray-200 shrink-0">
              <button onClick={() => setModo("apuntes")} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${modo === "apuntes" ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>📝 Apuntes</button>
              <button onClick={() => setModo("flashcards")} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${modo === "flashcards" ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-200'}`}>🧠 Flashcards IA <span className="text-xs opacity-60">({temaSeleccionado.flashcards?.length || 0})</span></button>
            </div>

            <div className="flex-1 md:overflow-y-auto pr-2 -mr-2 bg-[#fafafa] p-3 rounded-xl border border-gray-100 min-h-0">
              {modo === "apuntes" ? (
                <div className="flex flex-col h-full space-y-3">
                  <label className="text-xs md:text-sm text-gray-600 font-medium">Escribe tus apuntes, perlas clínicas o mnemotecnias (se guardan automáticamente):</label>
                  <textarea value={temaSeleccionado.apuntes} onChange={(e) => actualizarApuntes(e.target.value)} className="flex-1 w-full p-4 border border-gray-200 rounded-xl bg-white shadow-inner focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 transition-all text-sm md:text-base resize-none leading-relaxed min-h-[250px] md:min-h-0" placeholder="Escribe aquí tus apuntes del tema..." />
                </div>
              ) : (
                <div className="flex flex-col h-full items-center space-y-5">
                  <div className="flex flex-col gap-3 w-full bg-white p-4 rounded-xl border border-gray-100 shadow-sm shrink-0">
                      {archivoAdjunto ? (
                        <div className="flex items-center gap-2.5 bg-emerald-50 text-emerald-800 px-3 py-2 rounded-full text-xs border border-emerald-200">
                          📄 <span className="font-semibold">{archivoAdjunto.nombre}</span>
                          <button onClick={() => setArchivoAdjunto(null)} className="ml-auto text-red-500 font-bold px-1.5 py-0.5 rounded-full hover:bg-red-100 transition-colors">X</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center flex-wrap">
                          <input type="file" id="subir-pdf-eunacom" accept=".pdf, image/*" onChange={handleSubirArchivo} className="hidden" />
                          <label htmlFor="subir-pdf-eunacom" className="flex-1 flex justify-center items-center gap-2 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-200 rounded-lg text-sm font-semibold cursor-pointer transition-colors"><Paperclip className="w-4 h-4 text-gray-500" />Adjuntar Documento <span className="hidden sm:inline">(PDF/Imagen)</span></label>
                        </div>
                      )}
                      <button onClick={generarFlashcards} disabled={cargando} className="w-full flex justify-center items-center gap-2.5 px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold disabled:opacity-50 transition-all shadow"><BrainCircuit className="w-5 h-5" />{cargando ? "Generando..." : "Generar Nuevas⚡"}</button>
                  </div>

                  {loteNuevo.length > 0 && (
                    <div className="w-full bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex flex-col items-center space-y-3.5 shadow-md shrink-0">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 border-b border-amber-100 pb-2.5">
                          <span className="text-[11px] font-medium text-amber-900 uppercase tracking-wider">✨ Lote Nuevo Generado</span>
                          <button onClick={guardarLoteEnMazo} className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow transition-all self-start sm:self-center"><CheckCircle className="w-4 h-4" /> Guardar {loteNuevo.length} en Mazo</button>
                        </div>
                        <div className="text-amber-700 font-bold mb-1 text-sm">Tarjeta Nueva {indiceLoteNuevo + 1} de {loteNuevo.length}</div>
                        <div onClick={() => setMostrarRespuestaLote(!mostrarRespuestaLote)} className={`w-full p-6 md:p-8 rounded-2xl shadow-sm flex items-center justify-center text-center cursor-pointer transition-all ${mostrarRespuestaLote ? 'bg-amber-100 border-2 border-amber-300' : 'bg-white border border-amber-200'} min-h-[200px]`}>
                          <p className={`text-lg md:text-2xl font-medium ${mostrarRespuestaLote ? 'text-amber-900' : 'text-gray-900'}`}>{mostrarRespuestaLote ? loteNuevo[indiceLoteNuevo].respuesta : loteNuevo[indiceLoteNuevo].pregunta}</p>
                        </div>
                        <div className="flex justify-center gap-3 w-full border-t border-amber-100 pt-3.5 flex-wrap">
                          <button onClick={() => { setIndiceLoteNuevo(Math.max(0, indiceLoteNuevo - 1)); setMostrarRespuestaLote(false); }} disabled={indiceLoteNuevo === 0} className="px-3.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 disabled:opacity-50">◀ Anterior</button>
                          <button onClick={() => { setIndiceLoteNuevo(Math.min(loteNuevo.length - 1, indiceLoteNuevo + 1)); setMostrarRespuestaLote(false); }} disabled={indiceLoteNuevo === loteNuevo.length - 1} className="px-3.5 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-semibold disabled:opacity-50">Siguiente ▶</button>
                        </div>
                    </div>
                  )}

                  {temaSeleccionado.flashcards && temaSeleccionado.flashcards.length > 0 ? (
                      <div className="w-full flex flex-col items-center flex-1 my-auto h-full space-y-4 min-h-[250px]">
                        <div className="text-gray-600 text-sm font-bold tracking-tight shrink-0">Tarjeta Guardada {indiceTarjeta + 1} de {temaSeleccionado.flashcards.length}</div>
                        <div onClick={() => setMostrarRespuesta(!mostrarRespuesta)} className={`w-full flex-1 p-6 md:p-8 rounded-2xl shadow-xl flex items-center justify-center text-center cursor-pointer transition-all ${mostrarRespuesta ? 'bg-purple-50 border-2 border-purple-200' : 'bg-white border border-gray-100'} min-h-[200px]`}>
                          <p className={`text-xl md:text-3xl font-medium ${mostrarRespuesta ? 'text-purple-900' : 'text-gray-900'}`}>{mostrarRespuesta ? temaSeleccionado.flashcards[indiceTarjeta].respuesta : temaSeleccionado.flashcards[indiceTarjeta].pregunta}</p>
                        </div>
                        <p className="text-xs text-gray-400 mt-1.5 shrink-0">(Haz clic para voltear)</p>
                        <div className="flex justify-center gap-3.5 mt-5 flex-wrap shrink-0 pb-4">
                          <button onClick={() => { setIndiceTarjeta(Math.max(0, indiceTarjeta - 1)); setMostrarRespuesta(false); }} disabled={indiceTarjeta === 0} className="px-5 py-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 disabled:opacity-50 transition-colors shadow-sm">◀ Anterior</button>
                          <button onClick={() => { setIndiceTarjeta(Math.min(temaSeleccionado.flashcards.length - 1, indiceTarjeta + 1)); setMostrarRespuesta(false); }} disabled={indiceTarjeta === temaSeleccionado.flashcards.length - 1} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold disabled:opacity-50 transition-colors shadow-sm">Siguiente ▶</button>
                        </div>
                      </div>
                  ) : (
                    !loteNuevo.length && <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center space-y-3 p-10 h-full"><BrainCircuit className="w-12 h-12 text-gray-300" /><p className="text-sm">No hay flashcards guardadas en este tema.</p></div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
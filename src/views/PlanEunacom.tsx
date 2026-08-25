import { useState, useEffect } from "react";
import { consultarGeminiConArchivo } from "../Services/gemini";
import { TEMARIO_BASE } from "../data/temasEunacom";
import { BookOpen, FileText, BrainCircuit, Paperclip, CheckCircle, Cloud, CheckCircle2, XCircle, Sparkles, Loader2, Award, Maximize2, Minimize2, Trash2, X, RotateCcw } from 'lucide-react';
import { guardarEnNube, cargarDeNube } from "../Services/cloudSync";
import { MarkdownClinico } from "../components/MarkdownClinico";

interface Flashcard { pregunta: string; respuesta: string; }
interface PreguntaTest {
  id: number;
  enunciado: string;
  opciones: string[];
  correcta: number; // 0-4
  justificacion: string;
  tema: string;
}

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
  const [modo, setModo] = useState<"apuntes" | "flashcards" | "simulacro">("apuntes");
  const [cargando, setCargando] = useState(false);
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string, base64: string, mimeType: string } | null>(null);
  
  const [indiceTarjeta, setIndiceTarjeta] = useState(0);
  const [mostrarRespuesta, setMostrarRespuesta] = useState(false);

  const [loteNuevo, setLoteNuevo] = useState<Flashcard[]>([]);
  const [indiceLoteNuevo, setIndiceLoteNuevo] = useState(0);
  const [mostrarRespuestaLote, setMostrarRespuestaLote] = useState(false);

  // Estado de expansión / modo enfoque para maximizar espacio
  const [espacioExpandido, setEspacioExpandido] = useState(false);
  const [modalFlashcardFullscreen, setModalFlashcardFullscreen] = useState(false);

  // --- SIMULACRO DE EXAMEN TEÓRICO ---
  const [tipoSimulacro, setTipoSimulacro] = useState<"teorico1" | "teorico2" | "tema">("teorico1");
  const [preguntasTest, setPreguntasTest] = useState<PreguntaTest[]>([]);
  const [respuestasUsuario, setRespuestasUsuario] = useState<Record<number, number>>({});
  const [testFinalizado, setTestFinalizado] = useState<boolean>(false);
  const [generandoTest, setGenerandoTest] = useState<boolean>(false);

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

  const eliminarTarjetaActual = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!temaSeleccionado.flashcards || temaSeleccionado.flashcards.length === 0) return;
    if (!window.confirm("¿Seguro que deseas eliminar esta flashcard del tema?")) return;
    
    const nuevasFlashcards = temaSeleccionado.flashcards.filter((_, idx) => idx !== indiceTarjeta);
    setTemas(temas.map(t => t.id === temaSeleccionado.id ? { ...t, flashcards: nuevasFlashcards } : t));
    setIndiceTarjeta(prev => Math.max(0, Math.min(prev, nuevasFlashcards.length - 1)));
    setMostrarRespuesta(false);
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

  const generarSimulacroExamen = async () => {
    setGenerandoTest(true);
    setPreguntasTest([]);
    setRespuestasUsuario({});
    setTestFinalizado(false);

    let temarioAlcance = "";
    if (tipoSimulacro === "teorico1") {
      temarioAlcance = "Examen Teórico 1 (Semana 7): CARDIOLOGÍA (SCA, Arritmias, IC, Valvulopatías, TEP), GASTROENTEROLOGÍA (DHC, HDA, Pancreatitis, Diarreas) y ENFERMEDADES RESPIRATORIAS (NAC, EPOC, Asma, Derrame pleural).";
    } else if (tipoSimulacro === "teorico2") {
      temarioAlcance = "Examen Teórico 2 (Semana 14): ENFERMEDADES INFECCIOSAS (Sepsis, ITU, VIH, Antibióticos), NEFROLOGÍA (IRA, ERC, Acidosis/Alcalosis, Trastornos del Potasio/Sodio), HEMATO-ONCOLOGÍA (Anemias, Linfomas, Lisis tumoral, Neutropenia febril), NUTRICIÓN Y DIABETES (CAD, Hipoglicemia, Insulinoterapia), REUMATOLOGÍA (LES, AR, Gota, Vasculitis), ENDOCRINOLOGÍA (Tiroides, Cushing, Suprarrenal) y GERIATRÍA (Delirium, Demencia).";
    } else {
      temarioAlcance = `Tema específico: ${temaSeleccionado.titulo} (${temaSeleccionado.categoria})`;
    }

    const prompt = `
Actúa como la Comisión Evaluadora de Exámenes Teóricos de Medicina Interna de la Universidad de Magallanes (UMAG) y creador experto de preguntas EUNACOM Medicina Interna.
Genera un simulacro de 5 CASOS CLÍNICOS DE SELECCIÓN MÚLTIPLE de alta fidelidad sobre el temario: "${temarioAlcance}".

REQUISITOS ESTRICTOS DE CADA PREGUNTA:
- Formato caso clínico: Paciente con edad, antecedentes, motivo de consulta, signos vitales y datos paraclínicos.
- 5 alternativas (A, B, C, D, E) de las cuales solo una es la correcta.
- Enfoque EUNACOM: Diagnóstico diferencial más probable, examen de confirmación de elección, conducta terapéutica inicial o criterios de hospitalización/derivación GES.
- Justificación clínica fundamentada con fisiopatología y guías clínicas MINSAL/GES.

REGLA: Devuelve ÚNICAMENTE un arreglo JSON válido (sin markdown):
[
  {
    "id": 1,
    "enunciado": "Paciente masculino de 68 años con antecedentes de DHC...",
    "opciones": ["A) Alternativa 1", "B) Alternativa 2", "C) Alternativa 3", "D) Alternativa 4", "E) Alternativa 5"],
    "correcta": 0,
    "justificacion": "La respuesta correcta es A porque según las guías clínicas...",
    "tema": "Gastroenterología"
  }
]
`;

    try {
      const resText = await consultarGeminiConArchivo(prompt);
      const limpio = resText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const parseadas: PreguntaTest[] = JSON.parse(limpio);
      setPreguntasTest(parseadas);
    } catch (e: any) {
      alert(`Error al generar preguntas con IA: ${e.message}`);
    } finally {
      setGenerandoTest(false);
    }
  };

  const seleccionarOpcion = (preguntaId: number, opcionIdx: number) => {
    if (testFinalizado) return;
    setRespuestasUsuario(prev => ({ ...prev, [preguntaId]: opcionIdx }));
  };

  const calcularNotaSimulacro = () => {
    if (preguntasTest.length === 0) return { correctas: 0, total: 0, porcentaje: 0, nota: 1.0 };
    let correctas = 0;
    preguntasTest.forEach(p => {
      if (respuestasUsuario[p.id] === p.correcta) correctas += 1;
    });
    const total = preguntasTest.length;
    const porcentaje = Math.round((correctas / total) * 100);
    // Escala 70% exigencia (UMAG):
    let nota = 1.0;
    if (porcentaje >= 70) {
      nota = 4.0 + ((porcentaje - 70) / 30) * 3.0;
    } else {
      nota = 1.0 + (porcentaje / 70) * 3.0;
    }
    return { correctas, total, porcentaje, nota: parseFloat(nota.toFixed(1)) };
  };

  const resultadoSimulacro = calcularNotaSimulacro();

  const actualizarApuntes = (texto: string) => setTemas(temas.map(t => t.id === temaSeleccionado.id ? { ...t, apuntes: texto } : t));
  const calculoProgreso = temas.length > 0 ? Math.round((temas.filter(t => t.estado === "🟢 Dominado").length / temas.length) * 100) : 0;

  if (descargando) {
    return (
      <div className="h-full flex flex-col items-center justify-center space-y-3 bg-gray-50 dark:bg-slate-900">
        <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
        <p className="text-gray-500 dark:text-slate-400 font-semibold text-sm">Sincronizando apuntes con la nube...</p>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6 max-w-[1600px] w-full mx-auto md:h-full flex flex-col space-y-3 md:space-y-4 bg-gray-50 dark:bg-slate-900 md:overflow-hidden">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-6 h-6 md:w-7 md:h-7 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-xl md:text-2xl font-extrabold text-gray-950 dark:text-white tracking-tight">Plan EUNACOM & Teóricos UMAG</h1>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500 dark:text-slate-400">
            <span>{temas.length} Temas Oficiales • Apuntes, Flashcards y Simulacros de Exámenes.</span>
            {!descargando && <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 ml-2"><Cloud className="w-3 h-3"/> Nube</span>}
          </div>
        </div>
        <div className="flex items-center gap-3 bg-gray-100 dark:bg-slate-700 p-2 rounded-full border border-gray-200 dark:border-slate-600 shrink-0 self-start sm:self-center">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center border-2 border-emerald-200 dark:border-emerald-700">
                <span className="text-lg md:text-xl font-bold text-emerald-700 dark:text-emerald-300">{calculoProgreso}%</span>
            </div>
            <div className="pr-3">
                <p className="text-sm md:text-base font-semibold text-gray-900 dark:text-white">Dominado</p>
                <p className="text-[11px] md:text-xs text-gray-500 dark:text-slate-400">De {temas.length} temas totales</p>
            </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL: ÍNDICE Y ÁREA DE ESTUDIO */}
      <div className="flex flex-col md:flex-row gap-4 md:gap-5 items-start flex-1 md:overflow-hidden min-h-0 w-full">
        
        {/* ÍNDICE TEMÁTICO (Ocultable en Modo Expandido) */}
        {!espacioExpandido && (
          <div className="w-full md:w-80 flex-shrink-0 flex flex-col h-[320px] md:h-full transition-all duration-300">
            <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden flex-1 min-h-0">
              <h2 className="text-base font-bold text-gray-950 dark:text-white mb-3 flex items-center gap-2 shrink-0">
                <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> Índice Temático EUNACOM
              </h2>
              <nav className="space-y-2 overflow-y-auto pr-1.5 -mr-1.5 flex-1 min-h-0 pb-2">
                {temas.map(tema => (
                  <button 
                    key={tema.id} 
                    onClick={() => seleccionarTema(tema)} 
                    className={`w-full text-left p-3 rounded-xl transition-all border shrink-0 ${
                      temaSeleccionado?.id === tema.id 
                        ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-700 shadow-sm' 
                        : 'bg-gray-50/50 dark:bg-slate-850 hover:bg-gray-100 dark:hover:bg-slate-750 border-gray-200/70 dark:border-slate-700'
                    }`}
                  >
                    <p className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-0.5">{tema.categoria}</p>
                    <p className="text-xs sm:text-sm font-bold text-gray-950 dark:text-slate-100 leading-tight mb-1.5">{tema.titulo}</p>
                    <div className="flex justify-between items-center gap-2 pt-1 border-t border-gray-200/50 dark:border-slate-700 text-xs">
                      <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">{tema.estado}</span>
                      <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full font-bold border border-purple-200 dark:border-purple-800">
                        🧠 {tema.flashcards?.length || 0}
                      </span>
                    </div>
                  </button>
                ))}
              </nav>
            </div>
          </div>
        )}

        {/* ÁREA DE ESTUDIO ACTIVA */}
        {temaSeleccionado && (
          <div className="flex-1 w-full bg-white dark:bg-slate-800 p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 space-y-4 flex flex-col md:overflow-hidden min-h-0 md:h-full">
            
            {/* Barra superior del tema activo */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-gray-100 dark:border-slate-700 pb-3 shrink-0">
              <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">{temaSeleccionado.categoria}</p>
                  <h2 className="text-lg md:text-2xl font-black text-gray-950 dark:text-white tracking-tight leading-tight">{temaSeleccionado.titulo}</h2>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-center shrink-0 flex-wrap">
                  
                  {/* Botón de Expandir / Modo Enfoque */}
                  <button
                    onClick={() => setEspacioExpandido(!espacioExpandido)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all border shadow-2xs ${
                      espacioExpandido 
                        ? 'bg-emerald-600 text-white border-emerald-600' 
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 border-gray-200 dark:border-slate-600'
                    }`}
                    title={espacioExpandido ? "Mostrar índice temático" : "Expandir área de lectura y apuntes"}
                  >
                    {espacioExpandido ? (
                      <>
                        <Minimize2 className="w-3.5 h-3.5" />
                        <span>Ver Índice</span>
                      </>
                    ) : (
                      <>
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Ampliar Espacio</span>
                      </>
                    )}
                  </button>

                  <select 
                    value={temaSeleccionado.estado} 
                    onChange={(e) => cambiarEstadoTema(e.target.value as any)} 
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold text-gray-900 dark:text-white transition-colors outline-none cursor-pointer shadow-2xs"
                  >
                      <option value="🔴 Pendiente">🔴 Pendiente</option>
                      <option value="🟡 Repasando">🟡 Repasando</option>
                      <option value="🟢 Dominado">🟢 Dominado</option>
                  </select>
              </div>
            </div>

            {/* Selector de 3 Modos: Apuntes, Flashcards, Simulacro */}
            <div className="grid grid-cols-3 gap-2 p-1.5 bg-gray-100 dark:bg-slate-750 rounded-xl border border-gray-200 dark:border-slate-700 shrink-0">
              <button 
                onClick={() => setModo("apuntes")} 
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  modo === "apuntes" ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                📝 Apuntes
              </button>
              <button 
                onClick={() => setModo("flashcards")} 
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  modo === "flashcards" ? 'bg-purple-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                🧠 Flashcards ({temaSeleccionado.flashcards?.length || 0})
              </button>
              <button 
                onClick={() => setModo("simulacro")} 
                className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all ${
                  modo === "simulacro" ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700'
                }`}
              >
                🎯 Simulacros Teóricos
              </button>
            </div>

            {/* CONTENEDOR INTERNO DEL MODO */}
            <div className="flex-1 md:overflow-y-auto bg-slate-50/80 dark:bg-slate-900/60 p-3 sm:p-4 md:p-6 rounded-2xl border border-gray-200/80 dark:border-slate-700 min-h-0 flex flex-col">
              
              {/* MODO 1: APUNTES */}
              {modo === "apuntes" && (
                <div className="flex flex-col h-full space-y-3 flex-1">
                  <div className="flex justify-between items-center shrink-0">
                    <label className="text-xs sm:text-sm text-gray-700 dark:text-slate-200 font-bold">
                      📝 Apuntes, esquemas y perlas de este tema:
                    </label>
                    <span className="text-[11px] text-gray-400 font-medium">
                      Guardado automático en nube ☁️
                    </span>
                  </div>
                  <textarea 
                    value={temaSeleccionado.apuntes} 
                    onChange={(e) => actualizarApuntes(e.target.value)} 
                    className="flex-1 w-full p-4 md:p-5 border border-gray-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 text-gray-900 dark:text-white shadow-inner focus:ring-2 focus:ring-emerald-400 focus:border-emerald-500 transition-all text-sm md:text-base resize-none leading-relaxed min-h-[300px]" 
                    placeholder="Escribe aquí tus apuntes, algoritmos diagnósticos, dosis clave o criterios MINSAL/GES..." 
                  />
                </div>
              )}

              {/* MODO 2: FLASHCARDS */}
              {modo === "flashcards" && (
                <div className="flex flex-col h-full items-center space-y-4 flex-1">
                  
                  {/* Barra de Generación con IA */}
                  <div className="flex flex-col sm:flex-row gap-2.5 w-full bg-white dark:bg-slate-800 p-3.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-sm shrink-0">
                      {archivoAdjunto ? (
                        <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-3 py-2 rounded-xl text-xs border border-emerald-200 dark:border-emerald-800 flex-1">
                          📄 <span className="font-semibold truncate">{archivoAdjunto.nombre}</span>
                          <button onClick={() => setArchivoAdjunto(null)} className="ml-auto text-red-500 font-bold px-1.5 py-0.5 rounded-full hover:bg-red-100">X</button>
                        </div>
                      ) : (
                        <div className="flex gap-2 items-center flex-1">
                          <input type="file" id="subir-pdf-eunacom" accept=".pdf, image/*" onChange={handleSubirArchivo} className="hidden" />
                          <label htmlFor="subir-pdf-eunacom" className="flex-1 flex justify-center items-center gap-2 px-3 py-2.5 bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-600 rounded-xl text-xs font-bold cursor-pointer transition-colors">
                            <Paperclip className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            <span>Adjuntar PDF / Foto de estudio</span>
                          </label>
                        </div>
                      )}
                      <button 
                        onClick={generarFlashcards} 
                        disabled={cargando} 
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold disabled:opacity-50 transition-all shadow-sm flex items-center justify-center gap-2 shrink-0"
                      >
                        <BrainCircuit className="w-4 h-4" />
                        {cargando ? "Generando con Gemini..." : "Generar Flashcards IA ✨"}
                      </button>
                  </div>

                  {/* Lote Nuevo Recién Generado */}
                  {loteNuevo.length > 0 && (
                    <div className="w-full max-w-4xl bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl p-4 sm:p-5 flex flex-col items-center space-y-3 shadow-md shrink-0 animate-in fade-in">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 border-b border-amber-200 dark:border-amber-800 pb-2">
                          <span className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-4 h-4 text-amber-600 animate-spin" /> Lote Nuevo Generado ({loteNuevo.length} tarjetas)
                          </span>
                          <button onClick={guardarLoteEnMazo} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow transition-all">
                            <CheckCircle className="w-4 h-4" /> Guardar Todo al Mazo
                          </button>
                        </div>

                        <div className="text-amber-800 dark:text-amber-300 font-bold text-xs">
                          Tarjeta Nueva {indiceLoteNuevo + 1} de {loteNuevo.length}
                        </div>

                        <div 
                          onClick={() => setMostrarRespuestaLote(!mostrarRespuestaLote)} 
                          className={`w-full p-6 md:p-8 rounded-2xl shadow-md flex flex-col justify-between cursor-pointer transition-all min-h-[220px] select-none ${
                            mostrarRespuestaLote 
                              ? 'bg-amber-100 dark:bg-amber-900/60 border-2 border-amber-400 text-amber-950 dark:text-amber-100' 
                              : 'bg-white dark:bg-slate-800 border-2 border-amber-200 dark:border-amber-800 text-gray-900 dark:text-white'
                          }`}
                        >
                          <div className="flex justify-between items-center pb-2 border-b border-amber-200/60 text-xs font-bold uppercase">
                            <span>{mostrarRespuestaLote ? '💡 RESPUESTA' : '❓ PREGUNTA'}</span>
                            <span className="text-[10px] text-amber-700">(Clic para voltear)</span>
                          </div>
                          <div className="my-auto py-3 text-center text-sm md:text-base font-medium leading-relaxed">
                            <MarkdownClinico contenido={mostrarRespuestaLote ? loteNuevo[indiceLoteNuevo].respuesta : loteNuevo[indiceLoteNuevo].pregunta} />
                          </div>
                          <div className="text-[10px] text-gray-400 text-center">Toca para dar vuelta</div>
                        </div>

                        <div className="flex justify-center gap-3 w-full pt-1 flex-wrap">
                          <button onClick={() => { setIndiceLoteNuevo(Math.max(0, indiceLoteNuevo - 1)); setMostrarRespuestaLote(false); }} disabled={indiceLoteNuevo === 0} className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 disabled:opacity-40">◀ Anterior</button>
                          <button onClick={() => setMostrarRespuestaLote(!mostrarRespuestaLote)} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold">Voltear 🔄</button>
                          <button onClick={() => { setIndiceLoteNuevo(Math.min(loteNuevo.length - 1, indiceLoteNuevo + 1)); setMostrarRespuestaLote(false); }} disabled={indiceLoteNuevo === loteNuevo.length - 1} className="px-4 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-bold text-gray-700 dark:text-slate-200 disabled:opacity-40">Siguiente ▶</button>
                        </div>
                    </div>
                  )}

                  {/* Tarjetas Guardadas del Mazo con Alto Contraste */}
                  {temaSeleccionado.flashcards && temaSeleccionado.flashcards.length > 0 ? (
                      <div className="w-full flex flex-col items-center flex-1 my-auto h-full space-y-4 min-h-[320px] max-w-4xl">
                        
                        {/* Cabecera de la tarjeta */}
                        <div className="flex items-center justify-between w-full px-2">
                          <span className="text-xs font-bold text-gray-600 dark:text-slate-300 uppercase tracking-wider bg-white dark:bg-slate-800 px-3.5 py-1.5 rounded-xl border border-gray-200 dark:border-slate-700 shadow-2xs">
                            Tarjeta Guardada {indiceTarjeta + 1} de {temaSeleccionado.flashcards.length}
                          </span>
                          
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setModalFlashcardFullscreen(true)}
                              className="text-xs text-purple-700 dark:text-purple-300 font-bold bg-purple-50 dark:bg-purple-950/50 hover:bg-purple-100 px-3 py-1.5 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center gap-1 transition-colors shadow-2xs"
                              title="Ver a pantalla completa"
                            >
                              <Maximize2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Pantalla Completa</span>
                            </button>
                            <button
                              onClick={eliminarTarjetaActual}
                              className="text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded-xl border border-transparent hover:border-red-200 transition-colors"
                              title="Eliminar esta flashcard"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* CUERPO DE LA TARJETA (CON FONDO NÍTIDO Y ELEVACIÓN) */}
                        <div 
                          onClick={() => setMostrarRespuesta(!mostrarRespuesta)} 
                          className={`w-full flex-1 p-6 md:p-8 rounded-3xl shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-300 transform select-none min-h-[260px] md:min-h-[320px] ${
                            mostrarRespuesta 
                              ? 'bg-gradient-to-br from-emerald-50 via-teal-50/70 to-emerald-100/50 dark:from-slate-850 dark:via-emerald-950/40 dark:to-slate-850 border-2 border-emerald-400 dark:border-emerald-500 shadow-emerald-500/10' 
                              : 'bg-white dark:bg-slate-800 border-2 border-indigo-200 dark:border-slate-700 shadow-indigo-500/10'
                          }`}
                        >
                          {/* Badge de cara */}
                          <div className="flex justify-between items-center pb-3 border-b border-gray-200/70 dark:border-slate-700/70">
                            <span className={`text-xs font-black uppercase tracking-wider px-3.5 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs ${
                              mostrarRespuesta 
                                ? 'bg-emerald-600 text-white' 
                                : 'bg-indigo-600 text-white'
                            }`}>
                              {mostrarRespuesta ? '💡 RESPUESTA & FUNDAMENTACIÓN' : '❓ CASO / PREGUNTA CLÍNICA'}
                            </span>
                            <span className="text-[11px] text-gray-400 dark:text-slate-400 font-medium">
                              (Toca para voltear)
                            </span>
                          </div>

                          {/* Contenido Clínico */}
                          <div className="my-auto py-4 text-center overflow-y-auto max-h-[340px] px-2">
                            <div className={`text-base sm:text-lg md:text-xl font-medium leading-relaxed ${
                              mostrarRespuesta ? 'text-emerald-950 dark:text-emerald-100' : 'text-gray-900 dark:text-white'
                            }`}>
                              <MarkdownClinico contenido={mostrarRespuesta ? temaSeleccionado.flashcards[indiceTarjeta].respuesta : temaSeleccionado.flashcards[indiceTarjeta].pregunta} />
                            </div>
                          </div>

                          {/* Pie de la tarjeta */}
                          <div className="pt-3 border-t border-gray-200/70 dark:border-slate-700/70 flex justify-between items-center text-[11px] text-gray-400 dark:text-slate-400">
                            <span>{temaSeleccionado.categoria}</span>
                            <span className="font-semibold text-purple-600 dark:text-purple-400 flex items-center gap-1">
                              <RotateCcw className="w-3 h-3" /> Haz clic para dar vuelta
                            </span>
                          </div>
                        </div>

                        {/* Controles de Navegación */}
                        <div className="flex items-center justify-center gap-3 w-full pt-1 flex-wrap">
                          <button 
                            onClick={() => { setIndiceTarjeta(Math.max(0, indiceTarjeta - 1)); setMostrarRespuesta(false); }} 
                            disabled={indiceTarjeta === 0} 
                            className="px-5 py-2.5 bg-white dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-xs sm:text-sm font-bold text-gray-800 dark:text-slate-200 border border-gray-200 dark:border-slate-700 disabled:opacity-40 transition-all shadow-sm"
                          >
                            ◀ Anterior
                          </button>
                          <button 
                            onClick={() => setMostrarRespuesta(!mostrarRespuesta)} 
                            className="px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-md flex items-center gap-1.5"
                          >
                            🔄 {mostrarRespuesta ? "Ver Pregunta" : "Ver Respuesta"}
                          </button>
                          <button 
                            onClick={() => { setIndiceTarjeta(Math.min(temaSeleccionado.flashcards.length - 1, indiceTarjeta + 1)); setMostrarRespuesta(false); }} 
                            disabled={indiceTarjeta === temaSeleccionado.flashcards.length - 1} 
                            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold disabled:opacity-40 transition-all shadow-sm"
                          >
                            Siguiente ▶
                          </button>
                        </div>
                      </div>
                  ) : (
                    !loteNuevo.length && (
                      <div className="flex-1 flex flex-col items-center justify-center text-gray-400 text-center space-y-3 p-10 h-full">
                        <BrainCircuit className="w-14 h-14 text-purple-300 dark:text-purple-900" />
                        <p className="text-base font-bold text-gray-600 dark:text-slate-300">No hay flashcards guardadas en este tema.</p>
                        <p className="text-xs text-gray-400 max-w-sm">Presiona "Generar Flashcards IA" arriba o adjunta un PDF/imagen para crear un mazo de preguntas clave.</p>
                      </div>
                    )
                  )}
                </div>
              )}

              {/* MODO 3: SIMULACRO DE EXÁMENES TEÓRICOS */}
              {modo === "simulacro" && (
                <div className="space-y-4">
                  
                  {/* Selector de Examen */}
                  <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button
                        onClick={() => setTipoSimulacro("teorico1")}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          tipoSimulacro === "teorico1" ? "bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-300" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <p className="font-bold">📝 Examen Teórico 1 (12.5%)</p>
                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">Cardio, Gastro y Respiratorio</p>
                      </button>

                      <button
                        onClick={() => setTipoSimulacro("teorico2")}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          tipoSimulacro === "teorico2" ? "bg-purple-50 border-purple-400 text-purple-900 ring-2 ring-purple-300" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <p className="font-bold">📝 Examen Teórico 2 (12.5%)</p>
                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">Infecto, Nefro, Reuma, Endócrino...</p>
                      </button>

                      <button
                        onClick={() => setTipoSimulacro("tema")}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          tipoSimulacro === "tema" ? "bg-emerald-50 border-emerald-400 text-emerald-900 ring-2 ring-emerald-300" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                        }`}
                      >
                        <p className="font-bold">🎯 Test de este Tema</p>
                        <p className="text-[10px] text-gray-500 font-normal mt-0.5">{temaSeleccionado.titulo}</p>
                      </button>
                    </div>

                    <button
                      onClick={generarSimulacroExamen}
                      disabled={generandoTest}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all disabled:opacity-50"
                    >
                      {generandoTest ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Generando casos clínicos EUNACOM con Gemini...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Generar 5 Casos Clínicos con IA ✨</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Preguntas del Test */}
                  {preguntasTest.length > 0 && (
                    <div className="space-y-4">
                      {preguntasTest.map((p, pIdx) => {
                        const seleccionada = respuestasUsuario[p.id];
                        const esCorrecta = seleccionada === p.correcta;

                        return (
                          <div key={p.id} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
                            <div className="flex justify-between items-start">
                              <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md uppercase">
                                Caso {pIdx + 1} • {p.tema}
                              </span>
                              {testFinalizado && (
                                <span className={`text-xs font-bold flex items-center gap-1 ${
                                  esCorrecta ? 'text-emerald-600' : 'text-red-600'
                                }`}>
                                  {esCorrecta ? <><CheckCircle2 className="w-4 h-4" /> Correcta</> : <><XCircle className="w-4 h-4" /> Incorrecta</>}
                                </span>
                              )}
                            </div>

                            <p className="text-xs md:text-sm text-gray-900 font-medium leading-relaxed">
                              {p.enunciado}
                            </p>

                            <div className="space-y-1.5">
                              {p.opciones.map((opcion, oIdx) => {
                                const esEstaSeleccionada = seleccionada === oIdx;
                                const esLaCorrecta = p.correcta === oIdx;

                                let estiloOpcion = "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100";
                                if (testFinalizado) {
                                  if (esLaCorrecta) estiloOpcion = "bg-emerald-100 border-emerald-400 text-emerald-950 font-bold";
                                  else if (esEstaSeleccionada && !esLaCorrecta) estiloOpcion = "bg-red-100 border-red-300 text-red-900 font-bold";
                                } else if (esEstaSeleccionada) {
                                  estiloOpcion = "bg-blue-50 border-blue-400 text-blue-900 font-bold ring-2 ring-blue-300";
                                }

                                return (
                                  <button
                                    key={oIdx}
                                    onClick={() => seleccionarOpcion(p.id, oIdx)}
                                    className={`w-full p-2.5 rounded-lg border text-xs text-left transition-all ${estiloOpcion}`}
                                  >
                                    {opcion}
                                  </button>
                                );
                              })}
                            </div>

                            {testFinalizado && (
                              <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-800 dark:text-slate-200 leading-relaxed">
                                <p className="font-bold text-blue-900 dark:text-blue-400 mb-1">Fundamentación Clínica EUNACOM:</p>
                                <MarkdownClinico contenido={p.justificacion} />
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Botón de Finalizar Test */}
                      {!testFinalizado ? (
                        <button
                          onClick={() => setTestFinalizado(true)}
                          disabled={Object.keys(respuestasUsuario).length < preguntasTest.length}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Finalizar Simulacro y Ver Calificación Oficial
                        </button>
                      ) : (
                        <div className="bg-white p-4 rounded-xl border-2 border-emerald-200 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in zoom-in-95">
                          <div className="flex items-center gap-3">
                            <Award className="w-8 h-8 text-emerald-600" />
                            <div>
                              <h4 className="font-bold text-gray-900 text-sm">Resultado del Simulacro</h4>
                              <p className="text-xs text-gray-500">
                                {resultadoSimulacro.correctas} de {resultadoSimulacro.total} correctas ({resultadoSimulacro.porcentaje}%) • Exigencia 70%
                              </p>
                            </div>
                          </div>
                          <div className={`px-4 py-2 rounded-xl text-center font-black text-base border ${
                            resultadoSimulacro.nota >= 4.0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                          }`}>
                            Nota: {resultadoSimulacro.nota.toFixed(1)}
                            <span className="block text-[10px] uppercase font-bold">
                              {resultadoSimulacro.nota >= 4.0 ? 'Aprobado 🎓' : 'Reprobado ❌'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

            </div>
          </div>
        )}
      </div>

      {/* MODAL GIGANTE DE PANTALLA COMPLETA PARA FLASHCARDS */}
      {modalFlashcardFullscreen && temaSeleccionado.flashcards && temaSeleccionado.flashcards.length > 0 && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border-2 border-purple-300 dark:border-purple-800 rounded-3xl w-full max-w-5xl h-[90vh] max-h-[850px] shadow-2xl flex flex-col justify-between p-4 sm:p-8 relative overflow-hidden">
            
            {/* Cabecera del modal */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-slate-800 shrink-0">
              <div className="flex items-center gap-2">
                <span className="bg-purple-100 dark:bg-purple-950 text-purple-800 dark:text-purple-300 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider border border-purple-200 dark:border-purple-800">
                  {temaSeleccionado.categoria}
                </span>
                <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white truncate max-w-xs sm:max-w-md">
                  {temaSeleccionado.titulo}
                </h3>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-500 dark:text-slate-400">
                  Tarjeta {indiceTarjeta + 1} de {temaSeleccionado.flashcards.length}
                </span>
                <button
                  onClick={() => setModalFlashcardFullscreen(false)}
                  className="p-2 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-full transition-colors"
                  title="Cerrar pantalla completa"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tarjeta Gigante Interactiva */}
            <div
              onClick={() => setMostrarRespuesta(!mostrarRespuesta)}
              className={`flex-1 my-4 p-6 sm:p-12 rounded-3xl shadow-xl flex flex-col justify-between cursor-pointer transition-all duration-300 transform select-none overflow-y-auto ${
                mostrarRespuesta
                  ? 'bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 dark:from-slate-850 dark:via-emerald-950/50 dark:to-slate-850 border-2 border-emerald-500 shadow-emerald-500/20'
                  : 'bg-gradient-to-br from-white via-slate-50 to-indigo-50/40 dark:from-slate-850 dark:via-slate-850 dark:to-slate-900 border-2 border-indigo-300 dark:border-slate-700 shadow-indigo-500/20'
              }`}
            >
              <div className="flex justify-between items-center pb-3 border-b border-gray-200/70 dark:border-slate-700/70">
                <span className={`text-xs sm:text-sm font-black uppercase tracking-wider px-4 py-1.5 rounded-lg shadow-sm ${
                  mostrarRespuesta ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {mostrarRespuesta ? '💡 RESPUESTA & FUNDAMENTACIÓN CLÍNICA' : '❓ CASO / PREGUNTA EUNACOM'}
                </span>
                <span className="text-xs text-gray-400 font-medium">
                  Toca para voltear 🔄
                </span>
              </div>

              <div className="my-auto py-6 text-center text-lg sm:text-2xl md:text-3xl font-medium leading-relaxed px-2 sm:px-6">
                <MarkdownClinico contenido={mostrarRespuesta ? temaSeleccionado.flashcards[indiceTarjeta].respuesta : temaSeleccionado.flashcards[indiceTarjeta].pregunta} />
              </div>

              <div className="pt-3 border-t border-gray-200/70 dark:border-slate-700/70 text-center text-xs text-purple-600 dark:text-purple-400 font-bold">
                🔄 Haz clic en la tarjeta para alternar entre pregunta y respuesta
              </div>
            </div>

            {/* Controles de Navegación del modal */}
            <div className="flex items-center justify-between gap-3 pt-2 shrink-0 flex-wrap">
              <button
                onClick={() => { setIndiceTarjeta(Math.max(0, indiceTarjeta - 1)); setMostrarRespuesta(false); }}
                disabled={indiceTarjeta === 0}
                className="px-6 py-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-900 dark:text-white rounded-2xl text-sm font-bold disabled:opacity-40 transition-all border border-gray-200 dark:border-slate-700"
              >
                ◀ Tarjeta Anterior
              </button>

              <button
                onClick={() => setMostrarRespuesta(!mostrarRespuesta)}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-2xl text-sm font-bold shadow-lg transition-all flex items-center gap-2"
              >
                🔄 {mostrarRespuesta ? "Ver Pregunta" : "Ver Respuesta"}
              </button>

              <button
                onClick={() => { setIndiceTarjeta(Math.min(temaSeleccionado.flashcards.length - 1, indiceTarjeta + 1)); setMostrarRespuesta(false); }}
                disabled={indiceTarjeta === temaSeleccionado.flashcards.length - 1}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold disabled:opacity-40 transition-all shadow-md"
              >
                Siguiente Tarjeta ▶
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
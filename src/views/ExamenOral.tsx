import { useState, useEffect, useRef } from 'react';
import { consultarGeminiConArchivo } from '../Services/gemini';
import { GraduationCap, Award, Play, RotateCcw, Send, Loader2, CheckCircle2, AlertCircle, FileCheck, UserCheck, Shuffle, Cloud, History, Calendar } from 'lucide-react';
import { guardarEnNube, cargarDeNube } from '../Services/cloudSync';

interface MensajeExamen {
  remitente: 'comision' | 'interno';
  texto: string;
  tiempo?: string;
}

interface EvaluacionPauta {
  analisisCuadro: number; // 10%
  interpretaPruebas: number; // 10%
  aproximacionDx: number; // 10%
  hipotesisDx: number; // 10%
  diagnosticosDif: number; // 10%
  conductaASeguir: number; // 20%
  conocimientoTeorico: number; // 30%
  notaFinal: number;
  comentariosComision: string;
  puntosFuertes: string[];
  aspectosMejorar: string[];
}

interface RegistroHistorialExamen {
  id: string;
  fecha: string;
  tema: string;
  evaluacion: EvaluacionPauta;
}

const TEMAS_CLINICOS_COMPLETOS = [
  // CARDIOLOGÍA
  'Cardiología: Síndrome Coronario Agudo (IAMCEST vs IAMSEST / Angina Inestable)',
  'Cardiología: Insuficiencia Cardíaca Aguda / Edema Pulmonar Agudo / Shock Cardiogénico',
  'Cardiología: Fibrilación Auricular con Respuesta Ventricular Rápida descompensada',
  'Cardiología: Taquiarritmias: Taquicardia Paroxística Supraventricular (TPSV) / Flutter Auricular',
  'Cardiología: Bradiarritmias: Bloqueo AV Completo / Bradicardia Sintomática',
  'Cardiología: Tromboembolismo Pulmonar Agudo (TEP) masivo y submasivo',
  'Cardiología: Endocarditis Infecciosa Aguda / Criterios de Duke',
  'Cardiología: Pericarditis Aguda / Taponamiento Cardíaco',
  'Cardiología: Estenosis Aórtica Severa Sintomática / Insuficiencia Mitral Aguda',

  // GASTROENTEROLOGÍA & HEPATOLOGÍA
  'Gastroenterología: Hemorragia Digestiva Alta Variceal en paciente con Cirrosis (DHC)',
  'Gastroenterología: Hemorragia Digestiva Alta No Variceal (Úlcera Péptica Sangrante)',
  'Gastroenterología: Pancreatitis Aguda Grave / Criterios de Severidad (BISAP / Ranson)',
  'Gastroenterología: Encefalopatía Hepática / Síndrome Hepatorrenal en DHC',
  'Gastroenterología: Diarrea Aguda con Deshidratación Severa / Sospecha de Clostridioides difficile',
  'Gastroenterología: Enfermedad Inflamatoria Intestinal (Crisis de Colitis Ulcerosa)',
  'Gastroenterología: Falla Hepática Aguda Grave (FHAG) / Daño Hepático Fulminante',

  // NEFROLOGÍA & MEDIO INTERNO
  'Nefrología: Injuria Renal Aguda (IRA) Oligúrica / Urgencias Dialíticas',
  'Nefrología: Hiperkalemia Severa con Cambios Electrocardiográficos',
  'Nefrología: Hiponatremia Severa Sintomática (Manejo con NaCl 3% y riesgo de mielinolisis)',
  'Nefrología: Síndrome Nefrítico Agudo (GNPE / Glomerulonefritis Rápidamente Progresiva)',
  'Nefrología: Síndrome Nefrótico Descompensado / Trombosis de Vena Renal',
  'Nefrología: Crisis Hipertensiva: Emergencia Hipertensiva con Daño de Órgano Blanco',
  'Nefrología: Trastornos Ácido-Base Complejos (Acidosis Láctica / Cetoacidosis)',

  // BRONCOPULMONAR
  'Broncopulmonar: Neumonía Adquirida en la Comunidad (NAC) Grave / CURB-65 / Shock Séptico',
  'Broncopulmonar: Crisis Asmática Severa / Estado Asmático en Urgencias',
  'Broncopulmonar: EPOC Reagudizado Grave con Insuficiencia Respiratoria Hipercápnica',
  'Broncopulmonar: Derrame Pleural Masivo / Empiema Pleural',
  'Broncopulmonar: Hemoptisis Masiva en paciente con TBC o Cáncer Pulmonar',

  // NUTRICIÓN & DIABETES / ENDOCRINOLOGÍA
  'Diabetes & Nutrición: Cetoacidosis Diabética (CAD) descompensada',
  'Diabetes & Nutrición: Estado Hiperosmolar Hiperglicémico (EHH)',
  'Diabetes & Nutrición: Hipoglicemia Severa en paciente diabético con ERC',
  'Endocrinología: Crisis Tirotóxica (Tormenta Tiroidea)',
  'Endocrinología: Coma Mixedematoso / Hipotiroidismo Severo',
  'Endocrinología: Insuficiencia Suprarrenal Aguda / Crisis Addisoniana',
  'Endocrinología: Hipercalcemia Maligna Severa',

  // INFECTOLOGÍA
  'Infectología: Sepsis y Shock Séptico de Foco Urinario / Neumónico',
  'Infectología: Neutropenia Febril de Alto Riesgo en paciente hemato-oncológico',
  'Infectología: Infección por VIH / Neumonía por Pneumocystis jirovecii / Meningitis Criptocócica',
  'Infectología: Meningitis Bacteriana Aguda del Adulto',
  'Infectología: Infección de Piel y Partes Blandas Necrosante (Fascitis Necrosante)',

  // HEMATOLOGÍA & REUMATOLOGÍA
  'Hematología: Síndrome Purpúrico / Púrpura Trombocitopénica Trombótica (PTT) vs PTI',
  'Hematología: Síndrome de Lisis Tumoral Aguda',
  'Hematología: Anemia Hemolítica Autoinmune Severa / Pancitopenia en Estudio',
  'Reumatología: Crisis de Lupus Eritematoso Sistémico con Nefritis Lúpica',
  'Reumatología: Monoartritis Aguda: Artritis Séptica vs Crisis de Gota',

  // GERIATRÍA
  'Geriatría: Síndrome Confusional Agudo (Delirium Hipoactivo / Hiperactivo) en Adulto Mayor'
];

export default function ExamenOral() {
  const [temaSeleccionado, setTemaSeleccionado] = useState<string>(TEMAS_CLINICOS_COMPLETOS[0]);
  const [enExamen, setEnExamen] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensajes, setMensajes] = useState<MensajeExamen[]>([]);
  const [respuestaInterno, setRespuestaInterno] = useState<string>('');
  const [evaluacionFinal, setEvaluacionFinal] = useState<EvaluacionPauta | null>(null);
  const [generandoActa, setGenerandoActa] = useState<boolean>(false);

  const [historialExamenes, setHistorialExamenes] = useState<RegistroHistorialExamen[]>([]);
  const [sincronizandoNube, setSincronizandoNube] = useState<boolean>(true);
  const [mostrarHistorialModal, setMostrarHistorialModal] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Cargar Historial desde la Nube al Iniciar
  useEffect(() => {
    async function sincronizarHistorial() {
      const datosNube = await cargarDeNube('examen_oral_historial');
      if (datosNube && Array.isArray(datosNube) && datosNube.length > 0) {
        setHistorialExamenes(datosNube);
      } else {
        const local = localStorage.getItem('wc_examen_oral_historial');
        if (local) {
          try { setHistorialExamenes(JSON.parse(local)); } catch (e) {}
        }
      }
      setSincronizandoNube(false);
    }
    sincronizarHistorial();
  }, []);

  // Guardar en la Nube al cambiar historial
  useEffect(() => {
    if (!sincronizandoNube && historialExamenes.length > 0) {
      localStorage.setItem('wc_examen_oral_historial', JSON.stringify(historialExamenes));
      guardarEnNube('examen_oral_historial', historialExamenes);
    }
  }, [historialExamenes, sincronizandoNube]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const sortearTemaAleatorio = () => {
    const randomIdx = Math.floor(Math.random() * TEMAS_CLINICOS_COMPLETOS.length);
    setTemaSeleccionado(TEMAS_CLINICOS_COMPLETOS[randomIdx]);
  };

  const iniciarExamen = async () => {
    setEnExamen(true);
    setEvaluacionFinal(null);
    setCargando(true);

    const promptInicial = `
Actúa como un Médico Tutor Evaluador Senior de Medicina Interna para un examen oral de pregrado.
Estamos iniciando la evaluación oral clínica sobre el tema: "${temaSeleccionado}".

INSTRUCCIONES CLÍNICAS:
1. Saluda al interno con formalidad académica médica.
2. Preséntale la VIÑETA CLÍNICA INICIAL del paciente (Edad, sexo, motivo de consulta a Urgencias o sala, anamnesis próxima breve, antecedentes mórbidos y signos vitales de ingreso).
3. Pídele al interno que exponga su enfrentamiento inicial, examen físico segmentario dirigido y sus primeras hipótesis diagnósticas.
4. Mantén un tono docente, formal, estructurado y exigente acorde al internado de medicina interna chileno y perfil EUNACOM.
`;

    try {
      const respuesta = await consultarGeminiConArchivo(promptInicial);
      setMensajes([
        {
          remitente: 'comision',
          texto: respuesta,
          tiempo: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e: any) {
      alert(`Error al iniciar examen: ${e.message}`);
      setEnExamen(false);
    } finally {
      setCargando(false);
    }
  };

  const enviarRespuesta = async () => {
    if (!respuestaInterno.trim() || cargando) return;

    const textoUsuario = respuestaInterno.trim();
    setRespuestaInterno('');

    const nuevosMensajes: MensajeExamen[] = [
      ...mensajes,
      {
        remitente: 'interno',
        texto: textoUsuario,
        tiempo: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ];

    setMensajes(nuevosMensajes);
    setCargando(true);

    const historialContexto = nuevosMensajes
      .map(m => `${m.remitente === 'comision' ? 'TUTOR EVALUADOR' : 'INTERNO'}: ${m.texto}`)
      .join('\n\n');

    const promptContinuar = `
Eres el Tutor Evaluador Senior de Medicina Interna.
Continúa evaluando al interno en su examen oral sobre: "${temaSeleccionado}".

HISTORIAL DE LA EVALUACIÓN:
${historialContexto}

INSTRUCCIÓN DEL EVALUADOR:
- Analiza la respuesta del interno. Si solicitó exámenes complementarios (laboratorio, ECG, imágenes, gases), entrégale los resultados concretos con valores numéricos y hallazgos radiológicos/ECG verosímiles.
- Hazle preguntas de seguimiento sobre: diagnósticos diferenciales, estratificación de gravedad (scores como CURB-65, MELD, Child-Pugh, TIMI, Wells, etc.), conducta terapéutica precisa (fármacos con dosis y vías, medidas generales) o criterios de ingreso a UCI/UTI o garantías GES si aplica.
- Si el examen ya lleva suficiente profundidad (3 o más intercambios), haz una última pregunta de integración teórica o fisiopatológica para concluir la sesión.
`;

    try {
      const respuestaIA = await consultarGeminiConArchivo(promptContinuar);
      setMensajes(prev => [
        ...prev,
        {
          remitente: 'comision',
          texto: respuestaIA,
          tiempo: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (e: any) {
      alert(`Error de conexión con Gemini: ${e.message}`);
    } finally {
      setCargando(false);
    }
  };

  const finalizarYCalificar = async () => {
    setGenerandoActa(true);

    const historialCompleto = mensajes
      .map(m => `${m.remitente === 'comision' ? 'TUTOR EVALUADOR' : 'INTERNO DE MEDICINA'}: ${m.texto}`)
      .join('\n\n');

    const promptCalificacion = `
Eres el Médico Tutor Evaluador de Medicina Interna.
Has finalizado el examen oral del interno sobre el tema: "${temaSeleccionado}".

Debes calificar el desempeño del interno con notas chilenas de 1.0 a 7.0 (donde 4.0 es la nota mínima de aprobación al 70% de exigencia) en los siguientes 7 acápites clínicos:

1. Analiza adecuadamente el cuadro clínico del paciente con el fin de recabar la información (10% de ponderación) -> Calificación de 1.0 a 7.0
2. Es capaz de interpretar pruebas diagnósticas generales (10% de ponderación) -> Calificación de 1.0 a 7.0
3. Realiza una aproximación diagnóstica de acuerdo a la información provista (10% de ponderación) -> Calificación de 1.0 a 7.0
4. Formula hipótesis diagnósticas (10% de ponderación) -> Calificación de 1.0 a 7.0
5. Plantea diagnósticos diferenciales (10% de ponderación) -> Calificación de 1.0 a 7.0
6. Define de forma general la conducta a seguir (20% de ponderación) -> Calificación de 1.0 a 7.0
7. Demuestra conocimiento teórico al responder las preguntas (30% de ponderación) -> Calificación de 1.0 a 7.0

HISTORIAL DEL EXAMEN:
${historialCompleto}

REGLA: Devuelve ÚNICAMENTE un objeto JSON válido con esta estructura exacta (sin markdown extra):
{
  "analisisCuadro": 6.5,
  "interpretaPruebas": 6.0,
  "aproximacionDx": 6.0,
  "hipotesisDx": 6.5,
  "diagnosticosDif": 5.5,
  "conductaASeguir": 6.0,
  "conocimientoTeorico": 6.2,
  "notaFinal": 6.1,
  "comentariosComision": "Comentario general sobre la presentación, solidez clínica y manejo integral.",
  "puntosFuertes": ["Punto 1", "Punto 2", "Punto 3"],
  "aspectosMejorar": ["Aspecto 1 a reforzar para EUNACOM", "Aspecto 2"]
}
`;

    try {
      const resText = await consultarGeminiConArchivo(promptCalificacion);
      const limpio = resText.replace(/```json/gi, '').replace(/```/g, '').trim();
      const pauta: EvaluacionPauta = JSON.parse(limpio);
      setEvaluacionFinal(pauta);

      // Guardar en Historial en la Nube
      const nuevoRegistro: RegistroHistorialExamen = {
        id: Date.now().toString(),
        fecha: new Date().toLocaleDateString('es-CL'),
        tema: temaSeleccionado,
        evaluacion: pauta
      };

      setHistorialExamenes(prev => [nuevoRegistro, ...prev]);

    } catch (e: any) {
      alert(`Error al generar el acta de evaluación: ${e.message}`);
    } finally {
      setGenerandoActa(false);
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-purple-100 text-purple-700 rounded-xl">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
                Simulador de Examen Oral Clínico (IA)
              </h1>
              {!sincronizandoNube && (
                <span className="flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                  <Cloud className="w-3 h-3" /> Nube
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Entrenamiento interactivo de casos clínicos complejos con evaluación formativa y rúbrica oficial.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {historialExamenes.length > 0 && !enExamen && (
            <button
              onClick={() => setMostrarHistorialModal(!mostrarHistorialModal)}
              className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors border"
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial ({historialExamenes.length})</span>
            </button>
          )}

          {!enExamen ? (
            <button
              onClick={iniciarExamen}
              disabled={cargando}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs md:text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
            >
              {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Iniciar Caso Clínico
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={finalizarYCalificar}
                disabled={generandoActa || mensajes.length < 3}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
              >
                {generandoActa ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />}
                Finalizar y Deliberar Nota
              </button>
              <button
                onClick={() => { setEnExamen(false); setMensajes([]); setEvaluacionFinal(null); }}
                className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl transition-colors"
                title="Reiniciar"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Historial Modal / Desplegable */}
      {mostrarHistorialModal && !enExamen && (
        <div className="bg-white p-4 md:p-5 rounded-2xl border border-purple-200 shadow-lg space-y-3 animate-in fade-in">
          <div className="flex justify-between items-center border-b pb-2">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-600" /> Historial de Exámenes Guardados en la Nube
            </h3>
            <button onClick={() => setMostrarHistorialModal(false)} className="text-gray-400 hover:text-gray-600 text-xs font-bold">Cerrar</button>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {historialExamenes.map(h => (
              <div
                key={h.id}
                onClick={() => setEvaluacionFinal(h.evaluacion)}
                className="p-3 bg-gray-50 hover:bg-purple-50 rounded-xl border border-gray-200 flex justify-between items-center cursor-pointer transition-colors"
              >
                <div className="truncate pr-2">
                  <p className="font-bold text-gray-900 text-xs truncate">{h.tema}</p>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3 h-3" /> {h.fecha}
                  </p>
                </div>
                <div className={`px-2.5 py-1 rounded-lg font-black text-xs shrink-0 border ${
                  h.evaluacion.notaFinal >= 4.0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
                }`}>
                  Nota: {h.evaluacion.notaFinal.toFixed(1)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selector de Temario Extenso y Sorteo */}
      {!enExamen && (
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <label className="block text-xs font-bold uppercase text-gray-700 tracking-wider">
              Temario Clínico de Medicina Interna ({TEMAS_CLINICOS_COMPLETOS.length} Casos Disponibles)
            </label>
            <button
              type="button"
              onClick={sortearTemaAleatorio}
              className="w-fit px-3 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold rounded-lg border border-purple-200 flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Shuffle className="w-3.5 h-3.5 text-purple-600" />
              <span>🎲 Sortear Caso Clínico Aleatorio</span>
            </button>
          </div>

          <select
            value={temaSeleccionado}
            onChange={e => setTemaSeleccionado(e.target.value)}
            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800 font-medium"
          >
            {TEMAS_CLINICOS_COMPLETOS.map((tema, i) => (
              <option key={i} value={tema}>{tema}</option>
            ))}
          </select>
        </div>
      )}

      {/* Rúbrica Oficial Calificada */}
      {evaluacionFinal && (
        <div className="bg-white p-5 md:p-6 rounded-2xl border-2 border-purple-200 shadow-xl space-y-4 animate-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Acta de Calificación y Retroalimentación</h2>
                <p className="text-xs text-gray-500 truncate max-w-xl">{temaSeleccionado}</p>
              </div>
            </div>
            <div className={`px-4 py-2 rounded-xl text-center font-black text-lg border ${
              evaluacionFinal.notaFinal >= 4.0 ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : 'bg-red-50 text-red-800 border-red-300'
            }`}>
              Nota Final: {evaluacionFinal.notaFinal.toFixed(1)}
              <span className="block text-[10px] uppercase font-bold tracking-wider">
                {evaluacionFinal.notaFinal >= 4.0 ? 'Aprobado 🎓' : 'Reprobado ❌'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-50 p-3 rounded-xl border">
              <span className="text-gray-500 font-bold block text-[10px] uppercase">1. Análisis Cuadro Clínico (10%)</span>
              <span className="text-base font-bold text-gray-800">{evaluacionFinal.analisisCuadro.toFixed(1)}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border">
              <span className="text-gray-500 font-bold block text-[10px] uppercase">2. Pruebas Diagnósticas (10%)</span>
              <span className="text-base font-bold text-gray-800">{evaluacionFinal.interpretaPruebas.toFixed(1)}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border">
              <span className="text-gray-500 font-bold block text-[10px] uppercase">3. Aproximación Diagnóstica (10%)</span>
              <span className="text-base font-bold text-gray-800">{evaluacionFinal.aproximacionDx.toFixed(1)}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border">
              <span className="text-gray-500 font-bold block text-[10px] uppercase">4. Hipótesis Diagnóstica (10%)</span>
              <span className="text-base font-bold text-gray-800">{evaluacionFinal.hipotesisDx.toFixed(1)}</span>
            </div>
            <div className="bg-gray-50 p-3 rounded-xl border">
              <span className="text-gray-500 font-bold block text-[10px] uppercase">5. Diagnósticos Diferenciales (10%)</span>
              <span className="text-base font-bold text-gray-800">{evaluacionFinal.diagnosticosDif.toFixed(1)}</span>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-200">
              <span className="text-purple-900 font-bold block text-[10px] uppercase">6. Conducta a Seguir (20%)</span>
              <span className="text-base font-bold text-purple-950">{evaluacionFinal.conductaASeguir.toFixed(1)}</span>
            </div>
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 sm:col-span-2">
              <span className="text-purple-900 font-bold block text-[10px] uppercase">7. Conocimiento Teórico (30%)</span>
              <span className="text-base font-bold text-purple-950">{evaluacionFinal.conocimientoTeorico.toFixed(1)}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border space-y-2 text-xs">
            <h3 className="font-bold text-gray-800 text-sm">Dictamen y Retroalimentación Clínica:</h3>
            <p className="text-gray-700 leading-relaxed italic">{evaluacionFinal.comentariosComision}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-emerald-800 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Fortalezas Demostradas
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
                  {evaluacionFinal.puntosFuertes?.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
              </div>
              <div className="space-y-1">
                <span className="text-[11px] font-bold text-amber-800 uppercase flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600" /> Aspectos a Reforzar para EUNACOM
                </span>
                <ul className="list-disc pl-4 space-y-0.5 text-gray-600">
                  {evaluacionFinal.aspectosMejorar?.map((pt, i) => <li key={i}>{pt}</li>)}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sala de Examen Oral / Chat con el Tutor Evaluador */}
      {enExamen && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[650px] overflow-hidden">
          
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold">Tutor Evaluador de Medicina Interna</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              {temaSeleccionado.split(':')[0]}
            </span>
          </div>

          <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50/50">
            {mensajes.map((m, idx) => {
              const esComision = m.remitente === 'comision';
              return (
                <div key={idx} className={`flex gap-3 ${esComision ? 'justify-start' : 'justify-end'}`}>
                  {esComision && (
                    <div className="w-8 h-8 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
                      🩺
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed shadow-sm ${
                    esComision
                      ? 'bg-white border border-gray-200 text-gray-800'
                      : 'bg-purple-600 text-white'
                  }`}>
                    <div className="flex justify-between items-center mb-1 text-[10px] opacity-75 font-semibold">
                      <span>{esComision ? 'Tutor Evaluador' : 'Tu Respuesta'}</span>
                      {m.tiempo && <span>{m.tiempo}</span>}
                    </div>
                    <div className="whitespace-pre-wrap">{m.texto}</div>
                  </div>
                </div>
              );
            })}

            {cargando && (
              <div className="flex items-center gap-2 text-xs text-purple-700 bg-purple-50 p-3 rounded-xl w-fit border border-purple-200 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>El Tutor Evaluador está analizando tu respuesta y formulando el siguiente paso...</span>
              </div>
            )}
          </div>

          <div className="p-3 bg-white border-t border-gray-100 flex gap-2">
            <textarea
              rows={2}
              value={respuestaInterno}
              onChange={e => setRespuestaInterno(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  enviarRespuesta();
                }
              }}
              placeholder="Escribe tu respuesta clínica, análisis de hipótesis, exámenes solicitados o plan de manejo..."
              className="flex-1 p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-purple-400 resize-none text-gray-800"
            />
            <button
              onClick={enviarRespuesta}
              disabled={!respuestaInterno.trim() || cargando}
              className="px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-xl flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
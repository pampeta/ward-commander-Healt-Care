import { useState, useEffect, useRef } from 'react';
import { consultarGeminiConArchivo } from '../Services/gemini';
import { GraduationCap, Award, Play, RotateCcw, Send, Loader2, CheckCircle2, AlertCircle, FileCheck, UserCheck } from 'lucide-react';

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

const TEMAS_OFICIALES = [
  'Cardiología: Síndrome Coronario Agudo / Fibrilación Auricular descompensada',
  'Cardiología: Insuficiencia Cardíaca Aguda / Edema Pulmonar Agudo',
  'Gastroenterología: Hemorragia Digestiva Alta en Daño Hepático Crónico (DHC)',
  'Gastroenterología: Pancreatitis Aguda Grave / Criterios de Severidad',
  'Nefrología: Injuria Renal Aguda (IRA) / Urgencias Dialíticas / Hiperkalemia',
  'Nefrología: Síndrome Nefrítico vs Nefrótico / Crisis Hipertensiva',
  'Broncopulmonar: Neumonía Adquirida en la Comunidad (NAC) grave / CURB-65',
  'Broncopulmonar: Tromboembolismo Pulmonar Agudo (TEP) / Scores y Manejo',
  'Diabetes & Nutrición: Cetoacidosis Diabética (CAD) / Síndrome Hiperosmolar',
  'Infectología: Sepsis / Shock Séptico de Foco Urinario o Pulmonar',
  'Hematología: Síndrome Purpúrico / Neutropenia Febril / Anemias Graves',
  'Reumatología: Lupus Eritematoso Sistémico / Artritis Séptica vs Cristales'
];

export default function ExamenOral() {
  const [temaSeleccionado, setTemaSeleccionado] = useState<string>(TEMAS_OFICIALES[0]);
  const [comisionDocente, setComisionDocente] = useState<string>('Dr. Mario Mayanz & Dra. Danissa Haro');
  const [enExamen, setEnExamen] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [mensajes, setMensajes] = useState<MensajeExamen[]>([]);
  const [respuestaInterno, setRespuestaInterno] = useState<string>('');
  const [evaluacionFinal, setEvaluacionFinal] = useState<EvaluacionPauta | null>(null);
  const [generandoActa, setGenerandoActa] = useState<boolean>(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajes]);

  const iniciarExamen = async () => {
    setEnExamen(true);
    setEvaluacionFinal(null);
    setCargando(true);

    const promptInicial = `
Actúa como la Comisión Docente de Pregrado de Medicina Interna de la Universidad de Magallanes (Hospital Clínico de Magallanes), integrada por: ${comisionDocente}.
Estamos iniciando el EXAMEN ORAL DE PREGRADO (Semana 15 - Carácter Reprobatorio - Pondera 30%).

El tema sorteado para el interno es: "${temaSeleccionado}".

INSTRUCCIONES CLÍNICAS:
1. Saluda al interno con formalidad académica médica.
2. Preséntale la VIÑETA CLÍNICA INICIAL del paciente (Edad, sexo, motivo de consulta a Urgencias o sala, anamnesis próxima breve, antecedentes mórbidos y signos vitales de ingreso).
3. Pídele al interno que exponga su enfrentamiento inicial, examen físico segmentario dirigido y sus primeras hipótesis diagnósticas.
4. Mantén un tono docente, formal y exigente acorde al internado de medicina interna chileno.
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
      .map(m => `${m.remitente === 'comision' ? 'COMISIÓN' : 'INTERNO'}: ${m.texto}`)
      .join('\n\n');

    const promptContinuar = `
Eres la Comisión Docente de Medicina Interna UMAG (${comisionDocente}).
Continúa evaluando al interno en su examen oral sobre: "${temaSeleccionado}".

HISTORIAL DE LA EVALUACIÓN:
${historialContexto}

INSTRUCCIÓN DE LA COMISIÓN:
- Analiza la respuesta del interno. Si solicitó exámenes complementarios (laboratorio, ECG, imágenes, gases), entrégale los resultados concretos con valores numéricos y hallazgos radiológicos/ECG.
- Hazle preguntas de seguimiento sobre: diagnósticos diferenciales, estratificación de gravedad (scores como CURB-65, MELD, Child-Pugh, TIMI, Wells, etc.), conducta terapéutica precisa (fármacos con dosis y vías, medidas generales) o criterios de ingreso a UCI/UTI o garantías GES si aplica.
- Si el examen ya lleva suficiente profundidad (3 o más intercambios), haz una última pregunta de integración teórica o fisiopatológica para concluir la deliberación.
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
      .map(m => `${m.remitente === 'comision' ? 'COMISIÓN DOCENTE' : 'INTERNO DE MEDICINA'}: ${m.texto}`)
      .join('\n\n');

    const promptCalificacion = `
Eres la Comisión Docente de Medicina Interna de la Universidad de Magallanes (Hospital Clínico de Magallanes).
Has finalizado el examen oral del interno sobre el tema: "${temaSeleccionado}".

Debes calificar el desempeño del interno según la PAUTA OFICIAL DE EVALUACIÓN DE EXAMEN ORAL DE PREGRADO INTERNADO MEDICINA INTERNA UMAG con notas chilenas de 1.0 a 7.0 (donde 4.0 es la nota mínima de aprobación al 70% de exigencia).

Ponderaciones de la Rúbrica:
1. Analiza adecuadamente el cuadro clínico del paciente con el fin de recabar la información (10% de ponderación) -> Calificación de 1.0 a 7.0
2. Es capaz de interpretar pruebas diagnósticas generales (10% de ponderación) -> Calificación de 1.0 a 7.0
3. Realiza una aproximación diagnóstica de acuerdo a la información provista (10% de ponderación) -> Calificación de 1.0 a 7.0
4. Formula hipótesis diagnósticas (10% de ponderación) -> Calificación de 1.0 a 7.0
5. Plantea diagnósticos diferenciales (10% de ponderación) -> Calificación de 1.0 a 7.0
6. Define de forma general la conducta a seguir (20% de ponderación) -> Calificación de 1.0 a 7.0
7. Demuestra conocimiento teórico al responder las preguntas por la comisión (30% de ponderación) -> Calificación de 1.0 a 7.0

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
                Simulador de Examen Oral de Pregrado
              </h1>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full border border-purple-200">
                Pondera 30% • Reprobatorio
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Comisión evaluadora docente con rúbrica oficial UMAG - Hospital Clínico de Magallanes.
            </p>
          </div>
        </div>

        {!enExamen ? (
          <button
            onClick={iniciarExamen}
            disabled={cargando}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs md:text-sm font-bold rounded-xl flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
          >
            {cargando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            Iniciar Examen Oral
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

      {/* Selector de Configuración si no está en examen */}
      {!enExamen && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm animate-in fade-in">
          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5 tracking-wider">
              Tema Clínico Sorteado (Temario Oficial)
            </label>
            <select
              value={temaSeleccionado}
              onChange={e => setTemaSeleccionado(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
            >
              {TEMAS_OFICIALES.map((tema, i) => (
                <option key={i} value={tema}>{tema}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-600 mb-1.5 tracking-wider">
              Comisión Evaluadora Designada
            </label>
            <select
              value={comisionDocente}
              onChange={e => setComisionDocente(e.target.value)}
              className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-purple-400 text-gray-800"
            >
              <option value="Dr. Mario Mayanz & Dra. Danissa Haro">Dr. Mario Mayanz (Director) & Dra. Danissa Haro (Medicina)</option>
              <option value="Dra. Andrea Chávez & Dr. Joaquín Muñoz">Dra. Andrea Chávez & Dr. Joaquín Muñoz (Medicina Interna)</option>
              <option value="Dr. Stanko Karelovic & Dr. Francisco Araneda">Dr. Stanko Karelovic (Gastro) & Dr. Francisco Araneda (Infecto)</option>
              <option value="Dr. Mauro Correa & Dra. Valeska Glasinovich">Dr. Mauro Correa (Nefro) & Dra. Valeska Glasinovich (Bronco)</option>
              <option value="Dr. Marcelo Montaner & Dr. Zosimo Maravi">Dr. Marcelo Montaner (Cardio) & Dr. Zosimo Maravi (Reuma)</option>
            </select>
          </div>
        </div>
      )}

      {/* Rúbrica Oficial Calificada */}
      {evaluacionFinal && (
        <div className="bg-white p-5 md:p-6 rounded-2xl border-2 border-purple-200 shadow-xl space-y-4 animate-in zoom-in-95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-purple-600" />
              <div>
                <h2 className="text-lg font-bold text-gray-900">Acta Oficial de Calificación de Examen Oral</h2>
                <p className="text-xs text-gray-500">Comisión: {comisionDocente} • Tema: {temaSeleccionado}</p>
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
              <span className="text-purple-900 font-bold block text-[10px] uppercase">7. Conocimiento Teórico Comision (30%)</span>
              <span className="text-base font-bold text-purple-950">{evaluacionFinal.conocimientoTeorico.toFixed(1)}</span>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border space-y-2 text-xs">
            <h3 className="font-bold text-gray-800 text-sm">Dictamen y Retroalimentación de la Comisión:</h3>
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

      {/* Sala de Examen Oral / Chat con la Comisión */}
      {enExamen && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[650px] overflow-hidden">
          
          <div className="p-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold">Comisión Evaluadora en Sesión</span>
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
                      🏛️
                    </div>
                  )}
                  <div className={`max-w-[85%] rounded-2xl p-3.5 text-xs md:text-sm leading-relaxed shadow-sm ${
                    esComision
                      ? 'bg-white border border-gray-200 text-gray-800'
                      : 'bg-purple-600 text-white'
                  }`}>
                    <div className="flex justify-between items-center mb-1 text-[10px] opacity-75 font-semibold">
                      <span>{esComision ? comisionDocente : 'Tu Respuesta'}</span>
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
                <span>La Comisión Docente está deliberando y formulando preguntas...</span>
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
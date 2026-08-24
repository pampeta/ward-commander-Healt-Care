import { useState } from 'react';
import { consultarGeminiConArchivo } from '../Services/gemini';
import { Activity, Phone, Users, Sparkles, Loader2, Copy, CheckCircle2, Zap, FileText } from 'lucide-react';

const TUTORES_REUNIONES = [
  { id: 1, especialidad: 'Cardiología', tutor: 'Dr. Marcelo Montaner', cel: '9 8803 6244', fechaSugerida: '09/09/2026', temas: 'SCA, Fibrilación Auricular, Insuficiencia Cardíaca Descompensada' },
  { id: 2, especialidad: 'Reumatología', tutor: 'Dr. Zosimo Maravi', cel: '9 8439 6061', fechaSugerida: '16/09/2026', temas: 'Lupus Eritematoso Sistémico, Artritis Reumatoide, Vasculitis' },
  { id: 3, especialidad: 'Gastroenterología', tutor: 'Dr. Stanko Karelovic', cel: '9 9640 1836', fechaSugerida: '23/09/2026', temas: 'Daño Hepático Crónico, Hemorragia Digestiva, Pancreatitis Aguda' },
  { id: 4, especialidad: 'Oncología', tutor: 'Dr. Diego Neira', cel: '9 6191 5407', fechaSugerida: '30/09/2026', temas: 'Urgencias Oncológicas, Síndrome de Lisis Tumoral, Neutropenia Febril' },
  { id: 5, especialidad: 'Broncopulmonar', tutor: 'Dra. Valeska Glasinovich', cel: '9 8418 4016', fechaSugerida: '07/10/2026', temas: 'Neumonía Grave, TEP, Derrame Pleural, EPOC descompensado' },
  { id: 6, especialidad: 'Hematología', tutor: 'Dra. Andrea Ortiz', cel: '9 7665 3809', fechaSugerida: '14/10/2026', temas: 'Enfrentamiento de Anemias Graves, Síndromes Linfoproliferativos, Púrpura' },
  { id: 7, especialidad: 'Nefrología', tutor: 'Dr. Mauro Correa', cel: '9 9908 8523', fechaSugerida: '21/10/2026', temas: 'Injuria Renal Aguda, Trastornos del Potasio/Sodio, Síndrome Nefrótico' },
  { id: 8, especialidad: 'Infectología', tutor: 'Dr. Francisco Araneda', cel: '9 7614 7930', fechaSugerida: '28/10/2026', temas: 'Sepsis y Shock Séptico, Manejo Racional de Antibióticos, ITU complicada' },
  { id: 9, especialidad: 'Nefrología', tutor: 'Dra. Danissa Haro', cel: '9 7957 0187', fechaSugerida: '04/11/2026', temas: 'Manejo de Hipertensión Secundaria, Urgencias Dialíticas, ERC avanzada' }
];

export default function EcgReunionClinica() {
  const [tabActivo, setTabActivo] = useState<'ecg' | 'reuniones'>('ecg');

  // --- CALCULADORA QTc BAZETT ---
  const [qtMedido, setQtMedido] = useState<string>('');
  const [fcQc, setFcQc] = useState<string>('');

  const calcQtc = () => {
    const qt = parseFloat(qtMedido); // en milisegundos
    const fc = parseFloat(fcQc);
    if (!qt || !fc || fc <= 0) return null;
    const rrSegundos = 60 / fc;
    const qtc = qt / Math.sqrt(rrSegundos);
    return Math.round(qtc);
  };

  const qtcResult = calcQtc();

  // --- ASISTENTE DE REUNIÓN CLÍNICA ---
  const [tutorElegido, setTutorElegido] = useState(TUTORES_REUNIONES[0]);
  const [temaReunion, setTemaReunion] = useState<string>(TUTORES_REUNIONES[0].temas.split(',')[0]);
  const [guionGenerado, setGuionGenerado] = useState<string>('');
  const [cargandoGuion, setCargandoGuion] = useState<boolean>(false);
  const [copiado, setCopiado] = useState<boolean>(false);

  const generarGuionReunion = async () => {
    setCargandoGuion(true);
    const prompt = `
Actúa como médico tutor especialista de Medicina Interna de la Universidad de Magallanes (Hospital Clínico de Magallanes).
El interno debe preparar su REUNIÓN CLÍNICA (Pondera 5% de la nota final) tutorizada por: ${tutorElegido.tutor} (${tutorElegido.especialidad}).
Tema de la exposición: "${temaReunion}".

PAUTA DE EVALUACIÓN OFICIAL UMAG:
- Manejo de contenidos actualizados (50%)
- Calidad de exposición y oratoria médica (20%)
- Preparación oportuna y estructura (20%)
- Calidad de presentación audiovisual (10%)

Genera una GUÍA COMPLETA Y ESTRUCTURA DE DIAPOSITIVAS lista para exponer que incluya:
1. Título formal y objetivos de la reunión.
2. Definición, epidemiología y relevancia en Chile (mencionar guías MINSAL / GES si aplica).
3. Fisiopatología clave y mecanismos etiológicos.
4. Enfrentamiento diagnóstico paso a paso (Clínica, Laboratorio, Imágenes, Scores de severidad).
5. Manejo terapéutico actualizado (Fármacos de primera línea con dosis, metas y manejo hospitalario).
6. 3 "Perlas Clínicas" o errores frecuentes que los docentes suelen preguntar.
7. Bibliografía sugerida (UpToDate, Rev Méd Chile, Harrison).
`;

    try {
      const resp = await consultarGeminiConArchivo(prompt);
      setGuionGenerado(resp);
    } catch (e: any) {
      alert(`Error al generar guion: ${e.message}`);
    } finally {
      setCargandoGuion(false);
    }
  };

  const copiarGuion = () => {
    navigator.clipboard.writeText(guionGenerado);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 text-rose-700 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              ECG & Reuniones Clínicas (HCM)
            </h1>
            <p className="text-xs text-gray-500">
              Entrenador para la prueba de ECG (Semana 2) y Asistente para Reuniones con Tutores.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => setTabActivo('ecg')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              tabActivo === 'ecg' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" /> Entrenador ECG (5%)
          </button>
          <button
            onClick={() => setTabActivo('reuniones')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              tabActivo === 'reuniones' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" /> Reuniones & Tutores (5%)
          </button>
        </div>
      </div>

      {/* --- TAB 1: ELECTROCARDIOGRAMA --- */}
      {tabActivo === 'ecg' && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in">
          
          {/* Calculadora QTc Bazett */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b pb-2">
              <Zap className="w-4 h-4 text-amber-500" /> Calculadora de Intervalo QT Corregido (Fórmula de Bazett)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-500 font-medium mb-1">QT Medido en ECG (milisegundos)</label>
                <input
                  type="number"
                  placeholder="Ej. 420 ms (10.5 cuadraditos)"
                  value={qtMedido}
                  onChange={e => setQtMedido(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Frecuencia Cardíaca (lpm)</label>
                <input
                  type="number"
                  placeholder="Ej. 75 lpm"
                  value={fcQc}
                  onChange={e => setFcQc(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border rounded-xl outline-none focus:ring-2 focus:ring-rose-400"
                />
              </div>
            </div>
            {qtcResult && (
              <div className={`p-3 rounded-xl text-xs border ${
                qtcResult > 460 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <p className="font-bold text-sm">QTc calculado: {qtcResult} ms</p>
                <p className="text-[11px] mt-0.5">
                  {qtcResult > 500
                    ? '⚠️ QTc severamente prolongado (> 500 ms): Alto riesgo de Torsade de Pointes. Suspender fármacos causantes (Quinolonas, Macrólidos, Haloperidol, Antiarrítmicos).'
                    : qtcResult > 450
                    ? 'QTc límite o prolongado (> 450 ms en hombres / > 460 ms en mujeres).'
                    : 'QTc Normal (< 440 ms).'}
                </p>
              </div>
            )}
          </div>

          {/* Guía Sistemática de Lectura en 6 Pasos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 text-rose-700">
                <CheckCircle2 className="w-4 h-4" /> 1. Ritmo, Frecuencia y Eje Eléctrico
              </h3>
              <div className="text-xs text-gray-700 space-y-2 leading-relaxed">
                <p><strong>• Ritmo Sinusal:</strong> Onda P positiva en DII, DIII y aVF; negativa en aVR. Cada onda P precede un complejo QRS con intervalo PR constante (0.12 - 0.20s).</p>
                <p><strong>• Frecuencia Cardíaca:</strong> 300 / nº cuadros grandes entre R-R (300, 150, 100, 75, 60, 50). En FA irregular: Nº QRS en 30 cuadros grandes (6s) × 10.</p>
                <p><strong>• Eje Eléctrico:</strong>
                  <br />- Normal (-30° a +90°): DI (+) y aVF (+).
                  <br />- Desviación Izquierda (-30° a -90°): DI (+) y aVF (-). (Evaluar HVI o HBAPI).
                  <br />- Desviación Derecha (+90° a +180°): DI (-) y aVF (+). (Evaluar HVD o TEP agudo).
                </p>
              </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 text-rose-700">
                <CheckCircle2 className="w-4 h-4" /> 2. Isquemia, Lesión e Infarto por Paredes
              </h3>
              <div className="text-xs text-gray-700 space-y-2 leading-relaxed">
                <p><strong>• Cara Inferior (DII, DIII, aVF):</strong> Arteria Coronaria Derecha (CD). Evaluar compromiso de VD con V3R y V4R.</p>
                <p><strong>• Cara Septal (V1 - V2):</strong> Arteria Descendente Anterior (DA proximal).</p>
                <p><strong>• Cara Anterior (V3 - V4):</strong> Arteria Descendente Anterior (DA).</p>
                <p><strong>• Cara Lateral Baja (V5 - V6) y Alta (DI, aVL):</strong> Arteria Circunfleja (Cx) o Diagonal.</p>
                <p><strong>• Cara Posterior (V7 - V9):</strong> Infradesnivel en V1-V2 con R alta como imagen en espejo.</p>
              </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 text-rose-700">
                <CheckCircle2 className="w-4 h-4" /> 3. Bloqueos AV y de Rama
              </h3>
              <div className="text-xs text-gray-700 space-y-2 leading-relaxed">
                <p><strong>• Bloqueo AV 1°:</strong> PR &gt; 0.20s (5 cuadraditos) constante sin P bloqueadas.</p>
                <p><strong>• Bloqueo AV 2° Mobitz I (Wenckebach):</strong> PR se alarga progresivamente hasta que una P no conduce.</p>
                <p><strong>• Bloqueo AV 2° Mobitz II:</strong> PR constante y súbitamente una P no conduce (Alto riesgo de progresión a BAV completo).</p>
                <p><strong>• Bloqueo AV 3° (Completo):</strong> Disociación auriculoventricular completa. Frecuencia auricular &gt; frecuencia ventricular.</p>
                <p><strong>• BCRD vs BCRI:</strong> QRS &gt; 0.12s. BCRD (rsR' en V1). BCRI (R ancha mellada en DI, aVL, V6 y QS en V1).</p>
              </div>
            </div>

            <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 text-rose-700">
                <CheckCircle2 className="w-4 h-4" /> 4. Arritmias Cardíacas Clásicas
              </h3>
              <div className="text-xs text-gray-700 space-y-2 leading-relaxed">
                <p><strong>• Fibrilación Auricular (FA):</strong> R-R completamente irregular, ausencia de ondas P, línea de base con ondas f irregulares.</p>
                <p><strong>• Flutter Auricular:</strong> Ondas F en "diente de sierra" clásicas a 300 lpm en DII, DIII, aVF con conducción AV 2:1 o 4:1.</p>
                <p><strong>• TPSV:</strong> Taquicardia regular de QRS estrecho a 150-220 lpm, ondas P no visibles o retrógradas.</p>
                <p><strong>• Síndrome Wolff-Parkinson-White (WPW):</strong> PR corto (&lt; 0.12s) + Onda Delta al inicio del QRS + QRS ensanchado.</p>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* --- TAB 2: REUNIONES CLÍNICAS & TUTORES --- */}
      {tabActivo === 'reuniones' && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in">
          
          {/* Directorio de Tutores HCM */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b pb-2">
              <Users className="w-4 h-4 text-blue-600" /> Directorio de Tutores de Reunión Clínica (HCM)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TUTORES_REUNIONES.map(t => (
                <div
                  key={t.id}
                  onClick={() => { setTutorElegido(t); setTemaReunion(t.temas.split(',')[0].trim()); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    tutorElegido.id === t.id
                      ? 'bg-blue-50 border-blue-400 shadow-sm ring-2 ring-blue-300'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-md uppercase">
                      {t.especialidad}
                    </span>
                    <span className="text-[10px] text-gray-400 font-mono">{t.fechaSugerida}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 text-xs mt-1.5">{t.tutor}</h4>
                  <p className="text-[11px] text-blue-700 flex items-center gap-1 mt-1 font-semibold">
                    <Phone className="w-3 h-3" /> {t.cel}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1 line-clamp-1">{t.temas}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Generador de Guion para la Exposición */}
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-3">
              <div>
                <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Preparador IA de Diapositivas y Guion de Exposición
                </h3>
                <p className="text-xs text-gray-500">
                  Tutor: <strong>{tutorElegido.tutor}</strong> ({tutorElegido.especialidad})
                </p>
              </div>
              <button
                onClick={generarGuionReunion}
                disabled={cargandoGuion || !temaReunion.trim()}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 shadow-md transition-all disabled:opacity-50"
              >
                {cargandoGuion ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Generar Estructura y Diapositivas ✨
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Tema Específico a Exponer</label>
              <input
                type="text"
                value={temaReunion}
                onChange={e => setTemaReunion(e.target.value)}
                placeholder="Ej. Síndrome Coronario Agudo: Manejo en Urgencias y Estratificación"
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800"
              />
            </div>

            {guionGenerado && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex justify-between items-center bg-gray-100 p-2.5 rounded-xl">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Guion y Esquema de Diapositivas Generado
                  </span>
                  <button
                    onClick={copiarGuion}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      copiado ? 'bg-green-600 text-white' : 'bg-white border text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {copiado ? <><CheckCircle2 className="w-3.5 h-3.5" /> ¡Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar Guion</>}
                  </button>
                </div>
                <div className="p-4 bg-slate-50 border border-gray-200 rounded-xl text-xs md:text-sm leading-relaxed text-gray-800 whitespace-pre-wrap max-h-[500px] overflow-y-auto font-sans">
                  {guionGenerado}
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
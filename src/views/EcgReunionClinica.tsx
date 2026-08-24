import { useState } from 'react';
import { consultarGeminiConArchivo } from '../Services/gemini';
import { 
  Activity, Phone, Users, Sparkles, Loader2, Copy, CheckCircle2, Zap, 
  FileText, Search, HeartPulse, AlertTriangle, 
  Flame, BatteryCharging, Shield, ListChecks, Stethoscope
} from 'lucide-react';
import { MarkdownClinico } from '../components/MarkdownClinico';

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

  // --- BUSCADOR Y FILTROS ECG ---
  const [filtroEcg, setFiltroEcg] = useState<string>('todos');
  const [busquedaEcg, setBusquedaEcg] = useState<string>('');

  // --- CALCULADORA QTc BAZETT ---
  const [qtMedido, setQtMedido] = useState<string>('');
  const [fcQc, setFcQc] = useState<string>('');

  const calcQtc = () => {
    const qt = parseFloat(qtMedido);
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

  const tarjetasEcg = [
    {
      id: 'fundamentos',
      categoria: 'fundamentos',
      titulo: '1. Toma, Derivaciones, Papel y Eje Cardíaco',
      icono: <Activity className="w-4 h-4 text-emerald-600" />,
      contenido: (
        <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-200">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/40 p-2.5 rounded-xl border border-emerald-200 dark:border-emerald-800 space-y-1">
            <p className="font-bold text-emerald-900 dark:text-emerald-300">🚦 Nemotecnia de Electrodos ("Rana Verde" / Chile):</p>
            <p className="mt-0.5">
              • <strong>Rojo (RA):</strong> Brazo Derecho.<br/>
              • <strong>Amarillo (LA):</strong> Brazo Izquierdo.<br/>
              • <strong>Negro (RL):</strong> Pierna Derecha (Tierra / Neutro).<br/>
              • <strong>Verde (LL):</strong> Pierna Izquierda.
            </p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1">
            <p className="font-bold text-gray-900 dark:text-white">📍 Derivaciones Precordiales (V1-V6):</p>
            <p>• <strong>V1:</strong> 4° EIC paraesternal derecho | <strong>V2:</strong> 4° EIC paraesternal izquierdo.</p>
            <p>• <strong>V3:</strong> Entre V2 y V4 | <strong>V4:</strong> 5° EIC línea medioclavicular izquierda.</p>
            <p>• <strong>V5:</strong> 5° EIC línea axilar anterior | <strong>V6:</strong> 5° EIC línea axilar media.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
              <p><strong>• Papel Milimetrado (25 mm/s):</strong></p>
              <p>- 1 cuadrito (1 mm) = <strong>0.04 s</strong> (40 ms) y <strong>0.1 mV</strong>.</p>
              <p>- 1 cuadro grande (5 mm) = <strong>0.20 s</strong> (200 ms) y <strong>0.5 mV</strong>.</p>
              <p>- 5 cuadros grandes = <strong>1.0 segundo</strong>.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
              <p><strong>• Eje Eléctrico Frontal:</strong> Normal (-30° a +90°).</p>
              <p>- <strong>DI (+) y DII (+)</strong> → Eje Normal.</p>
              <p>- <strong>DI (+) y DII (-)</strong> → Desviado a Izquierda (-30° a -90°).</p>
              <p>- <strong>DI (-) y DII (+)</strong> → Desviado a Derecha (+90° a +180°).</p>
            </div>
          </div>
          <p><strong>• Cálculo de FC Regular:</strong> FC = 300 / N° cuadros grandes entre R y R (o 1500 / n° cuadritos).</p>
        </div>
      )
    },
    {
      id: 'sistematica',
      categoria: 'sistematica',
      titulo: '2. Sistemática de Lectura de ECG en 7 Pasos (@MuyMedico)',
      icono: <ListChecks className="w-4 h-4 text-purple-600" />,
      contenido: (
        <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-200">
          <div className="bg-purple-50/70 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1">
            <p className="font-bold text-purple-900 dark:text-purple-300">📋 Algoritmo Ordenado de Interpretación:</p>
            <p><strong>1. Ritmo & Frecuencia:</strong> ¿Ritmo Sinusal? (FC 60-100 lpm, P positiva en I, II, aVF y negativa en aVR, P precede a cada QRS).</p>
            <p><strong>2. Intervalo PR:</strong> Medir en DII (Normal 0.12 - 0.20 s / 3 a 5 cuadritos). Corto &lt; 0.12s (WPW/marcapasos ectópico) o Largo &gt; 0.20s (BAV).</p>
            <p><strong>3. Complejo QRS:</strong> Duración normal &lt; 0.12 s (&lt; 3 cuadritos). Transición normal de negativo en V1 a positivo en V6.</p>
            <p><strong>4. Eje Eléctrico:</strong> Verificar cuadrante de DI y aVF (o buscar derivación isodifásica).</p>
            <p><strong>5. Segmento ST:</strong> Descartar Supradesnivel o Infradesnivel &gt; 1 mm respecto a la línea isoeléctrica (Punto J).</p>
            <p><strong>6. Onda T:</strong> Positiva en todas excepto aVR y V1. Descartar T picudas (Hiperkalemia) o invertidas simétricas (Isquemia).</p>
            <p><strong>7. Intervalo QTc:</strong> Bazett normal &lt; 0.44 s (&lt; 440 ms). Descartar hipertrofias y ondas Q de necrosis.</p>
          </div>
        </div>
      )
    },
    {
      id: 'hipertrofias',
      categoria: 'hipertrofias',
      titulo: '3. Hipertrofias Auriculares y Ventriculares',
      icono: <HeartPulse className="w-4 h-4 text-rose-600" />,
      contenido: (
        <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-rose-50/70 dark:bg-rose-950/40 p-2.5 rounded-xl border border-rose-200 dark:border-rose-800">
              <span className="font-bold text-rose-900 dark:text-rose-300">🫀 HTAI / P Mitrale ("Pancha de Izquierda")</span>
              <p className="mt-1">
                Onda P ancha <strong>&gt; 2.5 cuadritos (0.12 s)</strong> o bimodal con muesca en <strong>DII / DIII</strong> y componente negativo en V1. Típica de Estenosis Mitral e HTA.
              </p>
            </div>
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="font-bold text-amber-900 dark:text-amber-300">🫀 HTAD / P Pulmonale ("Paltona de Derecha")</span>
              <p className="mt-1">
                Onda P picuda y alta <strong>&gt; 2.5 mm (0.25 mV)</strong> en <strong>DII, DIII, aVF</strong> o asimétrica en V1. Típica de Cor Pulmonale / HTP.
              </p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1">
            <p><strong>• HTVI (Ventrículo Izquierdo):</strong></p>
            <p>- <strong>Índice de Sokolow-Lyon &gt; 35 mm:</strong> S(V1 o V2) + R(V5 o V6) ≥ 35 mm.</p>
            <p>- Onda R en <strong>aVL &gt; 11 mm</strong> o cualquiera de las ondas R &gt; 25 mm.</p>
            <p>- Eje desviado a la izquierda con sobrecarga sistólica (T invertida asimétrica en V5-V6).</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1">
            <p><strong>• HTVD (Ventrículo Derecho):</strong></p>
            <p>- <strong>Índice de Lewis &gt; 17 mm:</strong> S(V5 o V6) + R(V1 o V2). R &gt; S en V1 y eje a la derecha (&gt; +90°).</p>
          </div>
          <p className="text-[11px] text-gray-600 dark:text-slate-400 italic">
            <strong>Sobrecarga vs Hipertrofia:</strong> En crisis hipertensiva hay sobrecarga del VI con imagen similar a HTVI. Confirmar siempre con <strong>Ecocardiografía</strong>.
          </p>
        </div>
      )
    },
    {
      id: 'isquemia',
      categoria: 'isquemia',
      titulo: '4. Isquemia, Lesión, Infarto y Topografía Coronaria',
      icono: <Flame className="w-4 h-4 text-red-600" />,
      contenido: (
        <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-200">
          <div className="bg-red-50/70 dark:bg-red-950/40 p-2.5 rounded-xl border border-red-200 dark:border-red-800 space-y-1">
            <p className="font-bold text-red-900 dark:text-red-300">🔥 Progresión de Isquemia, Lesión y Necrosis:</p>
            <p><strong>• Isquemia:</strong> Ondas T invertidas, simétricas y profundas (subepicárdica) o T altas picudas (subendocárdica).</p>
            <p><strong>• Lesión Transmural (SCACEST / IAMCEST):</strong> Supradesnivel del ST convexo hacia arriba → <strong>¡Candidato a reperfusión urgente (Angioplastía o Trombolisis)!</strong></p>
            <p><strong>• Lesión Subendocárdica (SCASEST / IAMSEST):</strong> Infradesnivel del ST horizontal o descendente → <strong>¡NO se tromboliza!</strong> Manejo con antiagregación y coronariografía.</p>
            <p><strong>• Necrosis Miocárdica:</strong> Onda Q patológica (&gt; 25% del QRS o &gt; 0.04s) o complejo QS.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700">
            <p className="font-bold text-gray-900 dark:text-white mb-1">📍 Localización Anatómica según Derivaciones:</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
              <li>• <strong>Septal:</strong> V1 y V2 (Descendente Anterior proximal).</li>
              <li>• <strong>Anterior:</strong> V3 y V4 (Arteria Descendente Anterior).</li>
              <li>• <strong>Lateral Bajo / Apical:</strong> V5 y V6 (Circunfleja o DA).</li>
              <li>• <strong>Lateral Alto:</strong> DI y aVL (Arteria Circunfleja).</li>
              <li>• <strong>Inferior:</strong> DII, DIII y aVF (Coronaria Derecha en 90%).</li>
              <li>• <strong>Posterior:</strong> V7, V8 (R alta e infra ST especular en V1-V2).</li>
              <li>• <strong>Ventrículo Derecho:</strong> <strong>V3R y V4R</strong> (¡Siempre solicitar en infarto inferior!).</li>
            </ul>
          </div>
        </div>
      )
    },
    {
      id: 'taquiarritmias',
      categoria: 'taquiarritmias',
      titulo: '5. Algoritmo de Taquicardias y Síndrome WPW',
      icono: <Zap className="w-4 h-4 text-amber-500" />,
      contenido: (
        <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
              <span className="font-bold text-amber-900 dark:text-amber-300">⚡ QRS Estrecho (&lt; 0.12 s)</span>
              <p className="mt-1 text-[11px]">
                • <strong>Regular:</strong> Taquicardia Sinusal, Taquicardia Auricular Focal, <strong>Flutter Auricular</strong> (ondas F a 300 lpm con bloqueo 2:1 a 150 lpm), <strong>TPSV</strong> por reentrada nodal.<br/>
                • <strong>Irregular:</strong> <strong>Fibrilación Auricular (FA)</strong> (sin P, ondas f basales 500-600 lpm, RR irregular), <strong>TAMF</strong> en EPOC (P polimorfas ≥ 3).
              </p>
            </div>
            <div className="bg-red-50/70 dark:bg-red-950/40 p-2 rounded-xl border border-red-200 dark:border-red-800">
              <span className="font-bold text-red-900 dark:text-red-300">🚨 QRS Ancho (≥ 0.12 s)</span>
              <p className="mt-1 text-[11px]">
                • <strong>Regular:</strong> <strong>Taquicardia Ventricular Monomorfa (TV)</strong> ("Toda taquicardia de QRS ancho es TV hasta demostrar lo contrario"), WPW preexcitado.<br/>
                • <strong>Irregular:</strong> <strong>Torsades de Pointes</strong> (TV helicoidal en QT largo), <strong>Fibrilación Ventricular (FV)</strong> (paro cardíaco → ¡Desfibrilación!).
              </p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1">
            <p className="font-bold text-gray-900 dark:text-white">⚡ Síndrome de Wolff-Parkinson-White (Sd. WPW):</p>
            <p>Vía accesoria auriculoventricular (Haz de Kent). Triada clásica en ECG:</p>
            <p><strong>1. PR corto (&lt; 0.12 s)</strong> + <strong>2. Onda Delta</strong> (empastamiento inicial) + <strong>3. QRS ensanchado</strong>.</p>
          </div>
        </div>
      )
    },
    {
      id: 'bloqueos',
      categoria: 'bloqueos',
      titulo: '6. Bradiarritmias, Bloqueos AV y Bloqueos de Rama',
      icono: <AlertTriangle className="w-4 h-4 text-indigo-600" />,
      contenido: (
        <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-200">
          <div className="bg-indigo-50/70 dark:bg-indigo-950/40 p-2.5 rounded-xl border border-indigo-200 dark:border-indigo-800 space-y-1">
            <p className="font-bold text-indigo-900 dark:text-indigo-300">📉 Bloqueos Aurículo-Ventriculares (BAV):</p>
            <p><strong>• BAV 1° Grado:</strong> PR prolongado constante (&gt; 0.20 s / &gt; 5 cuadritos). Todas las P conducen.</p>
            <p><strong>• BAV 2° Mobitz I (Wenckebach):</strong> PR se alarga progresivamente hasta que una P no conduce.</p>
            <p><strong>• BAV 2° Mobitz II:</strong> PR constante y súbitamente una P no conduce → <strong>¡Requiere Marcapasos por alto riesgo de BAVC!</strong></p>
            <p><strong>• BAV 3° Grado (Completo):</strong> Disociación AV total, aurículas y ventrículos laten independientes (FC ventricular ≈ 30 lpm) → <strong>¡Marcapasos Urgente!</strong></p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
              <p><strong>• BCRD:</strong> QRS ≥ 0.12 s, patrón <strong>rSR' ("orejas de conejo")</strong> en V1-V2 y S empastada en V5-V6.</p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700">
              <p><strong>• BCRI:</strong> QRS ≥ 0.12 s, ondas QS profundas en V1-V2 y R ancha en V5-V6. <strong>Inutiliza el ECG</strong> para diagnóstico de isquemia.</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700 space-y-1 text-[11px]">
            <p><strong>• Bloqueo Trifascicular:</strong> 1. BAV 1° + 2. BCRD + 3. HBIA o HBIP → <strong>Indicación de Marcapasos</strong>.</p>
            <p><strong>• Paro Sinusal:</strong> Pausa &gt; 2 segundos sin actividad auricular por fallo transitorio del nodo sinusal.</p>
          </div>
        </div>
      )
    },
    {
      id: 'valvulopatias',
      categoria: 'valvulopatias',
      titulo: '7. Valvulopatías en el Electrocardiograma (@MuyMedico)',
      icono: <Stethoscope className="w-4 h-4 text-blue-600" />,
      contenido: (
        <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-blue-50/70 dark:bg-blue-950/40 p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 space-y-1">
              <span className="font-bold text-blue-900 dark:text-blue-300">Valvulopatías Aórticas</span>
              <p>• <strong>Estenosis Aórtica:</strong> Signos de HTVI concéntrica (R alto voltaje en V5-V6, I, aVL con sobrecarga).</p>
              <p>• <strong>Insuficiencia Aórtica:</strong> Sobrecarga diastólica de volumen del VI (ondas Q profundas y R altas en V5-V6).</p>
            </div>
            <div className="bg-purple-50/70 dark:bg-purple-950/40 p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 space-y-1">
              <span className="font-bold text-purple-900 dark:text-purple-300">Valvulopatías Mitrales</span>
              <p>• <strong>Estenosis Mitral:</strong> Onda P Mitrale en V1 y DII (&gt; 3 cuadritos) + HTVD y HAD por hipertensión pulmonar.</p>
              <p>• <strong>Insuficiencia Mitral:</strong> Dilatación del VI, P mitrale y Fibrilación Auricular frecuente.</p>
              <p>• <strong>Prolapso Mitral (PVM):</strong> Extrasístoles, WPW o QT largo, T aplanadas/negativas en cara inferior.</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-[11px] space-y-0.5">
            <p><strong>• Valvulopatías Derechas (Pulmonar y Tricúspide):</strong> Onda P Pulmonale, desviación de eje a la derecha, patrón de BCRD y signos de sobrecarga de VD.</p>
          </div>
        </div>
      )
    },
    {
      id: 'pericardio',
      categoria: 'pericardio',
      titulo: '8. Pericardiopatías y Miocardiopatías (@MuyMedico)',
      icono: <Shield className="w-4 h-4 text-cyan-600" />,
      contenido: (
        <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-200">
          <div className="bg-cyan-50/70 dark:bg-cyan-950/40 p-2.5 rounded-xl border border-cyan-200 dark:border-cyan-800 space-y-1">
            <p className="font-bold text-cyan-900 dark:text-cyan-300">🛡️ Pericardiopatías Claves:</p>
            <p><strong>• Pericarditis Aguda:</strong> Supradesnivel ST <strong>cóncavo hacia arriba ("en sonrisa/guirnalda") difuso</strong> en todas las derivaciones (excepto aVR) + <strong>Infradesnivel del segmento PR</strong>.</p>
            <p><strong>• Derrame Pericárdico / Taponamiento:</strong> <strong>Microvoltaje generalizado</strong> (QRS &lt; 5 mm en plano frontal) + <strong>Alternancia Eléctrica</strong> (variación latido a latido de la amplitud del QRS por bamboleo del corazón).</p>
            <p><strong>• Pericarditis Constrictiva:</strong> Bajo voltaje, ondas T invertidas difusas y Fibrilación Auricular.</p>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1">
            <p className="font-bold text-gray-900 dark:text-white">🫀 Miocardiopatías:</p>
            <p>• <strong>Miocardiopatía Dilatada:</strong> Crecimiento del VI, eje a la izquierda, taquicardia sinusal y BCRI.</p>
            <p>• <strong>Miocardiopatía Hipertrófica:</strong> R gigantes en precordiales + <strong>Ondas Q patológicas "en daga"</strong> (estrechas y profundas en derivaciones laterales V5-V6, I, aVL).</p>
            <p>• <strong>Miocardiopatía Restrictiva:</strong> Bajo voltaje generalizado con espesor miocárdico normal/aumentado en eco.</p>
          </div>
        </div>
      )
    },
    {
      id: 'electrolitos',
      categoria: 'electrolitos',
      titulo: '9. Electrolitos, Intoxicación por Fármacos, Brugada y TEP',
      icono: <BatteryCharging className="w-4 h-4 text-teal-600" />,
      contenido: (
        <div className="space-y-2.5 text-xs text-gray-700 dark:text-slate-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div className="bg-teal-50/70 dark:bg-teal-950/40 p-2.5 rounded-xl border border-teal-200 dark:border-teal-800 space-y-1">
              <span className="font-bold text-teal-900 dark:text-teal-300">🧪 Trastornos del Potasio (K⁺)</span>
              <p>• <strong>Hiperpotasemia (K⁺ &gt; 5.5):</strong> <strong>Ondas T altas, simétricas y picudas en tienda de campaña</strong> → ensanchamiento de QRS → onda sinusoidal → Paro.</p>
              <p>• <strong>Hipopotasemia (K⁺ &lt; 3.5):</strong> Ondas T aplanadas + <strong>Onda U prominente</strong> + prolongación de QT/QU → arritmias ventriculares.</p>
            </div>
            <div className="bg-amber-50/70 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 space-y-1">
              <span className="font-bold text-amber-900 dark:text-amber-300">💊 Calcio & Fármacos</span>
              <p>• <strong>Hipocalcemia:</strong> Alargamiento del ST y QT prolongado (Torsades de Pointes). Hipercalcemia = QT corto.</p>
              <p>• <strong>Digoxina:</strong> <strong>Cubeta digitálica</strong> (infradesnivel cóncavo del ST en cuchara). Intoxicación: extrasístoles ventriculares y bigeminismo.</p>
            </div>
          </div>
          <div className="bg-slate-50 dark:bg-slate-800 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700 space-y-1">
            <p><strong>• Hipotermia:</strong> Bradicardia sinusal, prolongación de PR/QT y <strong>Onda J de Osborn</strong> (deflexión positiva en la unión QRS-ST).</p>
            <p><strong>• Síndrome de Brugada:</strong> Patrón de BCRD + Supradesnivel ST en aleta de tiburón en V1-V2 (alto riesgo de muerte súbita por FV).</p>
            <p><strong>• TEP (Tromboembolismo Pulmonar):</strong> Patrón <strong>S1Q3T3</strong> (S en DI, Q en DIII, T invertida en DIII) + Taquicardia Sinusal.</p>
          </div>
        </div>
      )
    }
  ];

  const tarjetasFiltradas = tarjetasEcg.filter(t => {
    const cumpleCategoria = filtroEcg === 'todos' || t.categoria === filtroEcg;
    const cumpleBusqueda = busquedaEcg.trim() === '' || 
      t.titulo.toLowerCase().includes(busquedaEcg.toLowerCase()) || 
      t.id.toLowerCase().includes(busquedaEcg.toLowerCase());
    return cumpleCategoria && cumpleBusqueda;
  });

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6 bg-gray-50 dark:bg-slate-900 min-h-screen">
      
      <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-400 rounded-xl">
            <Activity className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white leading-tight flex items-center gap-2">
              ECG & Reuniones Clínicas (HCM)
            </h1>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Guía de ECG del Dr. Guillermo Guevara + Minimanual Ilustrado (@MuyMedico) y Asistente para Reuniones con Tutores.
            </p>
          </div>
        </div>

        <div className="flex bg-gray-100 dark:bg-slate-700 p-1 rounded-xl gap-1 shrink-0">
          <button
            onClick={() => setTabActivo('ecg')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              tabActivo === 'ecg' ? 'bg-white dark:bg-slate-800 text-rose-700 dark:text-rose-400 shadow-sm' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" /> Entrenador ECG (5%)
          </button>
          <button
            onClick={() => setTabActivo('reuniones')}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              tabActivo === 'reuniones' ? 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-400 shadow-sm' : 'text-gray-600 dark:text-slate-300 hover:text-gray-900'
            }`}
          >
            <Users className="w-4 h-4" /> Reuniones & Tutores (5%)
          </button>
        </div>
      </div>

      {tabActivo === 'ecg' && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in">
          
          <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-700 pb-2">
              <Zap className="w-4 h-4 text-amber-500" /> Calculadora de Intervalo QT Corregido (Fórmula de Bazett)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-gray-500 dark:text-slate-400 font-medium mb-1">QT Medido en ECG (milisegundos)</label>
                <input
                  type="number"
                  placeholder="Ej. 420 ms (10.5 cuadraditos)"
                  value={qtMedido}
                  onChange={e => setQtMedido(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-gray-500 dark:text-slate-400 font-medium mb-1">Frecuencia Cardíaca (lpm)</label>
                <input
                  type="number"
                  placeholder="Ej. 75 lpm"
                  value={fcQc}
                  onChange={e => setFcQc(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            {qtcResult && (
              <div className={`p-3 rounded-xl text-xs border ${
                qtcResult > 460 ? 'bg-red-50 dark:bg-red-950/50 border-red-200 dark:border-red-800 text-red-900 dark:text-red-300' : 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300'
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

          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar en la guía ECG (ej. Sokolow, Brugada, Wenckebach, Torsade, Digoxina, Pericarditis)..."
                  value={busquedaEcg}
                  onChange={e => setBusquedaEcg(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'fundamentos', label: '📐 Toma & Derivaciones' },
                { id: 'sistematica', label: '📋 Lectura 7 Pasos' },
                { id: 'hipertrofias', label: '🫀 Hipertrofias' },
                { id: 'isquemia', label: '🔥 Isquemia & Infarto' },
                { id: 'taquiarritmias', label: '⚡ Taquicardias' },
                { id: 'bloqueos', label: '📉 Bloqueos' },
                { id: 'valvulopatias', label: '🩺 Valvulopatías' },
                { id: 'pericardio', label: '🛡️ Pericardio & Miocardio' },
                { id: 'electrolitos', label: '🧪 Electrolitos & Fármacos' }
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setFiltroEcg(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 ${
                    filtroEcg === cat.id
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 border border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Buscador rápido */}
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={busquedaEcg}
                onChange={e => setBusquedaEcg(e.target.value)}
                placeholder="Buscar (ej. Sokolow, Pancha, Brugada)..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-rose-400 text-gray-900 dark:text-white"
              />
            </div>

          </div>

          {/* Tarjetas del Resumen Clínico */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tarjetasFiltradas.map(t => (
              <div key={t.id} className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-2 border-b border-gray-100 dark:border-slate-700 pb-2">
                  {t.icono}
                  <span>{t.titulo}</span>
                </h3>
                {t.contenido}
              </div>
            ))}
          </div>

        </div>
      )}

      {/* --- TAB 2: REUNIONES CLÍNICAS & TUTORES --- */}
      {tabActivo === 'reuniones' && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in">
          
          {/* Directorio de Tutores HCM */}
          <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 dark:text-white text-sm flex items-center gap-1.5 border-b border-gray-100 dark:border-slate-700 pb-2">
              <Users className="w-4 h-4 text-blue-600" /> Directorio de Tutores de Reunión Clínica (HCM)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {TUTORES_REUNIONES.map(t => (
                <div
                  key={t.id}
                  onClick={() => { setTutorElegido(t); setTemaReunion(t.temas.split(',')[0].trim()); }}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    tutorElegido.id === t.id
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 shadow-sm ring-2 ring-blue-300 dark:ring-blue-800'
                      : 'bg-gray-50 dark:bg-slate-900 border-gray-200 dark:border-slate-700 hover:bg-gray-100 dark:hover:bg-slate-750'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 font-bold px-2 py-0.5 rounded-md uppercase">
                      {t.especialidad}
                    </span>
                    <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">{t.fechaSugerida}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 dark:text-white text-xs mt-1.5">{t.tutor}</h4>
                  <p className="text-[11px] text-blue-700 dark:text-blue-400 flex items-center gap-1 mt-1 font-semibold">
                    <Phone className="w-3 h-3" /> {t.cel}
                  </p>
                  <p className="text-[10px] text-gray-500 dark:text-slate-400 mt-1 line-clamp-1">{t.temas}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Generador de Guion para la Exposición */}
          <div className="bg-white dark:bg-slate-800 p-4 md:p-5 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 dark:border-slate-700 pb-3">
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white text-sm flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-purple-600" /> Preparador IA de Diapositivas y Guion de Exposición
                </h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">
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
              <label className="block text-xs font-bold text-gray-600 dark:text-slate-300 uppercase mb-1">Tema Específico a Exponer</label>
              <input
                type="text"
                value={temaReunion}
                onChange={e => setTemaReunion(e.target.value)}
                placeholder="Ej. Síndrome Coronario Agudo: Manejo en Urgencias y Estratificación"
                className="w-full p-2.5 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 dark:text-white"
              />
            </div>

            {guionGenerado && (
              <div className="space-y-3 animate-in fade-in">
                <div className="flex justify-between items-center bg-gray-100 dark:bg-slate-700 p-2.5 rounded-xl">
                  <span className="text-xs font-bold text-gray-700 dark:text-slate-200 flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" /> Guion y Esquema de Diapositivas Generado
                  </span>
                  <button
                    onClick={copiarGuion}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 transition-all ${
                      copiado ? 'bg-green-600 text-white' : 'bg-white dark:bg-slate-800 border dark:border-slate-600 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-750'
                    }`}
                  >
                    {copiado ? <><CheckCircle2 className="w-3.5 h-3.5" /> ¡Copiado!</> : <><Copy className="w-3.5 h-3.5" /> Copiar Guion</>}
                  </button>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border border-gray-200 dark:border-slate-700 rounded-xl text-xs md:text-sm leading-relaxed text-gray-800 dark:text-slate-100 max-h-[500px] overflow-y-auto font-sans">
                  <MarkdownClinico contenido={guionGenerado} />
                </div>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
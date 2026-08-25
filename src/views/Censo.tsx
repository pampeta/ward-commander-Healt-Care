import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit3, Save, CheckCircle2, Circle, FileText, Calendar, AlertTriangle, ChevronDown, ChevronUp, X, ShieldAlert, Activity, Syringe, Bandage, Stethoscope, Cloud, Camera, Sparkles, Loader2, FileUp, Key } from "lucide-react";
import { guardarEnNube, cargarDeNube } from "../Services/cloudSync";
import { extraerPacienteDesdeDocumentoConGemini, extraerEvolucionConGemini, obtenerApiKeyGuardada } from "../Services/gemini";

interface Pendiente { id: string; texto: string; completado: boolean; }
interface Evolucion { id: string; fecha: string; texto: string; tipo?: "normal" | "ic"; especialidad?: string; medico?: string; }
interface DispositivoInvasivo { id: string; nombre: string; fechaInstalacion: string; }
interface Curacion { activo: boolean; ultimaFecha: string; frecuenciaDias: number; tipo: string; }
export interface ItemAntibiotico { id: string; nombre: string; dias: string; }

export function obtenerAntibioticos(p?: Partial<PacienteCenso> | null): ItemAntibiotico[] {
  if (!p) return [];
  if (Array.isArray(p.antibioticos) && p.antibioticos.length > 0) {
    return p.antibioticos;
  }
  if (p.atbNombre && p.atbNombre.trim()) {
    return [{
      id: 'legacy-1',
      nombre: p.atbNombre.trim(),
      dias: p.atbDias?.trim() || ''
    }];
  }
  return [];
}

interface PacienteCenso {
  id: string; cama: string; nombre: string; edad: string; diagnostico: string;
  anamnesis: string; fechaIngreso: string; atbNombre?: string; atbDias?: string;
  antibioticos?: ItemAntibiotico[];
  incobertura: string; invasivos: DispositivoInvasivo[]; curacion: Curacion;
  pendientes: Pendiente[]; evoluciones: Evolucion[]; ultimaEvolucionFecha?: string;
}
interface PatologiaGes { numero: number; nombre: string; keywords: string[]; }

const LISTA_GES: PatologiaGes[] = [
  { numero: 1, nombre: "Insuficiencia renal crónica terminal", keywords: ["insuficiencia renal cronica terminal", "irc terminal", "dialisis"] },
  { numero: 2, nombre: "Cardiopatías congénitas operables", keywords: ["cardiopatia congenita operable"] },
  { numero: 3, nombre: "Cáncer cervicouterino", keywords: ["cancer cervicouterino", "cacu"] },
  { numero: 4, nombre: "Alivio del dolor y cuidados paliativos por cáncer avanzado", keywords: ["cuidados paliativos", "alivio del dolor cancer"] },
  { numero: 5, nombre: "Infarto al corazón", keywords: ["iam", "infarto", "infarto agudo de miocardio", "iamst", "iamsec"] },
  { numero: 6, nombre: "Diabetes Mellitus tipo 1", keywords: ["dm1", "diabetes mellitus tipo 1", "diabetes tipo 1"] },
  { numero: 7, nombre: "Diabetes mellitus tipo 2", keywords: ["dm2", "diabetes mellitus tipo 2", "diabetes tipo 2", "diabetico"] },
  { numero: 8, nombre: "Cáncer de mama", keywords: ["cancer de mama", "neoplasia de mama"] },
  { numero: 9, nombre: "Disrafias espinales", keywords: ["disrafia espinal", "mielomeningocele"] },
  { numero: 10, nombre: "Tratamiento quirúrgico de escoliosis en menores de 25 años", keywords: ["escoliosis quirurgica"] },
  { numero: 11, nombre: "Tratamiento quirúrgico de cataratas", keywords: ["cataratas", "catarata senil"] },
  { numero: 12, nombre: "Endoprótesis total de cadera en artrosis severa", keywords: ["artrosis de cadera severa", "endoprotesis cadera"] },
  { numero: 13, nombre: "Fisura labiopalatina", keywords: ["fisura labiopalatina", "labio leporino"] },
  { numero: 14, nombre: "Cáncer en menores de 15 años", keywords: ["cancer infantil", "cancer pediatrico"] },
  { numero: 15, nombre: "Esquizofrenia", keywords: ["esquizofrenia", "trastorno esquizofrenico"] },
  { numero: 16, nombre: "Cáncer de testículo", keywords: ["cancer de testiculo"] },
  { numero: 17, nombre: "Linfomas", keywords: ["linfoma", "linfoma de hodgkin", "linfoma no hodgkin"] },
  { numero: 18, nombre: "Síndrome de Inmunodeficiencia Adquirida (VIH/SIDA)", keywords: ["vih", "sida", "vih/sida"] },
  { numero: 19, nombre: "Infección respiratoria aguda (IRA) en menores de 5 años", keywords: ["ira baja"] },
  { numero: 20, nombre: "Neumonía en mayores de 65 años", keywords: ["neumonia adquirida en la comunidad", "nac ambulatoria"] },
  { numero: 21, nombre: "Hipertensión arterial primaria o esencial", keywords: ["hta", "hipertension", "hipertenso"] },
  { numero: 22, nombre: "Epilepsia no refractaria en menores de 15 años", keywords: ["epilepsia infantil"] },
  { numero: 23, nombre: "Salud oral integral niños de 6 años", keywords: ["salud oral 6 anos"] },
  { numero: 24, nombre: "Prevención del parto prematuro", keywords: ["parto prematuro", "amenaza de parto prematuro"] },
  { numero: 25, nombre: "Trastornos de conducción cardíaca que requieren marcapaso", keywords: ["marcapaso"] },
  { numero: 26, nombre: "Colecistectomía preventiva cáncer de vesícula", keywords: ["colecistectomia preventiva", "vesicula biliar"] },
  { numero: 27, nombre: "Cáncer gástrico", keywords: ["cancer gastrico", "adenocarcinoma gastrico"] },
  { numero: 28, nombre: "Cáncer de próstata", keywords: ["cancer de prostata"] },
  { numero: 29, nombre: "Vicios de refracción en mayores de 65 años", keywords: ["vicios de refraccion", "presbicia"] },
  { numero: 30, nombre: "Estrabismo en menores de 9 años", keywords: ["estrabismo infantil"] },
  { numero: 31, nombre: "Retinopatía diabética", keywords: ["retinopatia diabetica"] },
  { numero: 32, nombre: "Desprendimiento de retina regmatógeno", keywords: ["desprendimiento de retina"] },
  { numero: 33, nombre: "Hemofilia", keywords: ["hemofilia"] },
  { numero: 34, nombre: "Depresión", keywords: ["depresion", "trastorno depresivo"] },
  { numero: 35, nombre: "Hiperplasia benigna de próstata sintomática", keywords: ["hiperplasia prostatica benigna", "hpb"] },
  { numero: 36, nombre: "Ayudas técnicas adulto mayor", keywords: ["ayudas tecnicas", "silla de ruedas"] },
  { numero: 37, nombre: "Ataque Cerebrovascular Isquémico", keywords: ["acv", "accv", "infarto cerebral", "avc isquemico"] },
  { numero: 38, nombre: "Enfermedad Pulmonar Obstructiva Crónica (EPOC)", keywords: ["epoc", "bronquitis cronica", "enfisema"] },
  { numero: 39, nombre: "Asma bronquial en menores de 15 años", keywords: ["asma infantil"] },
  { numero: 40, nombre: "Síndrome de Dificultad Respiratoria en recién nacido", keywords: ["sindrome de dificultad respiratoria neonatal"] },
  { numero: 41, nombre: "Artrosis de cadera y/o rodilla leve o moderada", keywords: ["artrosis de rodilla", "artrosis de cadera"] },
  { numero: 42, nombre: "Hemorragia Subaracnoidea por aneurisma", keywords: ["hemorragia subaracnoidea", "hsa"] },
  { numero: 43, nombre: "Tumores Primarios del Sistema Nervioso Central", keywords: ["tumor cerebral", "glioma", "meningioma"] },
  { numero: 44, nombre: "Hernia del Núcleo Pulposo Lumbar", keywords: ["hernia del nucleo pulposo", "hnp lumbar"] },
  { numero: 45, nombre: "Leucemia", keywords: ["leucemia"] },
  { numero: 46, nombre: "Urgencia Odontológica Ambulatoria", keywords: ["urgencia odontologica"] },
  { numero: 47, nombre: "Salud Oral Integral de personas de 60 años", keywords: ["salud oral 60 anos"] },
  { numero: 48, nombre: "Politraumatizado Grave", keywords: ["politraumatizado"] },
  { numero: 49, nombre: "Traumatismo Cráneo Encefálico moderado o grave", keywords: ["tec moderado", "tec grave"] },
  { numero: 50, nombre: "Trauma Ocular Grave", keywords: ["trauma ocular grave"] },
  { numero: 51, nombre: "Fibrosis Quística", keywords: ["fibrosis quistica"] },
  { numero: 52, nombre: "Artritis Reumatoídea", keywords: ["artritis reumatoide", "ar"] },
  { numero: 53, nombre: "Consumo perjudicial alcohol y drogas en menores de 20 años", keywords: ["consumo perjudicial alcohol"] },
  { numero: 54, nombre: "Analgesia del parto", keywords: ["analgesia del parto"] },
  { numero: 55, nombre: "Gran Quemado", keywords: ["gran quemado"] },
  { numero: 56, nombre: "Hipoacusia en mayores de 65 años (audífono)", keywords: ["hipoacusia adulto mayor", "audifono"] },
  { numero: 57, nombre: "Retinopatía del prematuro", keywords: ["retinopatia del prematuro", "rop"] },
  { numero: 58, nombre: "Displasia broncopulmonar del prematuro", keywords: ["displasia broncopulmonar"] },
  { numero: 59, nombre: "Hipoacusia neurosensorial bilateral del prematuro", keywords: ["hipoacusia prematuro"] },
  { numero: 60, nombre: "Epilepsia en mayores de 15 años", keywords: ["epilepsia adulto"] },
  { numero: 61, nombre: "Asma en mayores de 15 años", keywords: ["asma bronquial adulto"] },
  { numero: 62, nombre: "Enfermedad de Parkinson", keywords: ["parkinson"] },
  { numero: 63, nombre: "Artritis idiopática juvenil", keywords: ["artritis idiopatica juvenil"] },
  { numero: 64, nombre: "Enfermedad renal crónica", keywords: ["enfermedad renal cronica", "erc"] },
  { numero: 65, nombre: "Displasia luxante de caderas", keywords: ["displasia luxante de cadera", "dlc"] },
  { numero: 66, nombre: "Salud oral integral de la gestante", keywords: ["salud oral gestante"] },
  { numero: 67, nombre: "Esclerosis múltiple", keywords: ["esclerosis multiple"] },
  { numero: 68, nombre: "Hepatitis B", keywords: ["hepatitis b"] },
  { numero: 69, nombre: "Hepatitis C", keywords: ["hepatitis c"] },
  { numero: 70, nombre: "Cáncer Colorectal", keywords: ["cancer colorrectal", "cancer de colon"] },
  { numero: 71, nombre: "Cáncer de Ovario Epitelial", keywords: ["cancer de ovario"] },
  { numero: 72, nombre: "Cáncer Vesical", keywords: ["cancer vesical", "cancer de vejiga"] },
  { numero: 73, nombre: "Osteosarcoma", keywords: ["osteosarcoma"] },
  { numero: 74, nombre: "Lesiones crónicas válvula aórtica", keywords: ["valvulopatia aortica"] },
  { numero: 75, nombre: "Trastorno Bipolar", keywords: ["trastorno bipolar", "bipolaridad"] },
  { numero: 76, nombre: "Hipotiroidismo", keywords: ["hipotiroidismo"] },
  { numero: 77, nombre: "Hipoacusia en menores de 4 años", keywords: ["hipoacusia infantil"] },
  { numero: 78, nombre: "Lupus Eritematoso Sistémico", keywords: ["lupus", "les"] },
  { numero: 79, nombre: "Lesiones válvulas mitral y tricúspide", keywords: ["valvulopatia mitral"] },
  { numero: 80, nombre: "Erradicación del Helicobacter Pylori", keywords: ["helicobacter pylori"] },
  { numero: 81, nombre: "Cáncer de pulmón", keywords: ["cancer de pulmon"] },
  { numero: 82, nombre: "Cáncer de Tiroides", keywords: ["cancer de tiroides"] },
  { numero: 83, nombre: "Cáncer Renal", keywords: ["cancer renal"] },
  { numero: 84, nombre: "Mieloma Múltiple", keywords: ["mieloma"] },
  { numero: 85, nombre: "Enfermedad de Alzheimer y otras demencias", keywords: ["alzheimer", "demencia"] },
  { numero: 86, nombre: "Agresión sexual aguda", keywords: ["agresion sexual"] },
  { numero: 87, nombre: "Rehabilitación SARS-CoV-2", keywords: ["rehabilitacion covid", "post covid"] },
  { numero: 88, nombre: "Cirrosis hepática", keywords: ["cirrosis hepatica"] },
  { numero: 89, nombre: "Depresión grave adolescente con riesgo suicida", keywords: ["depresion grave adolescente", "intento suicida"] },
  { numero: 90, nombre: "Cesación del consumo de tabaco", keywords: ["cesacion tabaquismo", "tabaquismo"] }
];

export default function Censo() {
  const hoyStr = new Date().toISOString().split("T")[0];

  const [pacientes, setPacientes] = useState<PacienteCenso[]>([]);
  const [descargando, setDescargando] = useState(true);

  // DESCARGA DESDE LA NUBE AL INICIAR
  useEffect(() => {
    async function sincronizarCenso() {
      const datosNube = await cargarDeNube('censo');
      
      if (datosNube && Array.isArray(datosNube) && datosNube.length > 0) {
        setPacientes(datosNube);
      } else {
        const guardados = localStorage.getItem("ward_commander_censo");
        if (guardados) {
          try {
            setPacientes(JSON.parse(guardados));
          } catch (e) {
            setPacientes([]);
          }
        }
      }
      setDescargando(false);
    }
    
    sincronizarCenso();
  }, []);

  // SUBE A LA NUBE CADA VEZ QUE CAMBIEN LOS PACIENTES
  useEffect(() => {
    if (!descargando) {
      localStorage.setItem("ward_commander_censo", JSON.stringify(pacientes));
      guardarEnNube('censo', pacientes);
    }
  }, [pacientes, descargando]);

  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState<Partial<PacienteCenso> | null>(null);

  // Estados para escaneo inteligente con IA (Foto / Archivo / Texto)
  const [modalEscaneoAbierto, setModalEscaneoAbierto] = useState(false);
  const [escaneandoIA, setEscaneandoIA] = useState(false);
  const [archivosEscaneo, setArchivosEscaneo] = useState<Array<{ base64: string; mimeType: string; nombre: string; vistaPrevia?: string }>>([]);
  const [textoEscaneo, setTextoEscaneo] = useState("");
  const [errorEscaneo, setErrorEscaneo] = useState("");
  const [apiKeyLocal, setApiKeyLocal] = useState("");
  const [mostrarConfigKey, setMostrarConfigKey] = useState(false);

  useEffect(() => {
    const k = obtenerApiKeyGuardada();
    if (k) setApiKeyLocal(k);
  }, []);

  const guardarApiKeyLocal = (nuevaClave: string) => {
    setApiKeyLocal(nuevaClave);
    localStorage.setItem("wc_config", JSON.stringify({ apiKey: nuevaClave.trim() }));
    localStorage.setItem("gemini_api_key", nuevaClave.trim());
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorEscaneo("");

    Array.from(files).forEach(file => {
      const reader = new FileReader();

      if (file.type.startsWith("image/")) {
        reader.onload = () => {
          const result = reader.result as string;
          setArchivosEscaneo(prev => [
            ...prev,
            {
              base64: result,
              mimeType: file.type,
              nombre: file.name,
              vistaPrevia: result,
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        reader.onload = () => {
          const result = reader.result as string;
          setArchivosEscaneo(prev => [
            ...prev,
            {
              base64: result,
              mimeType: file.type,
              nombre: file.name,
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const result = reader.result as string;
          setTextoEscaneo(prev => prev ? `${prev}\n\n${result}` : result);
        };
        reader.readAsText(file);
      }
    });

    e.target.value = "";
  };

  const removerArchivoEscaneo = (index: number) => {
    setArchivosEscaneo(prev => prev.filter((_, i) => i !== index));
  };

  const procesarDocumentoConIA = async () => {
    if (archivosEscaneo.length === 0 && !textoEscaneo.trim()) {
      setErrorEscaneo("Por favor toma una foto, adjunta uno o varios archivos o pega el texto clínico del paciente.");
      return;
    }

    const keyActual = apiKeyLocal.trim() || obtenerApiKeyGuardada();
    if (!keyActual) {
      setErrorEscaneo("Por favor ingresa tu API Key de Gemini (Google AI Studio) abajo para que la IA procese el documento.");
      setMostrarConfigKey(true);
      return;
    }

    setEscaneandoIA(true);
    setErrorEscaneo("");

    try {
      const datosExtraidos = await extraerPacienteDesdeDocumentoConGemini({
        archivos: archivosEscaneo,
        textoPlano: textoEscaneo.trim() || undefined,
      }, keyActual);

      const curacionExtraida: Curacion = datosExtraidos.curacion ? {
        activo: !!datosExtraidos.curacion.activo,
        tipo: datosExtraidos.curacion.tipo || "",
        frecuenciaDias: datosExtraidos.curacion.frecuenciaDias || 3,
        ultimaFecha: datosExtraidos.curacion.ultimaFecha || hoyStr,
      } : { activo: false, ultimaFecha: hoyStr, frecuenciaDias: 3, tipo: "" };

      const pendientesExtraidos: Pendiente[] = Array.isArray(datosExtraidos.pendientes)
        ? datosExtraidos.pendientes.filter(Boolean).map(t => ({
            id: Date.now().toString() + Math.random().toString().slice(2, 6),
            texto: String(t),
            completado: false
          }))
        : [];

      const evolucionesExtraidas: Evolucion[] = Array.isArray(datosExtraidos.evoluciones)
        ? datosExtraidos.evoluciones
            .filter(e => e && e.texto && e.texto.trim().length > 0)
            .map((e, idx) => ({
              id: (Date.now() + idx).toString(),
              fecha: e.fecha || hoyStr,
              texto: e.texto.trim(),
              tipo: e.tipo === "ic" ? "ic" : "normal",
              especialidad: e.especialidad || "",
              medico: e.medico || ""
            }))
        : [];

      const tieneEvoHoy = evolucionesExtraidas.some(e => e.fecha === hoyStr);

      const antibioticosExtraidos: ItemAntibiotico[] = Array.isArray(datosExtraidos.antibioticos) && datosExtraidos.antibioticos.length > 0
        ? datosExtraidos.antibioticos.filter(a => a && a.nombre && a.nombre.trim()).map((a, i) => ({
            id: (Date.now() + i).toString(),
            nombre: a.nombre.trim(),
            dias: a.dias?.trim() || ""
          }))
        : datosExtraidos.atbNombre && datosExtraidos.atbNombre.trim()
          ? [{ id: Date.now().toString(), nombre: datosExtraidos.atbNombre.trim(), dias: datosExtraidos.atbDias?.trim() || "" }]
          : [];

      setPacienteEditando({
        cama: datosExtraidos.cama || "",
        nombre: datosExtraidos.nombre || "",
        edad: datosExtraidos.edad || "",
        fechaIngreso: datosExtraidos.fechaIngreso || hoyStr,
        diagnostico: datosExtraidos.diagnostico || "",
        atbNombre: datosExtraidos.atbNombre || "",
        atbDias: datosExtraidos.atbDias || "",
        antibioticos: antibioticosExtraidos,
        incobertura: datosExtraidos.incobertura || "",
        anamnesis: datosExtraidos.anamnesis || "",
        curacion: curacionExtraida,
        pendientes: pendientesExtraidos,
        invasivos: [],
        evoluciones: evolucionesExtraidas,
        ultimaEvolucionFecha: tieneEvoHoy ? hoyStr : undefined,
      });

      setModalEscaneoAbierto(false);
      setArchivosEscaneo([]);
      setTextoEscaneo("");
      setModalAbierto(true);
    } catch (err: any) {
      setErrorEscaneo(err.message || "Error al procesar el documento con IA.");
    } finally {
      setEscaneandoIA(false);
    }
  };

  const [modalEvolucionAbierto, setModalEvolucionAbierto] = useState(false);
  const [pacienteSeleccionadoEvolucion, setPacienteSeleccionadoEvolucion] = useState<PacienteCenso | null>(null);
  
  const [tipoNota, setTipoNota] = useState<"normal" | "ic">("normal");
  const [fechaEvolucion, setFechaEvolucion] = useState<string>(hoyStr);
  const [evolucionEditando, setEvolucionEditando] = useState<Evolucion | null>(null);
  const [nuevoTextoEvolucion, setNuevoTextoEvolucion] = useState("");
  const [especialidadIC, setEspecialidadIC] = useState("");
  const [medicoIC, setMedicoIC] = useState("");
  
  // Estados para extracción de Evolución con IA
  const [mostrarEscaneoEvo, setMostrarEscaneoEvo] = useState(false);
  const [escaneandoEvoIA, setEscaneandoEvoIA] = useState(false);
  const [archivosEvo, setArchivosEvo] = useState<Array<{ base64: string; mimeType: string; nombre: string; vistaPrevia?: string }>>([]);
  const [textoEvoAI, setTextoEvoAI] = useState("");
  const [errorEvoAI, setErrorEvoAI] = useState("");

  const handleFileSelectEvo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setErrorEvoAI("");

    Array.from(files).forEach(file => {
      const reader = new FileReader();

      if (file.type.startsWith("image/")) {
        reader.onload = () => {
          const result = reader.result as string;
          setArchivosEvo(prev => [
            ...prev,
            {
              base64: result,
              mimeType: file.type,
              nombre: file.name,
              vistaPrevia: result,
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === "application/pdf") {
        reader.onload = () => {
          const result = reader.result as string;
          setArchivosEvo(prev => [
            ...prev,
            {
              base64: result,
              mimeType: file.type,
              nombre: file.name,
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          const result = reader.result as string;
          setTextoEvoAI(prev => prev ? `${prev}\n\n${result}` : result);
        };
        reader.readAsText(file);
      }
    });

    e.target.value = "";
  };

  const removerArchivoEvo = (index: number) => {
    setArchivosEvo(prev => prev.filter((_, i) => i !== index));
  };

  const procesarEvolucionConIA = async () => {
    if (archivosEvo.length === 0 && !textoEvoAI.trim()) {
      setErrorEvoAI("Toma una foto, sube uno o varios archivos o pega el texto/link de Google Docs.");
      return;
    }

    const key = apiKeyLocal.trim() || obtenerApiKeyGuardada();
    if (!key) {
      setErrorEvoAI("Por favor configura tu API Key de Gemini.");
      return;
    }

    setEscaneandoEvoIA(true);
    setErrorEvoAI("");

    try {
      const resultado = await extraerEvolucionConGemini({
        archivos: archivosEvo,
        textoPlano: textoEvoAI.trim() || undefined
      }, key);

      if (resultado && resultado.length > 0) {
        if (resultado.length === 1) {
          const evo = resultado[0];
          setTipoNota(evo.tipo === "ic" ? "ic" : "normal");
          setNuevoTextoEvolucion(evo.texto);
          if (evo.especialidad) setEspecialidadIC(evo.especialidad);
          if (evo.medico) setMedicoIC(evo.medico);
          setMostrarEscaneoEvo(false);
          setArchivosEvo([]);
          setTextoEvoAI("");
        } else {
          if (pacienteSeleccionadoEvolucion) {
            const nuevasEvos: Evolucion[] = resultado.map((e, idx) => ({
              id: (Date.now() + idx).toString(),
              fecha: e.fecha || hoyStr,
              texto: e.texto,
              tipo: e.tipo === "ic" ? "ic" : "normal",
              especialidad: e.especialidad || "",
              medico: e.medico || ""
            }));

            const evosActualizadas = [...nuevasEvos, ...(pacienteSeleccionadoEvolucion.evoluciones || [])];
            const tieneHoy = nuevasEvos.some(e => e.fecha === hoyStr);

            const actualizados = pacientes.map(p => {
              if (p.id === pacienteSeleccionadoEvolucion.id) {
                return {
                  ...p,
                  evoluciones: evosActualizadas,
                  ultimaEvolucionFecha: tieneHoy ? hoyStr : p.ultimaEvolucionFecha
                };
              }
              return p;
            });

            setPacientes(actualizados);
            setPacienteSeleccionadoEvolucion(prev => prev ? {
              ...prev,
              evoluciones: evosActualizadas,
              ultimaEvolucionFecha: tieneHoy ? hoyStr : prev.ultimaEvolucionFecha
            } : null);

            setMostrarEscaneoEvo(false);
            setArchivosEvo([]);
            setTextoEvoAI("");
          }
        }
      }
    } catch (err: any) {
      setErrorEvoAI(err.message || "Error al extraer la evolución con IA.");
    } finally {
      setEscaneandoEvoIA(false);
    }
  };
  
  const [textoNuevoPendiente, setTextoNuevoPendiente] = useState<{ [key: string]: string }>({});

  const calcularDias = (fechaInicio: string) => {
    if (!fechaInicio) return 0;
    const inicio = new Date(fechaInicio);
    const hoy = new Date(hoyStr);
    const diffTime = hoy.getTime() - inicio.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const guardarPaciente = () => {
    if (!pacienteEditando?.cama || !pacienteEditando?.nombre) {
      alert("Por lo menos ingresa la Cama y el Nombre.");
      return;
    }

    const curacionFinal: Curacion = pacienteEditando.curacion || { activo: false, ultimaFecha: hoyStr, frecuenciaDias: 3, tipo: "" };
    const antibioticosFinales = obtenerAntibioticos(pacienteEditando).filter(a => a.nombre && a.nombre.trim());
    const primerAtb = antibioticosFinales[0];
    const atbNombreFallback = antibioticosFinales.map(a => a.nombre).join(', ') || "";
    const atbDiasFallback = antibioticosFinales.map(a => a.dias ? `${a.nombre}: ${a.dias}` : a.nombre).join(' | ') || (primerAtb?.dias || "");

    if (pacienteEditando.id) {
      setPacientes(prev => prev.map(p => p.id === pacienteEditando.id ? { 
        ...p, 
        ...(pacienteEditando as PacienteCenso),
        antibioticos: antibioticosFinales,
        atbNombre: atbNombreFallback,
        atbDias: atbDiasFallback,
        pendientes: Array.isArray(p.pendientes) ? p.pendientes : [],
        evoluciones: Array.isArray(p.evoluciones) ? p.evoluciones : [],
        invasivos: Array.isArray(p.invasivos) ? p.invasivos : [],
        curacion: curacionFinal
      } : p));
    } else {
      const nuevo: PacienteCenso = {
        id: Date.now().toString(),
        cama: pacienteEditando.cama || "",
        nombre: pacienteEditando.nombre || "",
        edad: pacienteEditando.edad || "",
        diagnostico: pacienteEditando.diagnostico || "",
        anamnesis: pacienteEditando.anamnesis || "",
        fechaIngreso: pacienteEditando.fechaIngreso || hoyStr,
        atbNombre: atbNombreFallback,
        atbDias: atbDiasFallback,
        antibioticos: antibioticosFinales,
        incobertura: pacienteEditando.incobertura || "",
        invasivos: [],
        curacion: curacionFinal,
        pendientes: [],
        evoluciones: []
      };
      setPacientes(prev => [...prev, nuevo]);
    }
    setModalAbierto(false);
    setPacienteEditando(null);
  };

  const eliminarPaciente = (id: string) => {
    if (window.confirm("¿Dar de alta / eliminar este paciente?")) {
      setPacientes(prev => prev.filter(p => p.id !== id));
    }
  };

  const togglePendiente = (pacienteId: string, pendienteId: string) => {
    setPacientes(prev => prev.map(p => {
      if (p.id === pacienteId) {
        const listaPendientes = Array.isArray(p.pendientes) ? p.pendientes : [];
        const nuevosPendientes = listaPendientes.map(pend => 
          pend.id === pendienteId ? { ...pend, completado: !pend.completado } : pend
        );
        return { ...p, pendientes: nuevosPendientes };
      }
      return p;
    }));
  };

  const eliminarPendiente = (pacienteId: string, pendienteId: string) => {
    setPacientes(prev => prev.map(p => {
      if (p.id === pacienteId) {
        const listaPendientes = Array.isArray(p.pendientes) ? p.pendientes : [];
        return { ...p, pendientes: listaPendientes.filter(pend => pend.id !== pendienteId) };
      }
      return p;
    }));
  };

  const agregarPendienteRapido = (pacienteId: string) => {
    const texto = textoNuevoPendiente[pacienteId];
    if (!texto || !texto.trim()) return;

    setPacientes(prev => prev.map(p => {
      if (p.id === pacienteId) {
        const listaPendientes = Array.isArray(p.pendientes) ? p.pendientes : [];
        return {
          ...p,
          pendientes: [...listaPendientes, { id: Date.now().toString(), texto: texto.trim(), completado: false }]
        };
      }
      return p;
    }));
    setTextoNuevoPendiente(prev => ({ ...prev, [pacienteId]: "" }));
  };

  const iniciarEdicionEvolucion = (evo: Evolucion) => {
    setEvolucionEditando(evo);
    setFechaEvolucion(evo.fecha || hoyStr);
    setNuevoTextoEvolucion(evo.texto || "");
    setTipoNota(evo.tipo === "ic" ? "ic" : "normal");
    setEspecialidadIC(evo.especialidad || "");
    setMedicoIC(evo.medico || "");
  };

  const cancelarEdicionEvolucion = () => {
    setEvolucionEditando(null);
    setFechaEvolucion(hoyStr);
    setNuevoTextoEvolucion("");
    setTipoNota("normal");
    setEspecialidadIC("");
    setMedicoIC("");
  };

  const eliminarEvolucion = (evoId: string, fechaEvo: string) => {
    if (!pacienteSeleccionadoEvolucion) return;
    if (window.confirm(`¿Seguro que deseas eliminar la evolución del ${fechaEvo.split('-').reverse().join('/')}?`)) {
      setPacientes(prev => prev.map(p => {
        if (p.id === pacienteSeleccionadoEvolucion.id) {
          const lista = Array.isArray(p.evoluciones) ? p.evoluciones : [];
          const filtradas = lista.filter(e => e.id !== evoId);
          const tieneHoy = filtradas.some(e => e.fecha === hoyStr);
          return {
            ...p,
            evoluciones: filtradas,
            ultimaEvolucionFecha: tieneHoy ? hoyStr : (filtradas[0]?.fecha || undefined)
          };
        }
        return p;
      }));

      setPacienteSeleccionadoEvolucion(prev => {
        if (!prev) return null;
        const lista = Array.isArray(prev.evoluciones) ? prev.evoluciones : [];
        const filtradas = lista.filter(e => e.id !== evoId);
        const tieneHoy = filtradas.some(e => e.fecha === hoyStr);
        return {
          ...prev,
          evoluciones: filtradas,
          ultimaEvolucionFecha: tieneHoy ? hoyStr : (filtradas[0]?.fecha || undefined)
        };
      });

      if (evolucionEditando?.id === evoId) {
        cancelarEdicionEvolucion();
      }
    }
  };

  const guardarEvolucion = () => {
    if (!pacienteSeleccionadoEvolucion || !nuevoTextoEvolucion.trim()) return;
    if (tipoNota === "ic" && (!especialidadIC.trim() || !medicoIC.trim())) {
      alert("Por favor ingresa la especialidad y el nombre del doctor.");
      return;
    }

    const fechaFinal = fechaEvolucion || hoyStr;

    if (evolucionEditando) {
      const evoActualizada: Evolucion = {
        ...evolucionEditando,
        fecha: fechaFinal,
        texto: nuevoTextoEvolucion.trim(),
        tipo: tipoNota,
        especialidad: tipoNota === "ic" ? especialidadIC.trim() : undefined,
        medico: tipoNota === "ic" ? medicoIC.trim() : undefined
      };

      setPacientes(prev => prev.map(p => {
        if (p.id === pacienteSeleccionadoEvolucion.id) {
          const lista = Array.isArray(p.evoluciones) ? p.evoluciones : [];
          const nuevas = lista.map(e => e.id === evolucionEditando.id ? evoActualizada : e);
          const tieneHoy = nuevas.some(e => e.fecha === hoyStr);
          return {
            ...p,
            evoluciones: nuevas,
            ultimaEvolucionFecha: tieneHoy ? hoyStr : (nuevas[0]?.fecha || undefined)
          };
        }
        return p;
      }));

      setPacienteSeleccionadoEvolucion(prev => {
        if (!prev) return null;
        const lista = Array.isArray(prev.evoluciones) ? prev.evoluciones : [];
        const nuevas = lista.map(e => e.id === evolucionEditando.id ? evoActualizada : e);
        const tieneHoy = nuevas.some(e => e.fecha === hoyStr);
        return {
          ...prev,
          evoluciones: nuevas,
          ultimaEvolucionFecha: tieneHoy ? hoyStr : (nuevas[0]?.fecha || undefined)
        };
      });

      cancelarEdicionEvolucion();
    } else {
      const nuevaEvo: Evolucion = {
        id: Date.now().toString(),
        fecha: fechaFinal,
        texto: nuevoTextoEvolucion.trim(),
        tipo: tipoNota,
        especialidad: tipoNota === "ic" ? especialidadIC.trim() : undefined,
        medico: tipoNota === "ic" ? medicoIC.trim() : undefined
      };

      setPacientes(prev => prev.map(p => {
        if (p.id === pacienteSeleccionadoEvolucion.id) {
          const listaEvoluciones = Array.isArray(p.evoluciones) ? p.evoluciones : [];
          const nuevas = [nuevaEvo, ...listaEvoluciones];
          const tieneHoy = nuevas.some(e => e.fecha === hoyStr);
          return {
            ...p,
            evoluciones: nuevas,
            ultimaEvolucionFecha: tieneHoy ? hoyStr : p.ultimaEvolucionFecha
          };
        }
        return p;
      }));

      setPacienteSeleccionadoEvolucion(prev => {
        if (!prev) return null;
        const lista = Array.isArray(prev.evoluciones) ? prev.evoluciones : [];
        const nuevas = [nuevaEvo, ...lista];
        const tieneHoy = nuevas.some(e => e.fecha === hoyStr);
        return {
          ...prev,
          evoluciones: nuevas,
          ultimaEvolucionFecha: tieneHoy ? hoyStr : prev.ultimaEvolucionFecha
        };
      });

      cancelarEdicionEvolucion();
    }
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6 bg-gray-50 min-h-full">
      
      {/* CABECERA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-1">
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-6 h-6 md:w-7 md:h-7 text-blue-600 shrink-0" /> 
            <span>Censo de Pacientes</span>
          </h1>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <span>Gestiona estancias, curaciones y GES.</span>
            {/* Indicador visual de guardado en la nube */}
            {!descargando && <span className="flex items-center gap-1 bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-md border border-green-200 ml-2"><Cloud className="w-3 h-3"/> En la nube</span>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            onClick={() => { 
              setArchivosEscaneo([]);
              setTextoEscaneo("");
              setErrorEscaneo("");
              setModalEscaneoAbierto(true); 
            }}
            className="flex-1 md:flex-none bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-4 py-2.5 rounded-xl md:rounded-lg text-sm font-bold flex justify-center items-center gap-2 shadow-md transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Foto / Archivo (IA)</span>
          </button>
          <button
            onClick={() => { 
              setPacienteEditando({ 
                fechaIngreso: hoyStr, 
                curacion: { activo: false, ultimaFecha: hoyStr, frecuenciaDias: 3, tipo: "" },
                antibioticos: []
              }); 
              setModalAbierto(true); 
            }}
            className="flex-1 md:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl md:rounded-lg text-sm font-bold flex justify-center items-center gap-2 shadow transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" /> Manual
          </button>
        </div>
      </div>

      {descargando ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-500 font-semibold text-sm">Sincronizando con la nube...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {pacientes.map((p) => {
            const evolucionadoHoy = p.ultimaEvolucionFecha === hoyStr;
            const listaPendientes = Array.isArray(p.pendientes) ? p.pendientes : [];
            const textoBusqueda = `${p.diagnostico || ""} ${p.anamnesis || ""}`.toLowerCase();
            const diasHospitalizacion = calcularDias(p.fechaIngreso);

            const gesDetectados = LISTA_GES.filter(g => 
              g.keywords.some(kw => textoBusqueda.includes(kw))
            );

            return (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 md:p-5 flex flex-col justify-between space-y-4 relative">
                <div>
                  <div className="flex justify-between items-start border-b border-gray-100 pb-3 mb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <span className="bg-blue-100 text-blue-800 font-black px-2.5 py-1 rounded text-xs w-fit">
                        Cama {p.cama}
                      </span>
                      {evolucionadoHoy ? (
                        <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                          ✓ Evolucionado hoy
                        </span>
                      ) : (
                        <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full w-fit">
                          Pendiente evolución
                        </span>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => { setPacienteEditando({ ...p, antibioticos: obtenerAntibioticos(p) }); setModalAbierto(true); }} className="text-gray-400 hover:text-blue-600 p-1.5 bg-gray-50 rounded-md transition-colors" title="Editar datos">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => eliminarPaciente(p.id)} className="text-gray-400 hover:text-red-600 p-1.5 bg-gray-50 rounded-md transition-colors" title="Dar de alta / Eliminar">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-gray-900 text-base md:text-lg leading-tight">{p.nombre} {p.edad ? <span className="text-gray-500 text-sm font-medium">({p.edad} años)</span> : ""}</h3>
                  <p className="text-xs md:text-sm font-semibold text-purple-700 mt-1">Dx: {p.diagnostico || "Sin diagnóstico principal"}</p>

                  <div className="mt-3 bg-slate-50 border border-gray-100 p-2 md:p-2.5 rounded-lg flex flex-wrap justify-between items-center text-xs gap-2">
                    <div>
                      <span className="text-gray-500 block text-[9px] md:text-[10px] uppercase font-bold tracking-wider">Fecha de Ingreso</span>
                      <span className="font-semibold text-gray-800">{p.fechaIngreso.split('-').reverse().join('/') || "No definida"}</span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-gray-500 block text-[9px] md:text-[10px] uppercase font-bold tracking-wider">Estadía</span>
                      <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                        {diasHospitalizacion} días
                      </span>
                    </div>
                  </div>

                  <ControlClinicoCard paciente={p} />

                  {gesDetectados.length > 0 && (
                    <AlertaGesCard pacienteId={p.id} gesDetectados={gesDetectados} />
                  )}

                  <div className="mt-3 bg-gray-50 p-3 rounded-lg text-xs border border-gray-100">
                    <span className="font-bold text-gray-700 block mb-1">Anamnesis / Base:</span>
                    <p className="text-gray-600 line-clamp-3 leading-relaxed">{p.anamnesis || "Sin anamnesis registrada..."}</p>
                  </div>

                  <div className="mt-4 space-y-2">
                    <span className="text-[10px] font-bold uppercase text-gray-500 block tracking-wider">Pendientes y Tareas</span>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                      {listaPendientes.map((pend) => (
                        <div key={pend.id} className="flex items-center justify-between text-xs hover:bg-gray-50 p-1.5 rounded-lg border border-transparent hover:border-gray-200 group transition-all">
                          <div onClick={() => togglePendiente(p.id, pend.id)} className="flex items-start gap-2 cursor-pointer flex-1">
                            <div className="mt-0.5 shrink-0">
                              {pend.completado ? (
                                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                              ) : (
                                  <Circle className="w-4 h-4 text-gray-300" />
                              )}
                            </div>
                            <span className={`${pend.completado ? "line-through text-gray-400" : "text-gray-700"} leading-snug`}>{pend.texto}</span>
                          </div>
                          <button 
                            onClick={() => eliminarPendiente(p.id, pend.id)} 
                            className="text-gray-300 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors ml-1 shrink-0" 
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-1.5 pt-1">
                      <input
                        type="text"
                        placeholder="Nuevo pendiente..."
                        value={textoNuevoPendiente[p.id] || ""}
                        onChange={e => setTextoNuevoPendiente(prev => ({ ...prev, [p.id]: e.target.value }))}
                        onKeyDown={e => { if (e.key === 'Enter') agregarPendienteRapido(p.id); }}
                        className="w-full text-xs p-2 border border-gray-200 rounded-lg outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
                      />
                      <button onClick={() => agregarPendienteRapido(p.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 rounded-lg font-bold border border-gray-200 transition-colors">+</button>
                    </div>
                  </div>
                </div>

                <div className="pt-3 mt-4 border-t border-gray-100 flex justify-between items-center">
                  <span className="text-[10px] md:text-[11px] text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                    {Array.isArray(p.evoluciones) ? p.evoluciones.length : 0} evoluciones
                  </span>
                  <button
                    onClick={() => { setPacienteSeleccionadoEvolucion(p); setModalEvolucionAbierto(true); }}
                    className="bg-blue-50 hover:bg-blue-100 border border-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
                  >
                    <FileText className="w-3.5 h-3.5 shrink-0" /> <span className="hidden xs:inline">Evolucionar / Historial</span><span className="xs:hidden">Evolución</span>
                  </button>
                </div>
              </div>
            );
          })}

          {pacientes.length === 0 && (
            <div className="col-span-full text-center py-12 md:py-20 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="font-medium text-gray-500">El censo está vacío.</p>
              <p className="text-sm">Agrega tu primer paciente para comenzar el turno.</p>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE ESCANEO INTELIGENTE CON IA */}
      {modalEscaneoAbierto && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white sm:rounded-2xl rounded-t-2xl max-w-xl w-full p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="bg-purple-100 p-2 rounded-xl text-purple-700 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                    Cargar Paciente con IA
                  </h2>
                  <p className="text-xs text-gray-500">
                    Foto, Google Docs, PDF o texto: extrae datos, evoluciones diarias e interconsultas (IC).
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalEscaneoAbierto(false)}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Botones de acción rápida: Cámara y Archivo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label className="flex flex-col items-center justify-center gap-2 p-4 bg-purple-50 hover:bg-purple-100/80 border-2 border-dashed border-purple-300 rounded-xl cursor-pointer transition-all text-purple-900 text-center">
                  <Camera className="w-7 h-7 text-purple-600" />
                  <span className="text-xs font-bold">Tomar Foto con Cámara</span>
                  <span className="text-[10px] text-purple-600/80">Ficha clínica, pizarra o monitor</span>
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>

                <label className="flex flex-col items-center justify-center gap-2 p-4 bg-blue-50 hover:bg-blue-100/80 border-2 border-dashed border-blue-300 rounded-xl cursor-pointer transition-all text-blue-900 text-center">
                  <FileUp className="w-7 h-7 text-blue-600" />
                  <span className="text-xs font-bold">Adjuntar Fotos o PDFs</span>
                  <span className="text-[10px] text-blue-600/80">JPG, PNG, PDF o archivos (múltiples)</span>
                  <input
                    type="file"
                    accept="image/*,application/pdf,.txt"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>

              {/* Vista previa de los archivos seleccionados */}
              {archivosEscaneo.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] font-bold text-gray-600 uppercase tracking-wider">
                    Archivos cargados ({archivosEscaneo.length}):
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {archivosEscaneo.map((arc, idx) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 flex items-center justify-between gap-2 text-xs shadow-2xs">
                        <div className="flex items-center gap-2 min-w-0">
                          {arc.vistaPrevia ? (
                            <img
                              src={arc.vistaPrevia}
                              alt="Vista previa"
                              className="w-10 h-10 object-cover rounded-lg border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-100 text-blue-700 flex items-center justify-center rounded-lg shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          )}
                          <div className="truncate">
                            <p className="font-bold text-gray-800 truncate">{arc.nombre}</p>
                            <p className="text-[10px] text-gray-500 uppercase">{arc.mimeType || "Archivo"}</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removerArchivoEscaneo(idx)}
                          className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                          title="Quitar archivo"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Área de texto / enlace Google Docs */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-gray-500 mb-1.5 tracking-wider">
                  O Pega texto clínico, enlace de Google Docs o Epicrisis:
                </label>
                <textarea
                  rows={4}
                  value={textoEscaneo}
                  onChange={(e) => setTextoEscaneo(e.target.value)}
                  placeholder="Pega aquí el enlace de tu Google Doc, texto copiado de la ficha, evoluciones de varios días o respuestas de interconsulta (ej. 'IC Cardio Dr. Muñoz: ...')."
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs outline-none focus:ring-2 focus:ring-purple-400 resize-none leading-relaxed text-gray-800"
                />
              </div>

              <div className="bg-blue-50/60 border border-blue-100 p-2.5 rounded-xl text-[11px] text-blue-900 space-y-1">
                <span className="font-bold flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-blue-600" /> Extracción completa por IA:</span>
                <p className="text-blue-800/90 leading-snug">
                  La IA detecta automáticamente la cama, nombre, diagnóstico, antibióticos, <strong>evoluciones clínicas separadas por fecha</strong> e <strong>interconsultas (IC)</strong> asignando la especialidad y el doctor.
                </p>
              </div>

              {/* Configuración / Entrada directa de API Key de Gemini */}
              {(!apiKeyLocal || mostrarConfigKey) ? (
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5 text-amber-700" /> Clave de Gemini (Google AI Studio) <span className="text-red-500">*</span>
                    </label>
                    {apiKeyLocal && (
                      <button type="button" onClick={() => setMostrarConfigKey(false)} className="text-[10px] text-gray-500 hover:text-gray-700 font-bold underline">
                        Ocultar
                      </button>
                    )}
                  </div>
                  <input
                    type="password"
                    value={apiKeyLocal}
                    onChange={(e) => guardarApiKeyLocal(e.target.value)}
                    placeholder="Pega aquí tu clave AIzaSy..."
                    className="w-full p-2.5 bg-white border border-amber-300 rounded-lg text-xs font-mono outline-none focus:ring-2 focus:ring-amber-500 text-gray-800"
                  />
                  <p className="text-[10px] text-amber-800 leading-tight">
                    Tu clave se guarda automáticamente en este dispositivo. Si no tienes una, consíguela gratis en{" "}
                    <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline font-bold text-blue-700">
                      Google AI Studio ↗
                    </a>.
                  </p>
                </div>
              ) : (
                <div className="flex justify-between items-center bg-slate-50 px-3 py-1.5 rounded-lg border border-gray-100 text-[11px] text-gray-500">
                  <span className="flex items-center gap-1.5"><Key className="w-3 h-3 text-green-600" /> Clave de IA configurada</span>
                  <button type="button" onClick={() => setMostrarConfigKey(true)} className="text-purple-600 hover:text-purple-800 font-bold text-[10px]">
                    Cambiar
                  </button>
                </div>
              )}

              {errorEscaneo && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{errorEscaneo}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 pt-3 border-t border-gray-100 shrink-0">
              <button
                type="button"
                onClick={() => setModalEscaneoAbierto(false)}
                className="order-2 sm:order-1 w-full sm:w-auto px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={procesarDocumentoConIA}
                disabled={escaneandoIA || (archivosEscaneo.length === 0 && !textoEscaneo.trim())}
                className="order-1 sm:order-2 w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {escaneandoIA ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analizando con Gemini...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Extraer y Llenar Datos ✨</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALES IGUALES */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white sm:rounded-2xl rounded-t-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 shrink-0">
              <h2 className="text-lg font-bold text-gray-800">
                {pacienteEditando?.id ? "Editar Paciente" : "Agregar Paciente al Censo"}
              </h2>
              {!pacienteEditando?.id && (
                <button
                  type="button"
                  onClick={() => {
                    setModalAbierto(false);
                    setArchivosEscaneo([]);
                    setTextoEscaneo("");
                    setErrorEscaneo("");
                    setModalEscaneoAbierto(true);
                  }}
                  className="text-xs font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Auto-llenar con Foto
                </button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wider">Cama *</label>
                    <input type="text" placeholder="Ej. 12A" value={pacienteEditando?.cama || ""} onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), cama: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wider">Edad</label>
                    <input type="text" placeholder="Ej. 65" value={pacienteEditando?.edad || ""} onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), edad: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wider">F. Ingreso *</label>
                    <input type="date" value={pacienteEditando?.fechaIngreso || hoyStr} onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), fechaIngreso: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wider">Nombre Completo *</label>
                  <input type="text" placeholder="Ej. Juan Pérez" value={pacienteEditando?.nombre || ""} onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), nombre: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wider">Diagnóstico Principal</label>
                  <input type="text" placeholder="Ej. Neumonía grave" value={pacienteEditando?.diagnostico || ""} onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), diagnostico: e.target.value }))} className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-400" />
                </div>
                <div className="bg-indigo-50/50 p-3.5 rounded-xl border border-indigo-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold uppercase text-indigo-900 tracking-wider flex items-center gap-1.5">
                      <Syringe className="w-4 h-4 text-indigo-600" /> Esquema Antibiótico / Antimicrobianos
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        const lista = obtenerAntibioticos(pacienteEditando);
                        const nuevaLista = [...lista, { id: Date.now().toString() + Math.random().toString().slice(2, 5), nombre: "", dias: "" }];
                        setPacienteEditando(prev => ({
                          ...(prev || {}),
                          antibioticos: nuevaLista
                        }));
                      }}
                      className="px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-sm transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" /> Agregar Antibiótico
                    </button>
                  </div>

                  {/* Lista de Antibióticos dinámicos */}
                  <div className="space-y-2">
                    {obtenerAntibioticos(pacienteEditando).map((atb, idx) => (
                      <div key={atb.id || idx} className="grid grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm">
                        <div className="col-span-7">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Antibiótico {idx + 1}</label>
                          <input
                            type="text"
                            placeholder="Ej. Fluconazol / Ceftriaxona / Meropenem"
                            value={atb.nombre}
                            onChange={e => {
                              const lista = [...obtenerAntibioticos(pacienteEditando)];
                              lista[idx] = { ...lista[idx], nombre: e.target.value };
                              setPacienteEditando(prev => ({ ...(prev || {}), antibioticos: lista }));
                            }}
                            className="w-full p-2 border border-indigo-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                          />
                        </div>
                        <div className="col-span-4">
                          <label className="block text-[9px] font-bold text-gray-500 uppercase mb-0.5">Días / Duración</label>
                          <input
                            type="text"
                            placeholder="Ej. 4 días"
                            value={atb.dias}
                            onChange={e => {
                              const lista = [...obtenerAntibioticos(pacienteEditando)];
                              lista[idx] = { ...lista[idx], dias: e.target.value };
                              setPacienteEditando(prev => ({ ...(prev || {}), antibioticos: lista }));
                            }}
                            className="w-full p-2 border border-indigo-200 rounded-lg text-xs bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                          />
                        </div>
                        <div className="col-span-1 flex justify-center pt-3">
                          <button
                            type="button"
                            onClick={() => {
                              const lista = obtenerAntibioticos(pacienteEditando).filter((_, i) => i !== idx);
                              setPacienteEditando(prev => ({ ...(prev || {}), antibioticos: lista }));
                            }}
                            className="text-gray-400 hover:text-red-500 p-1 rounded hover:bg-red-50 transition-colors"
                            title="Eliminar este antibiótico"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}

                    {obtenerAntibioticos(pacienteEditando).length === 0 && (
                      <div className="text-center py-2.5 text-xs text-indigo-500 italic bg-white/70 rounded-lg border border-dashed border-indigo-200">
                        Sin antibióticos registrados. Presiona <strong className="font-semibold text-indigo-700">"+ Agregar Antibiótico"</strong> para añadir los antimicrobianos que recibe el paciente.
                      </div>
                    )}
                  </div>

                  <div className="mt-1 pt-1.5 border-t border-indigo-100/60">
                    <label className="block text-[10px] font-bold uppercase text-indigo-700 mb-1 tracking-wider">Foco de Infección / Cobertura Global</label>
                    <input
                      type="text"
                      placeholder="Ej. NAC / ITU / Candidiasis esofágica / Foco abdominal"
                      value={pacienteEditando?.incobertura || ""}
                      onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), incobertura: e.target.value }))}
                      className="w-full p-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none"
                    />
                  </div>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-200 space-y-3">
                  <div className="flex items-center justify-between">
                      <label className="text-xs font-bold uppercase text-gray-700 flex items-center gap-1.5"><Bandage className="w-4 h-4 text-indigo-600" /> ¿Requiere Control de Curaciones?</label>
                      <input type="checkbox" checked={pacienteEditando?.curacion?.activo || false} onChange={e => { const cur = pacienteEditando?.curacion || { ultimaFecha: hoyStr, frecuenciaDias: 3, tipo: "" }; setPacienteEditando(prev => ({ ...(prev || {}), curacion: { ...cur, activo: e.target.checked } })); }} className="w-5 h-5 text-blue-600 rounded border-gray-300" />
                  </div>
                  {pacienteEditando?.curacion?.activo && (
                      <div className="space-y-3 pt-3 border-t border-gray-200">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Tipo de Herida / Curación</label>
                            <input type="text" placeholder="Ej. Herida operatoria..." value={pacienteEditando?.curacion?.tipo || ""} onChange={e => { const cur = pacienteEditando?.curacion || { activo: true, ultimaFecha: hoyStr, frecuenciaDias: 3, tipo: "" }; setPacienteEditando(prev => ({ ...(prev || {}), curacion: { ...cur, tipo: e.target.value } })); }} className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-blue-400" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Última Curación</label>
                              <input type="date" value={pacienteEditando?.curacion?.ultimaFecha || hoyStr} onChange={e => { const cur = pacienteEditando?.curacion || { activo: true, ultimaFecha: hoyStr, frecuenciaDias: 3, tipo: "" }; setPacienteEditando(prev => ({ ...(prev || {}), curacion: { ...cur, ultimaFecha: e.target.value } })); }} className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-blue-400" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-600 uppercase tracking-wider mb-1">Frecuencia (días)</label>
                              <input type="number" min="1" value={pacienteEditando?.curacion?.frecuenciaDias || 3} onChange={e => { const cur = pacienteEditando?.curacion || { activo: true, ultimaFecha: hoyStr, frecuenciaDias: 3, tipo: "" }; setPacienteEditando(prev => ({ ...(prev || {}), curacion: { ...cur, frecuenciaDias: Number(e.target.value) } })); }} className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:ring-1 focus:ring-blue-400" />
                            </div>
                        </div>
                      </div>
                  )}
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1 tracking-wider">Anamnesis / Antecedentes Base</label>
                  <textarea rows={3} placeholder="Historia clínica inicial..." value={pacienteEditando?.anamnesis || ""} onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), anamnesis: e.target.value }))} className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm outline-none resize-none focus:ring-2 focus:ring-blue-400 leading-relaxed" />
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 pt-3 border-t border-gray-100 shrink-0">
              <button onClick={() => setModalAbierto(false)} className="order-2 sm:order-1 w-full sm:w-auto px-5 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-bold rounded-xl transition-colors">Cancelar</button>
              <button onClick={guardarPaciente} className="order-1 sm:order-2 w-full sm:w-auto px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors">
                <Save className="w-4 h-4" /> Guardar Paciente
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEvolucionAbierto && pacienteSeleccionadoEvolucion && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white sm:rounded-2xl rounded-t-2xl max-w-2xl w-full p-4 sm:p-6 space-y-4 shadow-2xl max-h-[90vh] flex flex-col animate-in slide-in-from-bottom-4 sm:zoom-in-95">
            <div className="border-b border-gray-100 pb-3 flex justify-between items-start shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-800 leading-tight">Evoluciones: {pacienteSeleccionadoEvolucion.nombre}</h2>
                <p className="text-xs text-gray-500 mt-1">Cama {pacienteSeleccionadoEvolucion.cama} • Dx: {pacienteSeleccionadoEvolucion.diagnostico}</p>
              </div>
              <button onClick={() => setModalEvolucionAbierto(false)} className="text-gray-400 hover:text-gray-700 bg-gray-50 p-1.5 rounded-lg transition-colors"><X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-4 pr-1 -mr-1">
                <div className="bg-slate-50 p-3 sm:p-4 rounded-xl border border-gray-200 space-y-3 shrink-0">
                  <div className="flex justify-between items-center">
                    <div className="flex flex-col xs:flex-row gap-2 flex-1 mr-2">
                        <button type="button" onClick={() => setTipoNota("normal")} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${ tipoNota === "normal" ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50" }`}><FileText className="w-4 h-4" /> Evolución Normal</button>
                        <button type="button" onClick={() => setTipoNota("ic")} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${ tipoNota === "ic" ? "bg-purple-600 border-purple-600 text-white shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50" }`}><Stethoscope className="w-4 h-4" /> Respuesta (IC)</button>
                    </div>
                    <button
                      type="button"
                      onClick={() => setMostrarEscaneoEvo(!mostrarEscaneoEvo)}
                      className={`px-3 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                        mostrarEscaneoEvo
                          ? "bg-purple-700 text-white border-purple-700"
                          : "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100"
                      }`}
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Foto / Doc (IA)</span>
                    </button>
                  </div>

                  {/* Panel desplegable de escaneo con IA para evolución */}
                  {mostrarEscaneoEvo && (
                    <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-3 space-y-3 animate-in fade-in">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Extraer Evolución o IC con IA
                        </span>
                        <button
                          type="button"
                          onClick={() => setMostrarEscaneoEvo(false)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <label className="flex items-center justify-center gap-1.5 p-2.5 bg-white border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50 text-purple-900 text-xs font-bold transition-colors">
                          <Camera className="w-4 h-4 text-purple-600" />
                          <span>Tomar Foto</span>
                          <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleFileSelectEvo} />
                        </label>
                        <label className="flex items-center justify-center gap-1.5 p-2.5 bg-white border border-purple-200 rounded-lg cursor-pointer hover:bg-purple-50 text-purple-900 text-xs font-bold transition-colors">
                          <FileUp className="w-4 h-4 text-blue-600" />
                          <span>Subir Archivos / PDFs</span>
                          <input type="file" accept="image/*,application/pdf,.txt" multiple className="hidden" onChange={handleFileSelectEvo} />
                        </label>
                      </div>

                      {archivosEvo.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold text-purple-900 uppercase">
                            Archivos listos para procesar ({archivosEvo.length}):
                          </span>
                          <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
                            {archivosEvo.map((arc, idx) => (
                              <div key={idx} className="bg-white p-2 rounded-lg border border-purple-100 flex items-center justify-between text-xs shadow-2xs">
                                <span className="truncate font-medium text-gray-700">📄 {arc.nombre}</span>
                                <button 
                                  type="button" 
                                  onClick={() => removerArchivoEvo(idx)} 
                                  className="text-red-500 hover:bg-red-50 p-1 rounded font-bold ml-2 transition-colors"
                                  title="Quitar este archivo"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <textarea
                        rows={2}
                        value={textoEvoAI}
                        onChange={(e) => setTextoEvoAI(e.target.value)}
                        placeholder="O pega link de Google Docs, notas del pase de sala o respuesta de interconsulta..."
                        className="w-full p-2.5 bg-white border border-purple-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-400 resize-none text-gray-800"
                      />

                      {errorEvoAI && (
                        <p className="text-xs text-red-600 font-semibold">{errorEvoAI}</p>
                      )}

                      <button
                        type="button"
                        onClick={procesarEvolucionConIA}
                        disabled={escaneandoEvoIA || (archivosEvo.length === 0 && !textoEvoAI.trim())}
                        className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shadow-sm"
                      >
                        {escaneandoEvoIA ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            <span>Extrayendo con Gemini...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Procesar y Llenar Evolución ✨</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {/* Banner de Edición Activa */}
                  {evolucionEditando && (
                    <div className="bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-amber-900 dark:text-amber-300 font-bold">
                        <Edit3 className="w-4 h-4 text-amber-600" />
                        <span>Editando nota del {evolucionEditando.fecha.split('-').reverse().join('/')}</span>
                      </div>
                      <button
                        type="button"
                        onClick={cancelarEdicionEvolucion}
                        className="text-xs bg-white dark:bg-slate-800 text-gray-700 dark:text-slate-300 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-slate-700 font-semibold hover:bg-gray-100"
                      >
                        Cancelar Edición
                      </button>
                    </div>
                  )}

                  {/* Selector de Fecha de la Evolución */}
                  <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-gray-200 dark:border-slate-700">
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-blue-600" /> Fecha de la Evolución / Nota
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="date"
                        value={fechaEvolucion}
                        onChange={(e) => setFechaEvolucion(e.target.value)}
                        className="p-2 border border-gray-300 dark:border-slate-700 rounded-lg text-xs bg-gray-50 dark:bg-slate-800 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-400 flex-1 font-mono"
                      />
                      {fechaEvolucion !== hoyStr && (
                        <button
                          type="button"
                          onClick={() => setFechaEvolucion(hoyStr)}
                          className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 text-[11px] font-bold rounded-lg border border-blue-200 dark:border-blue-800 hover:bg-blue-100 shrink-0"
                        >
                          Hoy ({hoyStr.split('-').reverse().join('/')})
                        </button>
                      )}
                    </div>
                  </div>

                  {tipoNota === "ic" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-purple-50 p-3 rounded-lg border border-purple-200">
                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 uppercase tracking-wider mb-1">Especialidad</label>
                        <input type="text" placeholder="Ej. Gastroenterología" value={especialidadIC} onChange={e => setEspecialidadIC(e.target.value)} className="w-full p-2 border border-purple-200 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-purple-400" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-purple-900 uppercase tracking-wider mb-1">Médico Especialista</label>
                        <input type="text" placeholder="Ej. Dr. Karelovic" value={medicoIC} onChange={e => setMedicoIC(e.target.value)} className="w-full p-2 border border-purple-200 rounded-lg text-xs bg-white outline-none focus:ring-2 focus:ring-purple-400" />
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-600 tracking-wider mb-1.5">
                      {evolucionEditando 
                        ? `Modificar Contenido de la Nota (${fechaEvolucion.split('-').reverse().join('/')}):` 
                        : (tipoNota === "ic" ? "Sugerencias y Plan del Especialista:" : `Contenido de la Evolución (${fechaEvolucion.split('-').reverse().join('/')}):`)}
                    </label>
                    <textarea rows={3} placeholder={tipoNota === "ic" ? "Pega aquí lo que recomendó el especialista..." : "Escribe la evolución clínica, notas de turno o plan del día..."} value={nuevoTextoEvolucion} onChange={e => setNuevoTextoEvolucion(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400 resize-none leading-relaxed" />
                  </div>
                  <div className="flex justify-end gap-2">
                    {evolucionEditando && (
                      <button
                        type="button"
                        onClick={cancelarEdicionEvolucion}
                        className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
                      >
                        Cancelar
                      </button>
                    )}
                    <button onClick={guardarEvolucion} className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-colors ${evolucionEditando ? "bg-amber-600 hover:bg-amber-700" : (tipoNota === "ic" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700")}`}>
                      {evolucionEditando 
                        ? "Guardar Cambios 💾" 
                        : (tipoNota === "ic" ? "Guardar Respuesta IC 🩺" : "Guardar y Registrar Nota 🚀")}
                    </button>
                  </div>
                </div>
                <div className="space-y-3 pt-2">
                <h3 className="text-[10px] font-bold uppercase text-gray-500 tracking-wider">Historial de Evoluciones e Interconsultas</h3>
                <div className="space-y-3">
                    {Array.isArray(pacienteSeleccionadoEvolucion.evoluciones) && pacienteSeleccionadoEvolucion.evoluciones.map((evo) => {
                    const esIC = evo.tipo === "ic";
                    return (
                        <div key={evo.id} className={`border p-3.5 rounded-xl space-y-2 text-xs shadow-sm ${esIC ? "bg-purple-50/50 border-purple-200" : "bg-white border-gray-200"}`}>
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 border-b border-gray-100 pb-2">
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-1.5 text-gray-700 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit text-[10px] md:text-xs font-bold">
                                <Calendar className="w-3.5 h-3.5 text-blue-600" /> {evo.fecha.split('-').reverse().join('/')}
                              </div>
                              {esIC && (
                                <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase flex items-center gap-1 w-fit"><Stethoscope className="w-3.5 h-3.5" /> IC: {evo.especialidad} ({evo.medico})</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => iniciarEdicionEvolucion(evo)}
                                className="text-gray-500 hover:text-blue-600 p-1.5 bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
                                title="Editar esta evolución"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => eliminarEvolucion(evo.id, evo.fecha)}
                                className="text-gray-400 hover:text-red-600 p-1.5 bg-gray-50 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1 text-[11px] font-medium"
                                title="Eliminar esta evolución"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>Eliminar</span>
                              </button>
                            </div>
                        </div>
                        <p className="text-gray-800 font-sans whitespace-pre-wrap leading-relaxed text-sm">{evo.texto}</p>
                        </div>
                    );
                    })}
                    {(!pacienteSeleccionadoEvolucion.evoluciones || pacienteSeleccionadoEvolucion.evoluciones.length === 0) && (
                    <div className="text-center bg-gray-50 border border-dashed border-gray-200 rounded-xl py-8"><FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-xs font-medium">No hay evoluciones registradas.</p></div>
                    )}
                </div>
                </div>
            </div>
            <div className="border-t border-gray-100 pt-3 shrink-0">
              <button onClick={() => setModalEvolucionAbierto(false)} className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-800 text-sm font-bold rounded-xl transition-colors">Cerrar Historial</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ControlClinicoCard({ paciente }: { paciente: PacienteCenso }) {
  const [minimizado, setMinimizado] = useState<boolean>(() => {
    try {
      const guardado = localStorage.getItem(`wc_control_min_${paciente.id}`);
      return guardado !== null ? guardado === "true" : false;
    } catch {
      return false;
    }
  });

  const toggleMinimizado = () => {
    setMinimizado(prev => {
      const nuevo = !prev;
      try {
        localStorage.setItem(`wc_control_min_${paciente.id}`, String(nuevo));
      } catch {}
      return nuevo;
    });
  };

  const [nombreInv, setNombreInv] = useState("");
  const [fechaInv, setFechaInv] = useState(new Date().toISOString().split("T")[0]);
  const [pacienteState, setPacienteState] = useState(paciente);
  useEffect(() => { setPacienteState(paciente); }, [paciente]);

  const calcularDias = (fechaInicio: string) => {
    if (!fechaInicio) return 0;
    const inicio = new Date(fechaInicio);
    const hoy = new Date();
    const diffTime = hoy.getTime() - inicio.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 ? diffDays : 0;
  };

  const agregarDispositivo = () => {
    if (!nombreInv.trim()) return;
    const listaActual = Array.isArray(pacienteState.invasivos) ? pacienteState.invasivos : [];
    const actualizado = { ...pacienteState, invasivos: [...listaActual, { id: Date.now().toString(), nombre: nombreInv.trim(), fechaInstalacion: fechaInv }] };
    setPacienteState(actualizado);
    actualizarStoragePaciente(actualizado);
    setNombreInv("");
  };

  const actualizarFechaInvasivo = (id: string, nuevaFecha: string) => {
    const listaActual = Array.isArray(pacienteState.invasivos) ? pacienteState.invasivos : [];
    const actualizado = { ...pacienteState, invasivos: listaActual.map(i => i.id === id ? { ...i, fechaInstalacion: nuevaFecha } : i) };
    setPacienteState(actualizado);
    actualizarStoragePaciente(actualizado);
  };

  const eliminarDispositivo = (id: string) => {
    const listaActual = Array.isArray(pacienteState.invasivos) ? pacienteState.invasivos : [];
    const actualizado = { ...pacienteState, invasivos: listaActual.filter(i => i.id !== id) };
    setPacienteState(actualizado);
    actualizarStoragePaciente(actualizado);
  };

  const eliminarCuracion = () => {
    const actualizado = { ...pacienteState, curacion: { activo: false, ultimaFecha: "", frecuenciaDias: 0, tipo: "" } };
    setPacienteState(actualizado);
    actualizarStoragePaciente(actualizado);
  };

  const actualizarStoragePaciente = (pacienteActualizado: PacienteCenso) => {
    try {
      const guardados = localStorage.getItem("ward_commander_censo");
      if (guardados) {
        const parsed = JSON.parse(guardados);
        const nuevos = parsed.map((p: any) => p.id === pacienteActualizado.id ? pacienteActualizado : p);
        localStorage.setItem("ward_commander_censo", JSON.stringify(nuevos));
        guardarEnNube('censo', nuevos);
      }
    } catch (e) {}
  };

  const listaAtb = obtenerAntibioticos(pacienteState);
  const tieneAtb = listaAtb.length > 0;
  const tieneInvasivos = Array.isArray(pacienteState.invasivos) && pacienteState.invasivos.length > 0;
  const tieneCuracion = Boolean(pacienteState.curacion?.activo && pacienteState.curacion?.tipo);

  return (
    <div className="mt-2.5 bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 shadow-sm space-y-2 transition-all">
      <div className="flex items-center justify-between text-indigo-900 font-bold text-xs cursor-pointer select-none" onClick={toggleMinimizado}>
        <div className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-indigo-600 shrink-0" /><span>Control ATB, Infección & Invasivos</span></div>
        <button className="p-1 hover:bg-indigo-100 rounded-md transition-colors" title={minimizado ? "Expandir" : "Minimizar"}>{minimizado ? <ChevronDown className="w-4 h-4 text-indigo-700" /> : <ChevronUp className="w-4 h-4 text-indigo-700" />}</button>
      </div>
      {!minimizado && (
        <div className="space-y-2.5 pt-1 text-xs">
          {tieneAtb && (
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm space-y-2">
              <div className="flex items-center justify-between text-indigo-800 font-bold">
                <div className="flex items-center gap-1.5">
                  <Syringe className="w-3.5 h-3.5 text-indigo-500" />
                  <span>Antibióticos ({listaAtb.length}):</span>
                </div>
              </div>
              <div className="space-y-1.5">
                {listaAtb.map((atb, aIdx) => (
                  <div key={atb.id || aIdx} className="flex justify-between items-center bg-indigo-50/60 p-2 rounded-lg border border-indigo-100/70">
                    <span className="font-bold text-indigo-950 text-xs">{atb.nombre}</span>
                    <span className="text-[11px] font-bold bg-white text-indigo-700 px-2 py-0.5 rounded border border-indigo-200 shrink-0">
                      {atb.dias || "Días s/e"}
                    </span>
                  </div>
                ))}
              </div>
              {pacienteState.incobertura && (
                <div className="pt-1.5 mt-1 border-t border-indigo-50 flex items-start gap-1.5 text-amber-800 font-semibold"><ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" /><span className="leading-snug">Posible Infección / Foco:<br/><span className="text-gray-600 font-normal">{pacienteState.incobertura}</span></span></div>
              )}
            </div>
          )}
          <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm space-y-2">
            <span className="font-bold text-indigo-800 block">Dispositivos Invasivos:</span>
            <div className="space-y-2">
              {tieneInvasivos && pacienteState.invasivos.map(inv => {
                const diasCalculados = calcularDias(inv.fechaInstalacion);
                return (
                  <div key={inv.id} className="flex flex-col gap-1.5 bg-slate-50 p-2 rounded-lg border border-gray-100">
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-gray-800 font-bold leading-tight">{inv.nombre}</span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className={`font-bold px-2 py-0.5 rounded text-[10px] ${diasCalculados > 7 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>{diasCalculados} días</span>
                        <button onClick={() => eliminarDispositivo(inv.id)} className="text-gray-300 hover:text-red-500 bg-white p-1 rounded transition-colors border border-gray-100" title="Eliminar dispositivo"><X className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 pt-1 border-t border-gray-200">
                      <span>Instalado el:</span>
                      <input type="date" value={inv.fechaInstalacion || new Date().toISOString().split("T")[0]} onChange={e => actualizarFechaInvasivo(inv.id, e.target.value)} className="bg-white border border-gray-200 rounded px-1.5 py-0.5 text-[11px] font-mono text-gray-700 outline-none focus:border-indigo-400" />
                    </div>
                  </div>
                );
              })}
              {!tieneInvasivos && (<p className="text-gray-400 text-[11px] italic bg-gray-50 p-2 rounded text-center border border-dashed border-gray-200">Sin dispositivos invasivos registrados.</p>)}
            </div>
            <div className="flex flex-col sm:flex-row gap-2 pt-2 mt-2 border-t border-gray-100">
              <input type="text" placeholder="Ej. CVC, Sonda Foley..." value={nombreInv} onChange={e => setNombreInv(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') agregarDispositivo(); }} className="w-full text-xs p-2 border border-gray-200 rounded-lg bg-gray-50 outline-none focus:ring-1 focus:ring-indigo-400" />
              <div className="flex gap-2">
                <input type="date" value={fechaInv} onChange={e => setFechaInv(e.target.value)} className="w-full sm:w-auto text-xs p-2 border border-gray-200 rounded-lg bg-gray-50 outline-none font-mono focus:ring-1 focus:ring-indigo-400" />
                <button onClick={agregarDispositivo} className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-xs rounded-lg font-bold shadow-sm transition-colors shrink-0 flex items-center justify-center"><Plus className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
          {tieneCuracion && (
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm flex justify-between items-start">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-indigo-800 font-bold"><Bandage className="w-3.5 h-3.5 text-indigo-500" /> Control Curaciones</div>
                <p className="text-gray-700 pl-5 text-[11px] leading-relaxed"><span className="font-semibold text-gray-900 block">{pacienteState.curacion.tipo}</span> Última: <span className="font-mono bg-gray-50 px-1 border rounded">{pacienteState.curacion.ultimaFecha?.split('-').reverse().join('/') || "N/A"}</span> <br/><span className="text-gray-500">Frecuencia: cada {pacienteState.curacion.frecuenciaDias} días</span></p>
              </div>
              <button onClick={eliminarCuracion} className="text-gray-300 hover:text-red-500 p-1.5 bg-gray-50 rounded-md transition-colors border border-gray-100" title="Eliminar curación"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AlertaGesCard({ pacienteId, gesDetectados }: { pacienteId: string; gesDetectados: PatologiaGes[] }) {
  const [minimizado, setMinimizado] = useState<boolean>(() => {
    try {
      const guardado = localStorage.getItem(`wc_ges_min_${pacienteId}`);
      return guardado !== null ? guardado === "true" : false;
    } catch {
      return false;
    }
  });

  const toggleMinimizado = () => {
    setMinimizado(prev => {
      const nuevo = !prev;
      try {
        localStorage.setItem(`wc_ges_min_${pacienteId}`, String(nuevo));
      } catch {}
      return nuevo;
    });
  };

  const [estadoGes, setEstadoGes] = useState<Record<number, string>>(() => {
    try {
      const guardado = localStorage.getItem(`ges_estado_${pacienteId}`);
      return guardado ? JSON.parse(guardado) : {};
    } catch {
      return {};
    }
  });

  const cambiarEstado = (numeroGes: number, respuesta: "Sí" | "No" | "Eliminado") => {
    const nuevo = { ...estadoGes, [numeroGes]: respuesta };
    setEstadoGes(nuevo);
    localStorage.setItem(`ges_estado_${pacienteId}`, JSON.stringify(nuevo));
  };

  const gesVisibles = gesDetectados.filter(ges => estadoGes[ges.numero] !== "Eliminado");
  if (gesVisibles.length === 0) return null;

  return (
    <div className="mt-3 bg-amber-50/50 border border-amber-200 rounded-xl p-3 shadow-sm space-y-2 transition-all">
      <div className="flex items-center justify-between text-amber-800 font-bold text-xs cursor-pointer select-none" onClick={toggleMinimizado}>
        <div className="flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" /><span>Alerta GES Detectada ({gesVisibles.length})</span></div>
        <button className="p-1 hover:bg-amber-100 rounded-md transition-colors" title={minimizado ? "Expandir" : "Minimizar"}>{minimizado ? <ChevronDown className="w-4 h-4 text-amber-700" /> : <ChevronUp className="w-4 h-4 text-amber-700" />}</button>
      </div>
      {!minimizado && (
        <div className="space-y-2 pt-1.5">
          {gesVisibles.map(ges => {
            const resp = estadoGes[ges.numero];
            return (
              <div key={ges.numero} className="bg-white p-2.5 rounded-lg border border-amber-200 shadow-sm flex flex-col gap-2 text-xs">
                <div className="flex justify-between items-start gap-2">
                    <div><span className="font-black text-gray-900 block md:inline">GES Nº {ges.numero}:</span> <span className="text-gray-700 font-medium">{ges.nombre}</span></div>
                    <button onClick={() => cambiarEstado(ges.numero, "Eliminado")} className="text-gray-300 hover:text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors border border-transparent hover:border-red-100 shrink-0" title="Descartar / Eliminar esta alerta"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center pt-2 border-t border-amber-50 gap-2">
                  <span className="text-[10px] md:text-[11px] text-gray-500 font-bold uppercase tracking-wider">¿Activado en sistema?</span>
                  <div className="flex gap-1.5 w-full sm:w-auto">
                    <button onClick={() => cambiarEstado(ges.numero, "Sí")} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all border ${resp === "Sí" ? "bg-green-600 border-green-600 text-white shadow-md" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>Sí</button>
                    <button onClick={() => cambiarEstado(ges.numero, "No")} className={`flex-1 sm:flex-none px-4 py-1.5 rounded-md text-xs font-bold transition-all border ${resp === "No" ? "bg-red-600 border-red-600 text-white shadow-md" : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"}`}>No</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
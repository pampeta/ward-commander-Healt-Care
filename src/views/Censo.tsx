import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit3, Save, CheckCircle2, Circle, FileText, Calendar, AlertTriangle, ChevronDown, ChevronUp, X, ShieldAlert, Activity, Syringe, Bandage, Stethoscope, CloudCloud } from "lucide-react";
import { guardarEnNube, cargarDeNube } from "../Services/cloudSync";

interface Pendiente { id: string; texto: string; completado: boolean; }
interface Evolucion { id: string; fecha: string; texto: string; tipo?: "normal" | "ic"; especialidad?: string; medico?: string; }
interface DispositivoInvasivo { id: string; nombre: string; fechaInstalacion: string; }
interface Curacion { activo: boolean; ultimaFecha: string; frecuenciaDias: number; tipo: string; }
interface PacienteCenso {
  id: string; cama: string; nombre: string; edad: string; diagnostico: string;
  anamnesis: string; fechaIngreso: string; atbNombre: string; atbDias: string;
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

  const [modalEvolucionAbierto, setModalEvolucionAbierto] = useState(false);
  const [pacienteSeleccionadoEvolucion, setPacienteSeleccionadoEvolucion] = useState<PacienteCenso | null>(null);
  
  const [tipoNota, setTipoNota] = useState<"normal" | "ic">("normal");
  const [nuevoTextoEvolucion, setNuevoTextoEvolucion] = useState("");
  const [especialidadIC, setEspecialidadIC] = useState("");
  const [medicoIC, setMedicoIC] = useState("");
  
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

    if (pacienteEditando.id) {
      setPacientes(prev => prev.map(p => p.id === pacienteEditando.id ? { 
        ...p, 
        ...(pacienteEditando as PacienteCenso),
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
        atbNombre: pacienteEditando.atbNombre || "",
        atbDias: pacienteEditando.atbDias || "",
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

  const guardarEvolucion = () => {
    if (!pacienteSeleccionadoEvolucion || !nuevoTextoEvolucion.trim()) return;
    if (tipoNota === "ic" && (!especialidadIC.trim() || !medicoIC.trim())) {
      alert("Por favor ingresa la especialidad y el nombre del doctor.");
      return;
    }

    const nuevaEvo: Evolucion = {
      id: Date.now().toString(),
      fecha: hoyStr,
      texto: nuevoTextoEvolucion.trim(),
      tipo: tipoNota,
      especialidad: tipoNota === "ic" ? especialidadIC.trim() : undefined,
      medico: tipoNota === "ic" ? medicoIC.trim() : undefined
    };

    setPacientes(prev => prev.map(p => {
      if (p.id === pacienteSeleccionadoEvolucion.id) {
        const listaEvoluciones = Array.isArray(p.evoluciones) ? p.evoluciones : [];
        return {
          ...p,
          evoluciones: [nuevaEvo, ...listaEvoluciones],
          ultimaEvolucionFecha: hoyStr
        };
      }
      return p;
    }));

    setNuevoTextoEvolucion("");
    setEspecialidadIC("");
    setMedicoIC("");
    setTipoNota("normal");
    setModalEvolucionAbierto(false);
    setPacienteSeleccionadoEvolucion(null);
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
            {!descargando && <span className="flex items-center gap-1 bg-green-50 text-green-700 font-semibold px-2 py-0.5 rounded-md border border-green-200 ml-2"><CloudCloud className="w-3 h-3"/> En la nube</span>}
          </div>
        </div>
        <button
          onClick={() => { 
            setPacienteEditando({ 
              fechaIngreso: hoyStr, 
              curacion: { activo: false, ultimaFecha: hoyStr, frecuenciaDias: 3, tipo: "" } 
            }); 
            setModalAbierto(true); 
          }}
          className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl md:rounded-lg text-sm font-bold flex justify-center items-center gap-2 shadow transition-colors"
        >
          <Plus className="w-4 h-4" /> Nuevo Paciente
        </button>
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
                      <button onClick={() => { setPacienteEditando(p); setModalAbierto(true); }} className="text-gray-400 hover:text-blue-600 p-1.5 bg-gray-50 rounded-md transition-colors" title="Editar datos">
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

      {/* MODALES IGUALES */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 transition-all">
          <div className="bg-white sm:rounded-2xl rounded-t-2xl max-w-2xl w-full p-5 space-y-4 shadow-2xl animate-in slide-in-from-bottom-4 sm:zoom-in-95 max-h-[90vh] flex flex-col">
            <h2 className="text-lg font-bold text-gray-800 border-b border-gray-100 pb-3 shrink-0">
              {pacienteEditando?.id ? "Editar Paciente" : "Agregar Paciente al Censo"}
            </h2>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-indigo-50/50 p-3 rounded-xl border border-indigo-100">
                  <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-700 mb-1 tracking-wider">Antibiótico (ATB)</label>
                      <input type="text" placeholder="Ej. Ceftriaxona" value={pacienteEditando?.atbNombre || ""} onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), atbNombre: e.target.value }))} className="w-full p-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none" />
                  </div>
                  <div>
                      <label className="block text-[10px] font-bold uppercase text-indigo-700 mb-1 tracking-wider">Días ATB</label>
                      <input type="text" placeholder="Ej. 5 días" value={pacienteEditando?.atbDias || ""} onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), atbDias: e.target.value }))} className="w-full p-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none" />
                  </div>
                  <div className="sm:col-span-2 mt-1">
                      <label className="block text-[10px] font-bold uppercase text-indigo-700 mb-1 tracking-wider">Foco de Infección / Cobertura</label>
                      <input type="text" placeholder="Ej. NAC / ITU / Foco urinario" value={pacienteEditando?.incobertura || ""} onChange={e => setPacienteEditando(prev => ({ ...(prev || {}), incobertura: e.target.value }))} className="w-full p-2 border border-indigo-200 rounded-lg text-sm bg-white focus:ring-2 focus:ring-indigo-400 outline-none" />
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
                <div className="flex flex-col xs:flex-row gap-2">
                    <button type="button" onClick={() => setTipoNota("normal")} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${ tipoNota === "normal" ? "bg-blue-600 border-blue-600 text-white shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50" }`}><FileText className="w-4 h-4" /> Evolución Normal</button>
                    <button type="button" onClick={() => setTipoNota("ic")} className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${ tipoNota === "ic" ? "bg-purple-600 border-purple-600 text-white shadow-md" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50" }`}><Stethoscope className="w-4 h-4" /> Respuesta (IC)</button>
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
                    <label className="block text-[10px] font-bold uppercase text-gray-600 tracking-wider mb-1.5">{tipoNota === "ic" ? "Sugerencias y Plan del Especialista:" : `Agregar Evolución de Hoy (${hoyStr.split('-').reverse().join('/')})`}</label>
                    <textarea rows={3} placeholder={tipoNota === "ic" ? "Pega aquí lo que recomendó el especialista..." : "Escribe la evolución clínica, notas de turno o plan del día..."} value={nuevoTextoEvolucion} onChange={e => setNuevoTextoEvolucion(e.target.value)} className="w-full p-3 border border-gray-300 rounded-xl text-sm bg-white outline-none focus:ring-2 focus:ring-blue-400 resize-none leading-relaxed" />
                </div>
                <div className="flex justify-end">
                    <button onClick={guardarEvolucion} className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white shadow-md transition-colors ${tipoNota === "ic" ? "bg-purple-600 hover:bg-purple-700" : "bg-blue-600 hover:bg-blue-700"}`}>
                    {tipoNota === "ic" ? "Guardar Respuesta IC 🩺" : "Guardar y Marcar Evolucionado 🚀"}
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
                            <div className="flex items-center gap-1.5 text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded w-fit text-[10px] md:text-xs">
                            <Calendar className="w-3.5 h-3.5" /> {evo.fecha.split('-').reverse().join('/')}
                            </div>
                            {esIC && (
                            <span className="bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-lg text-[10px] uppercase flex items-center gap-1 w-fit"><Stethoscope className="w-3.5 h-3.5" /> IC: {evo.especialidad} ({evo.medico})</span>
                            )}
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
  const [minimizado, setMinimizado] = useState(false);
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

  const tieneAtb = Boolean(pacienteState.atbNombre && pacienteState.atbNombre.trim());
  const tieneInvasivos = Array.isArray(pacienteState.invasivos) && pacienteState.invasivos.length > 0;
  const tieneCuracion = Boolean(pacienteState.curacion?.activo && pacienteState.curacion?.tipo);

  return (
    <div className="mt-2.5 bg-indigo-50/40 border border-indigo-100 rounded-xl p-3 shadow-sm space-y-2 transition-all">
      <div className="flex items-center justify-between text-indigo-900 font-bold text-xs cursor-pointer select-none" onClick={() => setMinimizado(!minimizado)}>
        <div className="flex items-center gap-1.5"><Activity className="w-4 h-4 text-indigo-600 shrink-0" /><span>Control ATB, Infección & Invasivos</span></div>
        <button className="p-1 hover:bg-indigo-100 rounded-md transition-colors" title={minimizado ? "Expandir" : "Minimizar"}>{minimizado ? <ChevronDown className="w-4 h-4 text-indigo-700" /> : <ChevronUp className="w-4 h-4 text-indigo-700" />}</button>
      </div>
      {!minimizado && (
        <div className="space-y-2.5 pt-1 text-xs">
          {tieneAtb && (
            <div className="bg-white p-2.5 rounded-lg border border-indigo-100 shadow-sm space-y-1.5">
              <div className="flex items-center gap-1.5 text-indigo-800 font-bold"><Syringe className="w-3.5 h-3.5 text-indigo-500" /> Antibiótico (ATB):</div>
              <p className="text-gray-800 font-medium pl-5">{pacienteState.atbNombre} <span className="text-gray-500 font-normal">({pacienteState.atbDias || "Días no especificados"})</span></p>
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
  const [minimizado, setMinimizado] = useState(false);
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
      <div className="flex items-center justify-between text-amber-800 font-bold text-xs cursor-pointer select-none" onClick={() => setMinimizado(!minimizado)}>
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
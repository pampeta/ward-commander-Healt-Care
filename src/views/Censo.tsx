import { useState, useEffect } from "react";
import { Users, Plus, Trash2, Edit3, Save, CheckCircle2, Circle, FileText, Calendar, AlertTriangle } from "lucide-react";

interface Pendiente {
  id: string;
  texto: string;
  completado: boolean;
}

interface Evolucion {
  id: string;
  fecha: string;
  texto: string;
}

interface PacienteCenso {
  id: string;
  cama: string;
  nombre: string;
  edad: string;
  diagnostico: string;
  anamnesis: string;
  pendientes: Pendiente[];
  evoluciones: Evolucion[];
  ultimaEvolucionFecha?: string;
}

interface PatologiaGes {
  numero: number;
  nombre: string;
  keywords: string[];
}

// 📋 CATÁLOGO COMPLETO GES (1 a 90)
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
  const [pacientes, setPacientes] = useState<PacienteCenso[]>(() => {
    try {
      const guardados = localStorage.getItem("ward_commander_censo");
      if (guardados) {
        const parsed = JSON.parse(guardados);
        return parsed.map((p: any) => ({
          ...p,
          pendientes: Array.isArray(p.pendientes) ? p.pendientes : [],
          evoluciones: Array.isArray(p.evoluciones) ? p.evoluciones : []
        }));
      }
      return [
        {
          id: "1",
          cama: "12A",
          nombre: "Juan Pérez",
          edad: "68",
          diagnostico: "Neumonía adquirida en la comunidad, HTA y Diabetes tipo 2",
          anamnesis: "Cuadro de 4 días con tos productiva y disnea.",
          pendientes: [
            { id: "p1", texto: "Control de PCR y hemograma", completado: false },
            { id: "p2", texto: "Resultado de cultivo sputum", completado: true }
          ],
          evoluciones: [
            { id: "e1", fecha: "2026-07-18", texto: "Paciente estable, tolera régimen liviano. SatO2 96%." }
          ],
          ultimaEvolucionFecha: "2026-07-18"
        }
      ];
    } catch {
      return [];
    }
  });

  const [modalAbierto, setModalAbierto] = useState(false);
  const [pacienteEditando, setPacienteEditando] = useState<Partial<PacienteCenso> | null>(null);

  const [modalEvolucionAbierto, setModalEvolucionAbierto] = useState(false);
  const [pacienteSeleccionadoEvolucion, setPacienteSeleccionadoEvolucion] = useState<PacienteCenso | null>(null);
  const [nuevoTextoEvolucion, setNuevoTextoEvolucion] = useState("");
  
  const [textoNuevoPendiente, setTextoNuevoPendiente] = useState<{ [key: string]: string }>({});

  const hoyStr = new Date().toISOString().split("T")[0];

  useEffect(() => {
    localStorage.setItem("ward_commander_censo", JSON.stringify(pacientes));
  }, [pacientes]);

  const guardarPaciente = () => {
    if (!pacienteEditando?.cama || !pacienteEditando?.nombre) {
      alert("Por lo menos ingresa la Cama y el Nombre.");
      return;
    }

    if (pacienteEditando.id) {
      setPacientes(prev => prev.map(p => p.id === pacienteEditando.id ? { 
        ...p, 
        ...(pacienteEditando as PacienteCenso),
        pendientes: Array.isArray(p.pendientes) ? p.pendientes : [],
        evoluciones: Array.isArray(p.evoluciones) ? p.evoluciones : []
      } : p));
    } else {
      const nuevo: PacienteCenso = {
        id: Date.now().toString(),
        cama: pacienteEditando.cama || "",
        nombre: pacienteEditando.nombre || "",
        edad: pacienteEditando.edad || "",
        diagnostico: pacienteEditando.diagnostico || "",
        anamnesis: pacienteEditando.anamnesis || "",
        pendientes: [],
        evoluciones: []
      };
      setPacientes(prev => [...prev, nuevo]);
    }
    setModalAbierto(false);
    setPacienteEditando(null);
  };

  const eliminarPaciente = (id: string) => {
    if (confirm("¿Dar de alta / eliminar este paciente?")) {
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

    const nuevaEvo: Evolucion = {
      id: Date.now().toString(),
      fecha: hoyStr,
      texto: nuevoTextoEvolucion.trim()
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
    setModalEvolucionAbierto(false);
    setPacienteSeleccionadoEvolucion(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="w-7 h-7 text-blue-600" /> Censo de Pacientes & Evoluciones
          </h1>
          <p className="text-sm text-gray-500">Gestiona turnos, marca pendientes diarios y registra evoluciones sincronizadas con la IA.</p>
        </div>
        <button
          onClick={() => { setPacienteEditando({}); setModalAbierto(true); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 shadow"
        >
          <Plus className="w-4 h-4" /> Nuevo Paciente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pacientes.map((p) => {
          const evolucionadoHoy = p.ultimaEvolucionFecha === hoyStr;
          const listaPendientes = Array.isArray(p.pendientes) ? p.pendientes : [];
          const textoBusqueda = `${p.diagnostico || ""} ${p.anamnesis || ""}`.toLowerCase();

          // Autodetección de patologías GES
          const gesDetectados = LISTA_GES.filter(g => 
            g.keywords.some(kw => textoBusqueda.includes(kw))
          );

          return (
            <div key={p.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start border-b pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-blue-100 text-blue-800 font-black px-2.5 py-1 rounded text-xs">
                      Cama {p.cama}
                    </span>
                    {evolucionadoHoy ? (
                      <span className="bg-green-100 text-green-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                        ✓ Evolucionado hoy
                      </span>
                    ) : (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Pendiente evolución
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setPacienteEditando(p); setModalAbierto(true); }} className="text-gray-400 hover:text-blue-600 p-1" title="Editar datos">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => eliminarPaciente(p.id)} className="text-gray-400 hover:text-red-600 p-1" title="Eliminar">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="font-bold text-gray-900 text-base">{p.nombre} {p.edad ? `(${p.edad} años)` : ""}</h3>
                <p className="text-xs font-semibold text-purple-700 mt-0.5">Dx: {p.diagnostico || "Sin diagnóstico principal"}</p>

                {/* 🚨 COMPONENTE DE ALERTA GES INTEGRADO */}
                {gesDetectados.length > 0 && (
                  <AlertaGesCard pacienteId={p.id} gesDetectados={gesDetectados} />
                )}

                <div className="mt-3 bg-slate-50 p-2.5 rounded text-xs border">
                  <span className="font-bold text-slate-700 block mb-0.5">Anamnesis / Base:</span>
                  <p className="text-slate-600 line-clamp-2">{p.anamnesis || "Sin anamnesis..."}</p>
                </div>

                <div className="mt-3 space-y-1.5">
                  <span className="text-xs font-bold uppercase text-gray-500 block">Pendientes y Tareas:</span>
                  <div className="space-y-1 max-h-28 overflow-y-auto">
                    {listaPendientes.map((pend) => (
                      <div key={pend.id} onClick={() => togglePendiente(p.id, pend.id)} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-gray-50 p-1 rounded">
                        {pend.completado ? (
                          <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-300 shrink-0" />
                        )}
                        <span className={pend.completado ? "line-through text-gray-400" : "text-gray-700"}>{pend.texto}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-1 pt-1">
                    <input
                      type="text"
                      placeholder="Nuevo pendiente..."
                      value={textoNuevoPendiente[p.id] || ""}
                      onChange={e => setTextoNuevoPendiente(prev => ({ ...prev, [p.id]: e.target.value }))}
                      onKeyDown={e => { if (e.key === 'Enter') agregarPendienteRapido(p.id); }}
                      className="w-full text-xs p-1.5 border rounded outline-none"
                    />
                    <button onClick={() => agregarPendienteRapido(p.id)} className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 text-xs rounded font-bold">+</button>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t flex justify-between items-center">
                <span className="text-[11px] text-gray-500 font-mono">
                  {Array.isArray(p.evoluciones) ? p.evoluciones.length : 0} evoluciones
                </span>
                <button
                  onClick={() => { setPacienteSeleccionadoEvolucion(p); setModalEvolucionAbierto(true); }}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all"
                >
                  <FileText className="w-3.5 h-3.5" /> Evolucionar / Ver Historial
                </button>
              </div>
            </div>
          );
        })}

        {pacientes.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 border-2 border-dashed rounded-xl">
            No hay pacientes en el censo. Haz clic en "Nuevo Paciente" para comenzar.
          </div>
        )}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-lg w-full p-6 space-y-4 shadow-xl">
            <h2 className="text-lg font-bold text-gray-800 border-b pb-2">
              {pacienteEditando?.id ? "Editar Paciente" : "Agregar Paciente al Censo"}
            </h2>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Cama *</label>
                <input
                  type="text"
                  placeholder="Ej. 12A"
                  value={pacienteEditando?.cama || ""}
                  onChange={e => setPacienteEditando(prev => ({ ...prev, cama: e.target.value }))}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Edad</label>
                <input
                  type="text"
                  placeholder="Ej. 65"
                  value={pacienteEditando?.edad || ""}
                  onChange={e => setPacienteEditando(prev => ({ ...prev, edad: e.target.value }))}
                  className="w-full p-2 border rounded text-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Nombre Completo *</label>
              <input
                type="text"
                placeholder="Ej. Juan Pérez"
                value={pacienteEditando?.nombre || ""}
                onChange={e => setPacienteEditando(prev => ({ ...prev, nombre: e.target.value }))}
                className="w-full p-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Diagnóstico Principal</label>
              <input
                type="text"
                placeholder="Ej. Neumonía grave"
                value={pacienteEditando?.diagnostico || ""}
                onChange={e => setPacienteEditando(prev => ({ ...prev, diagnostico: e.target.value }))}
                className="w-full p-2 border rounded text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Anamnesis / Antecedentes Base</label>
              <textarea
                rows={3}
                placeholder="Historia clínica inicial..."
                value={pacienteEditando?.anamnesis || ""}
                onChange={e => setPacienteEditando(prev => ({ ...prev, anamnesis: e.target.value }))}
                className="w-full p-2 border rounded text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <button onClick={() => setModalAbierto(false)} className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-bold rounded-lg">Cancelar</button>
              <button onClick={guardarPaciente} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-lg flex items-center gap-1 shadow">
                <Save className="w-4 h-4" /> Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {modalEvolucionAbierto && pacienteSeleccionadoEvolucion && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full p-6 space-y-4 shadow-xl max-h-[90vh] flex flex-col">
            <div className="border-b pb-2 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-gray-800">Evoluciones y Notas: {pacienteSeleccionadoEvolucion.nombre}</h2>
                <p className="text-xs text-gray-500">Cama {pacienteSeleccionadoEvolucion.cama} • Dx: {pacienteSeleccionadoEvolucion.diagnostico}</p>
              </div>
              <button onClick={() => setModalEvolucionAbierto(false)} className="text-gray-400 hover:text-gray-700 font-bold text-lg">✕</button>
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-200 space-y-2">
              <label className="block text-xs font-bold uppercase text-blue-900">Agregar Evolución de Hoy ({hoyStr})</label>
              <textarea
                rows={3}
                placeholder="Escribe la evolución clínica, notas de turno o plan del día..."
                value={nuevoTextoEvolucion}
                onChange={e => setNuevoTextoEvolucion(e.target.value)}
                className="w-full p-2.5 border rounded-lg text-sm bg-white outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="flex justify-end">
                <button
                  onClick={guardarEvolucion}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow"
                >
                  Guardar y Marcar Evolucionado Hoy 🚀
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              <h3 className="text-xs font-bold uppercase text-gray-500 tracking-wider">Historial Clínico de Evoluciones</h3>
              {Array.isArray(pacienteSeleccionadoEvolucion.evoluciones) && pacienteSeleccionadoEvolucion.evoluciones.map((evo) => (
                <div key={evo.id} className="bg-gray-50 border p-3 rounded-lg space-y-1 text-xs">
                  <div className="flex items-center gap-1 text-gray-400 font-mono">
                    <Calendar className="w-3.5 h-3.5" /> {evo.fecha}
                  </div>
                  <p className="text-gray-800 font-sans whitespace-pre-wrap leading-relaxed">{evo.texto}</p>
                </div>
              ))}
              {(!pacienteSeleccionadoEvolucion.evoluciones || pacienteSeleccionadoEvolucion.evoluciones.length === 0) && (
                <p className="text-center text-gray-400 text-xs py-6">No hay evoluciones anteriores registradas para este paciente.</p>
              )}
            </div>

            <div className="border-t pt-3 flex justify-end">
              <button onClick={() => setModalEvolucionAbierto(false)} className="px-4 py-2 bg-gray-200 text-gray-800 text-xs font-bold rounded-lg">Cerrar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🔔 COMPONENTE INTERNO PARA GESTIONAR LAS ALERTAS GES DE CADA PACIENTE
function AlertaGesCard({ pacienteId, gesDetectados }: { pacienteId: string; gesDetectados: PatologiaGes[] }) {
  const [estadoGes, setEstadoGes] = useState<Record<number, string>>(() => {
    try {
      const guardado = localStorage.getItem(`ges_estado_${pacienteId}`);
      return guardado ? JSON.parse(guardado) : {};
    } catch {
      return {};
    }
  });

  const cambiarEstado = (numeroGes: number, respuesta: "Sí" | "No") => {
    const nuevo = { ...estadoGes, [numeroGes]: respuesta };
    setEstadoGes(nuevo);
    localStorage.setItem(`ges_estado_${pacienteId}`, JSON.stringify(nuevo));
  };

  return (
    <div className="mt-3 bg-amber-50 border border-amber-300 rounded-xl p-3 shadow-sm space-y-2">
      <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
        <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
        <span>Alerta GES Detectada:</span>
      </div>

      <div className="space-y-2">
        {gesDetectados.map(ges => {
          const resp = estadoGes[ges.numero];
          return (
            <div key={ges.numero} className="bg-white p-2 rounded-lg border border-amber-200 flex flex-col gap-1.5 text-xs">
              <div>
                <span className="font-extrabold text-gray-900">GES Nº {ges.numero}:</span>{" "}
                <span className="text-gray-700">{ges.nombre}</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-amber-50">
                <span className="text-[11px] text-gray-500 font-medium">¿Activado GES?</span>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => cambiarEstado(ges.numero, "Sí")}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                      resp === "Sí" ? "bg-green-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    Sí
                  </button>
                  <button
                    onClick={() => cambiarEstado(ges.numero, "No")}
                    className={`px-2.5 py-0.5 rounded text-xs font-bold transition-all ${
                      resp === "No" ? "bg-red-600 text-white shadow" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    No
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
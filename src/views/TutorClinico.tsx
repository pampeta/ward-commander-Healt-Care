import React, { useState, useEffect, useRef } from "react";
import { consultarGeminiConArchivo } from "../Services/gemini";
import { 
  BrainCircuit, Paperclip, SendHorizontal, BotMessageSquare, UserRound, 
  X, FileText, Cloud, Plus, Trash2, Eraser, Edit2, Check, 
  ChevronLeft, ChevronRight, Menu, BookOpen
} from "lucide-react";
import { guardarEnNube, cargarDeNube } from "../Services/cloudSync";
import { MarkdownClinico } from "../components/MarkdownClinico";

export interface EspacioClinico {
  id: string;
  nombre: string;
  icono: string;
  color: string;
  descripcion: string;
  promptContexto: string;
}

export interface MensajeChat {
  id?: string;
  remitente: "usuario" | "ia";
  texto: string;
  timestamp?: string;
}

export interface SesionChat {
  id: string;
  titulo: string;
  espacioId: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  mensajes: MensajeChat[];
}

const ESPACIOS_POR_DEFECTO: EspacioClinico[] = [
  {
    id: "general",
    nombre: "General / EUNACOM",
    icono: "🩺",
    color: "emerald",
    descripcion: "Medicina Interna integral, toma de decisiones, guías MINSAL y preparación EUNACOM.",
    promptContexto: "Enfócate en la integración clínica para el internista y preparación de alto nivel para el EUNACOM. Énfasis en diagnóstico diferencial, toma de decisiones, guías MINSAL/GES y criterios de hospitalización/alta."
  },
  {
    id: "bronco",
    nombre: "Broncopulmonar & Respiratorio",
    icono: "🫁",
    color: "sky",
    descripcion: "EPOC (GOLD 2024), Asma (GINA), NAC/NIH, TEP, Fibrosis y Gases Arteriales.",
    promptContexto: "Actúa con enfoque de especialista broncopulmonar e internista. Aplica guías GOLD 2023/2024 (Esquema ABE), GINA 2024, neumonías comunitarias e intrahospitalarias (CURB-65, ATS/IDSA), TEP (Wells/Geneva), fibrosis pulmonar y gasometría arterial con gradiente alvéolo-arterial."
  },
  {
    id: "cardio",
    nombre: "Cardiología & Hemodinamia",
    icono: "🫀",
    color: "red",
    descripcion: "SCA, Insuficiencia Cardíaca (FEy), Arritmias, ECG, Shock y Valvulopatías.",
    promptContexto: "Actúa con enfoque de cardiólogo especialista e internista. Aplica guías AHA/ACC/ESC actualizadas, interpretación avanzada de ECG, SCA con/sin supradesnivel de ST, IC con FEy reducida/preservada, arritmias, shock cardiogénico y valvulopatías."
  },
  {
    id: "nefro",
    nombre: "Nefrología & Medio Interno",
    icono: "🧪",
    color: "purple",
    descripcion: "AKI (KDIGO), ERC, Anion Gap, Trastornos Ácido-Base, Sodio y Potasio.",
    promptContexto: "Actúa con enfoque de nefrólogo senior. Aplica guías KDIGO para AKI y ERC, análisis minucioso de gases venosos/arteriales, trastornos del equilibrio ácido-base (Anion Gap, Delta-Delta), hipo/hipernatremia, hiperkalemia, FeNa y sedimento urinario."
  },
  {
    id: "infecto",
    nombre: "Infectología & Antimicrobianos",
    icono: "🦠",
    color: "amber",
    descripcion: "Sepsis, Antimicrobianos PK/PD, SOCHINF, Cultivos y Focos Infecciosos.",
    promptContexto: "Actúa con enfoque de infectólogo clínico. Aplica guías SOCHINF, PK/PD de antimicrobianos, ajuste en falla renal/hepática, sepsis/shock séptico (Surviving Sepsis 2021), bacteriemias, endocarditis (Duke) y desescalamiento antibiótico guiado por cultivos."
  },
  {
    id: "gastro",
    nombre: "Gastroenterología & Hepatología",
    icono: "🧬",
    color: "orange",
    descripcion: "HDA/HDB, Cirrosis (PBE, MELD, Child), Pancreatitis y Vías Biliares.",
    promptContexto: "Actúa con enfoque de gastroenterólogo y hepatólogo. Manejo de hemorragia digestiva alta/baja (Glasgow-Blatchford, Rockall), cirrosis hepática descompensada (PBE, encefalopatía, síndrome hepatorrenal, Child-Pugh, MELD), pancreatitis aguda (Atlanta/BISAP) e IBD."
  },
  {
    id: "hemato",
    nombre: "Hematología & Oncología",
    icono: "🩸",
    color: "rose",
    descripcion: "Anemias, IPR, Trombocitopenias, Coagulopatías, Urgencias Onco-hematológicas.",
    promptContexto: "Actúa con enfoque de hematólogo e internista. Estudio de anemias (micro/normo/macrocíticas, reticulocitos corregidos, IPR), trombocitopenias, coagulopatías (CID, TTP), leucemias/linfomas, urgencias oncológicas (neutropenia febril, lisis tumoral) y transfusiones."
  },
  {
    id: "endocrino",
    nombre: "Endocrinología & Diabetes",
    icono: "⚡",
    color: "yellow",
    descripcion: "CAD, EHH, Insulinoterapia basal-bolo, Tiroides y Crisis Suprarrenal.",
    promptContexto: "Actúa con enfoque de endocrinólogo. Cetoacidosis diabética (CAD), Estado Hiperosmolar Hiperglicémico (EHH), esquemas de insulinoterapia basal-bolo, patología tiroidea (hipotiroidismo, tirotoxicosis, tormenta tiroidea) e insuficiencia suprarrenal."
  },
  {
    id: "reuma",
    nombre: "Reumatología & Inmunología",
    icono: "🦴",
    color: "teal",
    descripcion: "LES, Artritis Reumatoide, Vasculitis, Monoartritis aguda y Autoanticuerpos.",
    promptContexto: "Actúa con enfoque de reumatólogo. Artritis reumatoide, Lupus Eritematoso Sistémico (criterios EULAR/ACR 2019), vasculitis sistémicas, esclerosis sistémica, monoartritis aguda (gota vs séptica) y panel de autoanticuerpos (ANA, ENA, anti-DNA, ANCA)."
  },
  {
    id: "neuro",
    nombre: "Neurología & Geriatría",
    icono: "🧠",
    color: "indigo",
    descripcion: "ACV (Código ACV), Delirium, Estatus Epiléptico, Cefaleas y Polifarmacia.",
    promptContexto: "Actúa con enfoque de neurólogo e internista-geriatra. ACV isquémico/hemorrágico (código ACV, trombolisis/trombectomía), estatus epiléptico, delirium vs demencia (CAM), síndrome confusional agudo, cefaleas con banderas rojas y polifarmacia."
  }
];

export default function TutorClinico() {
  const [espacios] = useState<EspacioClinico[]>(ESPACIOS_POR_DEFECTO);
  const [espacioActivoId, setEspacioActivoId] = useState<string>("general");
  const [filtroEspacio, setFiltroEspacio] = useState<string>("todos");
  
  const [sesiones, setSesiones] = useState<SesionChat[]>([]);
  const [sesionActivaId, setSesionActivaId] = useState<string>("");
  const [descargando, setDescargando] = useState(true);

  const [promptUsuario, setPromptUsuario] = useState("");
  const [cargando, setCargando] = useState(false);
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string, base64: string, mimeType: string } | null>(null);
  
  const [sidebarAbierto, setSidebarAbierto] = useState(true);
  const [sidebarMobileAbierto, setSidebarMobileAbierto] = useState(false);
  const [editandoTituloId, setEditandoTituloId] = useState<string | null>(null);
  const [nuevoTitulo, setNuevoTitulo] = useState("");

  const scrollRef = useRef<HTMLDivElement>(null);

  // Espacio seleccionado actualmente
  const espacioActivo = espacios.find(e => e.id === espacioActivoId) || espacios[0];

  // 1. CARGA INICIAL DESDE LA NUBE / LOCALSTORAGE
  useEffect(() => {
    async function sincronizarChats() {
      try {
        const datosNube = await cargarDeNube('tutor_chats_v2');
        if (datosNube && Array.isArray(datosNube) && datosNube.length > 0) {
          setSesiones(datosNube);
          setSesionActivaId(datosNube[0].id);
          setEspacioActivoId(datosNube[0].espacioId || "general");
        } else {
          // Fallback a LocalStorage v2
          const guardadoV2 = localStorage.getItem("ward_commander_tutor_chats_v2");
          if (guardadoV2) {
            try {
              const parsed = JSON.parse(guardadoV2);
              if (Array.isArray(parsed) && parsed.length > 0) {
                setSesiones(parsed);
                setSesionActivaId(parsed[0].id);
                setEspacioActivoId(parsed[0].espacioId || "general");
                setDescargando(false);
                return;
              }
            } catch (e) {}
          }

          // Migración de datos heredados (v1)
          const guardadoV1 = localStorage.getItem("ward_commander_tutor");
          let mensajesV1: MensajeChat[] = [
            { remitente: "ia", texto: "¡Hola! Soy tu Instructor Clínico IA. Puedes preguntarme dudas, pegarme transcripciones o adjuntar PDFs para que los analicemos." }
          ];

          if (guardadoV1) {
            try {
              const parsedV1 = JSON.parse(guardadoV1);
              if (Array.isArray(parsedV1) && parsedV1.length > 0) {
                mensajesV1 = parsedV1;
              }
            } catch (e) {}
          }

          const sesionInicial: SesionChat = {
            id: Date.now().toString(),
            titulo: "Consulta Inicial de Medicina Interna",
            espacioId: "general",
            fechaCreacion: new Date().toISOString(),
            fechaActualizacion: new Date().toISOString(),
            mensajes: mensajesV1
          };

          setSesiones([sesionInicial]);
          setSesionActivaId(sesionInicial.id);
        }
      } catch (err) {
        console.error("Error al cargar historial:", err);
      } finally {
        setDescargando(false);
      }
    }
    sincronizarChats();
  }, []);

  // 2. SINCRONIZACIÓN AUTOMÁTICA CON LA NUBE
  useEffect(() => {
    if (!descargando && sesiones.length > 0) {
      localStorage.setItem("ward_commander_tutor_chats_v2", JSON.stringify(sesiones));
      guardarEnNube('tutor_chats_v2', sesiones);
    }
  }, [sesiones, descargando]);

  // Sesión activa actual
  const sesionActiva = sesiones.find(s => s.id === sesionActivaId) || sesiones[0];
  const mensajesActivos = sesionActiva ? sesionActiva.mensajes : [];

  // Scroll automático al último mensaje
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [mensajesActivos, cargando]);

  // CREAR UN NUEVO CHAT
  const crearNuevoChat = (espacioIdTarget?: string) => {
    const targetEspacio = espacioIdTarget 
      ? espacios.find(e => e.id === espacioIdTarget) || espacioActivo 
      : espacioActivo;

    const nuevaSesion: SesionChat = {
      id: Date.now().toString(),
      titulo: `Nueva sesión (${targetEspacio.nombre.split('/')[0].split('&')[0].trim()})`,
      espacioId: targetEspacio.id,
      fechaCreacion: new Date().toISOString(),
      fechaActualizacion: new Date().toISOString(),
      mensajes: [
        { 
          remitente: "ia", 
          texto: `¡Hola! Bienvenido al espacio de **${targetEspacio.icono} ${targetEspacio.nombre}**.\n\n${targetEspacio.descripcion}\n\n¿En qué caso clínico, algoritmo terapéutico o duda te apoyo hoy?` 
        }
      ]
    };

    setSesiones(prev => [nuevaSesion, ...prev]);
    setSesionActivaId(nuevaSesion.id);
    setEspacioActivoId(targetEspacio.id);
    setSidebarMobileAbierto(false);
  };

  // ELIMINAR UN CHAT
  const eliminarChat = (idParaEliminar: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (sesiones.length <= 1) {
      if (window.confirm("¿Deseas reiniciar esta conversación a su estado inicial?")) {
        vaciarChatActual();
      }
      return;
    }

    if (window.confirm("¿Estás seguro de eliminar este chat definitivamente?")) {
      const restantes = sesiones.filter(s => s.id !== idParaEliminar);
      setSesiones(restantes);
      if (sesionActivaId === idParaEliminar && restantes.length > 0) {
        setSesionActivaId(restantes[0].id);
        setEspacioActivoId(restantes[0].espacioId || "general");
      }
    }
  };

  // VACIAR EL CHAT ACTUAL
  const vaciarChatActual = () => {
    if (!sesionActiva) return;
    if (window.confirm("¿Deseas limpiar todos los mensajes de este chat?")) {
      const msjInicial: MensajeChat = {
        remitente: "ia",
        texto: `Chat limpiado. Listo para una nueva consulta en **${espacioActivo.icono} ${espacioActivo.nombre}**.`
      };
      setSesiones(prev => prev.map(s => s.id === sesionActiva.id ? {
        ...s,
        mensajes: [msjInicial],
        fechaActualizacion: new Date().toISOString()
      } : s));
    }
  };

  // RENOMBRAR TÍTULO
  const guardarNuevoTitulo = (id: string) => {
    if (!nuevoTitulo.trim()) {
      setEditandoTituloId(null);
      return;
    }
    setSesiones(prev => prev.map(s => s.id === id ? { ...s, titulo: nuevoTitulo.trim() } : s));
    setEditandoTituloId(null);
    setNuevoTitulo("");
  };

  // CAMBIAR ESPACIO DEL CHAT ACTUAL
  const cambiarEspacioChatActual = (nuevoEspacioId: string) => {
    setEspacioActivoId(nuevoEspacioId);
    setSesiones(prev => prev.map(s => s.id === sesionActivaId ? {
      ...s,
      espacioId: nuevoEspacioId,
      fechaActualizacion: new Date().toISOString()
    } : s));
  };

  // SUBIR ARCHIVOS
  const handleSubirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      alert("El archivo es muy pesado (máximo 20MB).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setArchivoAdjunto({ nombre: file.name, base64: reader.result as string, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  // ENVIAR CONSULTA A GEMINI
  const enviarConsulta = async () => {
    if (!promptUsuario.trim() && !archivoAdjunto) return;
    if (!sesionActiva) return;

    const textoPregunta = promptUsuario.trim();
    setPromptUsuario("");
    
    const nuevoMensajeUsuario: MensajeChat = { 
      remitente: "usuario", 
      texto: textoPregunta + (archivoAdjunto ? ` [📄 ${archivoAdjunto.nombre}]` : ""),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Auto-actualizar título si es la primera pregunta o genérico
    let tituloActualizado = sesionActiva.titulo;
    if (sesionActiva.mensajes.length <= 1 || sesionActiva.titulo.startsWith("Nueva sesión")) {
      tituloActualizado = textoPregunta.length > 38 ? textoPregunta.slice(0, 38) + "..." : textoPregunta;
    }

    setSesiones(prev => prev.map(s => s.id === sesionActiva.id ? {
      ...s,
      titulo: tituloActualizado,
      fechaActualizacion: new Date().toISOString(),
      mensajes: [...s.mensajes, nuevoMensajeUsuario]
    } : s));

    setCargando(true);

    try {
      const contextoEspacio = espacioActivo.promptContexto;

      const promptSistema = `Actúa como un médico especialista senior, tutor de residentes e instructor experto en EUNACOM.
      
CONTEXTO DEL ESPACIO DE ESTUDIO ACTIVO (${espacioActivo.nombre.toUpperCase()}):
${contextoEspacio}

REGLAS DE RIGOR CLÍNICO Y FORMATO:
- Responde con máxima fundamentación fisiopatológica, algoritmos basados en evidencia y pautas diagnósticas/terapéuticas chilenas (MINSAL/GES).
- Escribe en español médico formal.
- Usa formato Markdown claro y estructurado (encabezados con ## o ###, listas con viñetas o números, negritas **texto**).
- NUNCA uses código matemático LaTeX (como \\text{}, \\frac{}, \\left(, \\right), signos de dólar $, $$ o \\%). Para fórmulas y dosis escribe texto normal y legible (ejemplo: "RRC = % Reticulocitos × (Ht paciente / Ht ideal)" o "PaO2 ≤ 55 mmHg").
- Si presentas esquemas o algoritmos, colócalos en texto claro o dentro de bloques de código monoespaciados.

Consulta del usuario: ${textoPregunta}`;

      const respuestaIA = await consultarGeminiConArchivo(promptSistema, undefined, archivoAdjunto || undefined);

      const nuevoMensajeIA: MensajeChat = { 
        remitente: "ia", 
        texto: respuestaIA,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setSesiones(prev => prev.map(s => s.id === sesionActiva.id ? {
        ...s,
        fechaActualizacion: new Date().toISOString(),
        mensajes: [...s.mensajes, nuevoMensajeIA]
      } : s));

      setArchivoAdjunto(null); 
    } catch (e: any) {
      const mensajeError: MensajeChat = { 
        remitente: "ia", 
        texto: `❌ Error al conectar con Gemini: ${e.message}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSesiones(prev => prev.map(s => s.id === sesionActiva.id ? {
        ...s,
        mensajes: [...s.mensajes, mensajeError]
      } : s));
    } finally {
      setCargando(false);
    }
  };

  // Filtrado de sesiones para el sidebar
  const sesionesFiltradas = filtroEspacio === "todos" 
    ? sesiones 
    : sesiones.filter(s => s.espacioId === filtroEspacio);

  // Helper de colores para badges de espacios
  const obtenerColorClase = (color: string) => {
    switch (color) {
      case "emerald": return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
      case "sky": return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:border-sky-800";
      case "red": return "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-800";
      case "purple": return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800";
      case "amber": return "bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800";
      case "rose": return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800";
      case "orange": return "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800";
      case "yellow": return "bg-amber-50 text-amber-900 border-amber-300 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-800";
      case "teal": return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800";
      case "indigo": return "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-300 dark:border-indigo-800";
      default: return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800";
    }
  };

  return (
    <div className="p-2 sm:p-4 md:p-6 max-w-7xl mx-auto h-[calc(100vh-4rem)] flex flex-col space-y-3 bg-gray-50 dark:bg-slate-900 overflow-hidden">
      
      {/* CABECERA PRINCIPAL */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-800 p-3.5 sm:p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 shrink-0">
        <div className="flex items-center justify-between sm:justify-start gap-3">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setSidebarAbierto(!sidebarAbierto)}
              className="hidden md:flex p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-xl text-gray-600 dark:text-slate-300 transition-colors"
              title={sidebarAbierto ? "Ocultar panel de chats" : "Mostrar panel de chats"}
            >
              {sidebarAbierto ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            </button>
            <button
              onClick={() => setSidebarMobileAbierto(true)}
              className="flex md:hidden p-2 bg-emerald-50 dark:bg-slate-700 text-emerald-700 dark:text-emerald-400 rounded-xl transition-colors"
              title="Abrir lista de chats"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400 rounded-xl">
              <BrainCircuit className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg md:text-xl font-black text-gray-900 dark:text-white tracking-tight">
                  Instructor Clínico IA
                </h1>
                {!descargando && (
                  <span className="hidden sm:flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-[10px]">
                    <Cloud className="w-3 h-3"/> Nube
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-xs sm:max-w-md">
                {espacioActivo.icono} Espacio: <strong className="font-semibold text-gray-700 dark:text-slate-200">{espacioActivo.nombre}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Acciones de Cabecera: Selector de Espacio y Nuevo Chat */}
        <div className="flex items-center gap-2 self-end sm:self-auto w-full sm:w-auto justify-between sm:justify-end">
          <div className="flex items-center gap-1.5 overflow-x-auto max-w-[200px] sm:max-w-none pb-1 sm:pb-0">
            <select
              value={espacioActivoId}
              onChange={(e) => cambiarEspacioChatActual(e.target.value)}
              className={`text-xs font-bold py-1.5 px-2.5 rounded-xl border outline-none cursor-pointer transition-all ${obtenerColorClase(espacioActivo.color)}`}
            >
              {espacios.map(esp => (
                <option key={esp.id} value={esp.id} className="bg-white dark:bg-slate-800 text-gray-900 dark:text-slate-100">
                  {esp.icono} {esp.nombre}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => crearNuevoChat()}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo Chat</span>
          </button>
        </div>
      </div>

      {/* ÁREA PRINCIPAL: SIDEBAR DE CHATS + CONVERSACIÓN */}
      <div className="flex-1 flex gap-3 min-h-0 relative overflow-hidden">
        
        {/* PANEL LATERAL DESKTOP (CHATS & ESPACIOS) */}
        {sidebarAbierto && (
          <aside className="hidden md:flex flex-col w-72 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 p-3 space-y-3 shrink-0 overflow-hidden">
            
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-slate-700 pb-2.5">
              <span className="text-xs font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" /> Espacios y Cuadernos
              </span>
              <span className="text-[10px] font-mono bg-gray-100 dark:bg-slate-700 px-2 py-0.5 rounded text-gray-600 dark:text-slate-300 font-bold">
                {sesiones.length} {sesiones.length === 1 ? 'chat' : 'chats'}
              </span>
            </div>

            {/* Selector de Filtro por Espacio */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase text-gray-400 tracking-wider">Filtrar por Especialidad:</label>
              <select
                value={filtroEspacio}
                onChange={(e) => setFiltroEspacio(e.target.value)}
                className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl text-gray-800 dark:text-slate-200 outline-none"
              >
                <option value="todos">🌐 Todos los espacios ({sesiones.length})</option>
                {espacios.map(e => {
                  const cant = sesiones.filter(s => s.espacioId === e.id).length;
                  return (
                    <option key={e.id} value={e.id}>
                      {e.icono} {e.nombre} ({cant})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Lista de Chats Guardados */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
              {sesionesFiltradas.map((s) => {
                const esp = espacios.find(e => e.id === s.espacioId) || espacios[0];
                const esActivo = s.id === sesionActivaId;
                const estaEditando = editandoTituloId === s.id;

                return (
                  <div
                    key={s.id}
                    onClick={() => {
                      if (!estaEditando) {
                        setSesionActivaId(s.id);
                        setEspacioActivoId(s.espacioId || "general");
                      }
                    }}
                    className={`group p-2.5 rounded-xl border text-xs cursor-pointer transition-all flex flex-col gap-1 ${
                      esActivo 
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700 shadow-xs' 
                        : 'bg-white dark:bg-slate-850 hover:bg-gray-50 dark:hover:bg-slate-750 border-gray-150 dark:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border flex items-center gap-1 shrink-0 ${obtenerColorClase(esp.color)}`}>
                        <span>{esp.icono}</span>
                        <span className="truncate max-w-[90px]">{esp.nombre.split('/')[0].split('&')[0]}</span>
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditandoTituloId(s.id);
                            setNuevoTitulo(s.titulo);
                          }}
                          className="text-gray-400 hover:text-blue-600 p-0.5 rounded"
                          title="Renombrar chat"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={(e) => eliminarChat(s.id, e)}
                          className="text-gray-400 hover:text-red-600 p-0.5 rounded"
                          title="Eliminar chat"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {estaEditando ? (
                      <div className="flex items-center gap-1 mt-1" onClick={e => e.stopPropagation()}>
                        <input
                          type="text"
                          value={nuevoTitulo}
                          onChange={e => setNuevoTitulo(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') guardarNuevoTitulo(s.id); }}
                          className="w-full text-xs p-1 bg-white dark:bg-slate-900 border border-emerald-400 rounded outline-none text-gray-900 dark:text-white font-medium"
                          autoFocus
                        />
                        <button onClick={() => guardarNuevoTitulo(s.id)} className="text-emerald-600 hover:text-emerald-700 p-1">
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <p className={`font-semibold truncate ${esActivo ? 'text-emerald-950 dark:text-emerald-200' : 'text-gray-800 dark:text-slate-200'}`}>
                        {s.titulo}
                      </p>
                    )}

                    <span className="text-[10px] text-gray-400 dark:text-slate-500">
                      {s.mensajes.length} {s.mensajes.length === 1 ? 'mensaje' : 'mensajes'}
                    </span>
                  </div>
                );
              })}

              {sesionesFiltradas.length === 0 && (
                <div className="text-center py-8 text-gray-400 dark:text-slate-500 text-xs italic">
                  No hay chats en este espacio.
                  <button
                    onClick={() => crearNuevoChat(filtroEspacio === "todos" ? "general" : filtroEspacio)}
                    className="block mx-auto mt-2 text-emerald-600 font-bold hover:underline"
                  >
                    + Iniciar uno aquí
                  </button>
                </div>
              )}
            </div>

            {/* Botón inferior de crear nuevo chat */}
            <button
              onClick={() => crearNuevoChat()}
              className="w-full py-2.5 bg-gray-50 dark:bg-slate-900 hover:bg-emerald-50 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 hover:text-emerald-700 border border-dashed border-gray-300 dark:border-slate-600 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
            >
              <Plus className="w-4 h-4" /> Nuevo Cuaderno / Chat
            </button>
          </aside>
        )}

        {/* DRAWER MÓVIL DE CHATS */}
        {sidebarMobileAbierto && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-start md:hidden animate-in fade-in">
            <div className="w-4/5 max-w-sm bg-white dark:bg-slate-800 h-full p-4 flex flex-col space-y-3 shadow-2xl animate-in slide-in-from-left">
              <div className="flex items-center justify-between border-b pb-3 border-gray-100 dark:border-slate-700">
                <span className="font-bold text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-emerald-600" /> Mis Cuadernos y Chats
                </span>
                <button onClick={() => setSidebarMobileAbierto(false)} className="text-gray-400 p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase text-gray-400">Filtrar:</label>
                <select
                  value={filtroEspacio}
                  onChange={(e) => setFiltroEspacio(e.target.value)}
                  className="w-full text-xs p-2 bg-gray-50 dark:bg-slate-900 border rounded-xl"
                >
                  <option value="todos">🌐 Todos los espacios</option>
                  {espacios.map(e => (
                    <option key={e.id} value={e.id}>{e.icono} {e.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {sesionesFiltradas.map(s => {
                  const esp = espacios.find(e => e.id === s.espacioId) || espacios[0];
                  const esActivo = s.id === sesionActivaId;
                  return (
                    <div
                      key={s.id}
                      onClick={() => {
                        setSesionActivaId(s.id);
                        setEspacioActivoId(s.espacioId || "general");
                        setSidebarMobileAbierto(false);
                      }}
                      className={`p-3 rounded-xl border text-xs flex justify-between items-center ${
                        esActivo ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300' : 'bg-gray-50 dark:bg-slate-900 border-gray-200'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border inline-block mb-1 ${obtenerColorClase(esp.color)}`}>
                          {esp.icono} {esp.nombre.split('/')[0]}
                        </span>
                        <p className="font-semibold text-gray-800 dark:text-slate-200 truncate">{s.titulo}</p>
                      </div>
                      <button onClick={(e) => eliminarChat(s.id, e)} className="text-gray-400 hover:text-red-600 p-1.5">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>

              <button
                onClick={() => crearNuevoChat()}
                className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" /> Nuevo Chat
              </button>
            </div>
          </div>
        )}

        {/* CONTENEDOR PRINCIPAL DEL CHAT */}
        <main className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col overflow-hidden min-h-0">
          
          {/* Barra Superior del Chat Activo */}
          <div className="p-3 px-4 bg-gray-50/70 dark:bg-slate-850 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 truncate pr-2">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-lg border shrink-0 ${obtenerColorClase(espacioActivo.color)}`}>
                {espacioActivo.icono} {espacioActivo.nombre}
              </span>
              <h2 className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white truncate">
                {sesionActiva?.titulo || "Chat Clínico"}
              </h2>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={vaciarChatActual}
                className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Limpiar mensajes de esta conversación"
              >
                <Eraser className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Vaciar</span>
              </button>
              <button
                onClick={() => sesionActiva && eliminarChat(sesionActiva.id)}
                className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Eliminar este chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Eliminar</span>
              </button>
            </div>
          </div>

          {/* Historial de Mensajes */}
          <div ref={scrollRef} className="flex-1 p-3 sm:p-5 overflow-y-auto space-y-4 bg-[#fafafa] dark:bg-slate-900/60">
            {descargando ? (
              <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-60">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-slate-400 font-semibold text-xs">Sincronizando chats con la nube...</p>
              </div>
            ) : (
              <>
                {mensajesActivos.map((msg, index) => {
                  const esUsuario = msg.remitente === "usuario";
                  return (
                    <div key={index} className={`flex ${esUsuario ? 'justify-end' : 'justify-start'}`}>
                      <div className={`flex items-start gap-2.5 max-w-[92%] sm:max-w-[82%] md:max-w-[78%] ${esUsuario ? 'flex-row-reverse' : 'flex-row'}`}>
                        
                        <div className={`hidden sm:flex w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                          esUsuario 
                            ? 'bg-blue-100 dark:bg-blue-950 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-300' 
                            : 'bg-emerald-100 dark:bg-emerald-950 border-emerald-200 dark:border-emerald-800 text-emerald-600 dark:text-emerald-300'
                        }`}>
                          {esUsuario ? <UserRound className="w-4 h-4" /> : <BotMessageSquare className="w-4 h-4" />}
                        </div>

                        <div className={`p-3.5 md:p-4 rounded-2xl text-[13px] md:text-sm leading-relaxed shadow-xs ${
                          esUsuario 
                            ? 'bg-blue-600 text-white rounded-br-sm' 
                            : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-850 dark:text-slate-100 rounded-bl-sm'
                        }`}>
                          <MarkdownClinico contenido={msg.texto} isUser={esUsuario} />
                          {msg.timestamp && (
                            <div className={`text-[9px] mt-1.5 text-right font-mono ${esUsuario ? 'text-blue-200' : 'text-gray-400 dark:text-slate-500'}`}>
                              {msg.timestamp}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                  );
                })}
                
                {cargando && (
                  <div className="flex justify-start">
                    <div className="flex items-start gap-2.5 max-w-[85%] sm:max-w-[75%]">
                      <div className="hidden sm:flex w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-800 text-emerald-600 items-center justify-center shrink-0 mt-0.5">
                        <BotMessageSquare className="w-4 h-4" />
                      </div>
                      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 p-3.5 rounded-2xl rounded-bl-sm shadow-xs text-emerald-600 dark:text-emerald-400 font-medium animate-pulse text-xs sm:text-sm flex items-center gap-2">
                        <div className="flex gap-1">
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                          <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                        <span>El Instructor ({espacioActivo.nombre.split('/')[0]}) está analizando el caso...</span>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* ZONA DE ESCRITURA */}
          <div className="p-2.5 sm:p-3.5 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700 flex flex-col gap-2 shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
            
            {archivoAdjunto && (
              <div className="flex items-center gap-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 rounded-lg text-xs border border-emerald-200 dark:border-emerald-800 w-fit shadow-xs">
                <FileText className="w-3.5 h-3.5 shrink-0" /> 
                <span className="font-semibold truncate max-w-[200px] sm:max-w-xs">{archivoAdjunto.nombre}</span>
                <button onClick={() => setArchivoAdjunto(null)} className="ml-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-950 p-1 rounded-md transition-colors">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            
            <div className="flex items-end gap-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-200 dark:focus-within:ring-emerald-800 focus-within:border-emerald-400 transition-all">
              
              <input type="file" id="subir-doc-tutor" accept=".pdf, image/*, .txt" onChange={handleSubirArchivo} className="hidden" />
              <label 
                htmlFor="subir-doc-tutor" 
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-slate-800 rounded-xl cursor-pointer transition-colors shrink-0 mb-0.5" 
                title="Adjuntar PDF, Imagen o TXT"
              >
                <Paperclip className="w-4 h-4 sm:w-5 sm:h-5" />
              </label>

              <textarea
                rows={1}
                value={promptUsuario}
                onChange={(e) => {
                    setPromptUsuario(e.target.value);
                    e.target.style.height = 'auto';
                    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => { 
                  if (e.key === 'Enter' && !e.shiftKey) { 
                    e.preventDefault(); 
                    enviarConsulta(); 
                    const target = e.target as HTMLTextAreaElement;
                    target.style.height = 'auto';
                  } 
                }}
                placeholder={`Pregunta sobre ${espacioActivo.nombre.split('/')[0].trim()} o pega tu duda clínica...`}
                className="flex-1 bg-transparent py-2.5 px-1.5 text-xs sm:text-sm text-gray-850 dark:text-white outline-none resize-none min-h-[38px] max-h-[120px] placeholder:text-gray-400 dark:placeholder:text-slate-500"
              />

              <button
                onClick={() => {
                  enviarConsulta();
                  const textarea = document.querySelector('textarea');
                  if(textarea) textarea.style.height = 'auto';
                }}
                disabled={cargando || descargando || (!promptUsuario.trim() && !archivoAdjunto)}
                className="w-9 h-9 sm:w-auto sm:px-4 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition-all disabled:opacity-50 disabled:bg-gray-300 dark:disabled:bg-slate-700 shadow-xs shrink-0 mb-0.5"
              >
                <SendHorizontal className="w-4 h-4" />
                <span className="hidden sm:inline">Enviar</span>
              </button>
            </div>

            <div className="text-center">
              <span className="text-[10px] text-gray-400 dark:text-slate-500">
                La IA puede cometer errores. Verifica siempre las guías clínicas y dosis oficiales.
              </span>
            </div>
          </div>

        </main>
      </div>

    </div>
  );
}
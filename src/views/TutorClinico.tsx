import React, { useState, useEffect } from "react";
import { consultarGeminiConArchivo } from "../Services/gemini";
import { BrainCircuit, Paperclip, SendHorizontal, BotMessageSquare, UserRound, X, FileText, CloudCloud } from "lucide-react";
import { guardarEnNube, cargarDeNube } from "../Services/cloudSync";

export default function TutorClinico() {
  const [promptUsuario, setPromptUsuario] = useState("");
  const [historial, setHistorial] = useState<{ remitente: "usuario" | "ia", texto: string }[]>([
    { remitente: "ia", texto: "¡Hola! Soy tu Instructor Clínico IA. Puedes preguntarme dudas, pegarme transcripciones o adjuntar PDFs para que los analicemos." }
  ]);
  const [descargando, setDescargando] = useState(true);
  
  const [cargando, setCargando] = useState(false);
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string, base64: string, mimeType: string } | null>(null);

  // DESCARGA DESDE LA NUBE AL INICIAR
  useEffect(() => {
    async function sincronizarChat() {
      const datosNube = await cargarDeNube('tutor_chat');
      
      if (datosNube && Array.isArray(datosNube) && datosNube.length > 0) {
        setHistorial(datosNube);
      } else {
        const guardado = localStorage.getItem("ward_commander_tutor");
        if (guardado) {
          try { setHistorial(JSON.parse(guardado)); } catch(e) {}
        }
      }
      setDescargando(false);
    }
    sincronizarChat();
  }, []);

  // SUBE A LA NUBE CADA VEZ QUE HAY UN NUEVO MENSAJE
  useEffect(() => {
    if (!descargando) {
      localStorage.setItem("ward_commander_tutor", JSON.stringify(historial));
      guardarEnNube('tutor_chat', historial);
    }
  }, [historial, descargando]);

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

  const enviarConsulta = async () => {
    if (!promptUsuario.trim() && !archivoAdjunto) return;

    const textoPregunta = promptUsuario;
    setPromptUsuario("");
    
    setHistorial(prev => [...prev, { remitente: "usuario", texto: textoPregunta + (archivoAdjunto ? ` [📄 ${archivoAdjunto.nombre}]` : "") }]);
    setCargando(true);

    try {
      const promptSistema = `Actúa como un médico especialista senior, tutor de residentes e instructor experto en EUNACOM. Responde con rigor clínico, fundamentación fisiopatológica, criterios diagnósticos actualizados y guías de manejo clínico basadas en la evidencia. 
      
      Consulta del usuario: ${textoPregunta}`;

      const respuestaIA = await consultarGeminiConArchivo(promptSistema, undefined, archivoAdjunto || undefined);

      setHistorial(prev => [...prev, { remitente: "ia", texto: respuestaIA }]);
      setArchivoAdjunto(null); 
    } catch (e: any) {
      setHistorial(prev => [...prev, { remitente: "ia", texto: `❌ Error al conectar con Gemini: ${e.message}` }]);
    }
    setCargando(false);
  };

  return (
    <div className="p-3 md:p-6 max-w-5xl mx-auto h-full flex flex-col space-y-3 md:space-y-6 bg-gray-50 overflow-hidden">
      
      {/* CABECERA ADAPTATIVA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 shrink-0">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <BrainCircuit className="w-6 h-6 md:w-7 md:h-7 text-emerald-600" />
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 tracking-tight">Instructor Clínico IA</h1>
          </div>
          <div className="flex items-center gap-2 text-xs md:text-sm text-gray-500">
            <span>Resuelve casos, analiza transcripciones y aclara dudas.</span>
            {!descargando && <span className="flex items-center gap-1 bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded-md border border-emerald-200 ml-2"><CloudCloud className="w-3 h-3"/> Nube</span>}
          </div>
        </div>
      </div>

      {/* CONTENEDOR PRINCIPAL DEL CHAT */}
      <div className="flex-1 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden min-h-0">
        
        {/* Historial de Mensajes */}
        <div className="flex-1 p-4 md:p-6 overflow-y-auto space-y-5 bg-[#fafafa]">
          {descargando ? (
            <div className="flex flex-col items-center justify-center h-full space-y-3 opacity-50">
              <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
              <p className="text-gray-500 font-semibold text-sm">Sincronizando historial...</p>
            </div>
          ) : (
            <>
              {historial.map((msg, index) => (
                <div key={index} className={`flex ${msg.remitente === 'usuario' ? 'justify-end' : 'justify-start'}`}>
                  
                  <div className={`flex items-start gap-2.5 max-w-[85%] md:max-w-[75%] ${msg.remitente === 'usuario' ? 'flex-row-reverse' : 'flex-row'}`}>
                    
                    <div className={`hidden sm:flex w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center shrink-0 mt-0.5 border ${
                      msg.remitente === 'usuario' ? 'bg-blue-100 border-blue-200 text-blue-600' : 'bg-emerald-100 border-emerald-200 text-emerald-600'
                    }`}>
                      {msg.remitente === 'usuario' ? <UserRound className="w-4 h-4 md:w-5 md:h-5" /> : <BotMessageSquare className="w-4 h-4 md:w-5 md:h-5" />}
                    </div>

                    <div className={`p-3.5 md:p-4 rounded-2xl text-[13px] md:text-sm leading-relaxed shadow-sm ${
                      msg.remitente === 'usuario' 
                      ? 'bg-blue-600 text-white rounded-br-sm' 
                      : 'bg-white border border-gray-200 text-gray-800 rounded-bl-sm'
                    }`}>
                      <div className="font-sans whitespace-pre-wrap word-break break-words overflow-hidden">
                        {msg.texto.split(/(\*\*.*?\*\*)/g).map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className={msg.remitente === 'usuario' ? 'text-white' : 'text-gray-950'}>{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </div>
                    </div>

                  </div>
                </div>
              ))}
              
              {cargando && (
                <div className="flex justify-start">
                  <div className="flex items-start gap-2.5 max-w-[85%] md:max-w-[75%]">
                    <div className="hidden sm:flex w-8 h-8 md:w-10 md:h-10 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-600 items-center justify-center shrink-0 mt-0.5">
                      <BotMessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                    </div>
                    <div className="bg-white border border-gray-200 p-3.5 md:p-4 rounded-2xl rounded-bl-sm shadow-sm text-emerald-600 font-medium animate-pulse text-[13px] md:text-sm flex items-center gap-2">
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                      </div>
                      <span>Analizando consulta clínica...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ZONA DE ESCRITURA */}
        <div className="p-3 md:p-4 bg-white border-t border-gray-100 flex flex-col gap-2.5 shrink-0 z-10 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.02)]">
          
          {archivoAdjunto && (
            <div className="flex items-center gap-2 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-lg text-xs md:text-sm border border-emerald-200 w-fit shadow-sm">
              <FileText className="w-3.5 h-3.5 shrink-0" /> 
              <span className="font-semibold truncate max-w-[200px] sm:max-w-xs">{archivoAdjunto.nombre}</span>
              <button onClick={() => setArchivoAdjunto(null)} className="ml-1 text-red-500 hover:bg-red-100 p-1 rounded-md transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          
          <div className="flex items-end gap-2 bg-gray-50 border border-gray-200 rounded-2xl p-1.5 focus-within:ring-2 focus-within:ring-emerald-200 focus-within:border-emerald-400 transition-all shadow-inner">
            
            <input type="file" id="subir-doc-tutor" accept=".pdf, image/*, .txt" onChange={handleSubirArchivo} className="hidden" />
            <label 
              htmlFor="subir-doc-tutor" 
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl cursor-pointer transition-colors shrink-0 mb-0.5" 
              title="Adjuntar PDF, Imagen o TXT"
            >
              <Paperclip className="w-5 h-5" />
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
              placeholder="Escribe tu duda clínica..."
              className="flex-1 bg-transparent py-3 px-2 text-[13px] md:text-sm text-gray-800 outline-none resize-none min-h-[44px] max-h-[120px] placeholder:text-gray-400"
            />

            <button
              onClick={() => {
                enviarConsulta();
                const textarea = document.querySelector('textarea');
                if(textarea) textarea.style.height = 'auto';
              }}
              disabled={cargando || descargando || (!promptUsuario.trim() && !archivoAdjunto)}
              className="w-10 h-10 md:w-auto md:px-5 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition-all disabled:opacity-50 disabled:bg-gray-300 shadow-sm shrink-0 mb-0.5"
            >
              <SendHorizontal className="w-5 h-5 md:w-4 md:h-4" />
              <span className="hidden md:inline">Enviar</span>
            </button>
          </div>

          <div className="text-center">
            <span className="text-[10px] text-gray-400">La IA puede cometer errores. Verifica siempre las dosis y recomendaciones clínicas.</span>
          </div>
        </div>

      </div>
    </div>
  );
}
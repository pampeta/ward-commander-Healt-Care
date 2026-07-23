import { useState } from "react";
import { consultarGeminiConArchivo } from "../Services/gemini";

interface Mensaje {
  remitente: "usuario" | "ia";
  texto: string;
}

export default function TutorClinico() {
  const [promptUsuario, setPromptUsuario] = useState("");
  const [historial, setHistorial] = useState<Mensaje[]>([
    { remitente: "ia", texto: "¡Hola! Soy tu Instructor Clínico IA. Puedes preguntarme dudas, pegarme transcripciones o adjuntar PDFs para que los analicemos." }
  ]);
  const [cargando, setCargando] = useState(false);
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string, base64: string, mimeType: string } | null>(null);

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

      // Pasamos undefined como apiKey para que gemini.ts la tome automáticamente de localStorage
      const respuestaIA = await consultarGeminiConArchivo(promptSistema, undefined, archivoAdjunto || undefined);

      setHistorial(prev => [...prev, { remitente: "ia", texto: respuestaIA }]);
      setArchivoAdjunto(null); 
    } catch (e: any) {
      setHistorial(prev => [...prev, { remitente: "ia", texto: `❌ Error al conectar con Gemini: ${e.message}` }]);
    }
    setCargando(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto h-[85vh] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-800">Instructor Clínico IA</h1>
        <p className="text-sm text-gray-500">Resuelve casos, analiza transcripciones, procesa PDFs y aclara dudas complejas.</p>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-[#fafafa]">
          {historial.map((msg, index) => (
            <div key={index} className={`flex ${msg.remitente === 'usuario' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-3xl p-4 rounded-xl text-sm leading-relaxed ${msg.remitente === 'usuario' ? 'bg-blue-600 text-white rounded-br-none shadow' : 'bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm'}`}>
                <pre className="whitespace-pre-wrap font-sans">{msg.texto}</pre>
              </div>
            </div>
          ))}
          {cargando && (
            <div className="flex justify-start">
              <div className="bg-white border border-gray-200 p-4 rounded-xl shadow-sm text-purple-600 font-medium animate-pulse text-sm">
                🤖 El Instructor Clínico está analizando tu consulta...
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 flex flex-col gap-2">
          {archivoAdjunto && (
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs border border-blue-200 w-fit">
              📄 Archivo listo: {archivoAdjunto.nombre}
              <button onClick={() => setArchivoAdjunto(null)} className="ml-2 text-red-500 font-bold px-1">X</button>
            </div>
          )}
          
          <div className="flex gap-2 items-center">
            <input type="file" id="subir-doc-tutor" accept=".pdf, image/*, .txt" onChange={handleSubirArchivo} className="hidden" />
            <label htmlFor="subir-doc-tutor" className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-2.5 rounded-lg text-sm font-bold cursor-pointer transition-all flex items-center" title="Adjuntar PDF o imagen">
              📎
            </label>

            <textarea
              rows={1}
              value={promptUsuario}
              onChange={(e) => setPromptUsuario(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarConsulta(); } }}
              placeholder="Escribe tu duda o caso clínico (ej. háblame de la rinitis atrófica)..."
              className="flex-1 px-4 py-2.5 border rounded-lg outline-none text-sm resize-none focus:ring-1 focus:ring-blue-500"
            />

            <button
              onClick={enviarConsulta}
              disabled={cargando}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-bold transition-all disabled:opacity-50 shadow"
            >
              Enviar 🚀
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
import { useState, useEffect } from "react";
import { consultarGeminiConArchivo } from "../Services/gemini";
import { TEMARIO_BASE } from "../data/temasEunacom"; // <-- AQUí SE IMPORTAN LOS 99 TEMAS

interface Flashcard {
  pregunta: string;
  respuesta: string;
}

interface Tema {
  id: number;
  categoria: string;
  titulo: string;
  estado: "🔴 Pendiente" | "🟡 Repasando" | "🟢 Dominado";
  apuntes: string;
  flashcards: Flashcard[];
}

export default function PlanEunacom() {
  const [temas, setTemas] = useState<Tema[]>(() => {
    const guardado = localStorage.getItem("wardcommander_temas_eunacom");
    if (guardado) {
      const parseado = JSON.parse(guardado);
      return parseado.map((t: any) => ({ ...t, flashcards: t.flashcards || [] }));
    }
    return TEMARIO_BASE;
  });

  const [temaSeleccionado, setTemaSeleccionado] = useState<Tema>(temas[0]);
  const [modo, setModo] = useState<"apuntes" | "flashcards">("apuntes");
  const [cargando, setCargando] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("gemini_api_key") || "");
  const [archivoAdjunto, setArchivoAdjunto] = useState<{ nombre: string, base64: string, mimeType: string } | null>(null);
  const [indiceTarjeta, setIndiceTarjeta] = useState(0);
  const [mostrarRespuesta, setMostrarRespuesta] = useState(false);

  useEffect(() => {
    localStorage.setItem("wardcommander_temas_eunacom", JSON.stringify(temas));
    const temaActualizado = temas.find(t => t.id === temaSeleccionado.id);
    if (temaActualizado) setTemaSeleccionado(temaActualizado);
  }, [temas]);

  const handleSubirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 15 * 1024 * 1024) {
      alert("Archivo muy pesado (máx 15MB).");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      setArchivoAdjunto({ nombre: file.name, base64: reader.result as string, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  };

  const generarFlashcards = async () => {
    if (!apiKey.trim()) return alert("Falta tu API Key");
    setCargando(true);
    try {
      let prompt = `Actúa como tutor EUNACOM. Genera 5 flashcards avanzadas sobre: "${temaSeleccionado.titulo}". Apuntes previos: "${temaSeleccionado.apuntes}". `;
      if (archivoAdjunto) {
        prompt += "Usa también el documento adjunto como fuente principal. ";
      }
      prompt += `REGLA: Devuelve ÚNICAMENTE un arreglo JSON válido (sin markdown): [{"pregunta": "...", "respuesta": "..."}]`;
      
      const resText = await consultarGeminiConArchivo(prompt, apiKey, archivoAdjunto || undefined);
      const textoLimpio = resText.replace(/```json/g, '').replace(/```/g, '').trim();
      const nuevasFlashcards: Flashcard[] = JSON.parse(textoLimpio);
      
      setTemas(temas.map(t => t.id === temaSeleccionado.id ? { ...t, flashcards: nuevasFlashcards } : t));
      setIndiceTarjeta(0);
      setMostrarRespuesta(false);
      setArchivoAdjunto(null);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
    setCargando(false);
  };

  const actualizarEstado = (nuevoEstado: Tema['estado']) => setTemas(temas.map(t => t.id === temaSeleccionado.id ? { ...t, estado: nuevoEstado } : t));
  const actualizarApuntes = (texto: string) => setTemas(temas.map(t => t.id === temaSeleccionado.id ? { ...t, apuntes: texto } : t));
  const calculoProgreso = Math.round((temas.filter(t => t.estado === "🟢 Dominado").length / temas.length) * 100);

  return (
    <div className="p-6 max-w-7xl mx-auto h-[85vh] flex flex-col">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Plan EUNACOM - {temas.length} Temas</h1>
        <div className="flex items-center gap-4">
          <div className="w-full bg-gray-200 rounded-full h-4 flex-1 overflow-hidden">
            <div className="bg-green-500 h-full rounded-full transition-all duration-500" style={{ width: `${calculoProgreso}%` }}></div>
          </div>
          <span className="font-bold text-gray-700">{calculoProgreso}% Dominado</span>
        </div>
      </div>
      <div className="flex gap-6 flex-1 min-h-0">
        <div className="w-1/3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-slate-50 p-4 border-b font-semibold text-gray-700">Índice Temático</div>
          <div className="overflow-y-auto flex-1 p-2 space-y-2">
            {temas.map(tema => (
              <button key={tema.id} onClick={() => { setTemaSeleccionado(tema); setIndiceTarjeta(0); setMostrarRespuesta(false); }} className={`w-full text-left p-3 rounded transition-all ${temaSeleccionado.id === tema.id ? 'bg-blue-50 border-blue-200 border shadow-sm' : 'hover:bg-slate-50 border border-transparent'}`}>
                <div className="text-xs text-gray-500 mb-1 font-semibold">{tema.categoria}</div>
                <div className="font-medium text-gray-800 leading-tight">{tema.titulo}</div>
                <div className="text-xs mt-2 font-bold">{tema.estado}</div>
              </button>
            ))}
          </div>
        </div>
        <div className="w-2/3 bg-white rounded-lg shadow-sm border border-gray-200 flex flex-col overflow-hidden">
          <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
            <h2 className="font-bold text-lg text-gray-800">{temaSeleccionado.titulo}</h2>
            <div className="flex gap-2">
              <button onClick={() => setModo("apuntes")} className={`px-4 py-1 rounded text-sm font-bold ${modo === "apuntes" ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>📝 Apuntes</button>
              <button onClick={() => setModo("flashcards")} className={`px-4 py-1 rounded text-sm font-bold ${modo === "flashcards" ? 'bg-purple-600 text-white' : 'bg-gray-200'}`}>🧠 Flashcards IA</button>
            </div>
          </div>
          <div className="flex-1 p-6 overflow-y-auto bg-[#fafafa]">
            {modo === "apuntes" ? (
              <textarea value={temaSeleccionado.apuntes} onChange={(e) => actualizarApuntes(e.target.value)} className="w-full h-full resize-none outline-none bg-transparent" placeholder="Escribe tus apuntes o mnemotecnias..." />
            ) : (
              <div className="flex flex-col h-full items-center">
                 <div className="flex flex-col gap-2 w-full mb-6 bg-white p-4 rounded border shadow-sm">
                    <div className="flex gap-2">
                      <input type="password" placeholder="🔑 API Key Gemini..." value={apiKey} onChange={(e) => { setApiKey(e.target.value); localStorage.setItem("gemini_api_key", e.target.value); }} className="flex-1 px-3 py-2 border rounded text-sm" />
                      <input type="file" id="subir-pdf" accept=".pdf, image/*" onChange={handleSubirArchivo} className="hidden" />
                      <label htmlFor="subir-pdf" className="bg-gray-200 hover:bg-gray-300 px-4 py-2 rounded text-sm font-bold cursor-pointer flex items-center">📎 Adjuntar</label>
                      <button onClick={generarFlashcards} disabled={cargando} className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded text-sm font-bold disabled:opacity-50">
                        {cargando ? "Leyendo..." : "Generar ⚡"}
                      </button>
                    </div>
                    {archivoAdjunto && (
                      <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1 rounded text-xs border border-blue-200">
                        📄 Archivo: {archivoAdjunto.nombre}
                        <button onClick={() => setArchivoAdjunto(null)} className="ml-auto text-red-500 font-bold px-1">X</button>
                      </div>
                    )}
                 </div>
                 {temaSeleccionado.flashcards.length > 0 ? (
                    <div className="w-full max-w-lg flex flex-col items-center">
                      <div className="text-gray-500 font-bold mb-4">Tarjeta {indiceTarjeta + 1} de {temaSeleccionado.flashcards.length}</div>
                      <div onClick={() => setMostrarRespuesta(!mostrarRespuesta)} className={`w-full h-64 p-8 rounded-xl shadow-lg flex items-center justify-center text-center cursor-pointer transition-all ${mostrarRespuesta ? 'bg-purple-50 border-2 border-purple-200' : 'bg-white border-2 border-gray-200'}`}>
                        <p className={`text-xl font-medium ${mostrarRespuesta ? 'text-purple-800' : 'text-gray-800'}`}>{mostrarRespuesta ? temaSeleccionado.flashcards[indiceTarjeta].respuesta : temaSeleccionado.flashcards[indiceTarjeta].pregunta}</p>
                      </div>
                      <p className="text-sm text-gray-400 mt-2">(Haz clic para voltear)</p>
                      <div className="flex justify-center gap-4 mt-6">
                        <button onClick={() => { setIndiceTarjeta(Math.max(0, indiceTarjeta - 1)); setMostrarRespuesta(false); }} disabled={indiceTarjeta === 0} className="px-4 py-2 bg-gray-200 rounded font-bold disabled:opacity-50">◀ Anterior</button>
                        <button onClick={() => { setIndiceTarjeta(Math.min(temaSeleccionado.flashcards.length - 1, indiceTarjeta + 1)); setMostrarRespuesta(false); }} disabled={indiceTarjeta === temaSeleccionado.flashcards.length - 1} className="px-4 py-2 bg-blue-600 text-white rounded font-bold disabled:opacity-50">Siguiente ▶</button>
                      </div>
                    </div>
                 ) : <div className="flex-1 flex items-center justify-center text-gray-400">No hay flashcards para este tema todavía. ¡Genera algunas!</div>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
// Configuración base de servicios para Gemini con el modelo oficial vigente
const MODELO_GEMINI = "gemini-3.5-flash"; 

export const generateClinicalDocumentWithGemini = async (formData: {
  tipoDocumento: string;
  esqueletoFormat: string;
  preferenciasEstilo: string;
  rawData: string;
}, apiKey: string) => {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_GEMINI}:generateContent?key=${apiKey}`;

  const prompt = `
  Eres un asistente médico experto. Genera un documento clínico basado en los siguientes datos:
  Tipo de Documento: ${formData.tipoDocumento}
  Formato: ${formData.esqueletoFormat}
  Estilo: ${formData.preferenciasEstilo}
  Datos crudos: ${formData.rawData}
  `;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }]
    })
  });

  if (!response.ok) {
    const errJson = await response.json().catch(() => ({}));
    throw new Error(errJson.error?.message || `Error HTTP ${response.status}`);
  }

  const data = await response.json();
  return {
    text: data.candidates[0].content.parts[0].text
  };
};

// FUNCIÓN DE CONSULTA GENERAL Y MULTIMODAL
export const consultarGeminiConArchivo = async (
  prompt: string,
  apiKey: string,
  archivo?: { base64: string; mimeType: string } | null
) => {
  if (!apiKey || !apiKey.trim()) {
    throw new Error("No hay API Key configurada. Por favor regístrala en el módulo Generador IA.");
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODELO_GEMINI}:generateContent?key=${apiKey}`;

  const parts: any[] = [{ text: prompt }];

  if (archivo && archivo.base64) {
    const base64Data = archivo.base64.split(',')[1] || archivo.base64;
    parts.push({
      inline_data: {
        mime_type: archivo.mimeType,
        data: base64Data
      }
    });
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts }] }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Error HTTP ${response.status} al conectar con Google.`);
  }
  
  const data = await response.json();
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error("Google no devolvió ninguna respuesta válida.");
  }

  return data.candidates[0].content.parts[0].text;
};
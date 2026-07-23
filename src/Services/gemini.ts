const MODELO_GEMINI = "gemini-3.5-flash"; 

const obtenerApiKeyGuardada = (apiKeyDada?: string): string => {
  if (apiKeyDada && apiKeyDada.trim()) return apiKeyDada.trim();
  
  // Revisamos todas las posibles llaves donde se haya podido guardar en localStorage
  if (typeof window !== "undefined") {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.includes("gemini") || key.includes("google") || key.includes("ai_key"))) {
        const val = localStorage.getItem(key);
        if (val && val.trim().startsWith("AIza")) {
          return val.trim();
        }
      }
    }
  }

  return (
    localStorage.getItem("gemini_api_key") ||
    localStorage.getItem("google_ai_key") ||
    localStorage.getItem("wardcommander_gemini_key") ||
    ""
  ).trim();
};

export const generateClinicalDocumentWithGemini = async (formData: {
  tipoDocumento: string;
  esqueletoFormat: string;
  preferenciasEstilo: string;
  rawData: string;
}, apiKeyDada?: string) => {
  const apiKey = obtenerApiKeyGuardada(apiKeyDada);
  
  if (!apiKey) {
    throw new Error("No hay API Key configurada. Por favor regístrala en el módulo 'Control & Métricas' o 'Generador IA Gemini'.");
  }

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

export const consultarGeminiConArchivo = async (
  prompt: string,
  apiKeyDada?: string,
  archivo?: { base64: string; mimeType: string } | null
) => {
  const apiKey = obtenerApiKeyGuardada(apiKeyDada);

  if (!apiKey) {
    throw new Error("No hay API Key configurada. Por favor regístrala en el módulo 'Control & Métricas' o 'Generador IA Gemini'.");
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
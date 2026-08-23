const MODELO_GEMINI = "gemini-3.5-flash"; 

const obtenerApiKeyGuardada = (apiKeyDada?: string): string => {
  if (apiKeyDada && apiKeyDada.trim()) return apiKeyDada.trim();
  
  if (typeof window !== "undefined") {
    try {
      const configRaw = localStorage.getItem("wc_config");
      if (configRaw) {
        const parsed = JSON.parse(configRaw);
        if (parsed && parsed.apiKey && parsed.apiKey.trim()) {
          return parsed.apiKey.trim();
        }
      }
    } catch (e) {}

    return (
      localStorage.getItem("wardcommander_gemini_key") ||
      localStorage.getItem("gemini_api_key") ||
      localStorage.getItem("google_ai_key") ||
      ""
    ).trim();
  }
  return "";
};

export const generateClinicalDocumentWithGemini = async (formData: {
  tipoDocumento: string;
  esqueletoFormat: string;
  preferenciasEstilo: string;
  rawData: string;
}, apiKeyDada?: string) => {
  const apiKey = obtenerApiKeyGuardada(apiKeyDada);
  
  if (!apiKey) {
    throw new Error("No hay API Key configurada. Por favor guárdala en el módulo 'Control & Métricas'.");
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
    throw new Error("No hay API Key configurada. Por favor guárdala en el módulo 'Control & Métricas'.");
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

export interface DatosPacienteExtraidos {
  cama?: string;
  nombre?: string;
  edad?: string;
  fechaIngreso?: string;
  diagnostico?: string;
  atbNombre?: string;
  atbDias?: string;
  incobertura?: string;
  anamnesis?: string;
  curacion?: {
    activo: boolean;
    tipo?: string;
    frecuenciaDias?: number;
    ultimaFecha?: string;
  };
  pendientes?: string[];
}

export const extraerPacienteDesdeDocumentoConGemini = async (
  archivoOTexto: {
    base64?: string;
    mimeType?: string;
    textoPlano?: string;
  },
  apiKeyDada?: string
): Promise<DatosPacienteExtraidos> => {
  const apiKey = obtenerApiKeyGuardada(apiKeyDada);

  if (!apiKey) {
    throw new Error("No hay API Key de Gemini configurada. Por favor regístrala en el módulo 'Control & Configuración'.");
  }

  const prompt = `
Eres un asistente médico clínico de alta precisión. Analiza la imagen, documento o texto adjunto (que puede ser una ficha clínica, foto de hoja de censo/pizarra, epicrisis, evolución, informe de laboratorio o tarjeta de enfermería) y extrae TODOS los datos del paciente en formato JSON estricto.

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "cama": "número o código de cama (ej. 12A, Cama 4, etc.)",
  "nombre": "nombre completo o iniciales del paciente",
  "edad": "edad en años (ej. 68)",
  "fechaIngreso": "fecha de ingreso en formato YYYY-MM-DD",
  "diagnostico": "diagnóstico principal o motivo de hospitalización",
  "atbNombre": "antibióticos indicados si los hay (ej. Ceftriaxona + Metronidazol)",
  "atbDias": "días de antibiótico (ej. 3 días)",
  "incobertura": "foco infeccioso sospechoso o confirmado (ej. Foco respiratorio)",
  "anamnesis": "resumen de antecedentes mórbidos, anamnesis y estado actual",
  "curacion": {
    "activo": true o false,
    "tipo": "descripción de herida o curación si aplica",
    "frecuenciaDias": 3,
    "ultimaFecha": "YYYY-MM-DD"
  },
  "pendientes": ["lista", "de", "pendientes", "clinicos", "o", "examenes"]
}

Si algún dato no está explícito en la imagen o texto, deja el valor como string vacío ("") o false en curacion.activo.
`;

  const parts: any[] = [{ text: prompt }];

  if (archivoOTexto.textoPlano) {
    parts.push({ text: `\n--- TEXTO CLÍNICO PROPORCIONADO ---\n${archivoOTexto.textoPlano}` });
  }

  if (archivoOTexto.base64 && archivoOTexto.mimeType) {
    const base64Data = archivoOTexto.base64.split(',')[1] || archivoOTexto.base64;
    parts.push({
      inline_data: {
        mime_type: archivoOTexto.mimeType,
        data: base64Data
      }
    });
  }

  const modelosAIntentar = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-3.5-flash"];
  let ultimoError: any = null;

  for (const modelo of modelosAIntentar) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts }],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP ${response.status}`);
      }

      const data = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) throw new Error("Respuesta vacía de Gemini");

      const jsonLimpio = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(jsonLimpio) as DatosPacienteExtraidos;
    } catch (err: any) {
      ultimoError = err;
    }
  }

  throw new Error(`Error procesando documento con IA: ${ultimoError?.message || "No se pudo extraer información"}`);
};
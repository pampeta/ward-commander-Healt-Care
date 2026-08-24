import { GoogleGenerativeAI } from "@google/generative-ai";

export const listarModelosDisponibles = async (apiKey: string): Promise<string[]> => {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.models)) {
        const soportados = data.models
          .filter((m: any) => m.supportedGenerationMethods?.includes("generateContent"))
          .map((m: any) => m.name.replace(/^models\//, ""));

        console.log("Modelos habilitados en tu cuenta:", soportados);
        return soportados;
      }
    }
  } catch (e) {
    console.warn("No se pudo consultar ListModels:", e);
  }
  return [];
};

export const obtenerMejorModelo = async (apiKey: string): Promise<string> => {
  const disponibles = await listarModelosDisponibles(apiKey);
  const preferencia = [
    "gemini-3.6-flash",
    "gemini-3.6-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-flash"
  ];

  for (const pref of preferencia) {
    if (disponibles.includes(pref)) return pref;
  }

  const algunFlash = disponibles.find(m => m.toLowerCase().includes("flash"));
  if (algunFlash) return algunFlash;

  if (disponibles.length > 0) return disponibles[0];

  return "gemini-3.6-flash";
};

export const obtenerApiKeyGuardada = (apiKeyDada?: string): string => {
  if (apiKeyDada && apiKeyDada.trim()) return apiKeyDada.trim();

  const envKey = (import.meta.env.VITE_GEMINI_API_KEY as string | undefined)?.trim();
  if (envKey) return envKey;
  
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
  archivo?: { base64: string; mimeType: string } | null;
  linkGoogleDocs?: string;
}, apiKeyDada?: string) => {
  const apiKey = obtenerApiKeyGuardada(apiKeyDada);
  
  if (!apiKey) {
    throw new Error("No hay API Key configurada. Por favor guárdala en el módulo 'Control & Métricas'.");
  }

  let textoGoogleDocs = "";
  if (formData.linkGoogleDocs && formData.linkGoogleDocs.includes("docs.google.com/document")) {
    textoGoogleDocs = await extraerContenidoGoogleDocs(formData.linkGoogleDocs);
  }

  const mejorModelo = await obtenerMejorModelo(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: mejorModelo });

  const prompt = `
Eres un asistente médico clínico de alta precisión. Tu tarea es redactar un documento clínico formal, completo y profesional en base a la información proporcionada.

Tipo de Documento: ${formData.tipoDocumento}
Esqueleto / Estructura base exigida:
${formData.esqueletoFormat}

Instrucciones y Exigencias de Estilo del Médico Emisor:
${formData.preferenciasEstilo}

Datos Clínicos del Paciente:
${formData.rawData}
${textoGoogleDocs ? `\n--- CONTENIDO ADICIONAL DESDE GOOGLE DOCS ---\n${textoGoogleDocs}` : ""}

Genera el documento completo listo para la ficha clínica, siguiendo rigurosamente las pautas de estilo y formato solicitadas.
`;

  const contents: any[] = [prompt];

  if (formData.archivo && formData.archivo.base64) {
    const base64Data = formData.archivo.base64.split(',')[1] || formData.archivo.base64;
    contents.push({
      inlineData: {
        mimeType: formData.archivo.mimeType,
        data: base64Data
      }
    });
  }

  const result = await model.generateContent(contents);
  return {
    text: result.response.text()
  };
};

export interface EvolucionExtraidaDetallada {
  fecha?: string;
  texto: string;
  tipo: "normal" | "ic";
  especialidad?: string;
  medico?: string;
}

export const extraerEvolucionConGemini = async (
  archivoOTexto: {
    base64?: string;
    mimeType?: string;
    textoPlano?: string;
  },
  apiKeyDada?: string
): Promise<EvolucionExtraidaDetallada[]> => {
  const apiKey = obtenerApiKeyGuardada(apiKeyDada);

  if (!apiKey) {
    throw new Error("No hay API Key configurada. Por favor regístrala.");
  }

  let textoFinal = archivoOTexto.textoPlano || "";
  if (textoFinal.includes("docs.google.com/document")) {
    textoFinal = await extraerContenidoGoogleDocs(textoFinal);
  }

  const prompt = `
Eres un asistente médico clínico. Analiza la imagen, documento de Google Docs, nota o texto proporcionado y extrae las notas de evolución clínica diaria o respuestas de interconsulta del paciente.

Debes responder ÚNICAMENTE con un JSON array válido con la siguiente estructura:
[
  {
    "fecha": "YYYY-MM-DD",
    "texto": "Texto completo y redactado de la evolución clínica del día o plan médico",
    "tipo": "normal",
    "especialidad": "",
    "medico": ""
  },
  {
    "fecha": "YYYY-MM-DD",
    "texto": "Texto detallado de la respuesta de interconsulta, sugerencias y conductas del especialista",
    "tipo": "ic",
    "especialidad": "Especialidad médica (ej. Cardiología, Nefrología, Cirugía, etc.)",
    "medico": "Nombre del médico especialista si figura (ej. Dr. Muñoz, Dra. Haro)"
  }
]

Si solo hay una evolución del día, devuelve un array con 1 elemento.
`;

  const contents: any[] = [prompt];
  if (textoFinal && textoFinal.trim().length > 0) {
    contents.push(`\n--- NOTAS / DOCUMENTO ---\n${textoFinal}`);
  }

  if (archivoOTexto.base64 && archivoOTexto.mimeType) {
    const base64Data = archivoOTexto.base64.split(',')[1] || archivoOTexto.base64;
    contents.push({
      inlineData: {
        mimeType: archivoOTexto.mimeType,
        data: base64Data
      }
    });
  }

  const mejorModelo = await obtenerMejorModelo(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: mejorModelo,
    generationConfig: { responseMimeType: "application/json" }
  });

  const result = await model.generateContent(contents);
  const rawText = result.response.text();
  if (!rawText) throw new Error("Respuesta vacía de Gemini");

  const jsonLimpio = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
  const parsed = JSON.parse(jsonLimpio);
  return Array.isArray(parsed) ? parsed : [parsed];
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

  const mejorModelo = await obtenerMejorModelo(apiKey);
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: mejorModelo });

  const promptAfinado = `${prompt}\n\n[INSTRUCCIÓN DE FORMATO: Responde con formato Markdown limpio. Para términos médicos, scores, fórmulas o porcentajes, utiliza símbolos estándar legibles (≥, ≤, →, %, α, β) en lugar de código matemático LaTeX con signos de dólar ($...$, \\%, \\ge, \\alpha)].`;

  const contents: any[] = [promptAfinado];

  if (archivo && archivo.base64) {
    const base64Data = archivo.base64.split(',')[1] || archivo.base64;
    contents.push({
      inlineData: {
        mimeType: archivo.mimeType,
        data: base64Data
      }
    });
  }

  const result = await model.generateContent(contents);
  return result.response.text();
};

export interface EvolucionExtraida {
  fecha?: string;
  texto: string;
  tipo?: "normal" | "ic";
  especialidad?: string;
  medico?: string;
}

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
  evoluciones?: EvolucionExtraida[];
}

export const extraerContenidoGoogleDocs = async (urlOTexto: string): Promise<string> => {
  const match = urlOTexto.match(/docs\.google\.com\/document\/d\/([a-zA-Z0-9_-]+)/);
  if (!match || !match[1]) return urlOTexto;

  const docId = match[1];
  const docUrl = `https://docs.google.com/document/d/${docId}/edit`;

  // 1. Intentar endpoint serverless propio de Vercel (/api/fetch-google-doc)
  try {
    const res = await fetch(`/api/fetch-google-doc?url=${encodeURIComponent(docUrl)}`);
    if (res.ok) {
      const data = await res.json();
      if (data.text && data.text.trim().length > 0) {
        return data.text;
      }
    }
  } catch (e) {
    console.warn("No se pudo usar /api/fetch-google-doc:", e);
  }

  // 2. Intentar export directo
  try {
    const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=txt`;
    const res = await fetch(exportUrl);
    if (res.ok) {
      const text = await res.text();
      if (text && text.trim().length > 0) return text;
    }
  } catch (e) {
    console.warn("Direct fetch bloqueado por CORS:", e);
  }

  return urlOTexto;
};

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

  // Si es un enlace de Google Docs en textoPlano, descargamos el texto completo
  let textoFinal = archivoOTexto.textoPlano || "";
  if (textoFinal.includes("docs.google.com/document")) {
    textoFinal = await extraerContenidoGoogleDocs(textoFinal);
  }

  const prompt = `
Eres un asistente médico clínico de alta precisión. Analiza la imagen, documento de Google Docs, ficha clínica, epicrisis, evolución diaria, reporte de enfermería o notas adjuntas y extrae TODOS los datos del paciente en formato JSON estricto.

Debes prestar especial atención a:
1. Datos demográficos y de ingreso (Cama, Nombre, Edad, Fecha Ingreso, Diagnóstico principal, Antibióticos, Infección, Curaciones).
2. Pendientes clínicos por resolver.
3. HISTORIAL DE EVOLUCIONES CLÍNICAS: Extrae cada evolución diaria por fecha. Si la nota es una respuesta de interconsulta (IC) de otra especialidad (ej. Cardiología, Nefrología, etc.), márcala con tipo "ic", extrayendo la especialidad y el nombre del médico si aparece.

Debes responder ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "cama": "código o número de cama (ej. 12A, Cama 4, etc.)",
  "nombre": "nombre completo o iniciales del paciente",
  "edad": "edad en años (ej. 68)",
  "fechaIngreso": "fecha de ingreso en formato YYYY-MM-DD",
  "diagnostico": "diagnóstico principal o motivo de hospitalización",
  "atbNombre": "antibióticos indicados si los hay (ej. Ceftriaxona + Metronidazol)",
  "atbDias": "días de antibiótico (ej. 3 días)",
  "incobertura": "foco infeccioso sospechoso o confirmado (ej. Foco respiratorio)",
  "anamnesis": "resumen de antecedentes mórbidos, anamnesis y estado basal",
  "curacion": {
    "activo": true o false,
    "tipo": "descripción de herida o curación",
    "frecuenciaDias": 3,
    "ultimaFecha": "YYYY-MM-DD"
  },
  "pendientes": ["lista", "de", "pendientes", "o", "examenes", "por", "hacer"],
  "evoluciones": [
    {
      "fecha": "YYYY-MM-DD",
      "texto": "Texto de la evolución clínica del día",
      "tipo": "normal"
    },
    {
      "fecha": "YYYY-MM-DD",
      "texto": "Texto de la respuesta a la interconsulta o sugerencias del especialista",
      "tipo": "ic",
      "especialidad": "Especialidad médica (ej. Gastroenterología, Cardiología, etc.)",
      "medico": "Nombre del médico especialista si figura (ej. Dr. Karelovic)"
    }
  ]
}

Si algún dato no está explícito en el documento, deja el valor como string vacío ("") o false en curacion.activo o un array vacío [] en evoluciones/pendientes.
`;

  const contents: any[] = [prompt];

  if (textoFinal && textoFinal.trim().length > 0) {
    contents.push(`\n--- TEXTO CLÍNICO PROPORCIONADO ---\n${textoFinal}`);
  }

  if (archivoOTexto.base64 && archivoOTexto.mimeType) {
    const base64Data = archivoOTexto.base64.split(',')[1] || archivoOTexto.base64;
    contents.push({
      inlineData: {
        mimeType: archivoOTexto.mimeType,
        data: base64Data
      }
    });
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  // Obtener dinámicamente los modelos reales disponibles para la API key del usuario
  const disponibles = await listarModelosDisponibles(apiKey);
  const preferencia = [
    "gemini-3.6-flash",
    "gemini-3.6-pro",
    "gemini-2.0-flash",
    "gemini-2.0-flash-exp",
    "gemini-flash-latest",
    "gemini-pro-latest",
    "gemini-1.5-flash",
    "gemini-1.5-pro",
    "gemini-2.5-flash"
  ];

  const modelosAIntentar: string[] = [];

  if (disponibles.length > 0) {
    for (const pref of preferencia) {
      if (disponibles.includes(pref) && !modelosAIntentar.includes(pref)) {
        modelosAIntentar.push(pref);
      }
    }
    for (const disp of disponibles) {
      if (!modelosAIntentar.includes(disp)) {
        modelosAIntentar.push(disp);
      }
    }
  }

  if (modelosAIntentar.length === 0) {
    modelosAIntentar.push("gemini-3.6-flash", "gemini-2.0-flash", "gemini-1.5-flash");
  }

  let ultimoError: any = null;

  for (const modelo of modelosAIntentar) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelo,
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const result = await model.generateContent(contents);
      const rawText = result.response.text();
      if (!rawText) throw new Error("Respuesta vacía de Gemini");

      const jsonLimpio = rawText.replace(/^```json\s*/i, '').replace(/\s*```$/i, '').trim();
      return JSON.parse(jsonLimpio) as DatosPacienteExtraidos;
    } catch (err: any) {
      console.warn(`Intento con ${modelo} falló:`, err);
      ultimoError = err;
    }
  }

  throw new Error(`Error procesando documento con IA: ${ultimoError?.message || "No se pudo extraer información"}`);
};
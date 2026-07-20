export interface SanitizerResult {
  textSanitized: string;
  hasChanges: boolean;
  diffs: Array<{ original: string; replaced: string; type: string }>;
}

export const sanitizeClinicalText = (rawText: string): SanitizerResult => {
  let text = rawText;
  const diffs: SanitizerResult['diffs'] = [];
  let hasChanges = false;

  // 1. Filtro estricto para RUT chileno
  const rutRegex = /(\d{1,2}(?:\.?\d{3}){2}-?[\dkK])/g;
  const rutsFound = text.match(rutRegex);
  if (rutsFound) {
    rutsFound.forEach((rut) => {
      diffs.push({ original: rut, replaced: '[RUT]', type: 'RUT' });
      hasChanges = true;
    });
    text = text.replace(rutRegex, '[RUT]');
  }

  // 2. Filtro para fechas de nacimiento
  const dateRegex = /(\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b)/g;
  const datesFound = text.match(dateRegex);
  if (datesFound) {
    datesFound.forEach((d) => {
      diffs.push({ original: d, replaced: '[FECHA_NAC]', type: 'FECHA' });
      hasChanges = true;
    });
    text = text.replace(dateRegex, '[FECHA_NAC]');
  }

  // 3. Filtro para nombres propios tras palabras clave
  const nameKeywords = /(?:paciente|Sr\.|Sra\.|don|doña)\s+([A-ZÁÉÍÓÚÑa-záéíóúñ]+(?:\s+[A-ZÁÉÍÓÚÑa-záéíóúñ]+){1,3})/g;
  let match;
  const namesToReplace: string[] = [];
  
  const searchRegex = new RegExp(nameKeywords);
  while ((match = searchRegex.exec(rawText)) !== null) {
    namesToReplace.push(match[1]);
  }

  namesToReplace.forEach((name) => {
    const safeName = name.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const exactNameRegex = new RegExp(`\\b${safeName}\\b`, 'g');
    if (text.match(exactNameRegex)) {
      diffs.push({ original: name, replaced: '[NOMBRE]', type: 'NOMBRE_PROPIO' });
      hasChanges = true;
      text = text.replace(exactNameRegex, '[NOMBRE]');
    }
  });

  return {
    textSanitized: text,
    hasChanges,
    diffs
  };
};
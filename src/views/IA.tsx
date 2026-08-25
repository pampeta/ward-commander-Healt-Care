import React, { useState, useEffect } from 'react';
import { generateClinicalDocumentWithGemini } from '../Services/gemini';
import { sanitizeClinicalText } from '../Services/sanitizer';
import { FileText, Wand2, Copy, CheckCircle2, ShieldAlert, Camera, FileUp, Sparkles, X, Link, Loader2 } from 'lucide-react';

const PLANTILLAS_POR_DEFECTO: Record<string, string> = {
  Ingreso: `**CR MEDICINA INTERNA - HOSPITAL CLÍNICO DE MAGALLANES**
---
### I. IDENTIFICACIÓN
* **Paciente:** [NOMBRE]
* **RUT:** [RUT]
* **Cama/Identificador Local:** {{CAMA_INICIALES}}

### II. HISTORIA CLÍNICA
* **Antecedentes Médicos:** 
* **Antecedentes Quirúrgicos:** 
* **Alergias:** 
* **Fármacos Habituales:** 
* **Motivo de Consulta y Anamnesis:** 

### III. SIGNOS VITALES Y EXAMEN FÍSICO
* **Signos Vitales:** FC: | FR: | PA: | T°: | SatO2:
* **Examen Físico Segmentario:** 

### IV. HIPÓTESIS DIAGNÓSTICA Y PLAN
1. 
* **Plan por Problemas:** `,

  Evolución: `**EVOLUCIÓN CLÍNICA DIARIA**
* **Paciente / Cama:** {{CAMA_INICIALES}}
* **Subjetivo (Evolución últimas 24h):** 
* **Objetivo (Examen físico y Signos Vitales actuales):** 
* **Laboratorios e Imágenes del día:** 
* **Análisis y Plan Diario:** `,

  Epicrisis: `**EPICRISIS MÉDICA**
* **Paciente:** {{CAMA_INICIALES}}
* **Diagnósticos de Egreso:** 
* **Resumen de Evolución Hospitalaria:** 
* **Reposo / Régimen:** 
* **Indicaciones al Alta y Banderas Rojas:** 
* **Citaciones:** 
* **Medicación y Reconciliación:** `
};

export const IAModuleDesktop: React.FC = () => {
  const [pacientes, setPacientes] = useState<any[]>([]);

  useEffect(() => {
    try {
      const censoGuardado = localStorage.getItem('ward_commander_censo');
      if (censoGuardado) {
        const parsed = JSON.parse(censoGuardado);
        if (Array.isArray(parsed)) {
          setPacientes(parsed);
        }
      }
    } catch (e) {
      console.error("Error al leer el censo:", e);
    }
  }, []);

 const doctores = [
    { 
      id: 1, 
      nombre: 'Dr. Joaquín Muñoz', 
      especialidad: 'Medicina Interna', 
      estilo: 'EXIGENCIAS ESTRICTAS DEL DR. JOAQUÍN MUÑOZ:\n' +
              '1. DIAGNÓSTICOS: Lista mediana-amplia (≈5 diagnósticos), incorporando antecedentes crónicos definidos (ej. HTA, DM2, EPOC) junto a la causa aguda de egreso.\n' +
              '2. RESUMEN: Inicia obligatoriamente con "Anamnesis Remota:" detallando antecedentes, fármacos previos con dosis, alergias y hábitos. Continúa con "Historia:" o "Historia Clínica:" relatando cronológicamente desde urgencia a sala. Finaliza el apartado de resumen con la fórmula de cierre formal exacta: "Dado estabilidad clínica, paciente se encuentra en condición de alta hospitalaria; se habla con paciente y familiares, lo cual es aceptado".\n' +
              '3. REPOSO / RÉGIMEN: Frase fija educativa de reposo: "No tiene indicación de reposo absoluto. Debe deambular y realizar ejercicio aeróbico a tolerancia...". Régimen amplio pautado: "Rico en fibra, verduras y frutas. Rico en proteínas, preferir de origen vegetal y de carnes magras. Consumir pescado 2 veces por semana. Mantener hidratación abundante".\n' +
              '4. INDICACIONES Y BANDERAS ROJAS: Viñetas claras. Incluye instrucción APS: "Mantener control en APS de sus patologías crónicas. Mostrar este documento para retomar controles...". Banderas rojas con texto estricto idéntico: "Acudir a servicio de urgencias en caso de dolor torácico o abdominal intenso, dificultad respiratoria, fiebre > 38° que no ceda al uso de paracetamol, náuseas y vómitos profusos, incapacidad de ingerir alimentos o agua vía oral...".\n' +
              '5. CITACIONES: Policlínico de altas de Medicina Interna (plazos de 2 semanas a 1 mes) coordinado con Urología o Broncopulmonar.\n' +
              '6. MEDICACIÓN: En la receta deja lista acotada (≈2-4 fármacos), pero realiza exhaustiva conciliación narrada en el texto detallando cuáles crónicos continuar (ej. "Continuar medicamentos crónicos: Losartán, Metformina...") y cuáles se suspenden o modifican.' 
    },
    { 
      id: 2, 
      nombre: 'Dra. Danissa Haro', 
      especialidad: 'Nefrología / Medicina Interna', 
      estilo: 'EXIGENCIAS ESTRICTAS DE LA DRA. DANISSA HARO:\n' +
              '1. DIAGNÓSTICOS: Problema-lista amplio y exhaustivo (≈5-6), desglosando comorbilidades complejas y factores de riesgo (ej. riesgo de realimentación, estenosis valvulares, ERC avanzada).\n' +
              '2. RESUMEN: Estructurado por sistemas. Inicia con "Ant. médicos:", "A. quirúrgicos:", "Alergias:" y "Fármacos:". Cuerpo dividido en subtítulos explícitos: "Hemodinamia/Cardiovascular:", "Respiratorio:", "Infeccioso:", "Neurológico / Salud Mental:" y "Sistema Renal / Metabólico y Medio Interno:". Pega curvas de laboratorio completas fechadas.\n' +
              '3. REPOSO / RÉGIMEN: "Régimen bajo en sodio (< 2gr sal al día), normoproteico según tolerancia" o "Relativo. No manipulación de catéter, no realizar esfuerzo físico con extremidad superior derecha".\n' +
              '4. INDICACIONES: Líneas directas de manejo concreto. Derivación estricta a Nefrología/Hemodiálisis y Cirugía Vascular. Mandato de "Mantener farmacoterapia de base". Banderas rojas enfocadas en accesos vasculares: "Consultar en urgencia en caso de sangrado que empape apósito, dolor en sitio inserción catéter, fiebre, calor local o enrojecimiento".\n' +
              '5. CITACIONES: Nefrología/Hemodiálisis, Cirugía Vascular, Gastroenterología o Paliativos.\n' +
              '6. MEDICACIÓN: Listas medianas-largas (≈8 fármacos) integrando arsenal crónico y agudo explícitamente ("Mantener farmacoterapia de base").' 
    },
    { 
      id: 3, 
      nombre: 'Dra. Andrea Chávez', 
      especialidad: 'Cardiología', 
      estilo: 'EXIGENCIAS ESTRICTAS DE LA DRA. ANDREA CHÁVEZ:\n' +
              '1. DIAGNÓSTICOS: Problema-lista extenso (≈6) cardiovascular, renal y metabólico severo.\n' +
              '2. RESUMEN: "Anamnesis Remota:" y "Anamnesis Próxima:" o "Motivo de hospitalización:". Subtítulo distintivo: "Evolución durante estadía en sala:". Pega curvas detalladas de laboratorio e informes de ecocardiogramas o AngioTAC. Apartado final explícito: "Condición al alta:" o "Al alta:" detallando estabilidad hemodinámica y mecánica ventilatoria.\n' +
              '3. REPOSO / RÉGIMEN: Reposo "Relativo". Régimen: "Bajo en sodio y en azúcares. Aumentar el consumo de fibra" y "Abundante hidratación (2 L al día). Deambular con supervisión en hogar".\n' +
              '4. INDICACIONES: Viñetas claras de perfil cardiológico. Órdenes de estudios ambulatorios ("Se deja orden de Holter de ritmo...", "Rescatar biopsia..."), tránsito intestinal y alerta: "Ante nuevo episodio de dolor torácico o compromiso de conciencia acudir a urgencias".\n' +
              '5. CITACIONES: Cardiología, Poli altas de Medicina e Instituto/CESFAM.\n' +
              '6. MEDICACIÓN: 6-8 fármacos (60% fuera de arsenal).' 
    },
    { 
      id: 4, 
      nombre: 'Dr. Francisco Javier Araneda', 
      especialidad: 'Medicina Interna', 
      estilo: 'EXIGENCIAS ESTRICTAS DEL DR. FRANCISCO JAVIER ARANEDA:\n' +
              '1. DIAGNÓSTICOS: Lista acotada (≈2-3 diagnósticos principales).\n' +
              '2. RESUMEN: Apartados "Antecedentes:" (mórbidos) e "Historia clínica:" o "Evolución". Vuelve a listar los diagnósticos definitivos dentro del cuerpo del resumen clínico y pega laboratorio de control fechado en formato horizontal abreviado.\n' +
              '3. REPOSO / RÉGIMEN: "Bajo en sal. Evitar consumo de carnes rojas. Suspender tabaco". Reposo "relativo", prescribiendo de forma directa sesiones de kinesiología motora y respiratoria.\n' +
              '4. INDICACIONES: Concretas y directas (ej. completar días específicos de ATB EV indicando fecha exacta). Reconsulta corta: "acudir a Servicio de urgencias SOS" ante fiebre o dolor refractario.\n' +
              '5. CITACIONES: Cardiología y Medicina Interna (1 a 2 meses).\n' +
              '6. MEDICACIÓN: ~7 fármacos integrando crónicos y nuevas terapias.' 
    },
    { 
      id: 5, 
      nombre: 'Dra. Elizabeth Carolina Figueroa', 
      especialidad: 'Diabetología / Medicina Interna', 
      estilo: 'EXIGENCIAS ESTRICTAS DE LA DRA. ELIZABETH CAROLINA FIGUEROA:\n' +
              '1. DIAGNÓSTICOS: Lista acotada (≈3 diagnósticos).\n' +
              '2. RESUMEN: "Antecedentes" y "Historia clínica" o "Motivo de hospitalización", con fuerte foco en la red de apoyo sociofamiliar y educación médica brindada. Bloque final de "Condición al alta".\n' +
              '3. REPOSO / RÉGIMEN: "Relativo" o "Relativo Asistido, liviano según tolerancia".\n' +
              '4. INDICACIONES: Bloque fijo de educación institucional reutilizado casi textual:\n' +
              '   - "Mantener controles por patologías crónicas en hospital de base y consultorio correspondiente por domicilio"\n' +
              '   - "Estilo de vida saludable: dieta, ejercicio (según tolerancia) y evitar hábitos tóxicos (tabaco y alcohol)"\n' +
              '   - "Se explican recomendaciones, elaborar estrategias en conjunto con paciente y su red de apoyo en caso de riesgo... importancia de ante síntomas de alarma acudir al servicio de urgencia"\n' +
              '5. CITACIONES: Diabetes, Hematología, TACO, Traumatología, Paliativos.\n' +
              '6. MEDICACIÓN: ~8 fármacos con conciliación explícita del 100% de los basales.' 
    },
    { 
      id: 6, 
      nombre: 'Dr. Mauro Antonio Correa', 
      especialidad: 'Cirugía Vascular / Medicina', 
      estilo: 'EXIGENCIAS ESTRICTAS DEL DR. MAURO ANTONIO CORREA:\n' +
              '1. DIAGNÓSTICOS: Mediana (≈4), jerarquizando diagnóstico principal agudo (ej. disfunción de acceso vascular) seguido de comorbilidades crónicas y sus estadíos (ERC etapa V en HD).\n' +
              '2. RESUMEN: Prosa formal con subtítulos "Anamnesis remota:" e "Historia actual:". Incluye procedencia, motivo de consulta y notas de ecoscopías o ecografías doppler con fecha.\n' +
              '3. REPOSO / RÉGIMEN: Detallado en varias líneas: "Blando hiposódico. Bajo en potasio y fósforo. Restricción hídrica < 1000cc/día". Reposo "Relativo" (sentar asistido y progresivamente levantar).\n' +
              '4. INDICACIONES: Frases formales a la medida. Detalla exámenes pendientes con instrucciones precisas ("Realizar angioTAC de vasos de cuello y tórax, CON FASE VENOSA..."). Banderas rojas de procedimiento: "Acudir a urgencias en caso de dolor a nivel donde se instalaron los catéteres, secreción purulenta o sanguinolenta, fiebre, calofríos...".\n' +
              '5. CITACIONES: Policlínicos de especialidad o cirugía vascular ("Gestionar al alta, a la brevedad").\n' +
              '6. MEDICACIÓN: 10-11 fármacos extensos.' 
    },
    { 
      id: 7, 
      nombre: 'Dra. Andrea Alejandra Ortiz', 
      especialidad: 'Medicina Interna', 
      estilo: 'EXIGENCIAS ESTRICTAS DE LA DRA. ANDREA ALEJANDRA ORTIZ:\n' +
              '1. DIAGNÓSTICOS: Acotada (≈3 diagnósticos).\n' +
              '2. RESUMEN: "Anamnesis remota" e "Historia:" o "Anamnesis próxima". Conciso, semiformal, con abreviaturas (SOS, VO). Incluye desglose de urgencia y cuidados críticos. Apartado explícito "Condición al alta o Al alta:".\n' +
              '3. REPOSO / RÉGIMEN: Breve (1-2 líneas), "Relativo, favorecer movilización temprana" e "Hiposódico".\n' +
              '4. INDICACIONES: Líneas directas que mezclan control ambulatorio con advertencia: "Consultar en servicios de urgencia en caso de dolor torácico o epigástrico opresivo, disnea, sudoración profusa...". Órdenes de exámenes ambulatorios ("Realizar ecocardiograma de forma ambulatoria").\n' +
              '5. CITACIONES: CAE Medicina Interna en "1 mes post alta" o CESFAM para EMPA.\n' +
              '6. MEDICACIÓN: Cortas (3-4 fármacos esenciales).' 
    },
    { 
      id: 8, 
      nombre: 'Dr. Stanko Karelovic', 
      especialidad: 'Gastroenterología', 
      estilo: 'EXIGENCIAS ESTRICTAS DEL DR. STANKO KARELOVIC:\n' +
              '1. DIAGNÓSTICOS: Mediana (≈3-4) separando principal de comorbilidades.\n' +
              '2. RESUMEN: Estructurado compacto. "-Antecedentes:" con guion (telegráfico). "Laboratorio de ingreso [fecha]:" con valores pegados consecutivos. Sección central dividida estrictamente por subtítulos de sistemas: "Hemodinamia:", "Respiratorio:", "Digestivo:" o "Infeccioso:".\n' +
              '3. REPOSO / RÉGIMEN: Breves y funcionales. "Relativo, evitar fuerza y ejercicios con carga" y régimen "Liviano" o "Liviano y bajo en sodio, evitar alcohol".\n' +
              '4. INDICACIONES: Viñetas cortas con guion. Control por subespecialidades y llamado directo: "Acudir a urgencias SOS en caso de nuevo dolor importante, signos de sangrado activo en deposiciones o compromiso de conciencia".\n' +
              '5. CITACIONES: Policlínico de Gastroenterología, Oncología o Paliativos en "7 a 10 días" o "en un mes" (EDA con toma de biopsia).\n' +
              '6. MEDICACIÓN: 7-10 fármacos mixtos sin texto de conciliación.' 
    },
    { 
      id: 9, 
      nombre: 'Dr. Pablo Sebastián Chávez', 
      especialidad: 'Oncología / Medicina Interna', 
      estilo: 'EXIGENCIAS ESTRICTAS DEL DR. PABLO SEBASTIÁN CHÁVEZ:\n' +
              '1. DIAGNÓSTICOS: Extenso problema-lista (≈8) con estadios y escalas (Child-Pugh, MELD, PESI).\n' +
              '2. RESUMEN: Riguroso con campos del sistema ("ANTECEDENTES: MÓRBIDOS / QUIRÚRGICOS / FÁRMACOS / ALERGIAS / HÁBITOS / SOCIAL"). Relato cronológico, exámenes con fecha, curso intrahospitalario por unidades o apartado "PLANES: Hemodinamia / Respiratorio / Oncológico / General-Social".\n' +
              '3. REPOSO / RÉGIMEN: MAYÚSCULAS sostenidas condicionado con flechas o notas de progresión: "RELATIVO. DEAMBULAR EN DOMICILIO", "Por náuseas y vómitos -> fraccionar alimentación en 6 veces...".\n' +
              '4. INDICACIONES: Extensas, carácter educativo, pre-habilitación, confort, directrices de Adecuación del Esfuerzo Terapéutico (AET).\n' +
              '5. CITACIONES: Gastroenterología, Reumatología, Cuidados Paliativos, CESFAM.\n' +
              '6. MEDICACIÓN: 6-13 fármacos orientados a síntomas críticos, opioides y paliativos.' 
    },
    { 
      id: 10, 
      nombre: 'Dr. Giorgio Ferri', 
      especialidad: 'Oncología / Cuidados Paliativos', 
      estilo: 'EXIGENCIAS ESTRICTAS DEL DR. GIORGIO FERRI:\n' +
              '1. DIAGNÓSTICOS: Mediana (≈4) enfocada en sospechas u oncológicos avanzados.\n' +
              '2. RESUMEN: Altamente subseccionado. Título "HISTORIA CLÍNICA:" o "RESUMEN HOSPITALIZACIÓN", dividiéndose en "Anamnesis remota:" (mórbidos, quirúrgicos, fármacos, alergias, hábitos) y "Anamnesis próxima:". Muletillas: "Laboratorio de ingreso destaca:", "Otros exámenes al ingreso:". Fechas exactas de TC/RNM.\n' +
              '3. REPOSO / RÉGIMEN: Condicionado a órtesis o asistencia: "Relativo en domicilio, con asistencia", "Relativo. Uso de faja corset dorsolumbar según indicación de neurocirugía".\n' +
              '4. INDICACIONES: Concretas para pacientes oncológicos o de confort. Pasos para rehospitalizaciones programadas ("Re-hospitalizar el martes... para fibrobroncoscopia..."), pautas pre-procedimiento.\n' +
              '5. CITACIONES: Paliativos oncológicos, Radioterapia, Oncología médica post comité.\n' +
              '6. MEDICACIÓN: 3-6 fármacos (analgesia transdérmica/sistémica potente y habituación).' 
    },
    { 
      id: 11, 
      nombre: 'Dra. Rebeca Vílchez', 
      especialidad: 'Nefrología', 
      estilo: 'EXIGENCIAS ESTRICTAS DE LA DRA. REBECA VÍLCHEZ:\n' +
              '1. DIAGNÓSTICOS: Extenso (≈8) con estructura numérica minuciosa (resueltos, agudos, medio interno, crónicos).\n' +
              '2. RESUMEN: Predominantemente en minúsculas y telegráfico. Títulos "Anamnesis remota:", "Motivo de consulta:", "Anamnesis próxima:". Laboratorios abreviados en línea con fecha corta (ej. "17.4 INGRESO..."). Evolución bajo rótulo exclusivo "EVOLUCIÓN POR PLANES" o "EVOLUCIÓN POR SISTEMAS" (Hemodinamia, Infeccioso, Medio interno, Respiratorio, Tromboprofilaxis).\n' +
              '3. CAMPOS NEGATIVOS: Constancia explícita con la palabra "no" en campos opcionales del sistema (Complicaciones durante la hospitalización: no; Cirugía(s) y/o intervenciones realizada(s): no; Procedimientos realizados: no; Infecciones intrahospitalarias: no).\n' +
              '4. REPOSO / RÉGIMEN: Minúsculas breves ("relativo / comun", "semisólidos y líquidos fraccionados con asistencia").\n' +
              '5. INDICACIONES: Minúsculas telegráficas. Banderas rojas: "consultar a URGENCIAS en caso de fiebre, dolor abdominal que no ceda...".\n' +
              '6. CITACIONES Y MEDICACIÓN: Peritoneodiálisis, Nefrología o Medicina Interna (15 días a 2 meses). 5-8 fármacos con insumos sustitutivos crónicos.' 
    },
    { 
      id: 12, 
      nombre: 'Dra. Daniela Andrea López', 
      especialidad: 'Diabetología / Medicina Interna', 
      estilo: 'EXIGENCIAS ESTRICTAS DE LA DRA. DANIELA ANDREA LÓPEZ:\n' +
              '1. DIAGNÓSTICOS: Mediana (≈4) enfocada en urgencias metabólicas complejas (CAD resuelta), debuts y focos infecciosos.\n' +
              '2. RESUMEN: Ordenado. Inicia con "1. Antecedentes" y "2. Historia clínica". Describe ingreso, progresión en UTI y destete de soportes. Informes de procedimientos invasivos endoscópicos/quirúrgicos. Cierra con la fórmula formal: "Dado estabilidad clínica, paciente se encuentra en condición de alta; se habla con paciente y familiares, lo cual es aceptado".\n' +
              '3. REPOSO / RÉGIMEN: "Relativo a tolerancia", "liviano con consistencia a tolerancia" o "Común hiposódico y diabético".\n' +
              '4. INDICACIONES: Detalladas de carácter organizativo. Viñetas para SOME, monitoreo y educación de insumos ("Solicitar hora en SOME para ingreso en poli diabetes...", "dejo receta para solicitar glucómetro"). Uso de MAYÚSCULAS puntuales para enfatizar lugares (CESFAM, SOME).\n' +
              '5. CITACIONES: CAE Diabetes, Oncología, Paliativos o Poli altas de Medicina (1-2 meses).\n' +
              '6. MEDICACIÓN: 5-8 fármacos con transición de insulinoterapia y material complementario (agujas, lancetas, cintas).' 
    }
  ];

  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [tipoDoc, setTipoDoc] = useState<string>('Epicrisis');
  
  const [esqueletoActual, setEsqueletoActual] = useState<string>(PLANTILLAS_POR_DEFECTO['Epicrisis']);
  const [rawData, setRawData] = useState<string>('');
  const [archivosAdjuntos, setArchivosAdjuntos] = useState<Array<{ base64: string; mimeType: string; nombre: string; vistaPrevia?: string }>>([]);
  const [linkGoogleDocs, setLinkGoogleDocs] = useState<string>('');
  
  const [sanitizedPreview, setSanitizedPreview] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (PLANTILLAS_POR_DEFECTO[tipoDoc]) {
      setEsqueletoActual(PLANTILLAS_POR_DEFECTO[tipoDoc]);
    }
  }, [tipoDoc]);

  const handleSubirArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      if (file.type.startsWith('image/')) {
        reader.onload = () => {
          setArchivosAdjuntos(prev => [
            ...prev,
            {
              base64: reader.result as string,
              mimeType: file.type,
              nombre: file.name,
              vistaPrevia: reader.result as string
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        reader.onload = () => {
          setArchivosAdjuntos(prev => [
            ...prev,
            {
              base64: reader.result as string,
              mimeType: file.type,
              nombre: file.name
            }
          ]);
        };
        reader.readAsDataURL(file);
      } else {
        reader.onload = () => {
          setRawData(prev => prev ? `${prev}\n\n--- ARCHIVO ADJUNTO (${file.name}) ---\n${reader.result}` : String(reader.result));
        };
        reader.readAsText(file);
      }
    });

    e.target.value = '';
  };

  const removerArchivoAdjunto = (index: number) => {
    setArchivosAdjuntos(prev => prev.filter((_, i) => i !== index));
  };

  const cargarDatosCensoEnRawData = (pacienteId: string) => {
    const p = pacientes.find((x: any) => String(x.id) === String(pacienteId) || String(x.cama) === String(pacienteId));
    if (!p) return;

    let texto = `PACIENTE: ${p.nombre || 'N/A'} (${p.edad || 'N/A'} años) - Cama: ${p.cama || 'N/A'}\n`;
    texto += `Fecha Ingreso: ${p.fechaIngreso || 'N/A'}\n`;
    if (p.diagnostico) texto += `Diagnóstico: ${p.diagnostico}\n`;
    if (p.atbNombre) texto += `Antibiótico (ATB): ${p.atbNombre} (Días: ${p.atbDias || '1'})\n`;
    if (p.incobertura) texto += `Foco / Incobertura: ${p.incobertura}\n`;
    if (p.anamnesis) texto += `Anamnesis / Antecedentes: ${p.anamnesis}\n`;
    if (p.curacion?.activo) texto += `Curación: ${p.curacion.tipo || 'Curación activa'} (cada ${p.curacion.frecuenciaDias || 3} días, última: ${p.curacion.ultimaFecha || ''})\n`;

    if (Array.isArray(p.pendientes) && p.pendientes.length > 0) {
      texto += `\nPendientes Clínicos:\n` + p.pendientes.map((pe: any) => `- ${pe.texto || pe}`).join('\n') + '\n';
    }

    if (Array.isArray(p.evoluciones) && p.evoluciones.length > 0) {
      texto += `\nHISTORIAL DE EVOLUCIONES E INTERCONSULTAS:\n`;
      p.evoluciones.forEach((evo: any) => {
        const header = evo.tipo === 'ic' ? `[IC: ${evo.especialidad || 'Especialista'} - ${evo.medico || ''}]` : `[Evolución ${evo.fecha || ''}]`;
        texto += `\n${header} (${evo.fecha || ''}):\n${evo.texto}\n`;
      });
    }

    setRawData(texto);
  };

  const handleVerifySanitization = () => {
    if (!rawData.trim() && archivosAdjuntos.length === 0 && !linkGoogleDocs.trim()) return;
    const result = sanitizeClinicalText(rawData || 'Datos clínicos adjuntos en imágenes, documentos o enlace.');
    setSanitizedPreview(result);
  };

  const executeGeneration = async () => {
    try {
      setIsGenerating(true);
      setError('');
      
      const savedConfig = localStorage.getItem('wc_config') || localStorage.getItem('gemini_api_key');
      let apiKey = '';
      if (savedConfig) {
        try {
          const parsed = JSON.parse(savedConfig);
          apiKey = parsed.apiKey || savedConfig;
        } catch {
          apiKey = savedConfig;
        }
      }

      const p = pacientes.find((x: any) => String(x.id) === String(selectedPacienteId) || String(x.cama) === String(selectedPacienteId));
      const doc = doctores.find(x => x.id === Number(selectedDoctorId));
      
      const camaInitialsPlaceholder = p ? `Cama ${p.cama || 'N/A'} - ${p.nombre || 'Paciente'} (${p.edad || 'N/A'} años, Ingreso: ${p.fechaIngreso?.split('-').reverse().join('/') || 'N/A'})` : '[CAMA / PACIENTE]';
      const customizedEsqueleto = esqueletoActual.replace(/{{CAMA_INICIALES}}/g, camaInitialsPlaceholder);

      const response = await generateClinicalDocumentWithGemini({
        tipoDocumento: tipoDoc,
        esqueletoFormat: customizedEsqueleto,
        preferenciasEstilo: doc?.estilo || 'Formato estándar formal.',
        rawData: sanitizedPreview ? sanitizedPreview.textSanitized : rawData,
        archivos: archivosAdjuntos,
        linkGoogleDocs: linkGoogleDocs.trim() || undefined
      }, apiKey || undefined);

      setOutput(response.text);
      setSanitizedPreview(null);

    } catch (err: any) {
      setError(err.message || 'Error en el motor de Gemini.');
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderHighlightedOutput = (text: string) => {
    const parts = text.split(/(\[FALTA:[^\]]+\])/g);
    return parts.map((part, i) => {
      if (part.startsWith('[FALTA:')) {
        return <span key={i} className="bg-yellow-200 text-yellow-900 font-bold px-1.5 py-0.5 rounded shadow-sm">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="p-3 md:p-6 max-w-7xl mx-auto space-y-4 md:space-y-6">
      
      <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-gray-900 flex items-center gap-2">
            <Wand2 className="w-6 h-6 text-purple-600" /> Redactor Clínico IA
          </h1>
          <p className="text-xs md:text-sm text-gray-500">
            Generación asistida de Epicrisis, Ingresos y Evoluciones basada en el estilo de médicos del HCM.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start">
        
        {/* COLUMNA IZQUIERDA: FORMULARIO Y DATOS */}
        <div className="bg-white p-4 md:p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase text-gray-500 mb-1 tracking-wider">Tipo de Documento</label>
              <select 
                value={tipoDoc} 
                onChange={e => setTipoDoc(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="Epicrisis">Epicrisis Médica</option>
                <option value="Ingreso">Ficha de Ingreso</option>
                <option value="Evolución">Evolución Diaria</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase text-gray-500 mb-1 tracking-wider">Estilo / Médico HCM</label>
              <select 
                value={selectedDoctorId} 
                onChange={e => setSelectedDoctorId(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm font-semibold outline-none focus:ring-2 focus:ring-purple-400"
              >
                <option value="">-- Estilo General / Estándar --</option>
                {doctores.map(doc => (
                  <option key={doc.id} value={doc.id}>{doc.nombre} ({doc.especialidad})</option>
                ))}
              </select>
            </div>
          </div>

          {pacientes.length > 0 && (
            <div className="bg-purple-50/50 p-3 rounded-xl border border-purple-100">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase text-purple-900 mb-1 tracking-wider">
                Vincular Paciente del Censo (Opcional)
              </label>
              <select
                value={selectedPacienteId}
                onChange={e => {
                  setSelectedPacienteId(e.target.value);
                  if (e.target.value) cargarDatosCensoEnRawData(e.target.value);
                }}
                className="w-full p-2 bg-white border border-purple-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-purple-400 font-medium text-gray-800"
              >
                <option value="">-- Seleccionar paciente para importar antecedentes --</option>
                {pacientes.map(p => (
                  <option key={p.id} value={p.id}>
                    Cama {p.cama} - {p.nombre} ({p.diagnostico || 'Sin Dx'})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="bg-gray-50 p-3 rounded-xl border border-gray-200 space-y-2.5">
            <span className="text-[10px] md:text-[11px] font-bold uppercase text-gray-700 tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" /> Adjuntar Fotos, PDFs o Google Docs
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-2 gap-2">
              <label className="flex items-center justify-center gap-1.5 p-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-purple-50 hover:border-purple-300 text-gray-700 hover:text-purple-900 text-xs font-bold transition-all shadow-sm">
                <Camera className="w-4 h-4 text-purple-600" />
                <span>Tomar Foto</span>
                <input type="file" accept="image/*" capture="environment" multiple className="hidden" onChange={handleSubirArchivo} />
              </label>

              <label className="flex items-center justify-center gap-1.5 p-2 bg-white border border-gray-200 rounded-lg cursor-pointer hover:bg-blue-50 hover:border-blue-300 text-gray-700 hover:text-blue-900 text-xs font-bold transition-all shadow-sm">
                <FileUp className="w-4 h-4 text-blue-600" />
                <span>Subir PDFs / Fotos</span>
                <input type="file" accept="image/*,application/pdf,.txt" multiple className="hidden" onChange={handleSubirArchivo} />
              </label>
            </div>

            {archivosAdjuntos.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-600 uppercase">
                  Archivos adjuntos ({archivosAdjuntos.length}):
                </span>
                <div className="grid grid-cols-1 gap-1.5 max-h-36 overflow-y-auto">
                  {archivosAdjuntos.map((arc, idx) => (
                    <div key={idx} className="bg-white p-2 rounded-lg border border-purple-200 flex items-center justify-between gap-2 shadow-2xs">
                      <div className="flex items-center gap-2 truncate">
                        {arc.vistaPrevia ? (
                          <img src={arc.vistaPrevia} alt="Adjunto" className="w-7 h-7 object-cover rounded border" />
                        ) : (
                          <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                        )}
                        <span className="text-xs font-bold text-gray-800 truncate">{arc.nombre}</span>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => removerArchivoAdjunto(idx)} 
                        className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors"
                        title="Quitar archivo"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 bg-white p-2 border border-gray-200 rounded-lg focus-within:ring-2 focus-within:ring-purple-400">
              <Link className="w-4 h-4 text-gray-400 shrink-0" />
              <input
                type="text"
                placeholder="Pega aquí el enlace de Google Docs..."
                value={linkGoogleDocs}
                onChange={e => setLinkGoogleDocs(e.target.value)}
                className="w-full text-xs outline-none text-gray-800"
              />
              {linkGoogleDocs && (
                <button type="button" onClick={() => setLinkGoogleDocs('')} className="text-gray-400 hover:text-gray-600">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="shrink-0">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-1 mb-1.5">
              <label className="text-[10px] md:text-[11px] font-bold uppercase text-gray-500 tracking-wider">Esqueleto / Formato Base</label>
              <button 
                onClick={() => setEsqueletoActual(PLANTILLAS_POR_DEFECTO[tipoDoc] || '')}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-semibold text-left sm:text-right"
              >
                Restaurar plantilla por defecto
              </button>
            </div>
            <textarea 
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] md:text-xs font-mono h-28 md:h-32 outline-none focus:ring-2 focus:ring-blue-400 transition-shadow resize-none leading-relaxed text-gray-700"
              value={esqueletoActual}
              onChange={e => setEsqueletoActual(e.target.value)}
            />
          </div>

          <div className="flex-1 min-h-[140px] flex flex-col">
            <div className="flex justify-between items-center mb-1.5 shrink-0">
              <label className="block text-[10px] md:text-[11px] font-bold uppercase text-gray-500 tracking-wider">Datos Clínicos / Notas / Evoluciones</label>
              {selectedPacienteId && (
                <button
                  type="button"
                  onClick={() => cargarDatosCensoEnRawData(selectedPacienteId)}
                  className="text-[10px] text-purple-600 hover:text-purple-800 font-bold flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3" /> Re-cargar datos del censo
                </button>
              )}
            </div>
            <textarea 
              className="w-full p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm h-48 md:h-56 font-mono outline-none focus:ring-2 focus:ring-blue-400 transition-shadow resize-none leading-relaxed text-gray-800"
              placeholder="Pega aquí laboratorios, evolución intrahospitalaria, notas de interconsulta..."
              value={rawData} 
              onChange={e => setRawData(e.target.value)}
            />
          </div>

          {!sanitizedPreview && (
            <button 
              onClick={handleVerifySanitization}
              disabled={(!rawData.trim() && archivosAdjuntos.length === 0 && !linkGoogleDocs.trim()) || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 md:py-3.5 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shrink-0"
            >
              <ShieldAlert className="w-4 h-4" /> Sanitizar y Revisar Privacidad
            </button>
          )}

          {sanitizedPreview && (
            <div className="bg-amber-50 border border-amber-200 p-3 md:p-4 rounded-xl space-y-3 shrink-0 shadow-sm animate-in fade-in duration-300">
              <div className="flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <h3 className="font-bold text-amber-900 text-[10px] md:text-xs uppercase tracking-wider">Filtro de Privacidad Activo</h3>
              </div>
              <p className="text-[11px] md:text-xs text-amber-800 leading-snug">Revisa cómo se enviará la información sin datos identificables:</p>
              <div className="bg-white p-2.5 md:p-3 rounded-lg border border-amber-100 text-[10px] md:text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap text-gray-700 shadow-inner">
                {sanitizedPreview.textSanitized}
              </div>
              <div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end pt-2">
                <button onClick={() => setSanitizedPreview(null)} className="w-full sm:w-auto bg-white border border-gray-200 text-gray-700 px-4 py-2 text-xs font-bold rounded-lg transition-colors">Corregir Texto</button>
                <button onClick={executeGeneration} disabled={isGenerating} className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-green-600 text-white px-5 py-2 text-xs font-bold rounded-lg hover:bg-green-700 shadow-sm transition-colors">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Generando con Gemini...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-3.5 h-3.5"/>
                      <span>Confirmar y Generar ✨</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold shrink-0">{error}</div>}
        </div>

        {/* COLUMNA DERECHA: DOCUMENTO ESTRUCTURADO (50% de la pantalla) */}
        <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col min-h-[500px] lg:sticky lg:top-4">
          {output ? (
            <div className="flex flex-col h-full animate-in zoom-in-95 duration-300">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-100 pb-3 md:pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-600" />
                  <h3 className="text-base md:text-lg font-bold text-gray-900">Documento Estructurado</h3>
                </div>
                <button 
                  onClick={copyToClipboard}
                  className={`w-full sm:w-auto flex items-center justify-center gap-1.5 px-5 py-2 text-xs md:text-sm font-bold rounded-xl transition-all shadow-sm ${copied ? 'bg-green-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'}`}
                >
                  {copied ? <><CheckCircle2 className="w-4 h-4"/> ¡Copiado!</> : <><Copy className="w-4 h-4"/> Copiar Texto</>}
                </button>
              </div>
              
              <div className="mt-4 bg-gray-50 border border-gray-100 p-4 md:p-5 rounded-xl font-sans text-[13px] md:text-sm text-gray-800 leading-relaxed overflow-y-auto whitespace-pre-wrap select-all shadow-inner max-h-[75vh]">
                {renderHighlightedOutput(output)}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 md:p-12 text-center text-gray-400 h-full min-h-[450px] flex flex-col items-center justify-center bg-gray-50/50">
              <div className="bg-purple-50 p-4 rounded-full mb-3 text-purple-600">
                <FileText className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-gray-700 mb-1">Área de Visualización del Documento</p>
              <p className="text-xs max-w-sm text-gray-500 leading-relaxed">
                El borrador clínico generado por Gemini adaptado al estilo del médico emisor seleccionado aparecerá en este panel listo para revisar y copiar a la ficha clínica.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
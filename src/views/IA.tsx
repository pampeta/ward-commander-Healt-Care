import React, { useState, useEffect } from 'react';
import { generateClinicalDocumentWithGemini } from '../Services/gemini';
import { sanitizeClinicalText } from '../Services/sanitizer';
import { FileText, Wand2, Copy, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';

// Plantillas base editadas y adaptadas según las exigencias de cada médico/servicio
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
  // 1. CARGAR PACIENTES REALES DESDE EL CENSO (localStorage)
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

  // Estado del formulario
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [tipoDoc, setTipoDoc] = useState<string>('Epicrisis');
  
  // Plantilla editable en tiempo real según el tipo de documento o preferencia del doctor
  const [esqueletoActual, setEsqueletoActual] = useState<string>(PLANTILLAS_POR_DEFECTO['Epicrisis']);
  const [rawData, setRawData] = useState<string>('');
  
  // Estado de la IA
  const [sanitizedPreview, setSanitizedPreview] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [output, setOutput] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Cambiar plantilla base automáticamente al cambiar de tipo de documento
  useEffect(() => {
    if (PLANTILLAS_POR_DEFECTO[tipoDoc]) {
      setEsqueletoActual(PLANTILLAS_POR_DEFECTO[tipoDoc]);
    }
  }, [tipoDoc]);

  const handleVerifySanitization = () => {
    if (!rawData.trim()) return;
    const result = sanitizeClinicalText(rawData);
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
      
      if (!apiKey) {
        throw new Error('API Key de Gemini no encontrada. Por favor regístrala.');
      }

      // Buscar paciente en el censo real (puede usar id o cama/nombre)
      const p = pacientes.find((x: any) => String(x.id) === String(selectedPacienteId) || String(x.cama) === String(selectedPacienteId));
      const doc = doctores.find(x => x.id === Number(selectedDoctorId));
      
      const camaInitialsPlaceholder = p ? `Cama ${p.cama || 'N/A'} - ${p.nombre || 'Paciente'} (${p.edad || 'N/A'} años, Ingreso: ${p.fechaIngreso?.split('-').reverse().join('/') || 'N/A'})` : '[CAMA / PACIENTE]';
      const customizedEsqueleto = esqueletoActual.replace(/{{CAMA_INICIALES}}/g, camaInitialsPlaceholder);

      const response = await generateClinicalDocumentWithGemini({
        tipoDocumento: tipoDoc,
        esqueletoFormat: customizedEsqueleto,
        preferenciasEstilo: doc?.estilo || 'Formato estándar formal.',
        rawData: sanitizedPreview ? sanitizedPreview.textSanitized : rawData
      }, apiKey);

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

  // --- DISEÑO OPTIMIZADO (MOBILE-FIRST) ---
  return (
    <div className="p-3 md:p-6 max-w-[1600px] mx-auto space-y-4 md:space-y-6 bg-gray-50 min-h-full flex flex-col">
      
      {/* Banner Permanente Adaptativo */}
      <div className="bg-red-50/80 border-l-4 border-red-500 p-3 md:p-4 rounded-r-xl flex items-start gap-3 shadow-sm shrink-0">
        <ShieldAlert className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
        <p className="text-[11px] md:text-xs text-red-800 leading-relaxed">
          <strong className="text-red-900">Borrador generado por IA:</strong> Verificar cada dato clínico antes de usar. Los formatos se adaptan rigurosamente al estilo del médico emisor seleccionado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 items-start flex-1 overflow-hidden">
        
        {/* PANEL IZQUIERDO: Inputs y Formatos */}
        <div className="space-y-4 md:space-y-5 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col max-h-[85vh] lg:max-h-full overflow-y-auto">
          
          <div className="flex items-center gap-2 border-b border-gray-100 pb-3 shrink-0">
            <Wand2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg md:text-xl font-bold text-gray-900">Generador por Médico Emisor</h2>
          </div>
          
          {/* Grid responsivo: 1 columna en celular, 3 en PC */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 shrink-0">
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase text-gray-500 mb-1.5 tracking-wider">Paciente (Censo)</label>
              <select className="w-full p-2.5 md:p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 transition-shadow appearance-none cursor-pointer" value={selectedPacienteId} onChange={e => setSelectedPacienteId(e.target.value)}>
                <option value="">Seleccionar del Censo...</option>
                {pacientes.map((p, idx) => (
                  <option key={p.id || idx} value={p.id || p.cama}>
                    {p.cama ? `Cama ${p.cama}` : ''} - {p.nombre || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase text-gray-500 mb-1.5 tracking-wider">Documento</label>
              <select className="w-full p-2.5 md:p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 transition-shadow appearance-none cursor-pointer" value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}>
                <option value="Epicrisis">Epicrisis</option>
                <option value="Ingreso">Ingreso</option>
                <option value="Evolución">Evolución</option>
              </select>
            </div>
            <div>
              <label className="block text-[10px] md:text-[11px] font-bold uppercase text-gray-500 mb-1.5 tracking-wider">Médico Emisor</label>
              <select className="w-full p-2.5 md:p-3 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm outline-none focus:ring-2 focus:ring-blue-400 text-gray-800 transition-shadow appearance-none cursor-pointer" value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)}>
                <option value="">Seleccionar doctor...</option>
                {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre} ({d.especialidad})</option>)}
              </select>
            </div>
          </div>

          {/* CAJA EDITABLE PARA PERSONALIZAR EL FORMATO */}
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
              className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl text-[11px] md:text-xs font-mono h-32 md:h-40 outline-none focus:ring-2 focus:ring-blue-400 transition-shadow resize-none leading-relaxed text-gray-700"
              value={esqueletoActual}
              onChange={e => setEsqueletoActual(e.target.value)}
            />
          </div>

          <div className="flex-1 min-h-[150px] flex flex-col">
            <label className="block text-[10px] md:text-[11px] font-bold uppercase text-gray-500 mb-1.5 tracking-wider shrink-0">Notas Sueltas, Laboratorios o Respuestas IC</label>
            <textarea 
              className="w-full p-3 md:p-4 bg-gray-50 border border-gray-200 rounded-xl text-xs md:text-sm h-full font-mono outline-none focus:ring-2 focus:ring-blue-400 transition-shadow resize-none leading-relaxed text-gray-800 flex-1"
              placeholder="Pega aquí laboratorios, evolución intrahospitalaria, notas de interconsulta..."
              value={rawData} 
              onChange={e => setRawData(e.target.value)}
            />
          </div>

          {!sanitizedPreview && (
            <button 
              onClick={handleVerifySanitization}
              disabled={!rawData.trim() || isGenerating}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-bold py-3 md:py-3.5 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md shrink-0"
            >
              <ShieldAlert className="w-4 h-4" /> Sanitizar y Revisar Privacidad
            </button>
          )}

          {/* Diff Intermedio de Confirmación */}
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
                  {isGenerating ? 'Generando IA...' : <><Wand2 className="w-3.5 h-3.5"/> Confirmar y Enviar</>}
                </button>
              </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-semibold shrink-0">{error}</div>}
        </div>

        {/* PANEL DERECHO: Output */}
        <div className="flex flex-col h-full space-y-4 max-h-[85vh] lg:max-h-full">
          {output ? (
            <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col h-full animate-in zoom-in-95 duration-300">
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
              
              <div className="mt-4 bg-gray-50 border border-gray-100 p-4 md:p-5 rounded-xl font-sans text-[13px] md:text-sm text-gray-800 leading-relaxed flex-1 overflow-y-auto whitespace-pre-wrap select-all shadow-inner">
                {renderHighlightedOutput(output)}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-2xl p-8 md:p-12 text-center text-gray-400 h-full min-h-[300px] flex flex-col items-center justify-center bg-white/50">
              <div className="bg-gray-50 p-4 rounded-full mb-3">
                <FileText className="w-8 h-8 text-gray-300" />
              </div>
              <p className="text-sm font-medium text-gray-500 mb-1">Área de Visualización</p>
              <p className="text-xs max-w-xs leading-relaxed">El borrador clínico estructurado por Gemini con el estilo del médico emisor aparecerá en este panel listo para copiar.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
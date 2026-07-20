import React, { useState, useEffect } from 'react';
import { generateClinicalDocumentWithGemini } from '../Services/gemini';
import { sanitizeClinicalText } from '../Services/sanitizer';

// Plantillas base editables según las exigencias de cada médico/servicio
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
* **Diagnósticos de Ingreso:** 
* **Resumen de Evolución Hospitalaria:** 
* **Diagnósticos de Egreso / Alta:** 
* **Indicaciones al Alta y Pendientes:** `
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
    { id: 1, nombre: 'Dra. Ortiz', especialidad: 'Medicina Interna', estilo: 'Frases cortas. Exige fisiopatología explícita.' },
    { id: 2, nombre: 'Dr. Karelovic', especialidad: 'Gastroenterología', estilo: 'Uso estricto de clasificaciones (Child-Pugh, MELD).' },
    { id: 3, nombre: 'Dra. Figueroa', especialidad: 'Medicina Interna', estilo: 'Detalle riguroso en el plan por problemas.' }
  ];

  // Estado del formulario
  const [selectedPacienteId, setSelectedPacienteId] = useState<string>('');
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [tipoDoc, setTipoDoc] = useState<string>('Ingreso');
  
  // Plantilla editable en tiempo real según el tipo de documento o preferencia del doctor
  const [esqueletoActual, setEsqueletoActual] = useState<string>(PLANTILLAS_POR_DEFECTO['Ingreso']);
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
      
      const camaInitialsPlaceholder = p ? `${p.cama || 'Cama'} - ${p.nombre || p.iniciales || 'Paciente'}` : '[CAMA / PACIENTE]';
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
        return <span key={i} className="bg-yellow-200 text-yellow-900 font-bold px-1 rounded">{part}</span>;
      }
      return part;
    });
  };

  return (
    <div className="p-6 max-w-[1600px] mx-auto space-y-4">
      {/* Banner Permanente */}
      <div className="bg-red-50 border-l-4 border-red-600 p-3 rounded-r-lg text-xs text-red-900 shadow-sm">
        ⚠️ <strong>Borrador generado por IA:</strong> Verificar cada dato clínico antes de usar. Los pacientes se cargan directamente desde tu Censo activo.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* PANEL IZQUIERDO: Inputs y Formatos */}
        <div className="space-y-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 border-b pb-2">Entrada Clínica y Formatos</h2>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Paciente (Censo)</label>
              <select className="w-full p-2 bg-gray-50 border rounded-lg text-sm" value={selectedPacienteId} onChange={e => setSelectedPacienteId(e.target.value)}>
                <option value="">Seleccionar del Censo...</option>
                {pacientes.map((p, idx) => (
                  <option key={p.id || idx} value={p.id || p.cama}>
                    {p.cama ? `Cama ${p.cama}` : ''} - {p.nombre || p.iniciales || 'Sin nombre'}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Documento</label>
              <select className="w-full p-2 bg-gray-50 border rounded-lg text-sm" value={tipoDoc} onChange={e => setTipoDoc(e.target.value)}>
                <option value="Ingreso">Ingreso</option>
                <option value="Evolución">Evolución</option>
                <option value="Epicrisis">Epicrisis</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Médico Revisor</label>
              <select className="w-full p-2 bg-gray-50 border rounded-lg text-sm" value={selectedDoctorId} onChange={e => setSelectedDoctorId(e.target.value)}>
                <option value="">Seleccionar...</option>
                {doctores.map(d => <option key={d.id} value={d.id}>{d.nombre} ({d.especialidad})</option>)}
              </select>
            </div>
          </div>

          {/* CAJA EDITABLE PARA PERSONALIZAR EL FORMATO DEL DOCTOR */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold uppercase text-gray-500">Esqueleto / Formato Base (Editable según exigencia del Doc)</label>
              <button 
                onClick={() => setEsqueletoActual(PLANTILLAS_POR_DEFECTO[tipoDoc] || '')}
                className="text-[10px] text-blue-600 hover:underline font-semibold"
              >
                Restaurar plantilla por defecto
              </button>
            </div>
            <textarea 
              className="w-full p-2.5 bg-slate-50 border rounded-lg text-xs font-mono h-36"
              value={esqueletoActual}
              onChange={e => setEsqueletoActual(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase text-gray-500 mb-1">Datos Clínicos Crudos (Pega laboratorios, notas sueltas, etc.)</label>
            <textarea 
              className="w-full p-3 bg-gray-50 border rounded-lg text-sm h-40 font-mono"
              placeholder="Ejemplo: paciente descompensado, crepitantes basales, se solicita PCR y hemograma que muestra leucocitosis..."
              value={rawData} 
              onChange={e => setRawData(e.target.value)}
            />
          </div>

          {!sanitizedPreview && (
            <button 
              onClick={handleVerifySanitization}
              disabled={!rawData.trim() || isGenerating}
              className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50"
            >
              Sanitizar y Revisar Privacidad
            </button>
          )}

          {/* Diff Intermedio de Confirmación */}
          {sanitizedPreview && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg space-y-3">
              <h3 className="font-bold text-amber-900 text-xs uppercase">Filtro de Privacidad Activo</h3>
              <p className="text-xs text-amber-800">Revisa cómo se enviará la información sin datos identificables:</p>
              <div className="bg-white p-2 rounded border text-xs font-mono max-h-32 overflow-y-auto whitespace-pre-wrap">
                {sanitizedPreview.textSanitized}
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setSanitizedPreview(null)} className="bg-gray-200 text-gray-800 px-3 py-1.5 text-xs font-bold rounded">Corregir</button>
                <button onClick={executeGeneration} disabled={isGenerating} className="bg-green-600 text-white px-4 py-1.5 text-xs font-bold rounded hover:bg-green-700">
                  {isGenerating ? 'Generando...' : 'Confirmar y Enviar a IA'}
                </button>
              </div>
            </div>
          )}

          {error && <div className="p-3 bg-red-100 text-red-800 rounded-lg text-xs font-semibold">{error}</div>}
        </div>

        {/* PANEL DERECHO: Output */}
        <div className="space-y-4">
          {output ? (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex justify-between items-center border-b pb-2">
                <h3 className="text-base font-bold text-gray-800">Documento Estructurado</h3>
                <button 
                  onClick={copyToClipboard}
                  className={`px-4 py-1.5 text-xs font-bold rounded-lg border ${copied ? 'bg-green-600 text-white' : 'bg-gray-50 text-gray-700'}`}
                >
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg font-sans text-sm text-gray-800 leading-relaxed max-h-[580px] overflow-y-auto whitespace-pre-wrap select-all shadow-inner">
                {renderHighlightedOutput(output)}
              </div>
            </div>
          ) : (
            <div className="border-2 border-dashed border-gray-200 rounded-xl p-12 text-center text-gray-400 min-h-[400px] flex flex-col items-center justify-center">
              <p className="text-sm">El borrador clínico estructurado por Gemini aparecerá en este panel listo para copiar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
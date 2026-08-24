import { useState } from 'react';
import { Calculator, Heart, Droplets, Wind, Activity } from 'lucide-react';

export default function CalculadorasMedicas() {
  const [categoriaActiva, setCategoriaActiva] = useState<'nefro' | 'cardio' | 'resp' | 'gastro'>('nefro');

  // --- NEFROLOGÍA & MEDIO INTERNO ---
  const [cgEdad, setCgEdad] = useState<string>('');
  const [cgPeso, setCgPeso] = useState<string>('');
  const [cgCreat, setCgCreat] = useState<string>('');
  const [cgSexo, setCgSexo] = useState<'m' | 'f'>('m');

  const calcCockcroft = () => {
    const edad = parseFloat(cgEdad);
    const peso = parseFloat(cgPeso);
    const creat = parseFloat(cgCreat);
    if (!edad || !peso || !creat || creat <= 0) return null;
    const factor = cgSexo === 'f' ? 0.85 : 1.0;
    const clcr = ((140 - edad) * peso * factor) / (72 * creat);
    return clcr.toFixed(1);
  };

  const [fenaNaU, setFenaNaU] = useState<string>('');
  const [fenaNaP, setFenaNaP] = useState<string>('');
  const [fenaCrU, setFenaCrU] = useState<string>('');
  const [fenaCrP, setFenaCrP] = useState<string>('');

  const calcFeNa = () => {
    const naU = parseFloat(fenaNaU);
    const naP = parseFloat(fenaNaP);
    const crU = parseFloat(fenaCrU);
    const crP = parseFloat(fenaCrP);
    if (!naU || !naP || !crU || !crP || naP <= 0 || crU <= 0) return null;
    const fena = (naU * crP * 100) / (naP * crU);
    return fena.toFixed(2);
  };

  const [agNa, setAgNa] = useState<string>('');
  const [agCl, setAgCl] = useState<string>('');
  const [agHco3, setAgHco3] = useState<string>('');
  const [agAlb, setAgAlb] = useState<string>('');

  const calcAnionGap = () => {
    const na = parseFloat(agNa);
    const cl = parseFloat(agCl);
    const hco3 = parseFloat(agHco3);
    const alb = parseFloat(agAlb);
    if (isNaN(na) || isNaN(cl) || isNaN(hco3)) return null;
    const ag = na - (cl + hco3);
    let agCorregido = ag;
    if (!isNaN(alb) && alb > 0) {
      agCorregido = ag + 2.5 * (4.0 - alb);
    }
    return { ag: ag.toFixed(1), agCorregido: agCorregido.toFixed(1) };
  };

  const [naMedido, setNaMedido] = useState<string>('');
  const [glicemia, setGlicemia] = useState<string>('');

  const calcNaCorregido = () => {
    const na = parseFloat(naMedido);
    const g = parseFloat(glicemia);
    if (isNaN(na) || isNaN(g) || g < 100) return null;
    const naKatz = na + 0.016 * (g - 100);
    const naHillier = na + 0.024 * (g - 100);
    return { katz: naKatz.toFixed(1), hillier: naHillier.toFixed(1) };
  };

  // --- CARDIOLOGÍA ---
  const [chaAge, setChaAge] = useState<number>(0);
  const [chaIcc, setChaIcc] = useState<boolean>(false);
  const [chaHta, setChaHta] = useState<boolean>(false);
  const [chaDm, setChaDm] = useState<boolean>(false);
  const [chaAit, setChaAit] = useState<boolean>(false);
  const [chaVasc, setChaVasc] = useState<boolean>(false);
  const [chaFemale, setChaFemale] = useState<boolean>(false);

  const calcCha2ds2Vasc = () => {
    let score = 0;
    if (chaIcc) score += 1;
    if (chaHta) score += 1;
    if (chaAge >= 75) score += 2;
    else if (chaAge >= 65) score += 1;
    if (chaDm) score += 1;
    if (chaAit) score += 2;
    if (chaVasc) score += 1;
    if (chaFemale) score += 1;
    return score;
  };

  const [hasHta, setHasHta] = useState<boolean>(false);
  const [hasRenal, setHasRenal] = useState<boolean>(false);
  const [hasHepatico, setHasHepatico] = useState<boolean>(false);
  const [hasIctus, setHasIctus] = useState<boolean>(false);
  const [hasBleeding, setHasBleeding] = useState<boolean>(false);
  const [hasInrLab, setHasInrLab] = useState<boolean>(false);
  const [hasEdad65, setHasEdad65] = useState<boolean>(false);
  const [hasDrogas, setHasDrogas] = useState<boolean>(false);

  const calcHasBled = () => {
    let s = 0;
    if (hasHta) s += 1;
    if (hasRenal) s += 1;
    if (hasHepatico) s += 1;
    if (hasIctus) s += 1;
    if (hasBleeding) s += 1;
    if (hasInrLab) s += 1;
    if (hasEdad65) s += 1;
    if (hasDrogas) s += 1;
    return s;
  };

  // --- RESPIRATORIO ---
  const [curbC, setCurbC] = useState<boolean>(false);
  const [curbU, setCurbU] = useState<boolean>(false);
  const [curbR, setCurbR] = useState<boolean>(false);
  const [curbB, setCurbB] = useState<boolean>(false);
  const [curb65, setCurb65] = useState<boolean>(false);

  const calcCurb65 = () => {
    let s = 0;
    if (curbC) s += 1;
    if (curbU) s += 1;
    if (curbR) s += 1;
    if (curbB) s += 1;
    if (curb65) s += 1;
    return s;
  };

  const [wellsTv, setWellsTv] = useState<boolean>(false);
  const [wellsAlt, setWellsAlt] = useState<boolean>(false);
  const [wellsFc, setWellsFc] = useState<boolean>(false);
  const [wellsInmob, setWellsInmob] = useState<boolean>(false);
  const [wellsPrev, setWellsPrev] = useState<boolean>(false);
  const [wellsHemopt, setWellsHemopt] = useState<boolean>(false);
  const [wellsCancer, setWellsCancer] = useState<boolean>(false);

  const calcWellsTep = () => {
    let s = 0;
    if (wellsTv) s += 3;
    if (wellsAlt) s += 3;
    if (wellsFc) s += 1.5;
    if (wellsInmob) s += 1.5;
    if (wellsPrev) s += 1.5;
    if (wellsHemopt) s += 1;
    if (wellsCancer) s += 1;
    return s;
  };

  // --- GASTRO & HÍGADO ---
  const [cpBili, setCpBili] = useState<number>(1);
  const [cpAlb, setCpAlb] = useState<number>(1);
  const [cpInr, setCpInr] = useState<number>(1);
  const [cpAscitis, setCpAscitis] = useState<number>(1);
  const [cpEncef, setCpEncef] = useState<number>(1);

  const calcChildPugh = () => {
    const total = cpBili + cpAlb + cpInr + cpAscitis + cpEncef;
    let clase = 'Clase A (5-6 pts): Buena función / Sobrevida 1 año ~100%';
    if (total >= 10) clase = 'Clase C (10-15 pts): Descompensación severa / Sobrevida 1 año ~45%';
    else if (total >= 7) clase = 'Clase B (7-9 pts): Compromiso funcional significativo / Sobrevida 1 año ~80%';
    return { total, clase };
  };

  const [meldBili, setMeldBili] = useState<string>('');
  const [meldInr, setMeldInr] = useState<string>('');
  const [meldCr, setMeldCr] = useState<string>('');
  const [meldDialisis, setMeldDialisis] = useState<boolean>(false);

  const calcMeld = () => {
    let bili = parseFloat(meldBili);
    let inr = parseFloat(meldInr);
    let cr = parseFloat(meldCr);
    if (!bili || !inr || !cr || bili <= 0 || inr <= 0 || cr <= 0) return null;
    if (bili < 1) bili = 1;
    if (inr < 1) inr = 1;
    if (cr < 1) cr = 1;
    if (cr > 4 || meldDialisis) cr = 4;
    const meld = 9.57 * Math.log(cr) + 3.78 * Math.log(bili) + 11.2 * Math.log(inr) + 6.43;
    return Math.round(meld);
  };

  const clcrResult = calcCockcroft();
  const fenaResult = calcFeNa();
  const agResult = calcAnionGap();
  const naCorrResult = calcNaCorregido();
  const chaResult = calcCha2ds2Vasc();
  const hasResult = calcHasBled();
  const curbResult = calcCurb65();
  const wellsResult = calcWellsTep();
  const cpResult = calcChildPugh();
  const meldResult = calcMeld();

  return (
    <div className="p-3 md:p-6 max-w-6xl mx-auto space-y-4 md:space-y-6 bg-gray-50 min-h-screen">
      
      {/* Header */}
      <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-blue-100 text-blue-700 rounded-xl">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-tight">
              Calculadoras Clínicas de Medicina Interna
            </h1>
            <p className="text-xs text-gray-500">
              Scores diagnósticos y pronósticos validados para sala, turnos HCM y EUNACOM.
            </p>
          </div>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl gap-1 shrink-0 overflow-x-auto">
          <button
            onClick={() => setCategoriaActiva('nefro')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              categoriaActiva === 'nefro' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Droplets className="w-4 h-4" /> Nefro & Medio Interno
          </button>
          <button
            onClick={() => setCategoriaActiva('cardio')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              categoriaActiva === 'cardio' ? 'bg-white text-rose-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className="w-4 h-4" /> Cardio
          </button>
          <button
            onClick={() => setCategoriaActiva('resp')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              categoriaActiva === 'resp' ? 'bg-white text-emerald-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Wind className="w-4 h-4" /> Neumo & Sepsis
          </button>
          <button
            onClick={() => setCategoriaActiva('gastro')}
            className={`px-3 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${
              categoriaActiva === 'gastro' ? 'bg-white text-amber-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Activity className="w-4 h-4" /> Gastro & Hígado
          </button>
        </div>
      </div>

      {/* NEFRO */}
      {categoriaActiva === 'nefro' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in">
          
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b pb-2">
              <Droplets className="w-4 h-4 text-blue-600" /> Clearence Creatinina (Cockcroft-Gault)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Edad (años)</label>
                <input type="number" placeholder="Ej. 65" value={cgEdad} onChange={e => setCgEdad(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Peso (kg)</label>
                <input type="number" placeholder="Ej. 70" value={cgPeso} onChange={e => setCgPeso(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Creatinina Plasma (mg/dL)</label>
                <input type="number" step="0.1" placeholder="Ej. 1.2" value={cgCreat} onChange={e => setCgCreat(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none focus:ring-1 focus:ring-blue-400" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Sexo</label>
                <select value={cgSexo} onChange={e => setCgSexo(e.target.value as any)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none">
                  <option value="m">Hombre</option>
                  <option value="f">Mujer (x0.85)</option>
                </select>
              </div>
            </div>
            {clcrResult && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs">
                <p className="font-bold text-sm">ClCr estimado: {clcrResult} mL/min</p>
                <p className="text-[11px] text-blue-800 mt-0.5">
                  {parseFloat(clcrResult) >= 90 ? 'Etapa 1 (Normal o elevado)' :
                   parseFloat(clcrResult) >= 60 ? 'Etapa 2 (ERC leve)' :
                   parseFloat(clcrResult) >= 30 ? 'Etapa 3 (ERC moderada - Ajustar dosis ATB)' :
                   parseFloat(clcrResult) >= 15 ? 'Etapa 4 (ERC severa)' : 'Etapa 5 (Falla terminal)'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b pb-2">
              <Droplets className="w-4 h-4 text-blue-600" /> FeNa (Fracción Excretada de Na)
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Na Urinario (mEq/L)</label>
                <input type="number" placeholder="Ej. 15" value={fenaNaU} onChange={e => setFenaNaU(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Na Plasmático (mEq/L)</label>
                <input type="number" placeholder="Ej. 140" value={fenaNaP} onChange={e => setFenaNaP(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Creatinina Orina (mg/dL)</label>
                <input type="number" placeholder="Ej. 80" value={fenaCrU} onChange={e => setFenaCrU(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Creatinina Plasma (mg/dL)</label>
                <input type="number" step="0.1" placeholder="Ej. 2.1" value={fenaCrP} onChange={e => setFenaCrP(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
            </div>
            {fenaResult && (
              <div className={`p-3 rounded-xl text-xs border ${
                parseFloat(fenaResult) < 1 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <p className="font-bold text-sm">FeNa: {fenaResult}%</p>
                <p className="text-[11px] mt-0.5 font-medium">
                  {parseFloat(fenaResult) < 1
                    ? 'FeNa < 1%: Compatible con Falla Renal Prerrenal (avidez tubular por sodio).'
                    : 'FeNa > 2%: Compatible con Necrosis Tubular Aguda (NTA) / Causa Renal Intrínseca.'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b pb-2">
              <Droplets className="w-4 h-4 text-blue-600" /> Anion Gap & Corrección Albúmina
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Na+ (mEq/L)</label>
                <input type="number" placeholder="140" value={agNa} onChange={e => setAgNa(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Cl- (mEq/L)</label>
                <input type="number" placeholder="104" value={agCl} onChange={e => setAgCl(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">HCO3- (mEq/L)</label>
                <input type="number" placeholder="24" value={agHco3} onChange={e => setAgHco3(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Albúmina (g/dL)</label>
                <input type="number" step="0.1" placeholder="4.0" value={agAlb} onChange={e => setAgAlb(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
            </div>
            {agResult && (
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs space-y-1">
                <p className="font-bold text-sm">Anion Gap: {agResult.ag} mEq/L (Corregido: {agResult.agCorregido} mEq/L)</p>
                <p className="text-[11px] text-purple-800">
                  {parseFloat(agResult.agCorregido) > 12
                    ? 'Anion Gap Elevado (> 12): Cetoacidosis (CAD), Láctica, Uremia severa, Tóxicos (MUDPILES / GOLDMARK).'
                    : 'Anion Gap Normal (8 - 12): Acidosis hiperclorémica (Pérdidas digestivas por diarrea o ATR).'}
                </p>
              </div>
            )}
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b pb-2">
              <Droplets className="w-4 h-4 text-blue-600" /> Sodio Corregido en Hiperglicemia
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Na+ Medido (mEq/L)</label>
                <input type="number" placeholder="130" value={naMedido} onChange={e => setNaMedido(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Glicemia (mg/dL)</label>
                <input type="number" placeholder="450" value={glicemia} onChange={e => setGlicemia(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
            </div>
            {naCorrResult && (
              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-900 text-xs">
                <p className="font-bold text-sm">Na+ Corregido (Katz): {naCorrResult.katz} mEq/L</p>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Fórmula Hillier: <strong>{naCorrResult.hillier} mEq/L</strong>.
                </p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* CARDIO */}
      {categoriaActiva === 'cardio' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in">
          
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-600" /> Score CHA₂DS₂-VASc (FA)
              </h3>
              <span className="text-sm font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                {chaResult} pts
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={chaIcc} onChange={e => setChaIcc(e.target.checked)} className="rounded text-rose-600" />
                <span>C: Insuficiencia Cardíaca / FEVI &lt; 40% (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={chaHta} onChange={e => setChaHta(e.target.checked)} className="rounded text-rose-600" />
                <span>H: Hipertensión Arterial (+1)</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-500">A₂: Edad:</span>
                <select value={chaAge} onChange={e => setChaAge(Number(e.target.value))} className="p-1 border rounded text-xs bg-gray-50">
                  <option value={0}>&lt; 65 años (0 pts)</option>
                  <option value={65}>65 - 74 años (+1 pt)</option>
                  <option value={75}>&ge; 75 años (+2 pts)</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={chaDm} onChange={e => setChaDm(e.target.checked)} className="rounded text-rose-600" />
                <span>D: Diabetes Mellitus (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={chaAit} onChange={e => setChaAit(e.target.checked)} className="rounded text-rose-600" />
                <span>S₂: ACV previo / AIT / Tromboembolismo (+2)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={chaVasc} onChange={e => setChaVasc(e.target.checked)} className="rounded text-rose-600" />
                <span>V: Enfermedad Vascular (IAM, EAP) (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={chaFemale} onChange={e => setChaFemale(e.target.checked)} className="rounded text-rose-600" />
                <span>Sc: Sexo Femenino (+1)</span>
              </label>
            </div>
            <div className={`p-3 rounded-xl text-xs border ${
              chaResult >= (chaFemale ? 3 : 2) ? 'bg-rose-50 border-rose-200 text-rose-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <p className="font-bold">
                {chaResult >= (chaFemale ? 3 : 2)
                  ? 'Indicación Fuerte de Anticoagulación Oral (ACO / DOACs): Riesgo embólico elevado.'
                  : chaResult === (chaFemale ? 2 : 1)
                  ? 'Considerar Anticoagulación Oral según riesgo individual.'
                  : 'Bajo riesgo: No requiere anticoagulación oral.'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <Heart className="w-4 h-4 text-rose-600" /> Score HAS-BLED (Sangrado)
              </h3>
              <span className="text-sm font-black text-rose-700 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-200">
                {hasResult} pts
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasHta} onChange={e => setHasHta(e.target.checked)} className="rounded text-rose-600" />
                <span>H: HTA no controlada (PAS &gt; 160) (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasRenal} onChange={e => setHasRenal(e.target.checked)} className="rounded text-rose-600" />
                <span>A: Falla Renal (Diálisis, Cr &ge; 2.26) (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasHepatico} onChange={e => setHasHepatico(e.target.checked)} className="rounded text-rose-600" />
                <span>A: Falla Hepática (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasIctus} onChange={e => setHasIctus(e.target.checked)} className="rounded text-rose-600" />
                <span>S: Antecedente de ACV (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasBleeding} onChange={e => setHasBleeding(e.target.checked)} className="rounded text-rose-600" />
                <span>B: Sangrado mayor previo (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasInrLab} onChange={e => setHasInrLab(e.target.checked)} className="rounded text-rose-600" />
                <span>L: INR lábil (&lt; 60% en rango) (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasEdad65} onChange={e => setHasEdad65(e.target.checked)} className="rounded text-rose-600" />
                <span>E: Edad &gt; 65 años (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={hasDrogas} onChange={e => setHasDrogas(e.target.checked)} className="rounded text-rose-600" />
                <span>D: AINEs o antiagregantes (+1)</span>
              </label>
            </div>
            <div className={`p-3 rounded-xl text-xs border ${
              hasResult >= 3 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <p className="font-bold">
                {hasResult >= 3
                  ? 'HAS-BLED ≥ 3: Alto riesgo de sangrado. Requiere monitoreo y corregir factores (NO contraindica ACO).'
                  : 'HAS-BLED < 3: Bajo riesgo de sangrado.'}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* RESP */}
      {categoriaActiva === 'resp' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in">
          
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-emerald-600" /> Score CURB-65 (NAC)
              </h3>
              <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {curbResult} pts
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={curbC} onChange={e => setCurbC(e.target.checked)} className="rounded text-emerald-600" />
                <span>C: Confusión mental aguda (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={curbU} onChange={e => setCurbU(e.target.checked)} className="rounded text-emerald-600" />
                <span>U: Uremia &gt; 42 mg/dL (BUN &gt; 19 mg/dL) (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={curbR} onChange={e => setCurbR(e.target.checked)} className="rounded text-emerald-600" />
                <span>R: Frecuencia Respiratoria &ge; 30 rpm (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={curbB} onChange={e => setCurbB(e.target.checked)} className="rounded text-emerald-600" />
                <span>B: PAS &lt; 90 o PAD &le; 60 mmHg (+1)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={curb65} onChange={e => setCurb65(e.target.checked)} className="rounded text-emerald-600" />
                <span>65: Edad &ge; 65 años (+1)</span>
              </label>
            </div>
            <div className={`p-3 rounded-xl text-xs border ${
              curbResult >= 3 ? 'bg-red-50 border-red-200 text-red-900' : curbResult === 2 ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}>
              <p className="font-bold">
                {curbResult >= 3
                  ? 'CURB-65 = 3-5: Neumonía Grave. Hospitalizar en Sala Agudos / Evaluar UCI/UTI (Mortalidad 15-40%).'
                  : curbResult === 2
                  ? 'CURB-65 = 2: Riesgo intermedio. Hospitalización en Sala de Medicina.'
                  : 'CURB-65 = 0-1: Bajo riesgo. Manejo ambulatorio (Amoxicilina o Macrólido).'}
              </p>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <Wind className="w-4 h-4 text-emerald-600" /> Criterios de Wells (TEP)
              </h3>
              <span className="text-sm font-black text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                {wellsResult} pts
              </span>
            </div>
            <div className="space-y-1.5 text-xs text-gray-700">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wellsTv} onChange={e => setWellsTv(e.target.checked)} className="rounded text-emerald-600" />
                <span>Signos o síntomas de TVP (+3 pts)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wellsAlt} onChange={e => setWellsAlt(e.target.checked)} className="rounded text-emerald-600" />
                <span>Diagnóstico alternativo menos probable que TEP (+3 pts)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wellsFc} onChange={e => setWellsFc(e.target.checked)} className="rounded text-emerald-600" />
                <span>FC &gt; 100 lpm (+1.5 pts)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wellsInmob} onChange={e => setWellsInmob(e.target.checked)} className="rounded text-emerald-600" />
                <span>Inmovilización &ge; 3 días o cirugía en 4 semanas (+1.5 pts)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wellsPrev} onChange={e => setWellsPrev(e.target.checked)} className="rounded text-emerald-600" />
                <span>Antecedente de TVP / TEP (+1.5 pts)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wellsHemopt} onChange={e => setWellsHemopt(e.target.checked)} className="rounded text-emerald-600" />
                <span>Hemoptisis (+1 pt)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={wellsCancer} onChange={e => setWellsCancer(e.target.checked)} className="rounded text-emerald-600" />
                <span>Cáncer activo (+1 pt)</span>
              </label>
            </div>
            <div className={`p-3 rounded-xl text-xs border ${
              wellsResult > 4 ? 'bg-red-50 border-red-200 text-red-900' : 'bg-blue-50 border-blue-200 text-blue-900'
            }`}>
              <p className="font-bold">
                {wellsResult > 4
                  ? 'TEP Probable (> 4 pts): Solicitar AngioTAC de Tórax directamente.'
                  : 'TEP Improbable (≤ 4 pts): Solicitar Dímero D de alta sensibilidad para descartar.'}
              </p>
            </div>
          </div>

        </div>
      )}

      {/* GASTRO */}
      {categoriaActiva === 'gastro' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 animate-in fade-in">
          
          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-amber-600" /> Child-Pugh (Cirrosis / DHC)
              </h3>
              <span className="text-sm font-black text-amber-700 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                {cpResult.total} pts
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-gray-600 font-medium mb-0.5">Bilirrubina Total (mg/dL)</label>
                <select value={cpBili} onChange={e => setCpBili(Number(e.target.value))} className="w-full p-1.5 bg-gray-50 border rounded text-xs">
                  <option value={1}>&lt; 2.0 (1 pt)</option>
                  <option value={2}>2.0 - 3.0 (2 pts)</option>
                  <option value={3}>&gt; 3.0 (3 pts)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-0.5">Albúmina Sérica (g/dL)</label>
                <select value={cpAlb} onChange={e => setCpAlb(Number(e.target.value))} className="w-full p-1.5 bg-gray-50 border rounded text-xs">
                  <option value={1}>&gt; 3.5 (1 pt)</option>
                  <option value={2}>2.8 - 3.5 (2 pts)</option>
                  <option value={3}>&lt; 2.8 (3 pts)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-0.5">INR / Tiempo Protrombina</label>
                <select value={cpInr} onChange={e => setCpInr(Number(e.target.value))} className="w-full p-1.5 bg-gray-50 border rounded text-xs">
                  <option value={1}>INR &lt; 1.7 (1 pt)</option>
                  <option value={2}>INR 1.7 - 2.3 (2 pts)</option>
                  <option value={3}>INR &gt; 2.3 (3 pts)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-0.5">Ascitis</label>
                <select value={cpAscitis} onChange={e => setCpAscitis(Number(e.target.value))} className="w-full p-1.5 bg-gray-50 border rounded text-xs">
                  <option value={1}>Ausente (1 pt)</option>
                  <option value={2}>Leve / Controlable con diuréticos (2 pts)</option>
                  <option value={3}>Moderada a severa / Refractaria (3 pts)</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-600 font-medium mb-0.5">Encefalopatía Hepática</label>
                <select value={cpEncef} onChange={e => setCpEncef(Number(e.target.value))} className="w-full p-1.5 bg-gray-50 border rounded text-xs">
                  <option value={1}>Ausente (1 pt)</option>
                  <option value={2}>Grado 1 - 2 (2 pts)</option>
                  <option value={3}>Grado 3 - 4 (3 pts)</option>
                </select>
              </div>
            </div>
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
              <p className="font-bold text-sm">{cpResult.clase}</p>
            </div>
          </div>

          <div className="bg-white p-4 md:p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3">
            <h3 className="font-bold text-gray-800 text-sm flex items-center gap-1.5 border-b pb-2">
              <Activity className="w-4 h-4 text-amber-600" /> Score MELD (Cirrosis)
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <label className="block text-gray-500 font-medium mb-1">Bilirrubina (mg/dL)</label>
                <input type="number" step="0.1" placeholder="Ej. 2.5" value={meldBili} onChange={e => setMeldBili(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">INR</label>
                <input type="number" step="0.1" placeholder="Ej. 1.8" value={meldInr} onChange={e => setMeldInr(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
              <div>
                <label className="block text-gray-500 font-medium mb-1">Creatinina (mg/dL)</label>
                <input type="number" step="0.1" placeholder="Ej. 1.4" value={meldCr} onChange={e => setMeldCr(e.target.value)} className="w-full p-2 bg-gray-50 border rounded-lg outline-none" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs text-gray-700 cursor-pointer pt-1">
              <input type="checkbox" checked={meldDialisis} onChange={e => setMeldDialisis(e.target.checked)} className="rounded text-amber-600" />
              <span>Paciente en diálisis en la última semana</span>
            </label>
            {meldResult !== null && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <p className="font-bold text-sm">Score MELD: {meldResult} puntos</p>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {meldResult >= 40 ? 'Mortalidad a 3 meses estimada: 71.3%' :
                   meldResult >= 30 ? 'Mortalidad a 3 meses estimada: 52.6%' :
                   meldResult >= 20 ? 'Mortalidad a 3 meses estimada: 19.6%' :
                   meldResult >= 10 ? 'Mortalidad a 3 meses estimada: 6.0%' : 'Mortalidad a 3 meses estimada: 1.9%'}
                </p>
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
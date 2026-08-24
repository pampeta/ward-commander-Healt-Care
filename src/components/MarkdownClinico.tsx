import React from 'react';

interface MarkdownClinicoProps {
  contenido: string;
  className?: string;
  isUser?: boolean;
}

// Limpiador y formateador de símbolos matemáticos, LaTeX y caracteres especiales
export function sanitizarTextoClinico(texto: string): string {
  if (!texto) return '';

  let limpio = texto;

  // Reemplazo de símbolos LaTeX comunes a caracteres Unicode legibles
  limpio = limpio
    .replace(/\\rightarrow/g, '→')
    .replace(/\\leftarrow/g, '←')
    .replace(/\\leftrightarrow/g, '↔')
    .replace(/\\uparrow/g, '↑')
    .replace(/\\downarrow/g, '↓')
    .replace(/\\ge(q)?\b/g, '≥')
    .replace(/\\le(q)?\b/g, '≤')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\pm\b/g, '±')
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\&/g, '&')
    .replace(/\\_/g, '_')
    .replace(/\\#/g, '#');

  // Letras griegas frecuentes en medicina
  limpio = limpio
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\mu\b/g, 'µ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\Sigma\b/g, 'Σ')
    .replace(/\\lambda\b/g, 'λ');

  // Limpiar delimitadores LaTeX tipo $...$ o $$...$$
  limpio = limpio.replace(/\$\$([^$]+)\$\$/g, '$1');
  limpio = limpio.replace(/\$([^$]+)\$/g, '$1');

  // Reemplazar subíndices comunes tipo _1, _2, _0
  limpio = limpio
    .replace(/_1\b/g, '₁')
    .replace(/_2\b/g, '₂')
    .replace(/_3\b/g, '₃')
    .replace(/_4\b/g, '₄')
    .replace(/_0\b/g, '₀')
    .replace(/_a\b/g, 'ₐ')
    .replace(/_i\b/g, 'ᵢ');

  return limpio;
}

// Formateo de texto en línea (negritas, cursivas, código)
function renderizarTextoEnLinea(texto: string, isUser?: boolean): React.ReactNode {
  // Dividir por bloques de negrita (**texto**), cursiva (*texto*), código (`code`)
  const partes = texto.split(/(\*\*.*?\*\*|\*.*?\*|`.*?`)/g);

  return partes.map((parte, idx) => {
    if (parte.startsWith('**') && parte.endsWith('**') && parte.length >= 4) {
      return (
        <strong key={idx} className={`font-bold ${isUser ? 'text-white' : 'text-gray-950 dark:text-white'}`}>
          {parte.slice(2, -2)}
        </strong>
      );
    }
    if (parte.startsWith('*') && parte.endsWith('*') && parte.length >= 2) {
      return (
        <em key={idx} className="italic text-gray-700 dark:text-slate-300">
          {parte.slice(1, -1)}
        </em>
      );
    }
    if (parte.startsWith('`') && parte.endsWith('`') && parte.length >= 2) {
      return (
        <code key={idx} className="px-1.5 py-0.5 bg-gray-100 dark:bg-slate-800 text-rose-600 dark:text-rose-400 font-mono text-xs rounded border border-gray-200 dark:border-slate-700">
          {parte.slice(1, -1)}
        </code>
      );
    }
    return parte;
  });
}

export const MarkdownClinico: React.FC<MarkdownClinicoProps> = ({ contenido, className = '', isUser = false }) => {
  if (!contenido) return null;

  const textoSanitizado = sanitizarTextoClinico(contenido);
  const lineas = textoSanitizado.split('\n');

  return (
    <div className={`space-y-2 text-xs md:text-sm leading-relaxed ${className}`}>
      {lineas.map((linea, idx) => {
        const lineaTrim = linea.trim();

        // Línea vacía -> Espaciador
        if (!lineaTrim) {
          return <div key={idx} className="h-1" />;
        }

        // Separador horizontal (--- o ***)
        if (/^(\-{3,}|\*{3,}|_{3,})$/.test(lineaTrim)) {
          return <hr key={idx} className="my-2.5 border-gray-200 dark:border-slate-700" />;
        }

        // Encabezado Nivel 1 (# Titulo)
        if (lineaTrim.startsWith('# ')) {
          return (
            <h2 key={idx} className={`text-base md:text-lg font-black mt-3 mb-1.5 pb-1 border-b border-gray-200 dark:border-slate-700 ${isUser ? 'text-white' : 'text-gray-950 dark:text-white'}`}>
              {renderizarTextoEnLinea(lineaTrim.slice(2), isUser)}
            </h2>
          );
        }

        // Encabezado Nivel 2 (## Titulo)
        if (lineaTrim.startsWith('## ')) {
          return (
            <h3 key={idx} className={`text-sm md:text-base font-bold mt-2.5 mb-1 ${isUser ? 'text-white' : 'text-gray-900 dark:text-slate-100'}`}>
              {renderizarTextoEnLinea(lineaTrim.slice(3), isUser)}
            </h3>
          );
        }

        // Encabezado Nivel 3 (### Titulo)
        if (lineaTrim.startsWith('### ')) {
          return (
            <h4 key={idx} className={`text-xs md:text-sm font-bold mt-2 mb-0.5 ${isUser ? 'text-white' : 'text-emerald-700 dark:text-emerald-400'}`}>
              {renderizarTextoEnLinea(lineaTrim.slice(4), isUser)}
            </h4>
          );
        }

        // Encabezado Nivel 4 (#### Titulo)
        if (lineaTrim.startsWith('#### ')) {
          return (
            <h5 key={idx} className={`text-xs font-bold mt-1.5 mb-0.5 ${isUser ? 'text-white' : 'text-gray-800 dark:text-slate-200'}`}>
              {renderizarTextoEnLinea(lineaTrim.slice(5), isUser)}
            </h5>
          );
        }

        // Cita o Blockquote (> Texto)
        if (lineaTrim.startsWith('> ')) {
          return (
            <blockquote key={idx} className="pl-3 py-1 my-1 border-l-4 border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 text-gray-700 dark:text-slate-300 italic rounded-r">
              {renderizarTextoEnLinea(lineaTrim.slice(2), isUser)}
            </blockquote>
          );
        }

        // Lista Desordenada (* item, - item, • item)
        if (/^[\*\-\•]\s+/.test(lineaTrim)) {
          const textoItem = lineaTrim.replace(/^[\*\-\•]\s+/, '');
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 my-0.5">
              <span className="text-emerald-600 dark:text-emerald-400 font-bold leading-none mt-1 select-none">•</span>
              <div className="flex-1">
                {renderizarTextoEnLinea(textoItem, isUser)}
              </div>
            </div>
          );
        }

        // Lista Numerada (1. item, 2. item)
        const matchNumerada = lineaTrim.match(/^(\d+)\.\s+(.*)$/);
        if (matchNumerada) {
          const num = matchNumerada[1];
          const textoItem = matchNumerada[2];
          return (
            <div key={idx} className="flex items-start gap-2 ml-1 my-1">
              <span className="font-bold text-emerald-700 dark:text-emerald-400 shrink-0 text-xs mt-0.5 select-none">{num}.</span>
              <div className="flex-1">
                {renderizarTextoEnLinea(textoItem, isUser)}
              </div>
            </div>
          );
        }

        // Párrafo normal
        return (
          <p key={idx} className="leading-relaxed">
            {renderizarTextoEnLinea(lineaTrim, isUser)}
          </p>
        );
      })}
    </div>
  );
};
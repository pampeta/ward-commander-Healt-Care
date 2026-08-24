import React from 'react';

interface MarkdownClinicoProps {
  contenido: string;
  className?: string;
  isUser?: boolean;
}

// Limpiador y formateador exhaustivo de LaTeX, matemáticas y caracteres extraños
export function sanitizarTextoClinico(texto: string): string {
  if (!texto) return '';

  let limpio = texto;

  // 1. Eliminar delimitadores LaTeX tipo $$...$$ o $...$
  limpio = limpio.replace(/\$\$([\s\S]*?)\$\$/g, '$1');
  limpio = limpio.replace(/\$([^$\n]+)\$/g, '$1');

  // 2. Comandos de texto y fuentes en LaTeX (recursivo para anidados tipo \text{\textbf{...}})
  let anterior = '';
  let contador = 0;
  while (limpio !== anterior && contador < 10) {
    anterior = limpio;
    contador++;
    limpio = limpio
      .replace(/\\text\{([^{}]+)\}/g, '$1')
      .replace(/\\mathrm\{([^{}]+)\}/g, '$1')
      .replace(/\\textbf\{([^{}]+)\}/g, '**$1**')
      .replace(/\\textit\{([^{}]+)\}/g, '*$1*')
      .replace(/\\mathbf\{([^{}]+)\}/g, '**$1**')
      .replace(/\\operatorname\{([^{}]+)\}/g, '$1')
      .replace(/\\boxed\{([^{}]+)\}/g, '$1');
  }

  // 3. Fracciones tipo \frac{numerador}{denominador} -> (numerador / denominador)
  contador = 0;
  anterior = '';
  while (limpio !== anterior && contador < 10) {
    anterior = limpio;
    contador++;
    limpio = limpio.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1 / $2)');
  }

  // 4. Paréntesis, corchetes y llaves delimitadoras LaTeX
  limpio = limpio
    .replace(/\\left\(/g, '(')
    .replace(/\\right\)/g, ')')
    .replace(/\\left\[/g, '[')
    .replace(/\\right\]/g, ']')
    .replace(/\\left\\\{/g, '{')
    .replace(/\\right\\\}/g, '}')
    .replace(/\\left\|/g, '|')
    .replace(/\\right\|/g, '|')
    .replace(/\\left\./g, '')
    .replace(/\\right\./g, '');

  // 5. Operadores y símbolos matemáticos
  limpio = limpio
    .replace(/\\ge(q)?\b/g, '≥')
    .replace(/\\le(q)?\b/g, '≤')
    .replace(/\\neq\b/g, '≠')
    .replace(/\\approx\b/g, '≈')
    .replace(/\\pm\b/g, '±')
    .replace(/\\mp\b/g, '∓')
    .replace(/\\times\b/g, '×')
    .replace(/\\div\b/g, '÷')
    .replace(/\\cdot\b/g, '·')
    .replace(/\\infty\b/g, '∞')
    .replace(/\\sqrt\{([^{}]+)\}/g, '√($1)')
    .replace(/\\sqrt\b/g, '√')
    .replace(/\\sim\b/g, '~')
    .replace(/\\over\b/g, '/');

  // 6. Flechas y relaciones
  limpio = limpio
    .replace(/\\rightarrow\b/g, '→')
    .replace(/\\to\b/g, '→')
    .replace(/\\leftarrow\b/g, '←')
    .replace(/\\leftrightarrow\b/g, '↔')
    .replace(/\\Rightarrow\b/g, '⇒')
    .replace(/\\Leftarrow\b/g, '⇐')
    .replace(/\\uparrow\b/g, '↑')
    .replace(/\\downarrow\b/g, '↓');

  // 7. Letras griegas
  limpio = limpio
    .replace(/\\alpha\b/g, 'α')
    .replace(/\\beta\b/g, 'β')
    .replace(/\\gamma\b/g, 'γ')
    .replace(/\\Delta\b/g, 'Δ')
    .replace(/\\delta\b/g, 'δ')
    .replace(/\\epsilon\b/g, 'ε')
    .replace(/\\theta\b/g, 'θ')
    .replace(/\\lambda\b/g, 'λ')
    .replace(/\\mu\b/g, 'µ')
    .replace(/\\pi\b/g, 'π')
    .replace(/\\rho\b/g, 'ρ')
    .replace(/\\Sigma\b/g, 'Σ')
    .replace(/\\sigma\b/g, 'σ')
    .replace(/\\tau\b/g, 'τ')
    .replace(/\\phi\b/g, 'φ')
    .replace(/\\Phi\b/g, 'Φ')
    .replace(/\\omega\b/g, 'ω')
    .replace(/\\Omega\b/g, 'Ω');

  // 8. Espacios y saltos LaTeX
  limpio = limpio
    .replace(/\\quad\b/g, '   ')
    .replace(/\\qquad\b/g, '     ')
    .replace(/\\[,;:! ]/g, ' ')
    .replace(/\\\\/g, '\n');

  // 9. Caracteres escapados simples
  limpio = limpio
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\&/g, '&')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_');

  // 10. Superíndices y Subíndices frecuentes (química y medicina)
  limpio = limpio
    .replace(/\^\{\+?\-?2\+\}/g, '²⁺')
    .replace(/\^\{\+?\-?2\-\}/g, '²⁻')
    .replace(/\^\{\+\}/g, '⁺')
    .replace(/\^\{\-\}/g, '⁻')
    .replace(/\^2\b/g, '²')
    .replace(/\^3\b/g, '³')
    .replace(/_\{?0\}?/g, '₀')
    .replace(/_\{?1\}?/g, '₁')
    .replace(/_\{?2\}?/g, '₂')
    .replace(/_\{?3\}?/g, '₃')
    .replace(/_\{?4\}?/g, '₄')
    .replace(/_\{?5\}?/g, '₅')
    .replace(/_\{?6\}?/g, '₆')
    .replace(/_\{?7\}?/g, '₇')
    .replace(/_\{?8\}?/g, '₈')
    .replace(/_\{?9\}?/g, '₉')
    .replace(/_\{?a\}?/g, 'ₐ')
    .replace(/_\{?i\}?/g, 'ᵢ');

  // 11. Limpieza de llaves o barras invertidas huérfanas
  limpio = limpio.replace(/\\([a-zA-Z]+)/g, '$1');

  return limpio;
}

// Formateo de texto en línea (negritas, cursivas, código inline)
function renderizarTextoEnLinea(texto: string, isUser?: boolean): React.ReactNode {
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
        <em key={idx} className={`italic ${isUser ? 'text-blue-100' : 'text-gray-700 dark:text-slate-300'}`}>
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

  // Parsear bloques de código (```...```) y bloques de texto normal
  const bloques: { tipo: 'codigo' | 'texto', contenido: string }[] = [];
  const regexBloquesCodigo = /```([\s\S]*?)```/g;
  let ultimoIndice = 0;
  let match;

  while ((match = regexBloquesCodigo.exec(textoSanitizado)) !== null) {
    if (match.index > ultimoIndice) {
      bloques.push({ tipo: 'texto', contenido: textoSanitizado.slice(ultimoIndice, match.index) });
    }
    bloques.push({ tipo: 'codigo', contenido: match[1].trim() });
    ultimoIndice = regexBloquesCodigo.lastIndex;
  }

  if (ultimoIndice < textoSanitizado.length) {
    bloques.push({ tipo: 'texto', contenido: textoSanitizado.slice(ultimoIndice) });
  }

  return (
    <div className={`space-y-2 text-xs md:text-sm leading-relaxed ${className}`}>
      {bloques.map((bloque, bIdx) => {
        if (bloque.tipo === 'codigo') {
          return (
            <pre
              key={bIdx}
              className="p-3.5 my-2.5 bg-slate-900 text-emerald-400 dark:bg-slate-950 font-mono text-xs md:text-xs rounded-xl overflow-x-auto border border-slate-800 whitespace-pre shadow-inner leading-normal"
            >
              {bloque.contenido}
            </pre>
          );
        }

        const lineas = bloque.contenido.split('\n');

        return (
          <React.Fragment key={bIdx}>
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
          </React.Fragment>
        );
      })}
    </div>
  );
};
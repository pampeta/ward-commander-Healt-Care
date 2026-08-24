# 🏥 Ward Commander / El Rincón del Interno
### *La Suite Médica y Copiloto Clínico Integral para Internos, Residentes y Estudiantes de Medicina*

[![React 19](https://img.shields.io/badge/React-19.2-blue?logo=react&style=flat-square)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue?logo=typescript&style=flat-square)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.1-646CFF?logo=vite&style=flat-square)](https://vitejs.dev/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS-4.3-38B2AC?logo=tailwind-css&style=flat-square)](https://tailwindcss.com/)
[![Google Gemini AI](https://img.shields.io/badge/AI-Google_Gemini-4285F4?logo=google&style=flat-square)](https://ai.google.dev/)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?logo=supabase&style=flat-square)](https://supabase.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](LICENSE)
[![Deploy on Vercel](https://img.shields.io/badge/Vercel-Deployed-black?logo=vercel&style=flat-square)](https://ward-commander-healt-care-steel.vercel.app)

---

## 🌐 Demo en Vivo
👉 **Acceso a la plataforma web desplegada:** [ward-commander-healt-care-steel.vercel.app](https://ward-commander-healt-care-steel.vercel.app)

---

## 🎯 ¿Qué es Ward Commander?

**Ward Commander (El Rincón del Interno)** es una plataforma web de código abierto diseñada para resolver la fragmentación del trabajo diario del médico en formación. 

A diferencia de las herramientas tradicionales que separan el estudio teórico de la labor asistencial, **Ward Commander** unifica en una sola interfaz:
1. **La Gestión Asistencial en Sala:** Censo de pacientes en tiempo real, control de días de antibióticos concomitantes, dispositivos invasivos, curaciones y extracción multimodal de documentos clínicos con Inteligencia Artificial.
2. **El Copiloto Clínico & Docente:** Generador de documentos hospitalarios (Epicrisis, Ingresos, Evoluciones), simulador de comisiones de examen oral con rúbrica, instructor clínico IA con cuadernos de subespecialidad y banco de preparación para el EUNACOM.
3. **Productividad Hospitalaria:** Calculadoras médicas integradas, guía completa de ECG (Dr. Guillermo Guevara), programador de turnos de guardia recurrentes (cada 8 días) con exportación a Google Calendar y sincronización automática en la nube.

---

## 🚀 Módulos Principales

### 1. 🛏️ Censo de Pacientes & Gestión de Sala
- **Control de Pacientes por Sala/Cama:** Registro de diagnósticos activos, planes pendientes, alertas y estado de gravedad.
- **Esquema Dinámico de Multi-Antibióticos:** Permite añadir múltiples antimicrobianos por paciente, con seguimiento de días de tratamiento y foco infeccioso.
- **Seguimiento de Invasivos y Curaciones:** Fechas de instalación de catéteres venosos centrales (CVC), sondas Foley, líneas arteriales y frecuencia de curaciones avanzadas.
- **Extracción Automática con IA Multimodal (Cámara / PDF / Transcripción):** Sube una fotografía de la hoja de entrega de turno o un PDF y la IA digitaliza y estructura los datos del paciente automáticamente.

### 2. 📝 Generador de Documentos Clínicos (IA)
- Redacción asistida de:
  - **Ingresos de Medicina Interna** (Anamnesis, Examen Físico, Diagnósticos jerarquizados, Plan de Estudio y Tratamiento).
  - **Evoluciones Diarias SOAP** (Subjetivo, Objetivo, Análisis, Plan).
  - **Epicrisis de Alta** con resumen de hospitalización, fármacos de alta y controles.
  - **Interconsultas y Protocolos Operatorios**.
- Soporte para adjuntar archivos complementarios (imágenes de laboratorio, PDFs, links de Google Docs).

### 3. 💬 Instructor Clínico IA con Cuadernos de Subespecialidad
- **Espacios Temáticos con Colores y Enfoque Clínico:**
  - 🩺 *General / EUNACOM* (Verde Esmeralda)
  - 🫁 *Broncopulmonar & Respiratorio - GOLD 2024 / GINA* (Azul Cielo)
  - 🫀 *Cardiología & Hemodinamia - AHA / ESC* (Rojo)
  - 🧪 *Nefrología & Medio Interno - KDIGO / Ácido-Base* (Púrpura)
  - 🦠 *Infectología & Antimicrobianos - SOCHINF / PK-PD* (Ámbar)
  - 🧬 *Gastroenterología & Hepatología - Child / MELD* (Naranja)
  - 🩸 *Hematología & Oncología - Anemias / RRC / IPR* (Rosa)
  - ⚡ *Endocrinología & Diabetes - CAD / Basal-Bolo* (Amarillo)
  - 🦴 *Reumatología & Inmunología - LES / Vasculitis* (Turquesa)
  - 🧠 *Neurología & Geriatría - Código ACV / Delirium* (Índigo)
- **Gestión de Sesiones (Estilo Gemini/ChatGPT):** Múltiples chats independientes, auto-titulado inteligente, renombrado, vaciado y eliminación.

### 4. 🎓 Simulador de Examen Oral Clínico
- **Sorteo Aleatorio de Casos Reales de Medicina Interna:** Selección de temarios clínicos con rúbrica estructurada.
- **Interrogación Interactiva:** La comisión de IA evalúa fundamentación fisiopatológica, pertinencia de exámenes solicitados y conducta terapéutica.
- **Retroalimentación Formativa:** Puntaje porcentual, desglose por criterios y retroalimentación pedagógica inmediata.

### 5. 🫀 Calculadoras Médicas & Entrenador de ECG
- **Calculadoras Clínicas Integradas:**
  - Intervalo QTc corregido (Fórmula de Bazett) con alertas de riesgo para Torsade de Pointes.
  - Score de Wells (TEP / TVP), CURB-65 (Neumonía), Glasgow-Blatchford & Rockall (HDA).
  - Child-Pugh & MELD (Cirrosis), Anion Gap & Delta-Delta (Ácido-Base), RRC e IPR (Anemias).
- **Guía de Electrocardiograma (Dr. Guillermo Guevara):**
  - Nemotecnias clínicas chilenas (*"La Pancha es de izquierda"*, *"Paltona de derecha"*).
  - Criterios diagnósticos de Sokolow-Lyon, Lewis, Brugada, Bloqueos AV (Mobitz I vs II), Bloqueo Trifascicular, S1Q3T3 y trastornos electrolíticos (Hiperkalemia, QT largo).
  - Buscador dinámico y filtros rápidos por categorías.

### 6. 📅 Calendario & Programador de Turnos Recurrentes
- **Generador de Guardias Hospitalarias:** Configura tu ciclo de turnos (ej. cada 8 días) y genera automáticamente todas las fechas del semestre.
- **Sincronización con Calendarios Externos:** Exportación masiva en formato universal `.ics` y botones de agendamiento directo en Google Calendar.

### 7. 🌙 Modo Noche Clínico (Turno)
- Paleta oscura de alto contraste (*Dark Slate / Indigo*) diseñada específicamente para rondas nocturnas y turnos de urgencia sin encandilar ni fatigar la vista.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología | Propósito |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript + Vite | Interfaz ultra rápida, reactiva y tipada |
| **Estilos** | Tailwind CSS v4 + Lucide React | Diseño moderno, responsivo y modo noche |
| **Inteligencia Artificial** | Google Gemini 2.5/3 Flash API | Extracción multimodal (OCR, visión) y tutoría clínica |
| **Motor Markdown** | `MarkdownClinico` (Custom) | Sanitizador de fórmulas, tablas, código y LaTeX |
| **Base de Datos & Sync** | Supabase + LocalStorage Fallback | Persistencia en la nube y funcionamiento offline |
| **Despliegue** | Vercel | CI/CD automático con cada push a GitHub |

---

## 📦 Instalación y Despliegue Local

Sigue estos sencillos pasos para clonar y ejecutar el proyecto en tu máquina:

### 1. Clonar el repositorio
```bash
git clone https://github.com/pampeta/ward-commander-Healt-Care.git
cd ward-commander-Healt-Care
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo `.env` en la raíz del proyecto basándote en `.env.example`:
```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:
```env
# API Key de Google Gemini (Gratuita en https://aistudio.google.com/)
VITE_GEMINI_API_KEY=tu_gemini_api_key_aqui

# Configuración de Supabase (Opcional para sincronización en la nube)
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu_anon_key_aqui
```

### 4. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```
Abre tu navegador en `http://localhost:5173`.

### 5. Compilar para Producción
```bash
npm run build
```

---

## ⚙️ ¿Cómo personalizarlo para tu Universidad u Hospital?

Ward Commander está diseñado para ser fácilmente extensible:
- **Directorio de Tutores y Reuniones:** Edita el arreglo `TUTORES_REUNIONES` en `src/views/EcgReunionClinica.tsx` para agregar los docentes de tu propio hospital.
- **Espacios de Especialidad:** Puedes agregar nuevas subespecialidades o guías clínicas en `src/views/TutorClinico.tsx` dentro de `ESPACIOS_POR_DEFECTO`.
- **Rúbricas de Evaluación:** Modifica las pautas en `src/views/ExamenOral.tsx` para adaptarlas al currículo de tu escuela de medicina.

---

## 🤝 Contribuir al Proyecto

¡Las contribuciones de estudiantes de medicina, médicos e ingenieros son bienvenidas!
1. Haz un **Fork** del repositorio.
2. Crea una rama para tu funcionalidad (`git checkout -b feature/nueva-calculadora`).
3. Realiza tus cambios y haz un commit (`git commit -m 'Agregar calculadora de aclaramiento de creatinina'`).
4. Haz push a tu rama (`git push origin feature/nueva-calculadora`).
5. Abre un **Pull Request**.

---

## ⚠️ Descargo de Responsabilidad Médica (Medical Disclaimer)

> **IMPORTANTE:** Ward Commander / El Rincón del Interno es una herramienta de asistencia tecnológica, organización y apoyo académico para estudiantes de medicina, internos y profesionales de la salud. **No reemplaza el juicio clínico profesional, la anamnesis directa ni la confirmación de dosis y conductas según las guías oficiales vigentes de cada institución de salud.** Los autores no se hacen responsables del uso indebido de la información generada.

---

## 📄 Licencia

Este proyecto está bajo la Licencia **MIT**. Consulta el archivo [LICENSE](LICENSE) para más detalles.

---

Desarrollado con ❤️ para la comunidad médica. Si este proyecto te resulta útil, ¡no olvides dejarle una ⭐ en GitHub!

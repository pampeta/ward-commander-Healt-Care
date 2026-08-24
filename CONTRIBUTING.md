# 🤝 Guía de Contribución a Ward Commander

¡Gracias por tu interés en contribuir a **Ward Commander / El Rincón del Interno**!

Este proyecto fue creado por y para la comunidad médica (estudiantes, internos, residentes, especialistas) y desarrolladores de software con el objetivo de elevar el estándar de herramientas clínicas gratuitas y de código abierto.

---

## 🌟 Formas de Contribuir

Puedes aportar en múltiples áreas según tu perfil:

### 🩺 1. Contribuciones Clínicas / Médicas
- **Nuevas Calculadoras Médicas:** Agregar scores validados (ej: Aclaramiento Cockcroft-Gault, CHA2DS2-VASc, HAS-BLED, NIHSS, qSOFA).
- **Guías Clínicas & Algoritmos:** Añadir esquemas de tratamiento actualizados (MINSAL, SOCHINF, KDIGO, GOLD, ESC/AHA).
- **Temarios de Examen Oral / EUNACOM:** Proponer casos clínicos con rúbricas de retroalimentación pedagógica.
- **Detección de Errores Clínicos:** Reportar cualquier discordancia en dosis o fórmulas médicas.

### 💻 2. Contribuciones de Desarrollo / Software
- **Optimización de Rendimiento y UX:** Mejoras en la interfaz móvil, accesibilidad y tiempos de carga.
- **Nuevas Integraciones:** Soporte para transcripción de audio en tiempo real con Web Audio API.
- **Sincronización Offline:** Implementación de Service Workers / PWA para funcionamiento en subterráneos hospitalarios sin señal.
- **Pruebas Automatizadas:** Tests unitarios para las fórmulas de calculadoras médicas (itest).

---

## 🚀 Flujo de Trabajo (Git Workflow)

1. **Fork del Repositorio:** Haz clic en el botón *Fork* en la esquina superior derecha de GitHub.
2. **Clonar localmente:**
   `ash
   git clone https://github.com/TU_USUARIO/ward-commander-Healt-Care.git
   cd ward-commander-Healt-Care
   `
3. **Crear una rama descriptiva:**
   `ash
   git checkout -b feature/calculadora-cha2ds2-vasc
   `
4. **Hacer tus cambios y probar:**
   Asegúrate de que el proyecto compila limpiamente:
   `ash
   npm run build
   `
5. **Hacer Commit y Push:**
   `ash
   git commit -m feat(calculadoras): agregar score CHA2DS2-VASc con estratificacion de riesgo embolico
   git push origin feature/calculadora-cha2ds2-vasc
   `
6. **Abrir un Pull Request:** Ve a GitHub y envía un PR describiendo tus cambios y la justificación clínica o técnica.

---

## 📜 Código de Conducta
Mantenemos un ambiente respetuoso, colaborativo y centrado en la excelencia académica y clínica. ¡Toda ayuda es valorada!

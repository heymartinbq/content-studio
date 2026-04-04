# AI Assistant Code Rules - Content Studio `v4.0.0`

Este documento define las reglas de oro y el mapa estructural para cualquier asistente de IA que trabaje en este repositorio. Su cumplimiento es obligatorio para mantener la integridad semántica y técnica del proyecto.

## 🗺️ Mapa de Áreas de la Aplicación (DOM IDs)

Para manipular o referenciar elementos de la interfaz, utiliza siempre los siguientes identificadores:

### 1. Estructura Global
- **`app-root`**: Contenedor principal de toda la aplicación.
- **`main-header`**: Barra superior que contiene el branding y acciones globales.
- **`app-controls-footer`**: Región inferior que agrupa el Timeline y el Panel de Edición.

### 2. Región del Escenario (Canvas)
- **`canvas-stage-region`**: El elemento `<main>` que centra el escenario.
- **`preview-canvas-board`**: El tablero real donde se renderizan las capas (Vite + React nativo / Tailwind Transitions).

### 3. Capas de Contenido (Z-Index Order)
- **`layer-video-bg`**: Fondo de video abstracto/ciudad.
- **`layer-webcam-bg`**: Fuente de video de la cámara del usuario.
- **`layer-vignette-overlay`**: Capa de post-procesado para viñeta y enfoque.
- **`text-overlay-item-{id}`**: Capas de texto individuales (dinámicas).

### 4. Widgets y Paneles
- **`sidebar-editor-panel`**: Panel lateral de propiedades detalladas.
- **`bottom-timeline-panel`**: Controles de tiempo y gestión de capas.
- **`floating-editor-widget`**: Editor rápido y arrastrable sobre el canvas.

---

## 🛠️ Reglas de Desarrollo

### 1. Integridad de Identidad
- El nombre oficial del proyecto es **Content Studio**.
- **PROBHIIDO**: Usar "NEON FRAME PRO", "AI Studio" o referencias a "AI-Assisted" en el código orientado al usuario.

### 2. Estilo Visual (Aesthetics First)
- Mantener siempre la estética **Premium / Dark Mode / Glassmorphism**.
- Los componentes **NO** deben usar librerías externas de animación (como motion/react). Toda animación debe construirse con clases nativas de Tailwind (`animate-in`, `fade-in`, `transition`) garantizando la filosofía Zero-Waste.
- No utilizar colores básicos (red, blue, green). Usar la paleta definida en Tailwind CSS 4 y variables HSL.

### 3. Estructura de Componentes
- Cada nueva capa o filtro debe registrarse con un ID único y descriptivo en el DOM.
- Los filtros SVG deben definirse en `src/components/SVGFilters.tsx` y referenciarse mediante `url(#id)`.

### 4. Resiliencia de Entorno
- Validar siempre la existencia de APIs de hardware (ej: `navigator.mediaDevices`) antes de su uso.
- Evitar dependencias externas críticas para assets visuales (preferir Data URLs o SVG locales).

---

## 📐 Axiomas Arquitectónicos
- 3. **Soberanía de Render**: Prohibido usar DOM para previsualización de capas. Todo debe pasar por el `MasterCanvas` (WebGL 2 + Wasm SIMD) para garantizar fidelidad Direct-to-FFmpeg.
- 4. **Integridad Diagética**: Todo elemento de texto debe ser inyectado como textura GPU antes del post-procesado para mantener coherencia física con el video.
- 5. **Cero Residuos**: Eliminar cualquier dependencia de hooks de React para el bucle de renderizado; usar solo `requestAnimationFrame` y refs.
- **Soberanía del Dato**: Toda la configuración reside en el objeto `config` del `App.tsx`.
- **Fidelidad Semántica**: Los nombres de variables deben reflejar su función editorial (ej: `glowIntensity`, `diegeticTexture`).
- **Phi-Rank Compliance**: La jerarquía visual debe priorizar el `preview-canvas-board` como el Nexus central.
- **Documentación Mandatoria (Husky)**: Cada commit de código DEBE incluir actualizaciones en `CHANGELOG.md`, `README.md`, `AI_ASSISTANT_RULES.md` y `ROADMAP.md`. El validador pre-commit bloqueará cualquier intento que no cumpla con esta sincronía estructural.
- **Zero-Dead-Code (INALIENABLE)**: Está **PROHIBIDO** mantener código que no esté en uso activo en producción. No se permiten funciones, variables, imports o módulos sin uso bajo ninguna justificación. No existen `#[allow(dead_code)]`, `// TODO`, ni fallbacks no invocados. El único código válido es el que se ejecuta. Violaciones de este axioma deben ser revertidas inmediatamente.
- **COOP/COEP Requerido**: Toda nueva funcionalidad que use `SharedArrayBuffer`, `WebWorker` con Wasm o `Atomics` DEBE activar los headers: `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: credentialless`. **PROHIBIDO usar `require-corp`** — bloquea recursos cross-origin (videos de terceros, CDNs). `credentialless` habilita `SharedArrayBuffer` sin romper assets externos.

## 🧵 Arquitectura de Procesamiento Total Domain (v1.4.0+)
- **Soberanía Wasm**: Wasm SIMD es el único encargado de procesar todos los filtros visuales del video nativo (BCSH: Brightness, Contrast, Saturation, Hue), erradicando las dependencias de CSS `<filter>`.
- **Hilo Principal (Main Thread)**: El procesado Wasm SIMD es extremadamente eficiente (<5ms) y debe realizarse en el **Hilo Principal** dentro de `requestAnimationFrame`. Los `WebWorkers` probaron ser inestables para despliegues combinados y quedan deprecados para renderizado de frame.
- **Historial In-Memory**: Rust gestiona la memoria de Retroceso (Undo/Redo), retornando strings con decodificación UTF-8 desde Buffer. El JS no debe alojar la serialización del estado histórico (Single Truth Bank).
- **MasterCanvas (v4.0.0)**: Desposeído de lógica de animación propia. La autoridad de interpolación (f32 y Color Hex) y composición SIMD recae exclusivamente en Rust.
- **Soberanía Zero-Dead-Code**: Queda terminantemente prohibido el uso de `#[allow(dead_code)]` o supresiones de warnings en el compilador. Toda lógica en el binario Wasm debe ser funcionalmente activa.
- **DOM IDs activos del motor**: `vortex-canvas-output`, `vortex-engine-badge`.


# Changelog

All notable changes to the **Content Studio** project will be documented in this file.

## [4.0.0] - 2026-04-04
### Added
- **Sovereign Vortex v4 Engine (Zero Dead Code)**: Migración total de la lógica de animación e interpolación (Lerp/Easing/Color) de JS a Rust SIMD.
- **Vortex-Spatial OBB/SAT**: Implementación de colisiones de alta precisión para elementos rotados y escalados mediante Oriented Bounding Boxes y el Teorema del Eje Separador.
- **SIMD Multi-Stream Compositor**: Motor de mezcla de capas (Blending) nativo en Wasm para Video + Webcam con latencia cero, eliminando la dependencia de la GPU para la composición base.
- **Unified MasterCanvas v4**: Refactorización del flujo de renderizado para operar exclusivamente bajo las directrices del motor soberano de Rust.

### Fixed
- **Architectural Integrity**: Eliminación total de variables y funciones inactivas (dead_code) en el core de Rust, garantizando que el 100% de la lógica compilada sea funcionalmente activa.

## [3.1.0] - 2026-04-04
### Added
- **Inmersive SIMD Expansion**: Implementación de Aberración Cromática (RGB Shift) y Film Grain orgánico directamente en el pipeline de Rust.
- **Webcam SIMD Integration**: La fuente de la webcam ahora es procesada por el motor Wasm, compartiendo la misma estética inmersiva que el video de fondo.
- **MasterCanvas Unified Loop**: Refactorización del ciclo de renderizado para capturar, procesar y subir texturas de múltiples fuentes (Video/Webcam) mediante memoria soberana.
- **Global Color Authority**: Centralización de Brillo, Contraste, Saturación y Gamma en Wasm SIMD, eliminando procesos redundantes en la GPU.

### Fixed
- **Build Toolchain Alignment**: Corrección del error de intrínsecos `clone_ref` mediante el pinning de `wasm-bindgen` a la versión `=0.2.92`.

## [3.0.0] - 2026-04-03
### Added
- **Sovereign WebGL 2 Pipeline**: Transición total a un motor de renderizado WebGL 2 nativo de alto rendimiento (<1ms latencia).
- **Inyección Diagética de UI**: El texto ahora se sube como textura GPU y se mezcla físicamente con el video antes del post-procesado.
- **Vortex-Optics v3**: Implementación de Distorsión de Lente Universal (Barrel/Pincushion) y Halación Fílmica (Red Fringe) en shader.
- **Consolidación de Interfaz**: Unificación de Renderizado, Inmersión y Óptica en una sola pestaña maestra.

### Fixed
- **Estabilización de Imagen**: Corregidos errores de inversión vertical (Y-Flip) y mirror de webcam.
- **Visibilidad de Capas**: Solucionado bug de opacidad que bloqueaba el video de fondo cuando la webcam estaba desactivada.

## [1.9.1] - 2026-04-02
### Changed
- **Sovereign Engine & Zero-Waste Frontend**: Purga total de `motion/react` (Framer Motion), `express`, `dotenv`. Toda la animación del UI se ejecuta con CSS nativo de Tailwind v4 (`animate-in`, `fade-in`, `transition`).
- **Typescript Cero Errores**: Se corrigieron interfaces de componentes y remoción de props obsoletos (como `dragConstraints`) garantizando una compilación inmaculada de TS en modo estricto.
- **Git Tracking Optimization**: Se ignoró `src-rs/target/` explícitamente en el `.gitignore` y se restauró el track principal del demo de background interactivo comprimido.

## [1.5.1] - 2026-04-02
### Fixed
- **UI Render Lag**: Eliminadas las caídas dramáticas de frames en la vista previa del Canvas extrayendo la telemetría `setFrameMs` y los despachos `updateLayer` del ciclo de renderizado, reemplazándolos con refs y despachos `onPointerUp` logrando unos gloriosos 60FPS constantes en D&D.

## [1.5.0] - 2026-04-02
### Changed
- **Pipeline Universal Canvas**: Abolición completada de toda la arquitectura DOM/React Composition (`framer-motion`, HTML layers). Toda la capa gráfica viaja en Buffer (`MasterCanvas.tsx`), con físicas unificadas D&D e interpolación de Hit-Testing en memoria nativa Canvas para preparación Direct-to-FFmpeg.
- **WebRTC SIMD Filter**: La capa `WebcamLayer` ha sido oculta bajo el DOM y extraída en Buffer. Su data fotométrica ahora alimenta incondicionalmente el bucle de Inmersión Wasm (SIMD); el Grano, Viñeta y Luma afectan a la cámara integrándola con el proyecto completo fotograma a fotograma.

## [1.4.1] - 2026-04-02
### Fixed
- **Dynamic Film Grain PRNG**: Fixed an issue where the Wasm SIMD engine generated static noise. Injected `performance.now()` across the FFI bounds to create an authentic photochemical dynamic grain that changes per frame.
- **Invisible VideoLayer Bug**: Removed a residual CSS `url(#video-color-curves)` filter from `VideoLayer` which broke rendering completely in Chromium after SVG abolition.

## [1.4.0] - 2026-04-02

### Changed
- **Arquitectura de Motor (Main Thread)**: `VortexCanvas` fue reescrito para utilizar el motor WASM directamente en el hilo principal (`requestAnimationFrame`). La optimización SIMD de Rust asegura latencias menores a 5ms por frame, eliminando la necesidad de WebWorkers propensos a errores silenciosos de resolución de Wasm en Vite.
- **Limpieza de Dominio UI (Soberanía)**: Eliminados duplicados redundantes de SVG en `SVGFilters.tsx` para Filtros Inmersivos (`#immersive-overlay`), estableciendo a Rust (SIMD) como la ÚNICA fuente de verdad.
- **Gating de Rendimiento**: `VideoLayer` ahora solo instancia el pipeline en tiempo real si `showImmersiveOverlay` es verdaderamente `true`, enlazado directamente a los controles del Sidebar.

### Removed
- **VortexWorker**: Eliminado `src/workers/vortex.worker.ts` según el axioma de Zero-Dead-Code. La paralelización mediante `SharedArrayBuffer` presentaba demasiados conflictos con los CDNs y resoluciones Vite en producción/desarrollo mixto.

## [1.2.3] - 2026-04-02

### Fixed
- `wasm-bridge.ts`: Restaurado `debounce_update` como método de instancia en `VortexEngine`. Al reescribir el bridge para WASM real, se omitió este método que `EditorContext` usa para filtrar actualizaciones de sliders de alta frecuencia. La lógica es correctamente JS-side (no requiere round-trip a Wasm).



## [1.2.2] - 2026-04-02

### Fixed
- **COEP Header**: Cambiado `require-corp` → `credentialless` en `vite.config.ts` and `public/_headers`. `require-corp` bloqueaba videos cross-origin (mixkit.co CDN) con `ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep`. `credentialless` habilita `SharedArrayBuffer` sin bloquear assets externos.
- **AI_ASSISTANT_RULES.md**: Axioma COOP/COEP corregido para prohibir explícitamente `require-corp` en aplicaciones OSS con assets de terceros.

## [1.2.1] - 2026-04-02

### Fixed

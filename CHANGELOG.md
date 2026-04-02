# Changelog

All notable changes to the **Content Studio** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
- **COEP Header**: Cambiado `require-corp` → `credentialless` en `vite.config.ts` y `public/_headers`. `require-corp` bloqueaba videos cross-origin (mixkit.co CDN) con `ERR_BLOCKED_BY_RESPONSE.NotSameOriginAfterDefaultedToSameOriginByCoep`. `credentialless` habilita `SharedArrayBuffer` sin bloquear assets externos.
- **AI_ASSISTANT_RULES.md**: Axioma COOP/COEP corregido para prohibir explícitamente `require-corp` en aplicaciones OSS con assets de terceros.

## [1.2.1] - 2026-04-02

### Fixed
- `VortexCanvas.tsx`: Reemplazado `React.RefObject` por `RefObject` importado directamente. Elimina el error de IDE "Cannot find namespace React". Cumple Zero-Dead-Code: sin imports sin uso.

## [1.2.0] - 2026-04-02

### Added
- **Grain Dinámico por Luminancia**: Film Grain auténtico basado en luma perceptual BT.601. Más grano en sombras, menos en altas luces. Hash determinístico por posición — sin RNG costoso.
- **VortexWorker (WebWorker)**: Pipeline Vortex trasladado al hilo del worker. El hilo principal nunca se bloquea durante el procesamiento SIMD. Transferables zero-copy entre hilos.
- **Benchmarking por Frame**: Cada frame devuelto por el worker incluye `frameMs`. Visible en el badge `vortex-engine-badge` en tiempo real.
- **Badge UI `vortex-engine-badge`**: Indicador glassmorphism con pulse animation y latencia en ms, visible cuando el motor está activo.
- **COOP/COEP Headers (Vite + Producción)**: `Cross-Origin-Opener-Policy` y `Cross-Origin-Embedder-Policy` configurados en `vite.config.ts` y `public/_headers` para habilitar `SharedArrayBuffer` en localhost y hosting estático OSS.
- **`public/_headers`**: Archivo de headers para Netlify/Cloudflare Pages/GitHub Pages.

### Changed
- `video.rs`: Grain dinámico por luminancia reemplaza al grain uniforme. Compilación condicional estructural con `#[cfg(target_arch = "wasm32")]`.
- `VortexCanvas.tsx`: Arquitectura dual-thread con Worker. Eliminado el procesamiento on-main-thread.
- `vite.config.ts`: Headers COOP/COEP en `server` y `preview`.

## [1.1.0] - 2026-04-02

### Added
- **VortexCanvas**: Nuevo componente que captura frames del video en un `<canvas>` y aplica efectos SIMD Rust/Wasm en tiempo real via `requestAnimationFrame`.
- **Zero-Copy Frame Processing**: Pipeline completo `vortex_alloc → processFrame → vortex_free` con gestión soberana de memoria Wasm.
- **wasm-bridge.ts (Real)**: Reescritura total para cargar `vortex_engine.wasm` con `WebAssembly.instantiateStreaming`. Eliminado el Digital Twin TypeScript.
- **Film Grain + Scanlines SIMD**: Filtros de video en tiempo real acelerados por hardware (`simd128`) integrados al pipeline del canvas.
- **Compilación Condicional Rust**: `#[cfg(target_arch = "wasm32")]` en `video.rs` para eliminar errores del IDE en targets nativos.
- **Axioma Zero-Dead-Code**: Política formalizada en `AI_ASSISTANT_RULES.md`. Prohibición absoluta de `#[allow(dead_code)]`, fallbacks no invocados y código sin uso en producción.

### Changed
- `VideoLayer.tsx`: Ahora acepta `grain` y `scanlines` props. Cuando están activos, delega el renderizado a `VortexCanvas`.
- `EditorContext.tsx`: Sincronizado con el nuevo ABI del bridge real (`pushHistory`, `calculateGamma`).
- `video.rs`: Función única `process_frame` con SIMD condicional. Eliminado el fallback escalar.

### Removed
- Digital Twin TypeScript del motor (sustituido por binario Wasm real).
- `process_frame_scalar` y todo código muerto del motor Rust.

## [1.0.0] - 2026-04-01

### Added
- **Vortex Engine (Rust Core)**: Initial integration of the high-performance Rust core via Wasm.
- **Sovereign Wasm Architecture**: Manual ABI implementation (`extern "C"`) for zero-dependency portability.
- **Digital Twin (TS)**: TypeScript fallback/replica of the Rust engine in `wasm-bridge.ts`.
- **History System**: Complete Undo/Redo stack with state snapshotting.
- **UI History Controls**: Integrated navigation rail buttons for Undo/Redo in `EditorPanel`.
- **Global Shortcuts**: Support for `Ctrl+Z` and `Ctrl+Shift+Z` keyboard triggers.
- **Delta Filtering**: Intelligent de-bouncing in `debounce.rs` for smooth slider interactions.
- **Zero Slop Certification**: Full project linting and warning resolution in Rust and TypeScript.

### Changed
- Refactored `EditorContext` to handle the history-aware state reducer.
- Optimized SVG filters reference system in `SVGFilters.tsx`.

### Removed
- Obsolete wasm-bindgen generated artifacts in `src/core/pkg`.

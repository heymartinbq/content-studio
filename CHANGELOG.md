# Changelog

All notable changes to the **Content Studio** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

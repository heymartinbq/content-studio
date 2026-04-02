# Changelog

All notable changes to the **Content Studio** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

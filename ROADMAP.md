# Content Studio ROADMAP `v1.5.0`

Visión futura y objetivos estratégicos para el **Content Studio**.

## 🎯 Hitos Principales

### Hito 1: Motor Vortex v1.5 ✅ COMPLETADO
- [x] **SIMD Optimization**: `simd128` Film Grain + Scanlines. ✅ v1.1.0
- [x] **Zero-Copy Pipeline**: `vortex_alloc/free` + `processFrame`. ✅ v1.1.0
- [x] **Main-Thread Engine Validation**: WASM directo superando performance esperada (<5ms). Worker descartado por inestabilidad externa. ✅ v1.3.0
- [x] **Total Domain Architecture**: Procesamiento de Color Grading in-place en Wasm SIMD. SVG abolido. ✅ v1.4.0
- [x] **Advanced Film Emulation**: Grain dinámico por luminancia BT.601 + History State via Wasm. ✅ v1.4.0
- [x] **Benchmarking**: `frameMs` en tiempo real en badge UI. ✅ v1.2.0

### Hito 2: Edición No-Lineal (Timeline Expansion)
- [ ] **Layer Blending Modes**: Multiply, Screen, Overlay en el pipeline.
- [ ] **Keyframe Animation Engine**: Interpolación para propiedades de texto y filtros.
- [ ] **Persistent State**: Sincronización del `HistoryStack` con `indexedDB`.

### Hito 3: IA & Soberanía del Dato
- [ ] **On-Device LLM Integration**: Generación de subtítulos y efectos diegéticos mediante modelos locales.
- [ ] **Project Export**: Renderizado final `mp4` utilizando `ffmpeg.wasm`.

---

## 📐 Principios de Diseño
- **Latencia Zero**: Cada milisegundo cuenta.
- **Fidelidad Premium**: Estética Glassmorphism y Motion fluida.
- **Soberanía Wasm**: Funcionar sin dependencias de nube siempre que sea posible.

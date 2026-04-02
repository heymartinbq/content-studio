# Content Studio ROADMAP

Visión futura y objetivos estratégicos para el **Content Studio**.

## 🎯 Hitos Principales

### Hito 1: Motor Vortex v1.5 (Próximo)
- [ ] **Multi-Threaded Rendering**: Uso de `WebWorkers` con Wasm para procesamiento de filtros en paralelo.
- [ ] **Advanced Film Emulation**: Implementación de granulación dinámica basada en luminancia.
- [ ] **SIMD Optimization**: Aceleración por hardware para operaciones de color en Rust.

### Hito 2: Edición No-Lineal (Timeline Expansion)
- [ ] **Layer Blending Modes**: Soporte para Multiply, Screen, y Overlay en el Digital Twin.
- [ ] **Keyframe Animation Engine**: Sistema de interpolación para propiedades de texto y filtros.
- [ ] **Persistent State**: Sincronización del `HistoryStack` con `indexedDB`.

### Hito 3: IA & Soberanía del Dato
- [ ] **On-Device LLM Integration**: Generación de subtítulos y efectos diegéticos mediante modelos locales.
- [ ] **Project Export**: Renderizado final `mp4` utilizando `ffmpeg.wasm`.

---

## 📐 Principios de Diseño
- **Latencia Zero**: Cada milisegundo cuenta.
- **Fidelidad Premium**: Estética Glassmorphism y Motion fluida.
- **Soberanía Wasm**: Funcionar sin dependencias de nube siempre que sea posible.

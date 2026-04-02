# 🎬 Content Studio — Advanced Editorial Overlay System `v1.5.0`

**Content Studio** is a professional-grade web application designed for real-time video and text compositions. It provides creators with a high-end interface to craft visually stunning overlays, utilizing advanced SVG filters, motion graphics, and a sophisticated color grading engine.

## ✨ Key Features

-   **🌀 Vortex Engine (Real WASM)**: Motor de alto rendimiento en Rust (`wasm32` SIMD `v128`). Pipeline Zero-Copy processado directamente en el Main Thread logrando latencias < 5ms.
-   **🎬 Film Grain Dinámico**: Luminancia perceptual BT.601 determina la intensidad del grano por pixel — más grano en sombras, comportamiento auténtico de film fotoquímico.
-   **⏱️ Benchmarking en Tiempo Real**: Badge `vortex-engine-badge` muestra latencia `frameMs` de cada frame procesado por el motor Rust.
-   **⏪ Nonlinear History System**: Full Undo/Redo capabilities with serialized snapshots, integrated directly into the core engine and UI.
-   **📈 Advanced Color Curvature**: Professional-grade SRGB Gamma correction with independent channel control (Red, Green, Blue) for unified grading.
-   **📑 Vertical Navigation Rail**: High-efficiency sidebar with icon-based navigation, global Undo/Redo controls, and a streamlined workspace.
-   **🧩 Real-time Debugger**: Integrated event journaling and state inspection system (accessible via `Ctrl + Shift + D`).
-   **🎨 Dynamic Text Overlays**: Advanced typography engine with support for Glow, Glitch, Neon, and Chromatic Aberration effects.
-   **🛡️ Total Domain Wasm Certified v1.5.0**: 0 errores, 0 warnings. Árbol de Render refactorizado a Canvas Universal. Soporte de arrastre D&D in-engine sobre WebGL/Canvas2D sin depender de DOM elements. Listo para exportación unificada a FFmpeg.

## 🚀 Getting Started

### Prerequisites

-   [Node.js](https://nodejs.org/) (v18 or higher)
-   [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation

1.  Clone the repository:
    ```bash
    git clone [repository-url]
    cd content-studio
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

3.  Start the development server:
    ```bash
    npm run dev
    ```

## 🛠️ Technology Stack

-   **Core**: [React 19](https://react.dev/), [TypeScript](https://www.typescriptlang.org/)
-   **State Engine**: Custom Reducer-based Context with automated Journaling and History Stack
-   **Native Core**: [Rust](https://www.rust-lang.org/) (Sovereign Wasm Architecture)
-   **Build Tool**: [Vite](https://vitejs.dev/)
-   **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
-   **Animations**: [Motion](https://motion.dev/)
-   **Icons**: [Lucide React](https://lucide.dev/)

## 📄 License

This project is licensed under the Apache-2.0 License. See the [LICENSE](LICENSE) file for details.


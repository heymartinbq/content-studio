import { useEffect, useRef } from "react";
import SVGFilters from "./components/SVGFilters";
import VideoLayer from "./components/VideoLayer";
import WebcamLayer from "./components/WebcamLayer";
import EditorPanel from "./components/EditorPanel";
import Timeline from "./components/Timeline";
import FloatingEditor from "./components/FloatingEditor";
import Debugger from "./components/Debugger";
import MasterCanvas from "./components/MasterCanvas";
import { useEditor } from "./core/EditorContext";
import { Maximize2, Minimize2, Download, Layers, Camera, Edit3 } from "lucide-react";

export default function App() {
  const { state, actions } = useEditor();
  const { config, activeLayerId, isPreview, showFloatingEditor } = state;

  const canvasRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const webcamRef = useRef<HTMLVideoElement>(null);

  const selectedLayer = config.layers.find(l => l.id === activeLayerId);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (activeLayerId) actions.removeLayer(activeLayerId);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (activeLayerId) actions.duplicateLayer(activeLayerId);
      }
      if (e.key.toLowerCase() === "v" && activeLayerId && selectedLayer) {
        actions.updateLayer(activeLayerId, { visible: !selectedLayer.visible });
      }
      if (e.key.toLowerCase() === "l" && activeLayerId && selectedLayer) {
        actions.updateLayer(activeLayerId, { locked: !selectedLayer.locked });
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z") {
        e.preventDefault();
        e.shiftKey ? actions.redo() : actions.undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y") {
        e.preventDefault();
        actions.redo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLayerId, selectedLayer, actions]);

  return (
    <div id="app-root" className="relative w-full h-screen bg-neutral-950 overflow-hidden font-sans selection:bg-blue-500/30 flex flex-col">
      <SVGFilters
        noiseIntensity={config.noiseIntensity}
        textureIntensity={selectedLayer?.textureIntensity}
        videoBrightness={config.videoBrightness}
        videoContrast={config.videoContrast}
        videoSaturation={config.videoSaturation}
        videoHue={config.videoHue}
        videoGamma={actions.calculateGamma(config.videoGamma, 1)}
        videoGammaR={actions.calculateGamma(config.videoGamma, config.videoGammaR)}
        videoGammaG={actions.calculateGamma(config.videoGamma, config.videoGammaG)}
        videoGammaB={actions.calculateGamma(config.videoGamma, config.videoGammaB)}
      />

      {/* Debugger Overlay */}
      <Debugger />

      {/* Top Bar */}
      {!isPreview && (
        <header
          id="main-header"
          className="flex-shrink-0 h-24 flex items-center justify-between px-8 z-50 animate-in fade-in slide-in-from-top-4 duration-500"
        >
          <div className="flex items-center gap-5">
            <div className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform duration-300">
              <Layers className="text-blue-400" size={22} />
            </div>
            <div>
              <h1 className="text-white font-black text-xl tracking-tighter flex items-center gap-2">
                CONTENT<span className="text-blue-500">STUDIO</span>
                <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full uppercase tracking-widest">PRO</span>
              </h1>
              <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-black">Advanced Editorial Overlay System</p>
            </div>
          </div>

          <div className="flex items-center gap-3 p-1.5 bg-black/20 backdrop-blur-3xl border border-white/5 rounded-2xl">
            <button
              onClick={() => actions.toggleFloatingEditor()}
              className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${showFloatingEditor ? "text-blue-400 bg-blue-500/10" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Editor Flotante"
            >
              <Edit3 size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button
              onClick={() => actions.updateGlobalConfig({ useWebcam: !config.useWebcam })}
              className={`p-3 rounded-xl transition-all hover:scale-105 active:scale-95 relative ${config.useWebcam ? "text-red-500 bg-red-500/10" : "text-white/40 hover:text-white hover:bg-white/5"}`}
              title="Activar Cámara"
            >
              <Camera size={20} />
              {config.useWebcam && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-950 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse" />
              )}
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button
              onClick={() => actions.togglePreview(true)}
              className="p-3 rounded-xl text-white/40 hover:text-white transition-all hover:scale-105 active:scale-95 hover:bg-white/5"
              title="Vista Previa"
            >
              <Maximize2 size={20} />
            </button>
            <div className="w-px h-6 bg-white/10 mx-1" />
            <button className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)] hover:scale-105 active:scale-95">
              <Download size={18} />
              Exportar
            </button>
          </div>
        </header>
      )}

      {/* Main Canvas Area */}
      <main id="canvas-stage-region" ref={mainRef} className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative z-0">
        <div
          ref={canvasRef}
          onClick={() => actions.selectLayer("")}
          id="preview-canvas-board"
          className="relative shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] overflow-hidden bg-black ring-1 ring-white/5 cursor-crosshair transition-all duration-700 ease-in-out"
          style={{
            aspectRatio: config.aspectRatio,
            maxHeight: "100%",
            maxWidth: "100%",
            height: isPreview ? "100vh" : "100%",
            borderRadius: isPreview ? "0px" : "40px",
            filter: config.noiseIntensity > 0 ? "url(#subtle-noise)" : "none",
          }}
        >
          <VideoLayer videoUrl={config.videoUrl} videoRef={videoRef} currentTime={state.currentTime} />
          <WebcamLayer active={config.useWebcam} webcamRef={webcamRef} />
          <MasterCanvas config={config} videoRef={videoRef} webcamRef={webcamRef} />
        </div>

        {/* Preview Exit Button */}
        {isPreview && (
          <button
            onClick={() => actions.togglePreview(false)}
            className="fixed top-8 right-8 p-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full text-white/60 hover:text-white transition-all z-50 shadow-2xl hover:scale-110 active:scale-90 hover:bg-black/80 animate-in fade-in zoom-in duration-300"
          >
            <Minimize2 size={24} />
          </button>
        )}

        {/* Floating Inspector */}
        {showFloatingEditor && selectedLayer && !isPreview && (
          <FloatingEditor />
        )}

        {/* Sidebar Editor */}
        {!isPreview && <EditorPanel key="sidebar-editor" />}
      </main>

      {/* Timeline Footer */}
      {!isPreview && (
        <div
          id="app-controls-footer"
          className="flex-shrink-0 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <Timeline />
        </div>
      )}

      {/* Background Grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Noise Overlay */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay z-10"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import SVGFilters from "./components/SVGFilters";
import VideoLayer from "./components/VideoLayer";
import WebcamLayer from "./components/WebcamLayer";
import TextOverlay from "./components/TextOverlay";
import VignetteLayer from "./components/VignetteLayer";
import EditorPanel from "./components/EditorPanel";
import Timeline from "./components/Timeline";
import FloatingEditor from "./components/FloatingEditor";
import VideoEffectsEditor from "./components/VideoEffectsEditor";
import { Maximize2, Minimize2, Download, Share2, Layers, Camera, Plus, Edit3 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const DEFAULT_LAYERS = [
  {
    id: "layer-1",
    name: "Texto Principal",
    type: "text",
    text: "CONTENT STUDIO",
    fontSize: 120,
    fontFamily: "Space Grotesk",
    color: "#00f2ff",
    colorSecondary: "#0066ff",
    fillOpacity: 0.8,
    gradientConfig: {
      type: 'linear',
      angle: 180,
      stops: [
        { color: "#00f2ff", position: 0, opacity: 1 },
        { color: "#0066ff", position: 100, opacity: 1 }
      ]
    },
    glowIntensity: 10,
    sparkleSpeed: 3,
    neonEmboss: true,
    diegeticTexture: true,
    glitch: false,
    chromaticAberration: true,
    bloom: true,
    lightWrap: true,
    textureIntensity: 0.15,
    editorialStyle: "default",
    textAlign: "center",
    mixBlendMode: "normal",
    locked: false,
    visible: true,
    opacity: 1,
    selectionBorderColor: "#3b82f6",
    selectionBorderWidth: 2,
    x: 0,
    y: 0,
  }
];

const DEFAULT_CONFIG = {
  aspectRatio: "16/9",
  videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-abstract-neon-lights-in-motion-27371-large.mp4",
  videoOpacity: 0.8,
  videoBlur: 2,
  videoBrightness: 1,
  videoContrast: 1,
  videoSaturation: 1,
  videoHue: 0,
  showImmersiveOverlay: false,
  vignetteIntensity: 60,
  vignetteRadius: 20,
  vignetteColor: "#000000",
  useWebcam: false,
  webcamOpacity: 100,
  webcamBlur: 0,
  noiseIntensity: 0.05,
  layers: DEFAULT_LAYERS,
};

export default function App() {
  const [config, setConfig] = useState(DEFAULT_CONFIG);
  const [isPreview, setIsPreview] = useState(false);
  const [activeLayerId, setActiveLayerId] = useState<string>("layer-1");
  const [showFloatingEditor, setShowFloatingEditor] = useState(true);
  const canvasRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (activeLayerId.startsWith("layer-")) {
      setShowFloatingEditor(true);
    }
  }, [activeLayerId]);

  const handleLayerChange = (layerId: string, key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === layerId ? { ...l, [key]: value } : l)
    }));
  };

  const removeLayer = (id: string) => {
    if (config.layers.length <= 1) return;
    const newLayers = config.layers.filter((l: any) => l.id !== id);
    setConfig(prev => ({ ...prev, layers: newLayers }));
    if (activeLayerId === id) {
      setActiveLayerId(newLayers[0].id);
    }
  };

  const duplicateLayer = (id: string) => {
    const layerToCopy = config.layers.find((l: any) => l.id === id);
    if (!layerToCopy) return;
    const newId = `layer-${Date.now()}`;
    const newLayer = { 
      ...layerToCopy, 
      id: newId, 
      name: `${layerToCopy.name} (Copia)`,
      x: (layerToCopy.x || 0) + 40,
      y: (layerToCopy.y || 0) + 40
    };
    setConfig(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
    setActiveLayerId(newId);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input/textarea
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return;

      if (e.key === "Delete" || e.key === "Backspace") {
        if (activeLayerId) removeLayer(activeLayerId);
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "d") {
        e.preventDefault();
        if (activeLayerId) duplicateLayer(activeLayerId);
      }

      if (e.key.toLowerCase() === "v") {
        if (activeLayerId) {
          const layer = config.layers.find((l: any) => l.id === activeLayerId);
          if (layer) handleLayerChange(activeLayerId, "visible", !layer.visible);
        }
      }

      if (e.key.toLowerCase() === "l") {
        if (activeLayerId) {
          const layer = config.layers.find((l: any) => l.id === activeLayerId);
          if (layer) handleLayerChange(activeLayerId, "locked", !layer.locked);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeLayerId, config.layers]);

  const handleLayerPositionChange = (layerId: string, x: number, y: number) => {
    setConfig(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === layerId ? { ...l, x, y } : l)
    }));
  };

  const selectedLayer = config.layers.find(l => l.id === activeLayerId);

  return (
    <div className="relative w-full h-screen bg-neutral-950 overflow-hidden font-sans selection:bg-blue-500/30 flex flex-col">
      <SVGFilters 
        noiseIntensity={config.noiseIntensity} 
        textureIntensity={selectedLayer?.textureIntensity}
        videoBrightness={config.videoBrightness}
        videoContrast={config.videoContrast}
        videoSaturation={config.videoSaturation}
        videoHue={config.videoHue}
      />

      {/* Top Bar UI */}
      <AnimatePresence>
        {!isPreview && (
          <motion.header 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -50, opacity: 0 }}
            className="flex-shrink-0 h-24 flex items-center justify-between px-8 z-50"
          >
            <div className="flex items-center gap-5">
              <motion.div 
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="w-12 h-12 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center shadow-2xl"
              >
                <Layers className="text-blue-400" size={22} />
              </motion.div>
              <div>
                <h1 className="text-white font-black text-xl tracking-tighter flex items-center gap-2">
                  CONTENT<span className="text-blue-500">STUDIO</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-full uppercase tracking-widest">PRO</span>
                </h1>
                <p className="text-white/20 text-[9px] uppercase tracking-[0.3em] font-black">Advanced Editorial Overlay System</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-1.5 bg-black/20 backdrop-blur-3xl border border-white/5 rounded-2xl">
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFloatingEditor(prev => !prev)}
                className={`p-3 rounded-xl transition-colors ${showFloatingEditor ? "text-blue-400" : "text-white/40 hover:text-white"}`}
                title="Editor Flotante"
              >
                <Edit3 size={20} />
              </motion.button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: config.useWebcam ? "rgba(239,68,68,0.2)" : "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setConfig(prev => ({ ...prev, useWebcam: !prev.useWebcam }))}
                className={`p-3 rounded-xl transition-colors relative ${config.useWebcam ? "text-red-500" : "text-white/40 hover:text-white"}`}
                title="Activar Cámara"
              >
                <Camera size={20} />
                {config.useWebcam && (
                  <motion.span 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-neutral-950 shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                  />
                )}
              </motion.button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <motion.button
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsPreview(true)}
                className="p-3 rounded-xl text-white/40 hover:text-white transition-colors"
                title="Vista Previa"
              >
                <Maximize2 size={20} />
              </motion.button>
              <motion.button 
                whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                whileTap={{ scale: 0.95 }}
                className="p-3 rounded-xl text-white/40 hover:text-white transition-colors"
              >
                <Share2 size={20} />
              </motion.button>
              <div className="w-px h-6 bg-white/10 mx-1" />
              <motion.button 
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black text-xs uppercase tracking-widest transition-all shadow-[0_0_40px_rgba(37,99,235,0.3)]"
              >
                <Download size={18} />
                Exportar
              </motion.button>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Main Canvas Area */}
      <main ref={mainRef} className="flex-[7] flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden relative z-0">
        <motion.div 
          ref={canvasRef}
          layout
          onClick={() => setActiveLayerId("")}
          className="relative shadow-[0_64px_128px_-24px_rgba(0,0,0,1)] overflow-hidden bg-black ring-1 ring-white/5 cursor-crosshair"
          animate={{ 
            height: isPreview ? "100vh" : "100%",
            borderRadius: isPreview ? "0px" : "40px",
          }}
          transition={{ type: "spring", bounce: 0, duration: 0.8 }}
          style={{ 
            aspectRatio: config.aspectRatio,
            maxHeight: "100%",
            maxWidth: "100%",
            filter: config.noiseIntensity > 0 ? "url(#subtle-noise)" : "none",
          }}
        >
          <VideoLayer
            videoUrl={config.videoUrl}
            opacity={config.videoOpacity}
            blur={config.videoBlur}
            showImmersiveOverlay={config.showImmersiveOverlay}
          />

          <VideoEffectsEditor 
            config={config} 
            onConfigChange={(key, value) => setConfig(prev => ({ ...prev, [key]: value }))} 
          />

          <WebcamLayer
            active={config.useWebcam}
            opacity={config.webcamOpacity}
            blur={config.webcamBlur}
          />
          
          <VignetteLayer
            intensity={config.vignetteIntensity}
            color={config.vignetteColor}
            radius={config.vignetteRadius}
          />

          {config.layers.map((layer: any) => (
            layer.visible && (
              <TextOverlay
                key={layer.id}
                text={layer.text}
                color={layer.color}
                colorSecondary={layer.colorSecondary}
                fillOpacity={layer.fillOpacity}
                gradientConfig={layer.gradientConfig}
                glowIntensity={layer.glowIntensity}
                sparkleSpeed={layer.sparkleSpeed}
                fontSize={layer.fontSize}
                fontFamily={layer.fontFamily}
                neonEmboss={layer.neonEmboss}
                diegeticTexture={layer.diegeticTexture}
                glitch={layer.glitch}
                chromaticAberration={layer.chromaticAberration}
                bloom={layer.bloom}
                lightWrap={layer.lightWrap}
                editorialStyle={layer.editorialStyle as any}
                mixBlendMode={layer.mixBlendMode}
                textAlign={layer.textAlign as any}
                opacity={layer.opacity ?? 1}
                x={layer.x || 0}
                y={layer.y || 0}
                isActive={activeLayerId === layer.id}
                locked={layer.locked}
                onPositionChange={(x, y) => handleLayerPositionChange(layer.id, x, y)}
                onSelect={() => setActiveLayerId(layer.id)}
                selectionBorderColor={layer.selectionBorderColor}
                selectionBorderWidth={layer.selectionBorderWidth}
                dragConstraints={canvasRef}
              />
            )
          ))}
        </motion.div>

        {/* Preview Mode Exit Button */}
        <AnimatePresence>
          {isPreview && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              whileHover={{ scale: 1.1, backgroundColor: "rgba(0,0,0,0.8)" }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setIsPreview(false)}
              className="fixed top-8 right-8 p-4 bg-black/40 backdrop-blur-2xl border border-white/10 rounded-full text-white/60 hover:text-white transition-all z-50 shadow-2xl"
            >
              <Minimize2 size={24} />
            </motion.button>
          )}
        </AnimatePresence>

        {/* Floating Editor moved outside the overflow-hidden container */}
        <AnimatePresence>
          {showFloatingEditor && selectedLayer && !isPreview && (
            <FloatingEditor
              layer={selectedLayer}
              onChange={(key, value) => handleLayerChange(selectedLayer.id, key, value)}
              onClose={() => setShowFloatingEditor(false)}
              dragConstraints={mainRef}
            />
          )}
        </AnimatePresence>
      </main>

      {/* Timeline & Editor Area */}
      {!isPreview && (
        <motion.div 
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="flex-[3] flex flex-col min-h-0"
        >
          <Timeline 
            config={config} 
            onChange={setConfig}
            activeLayerId={activeLayerId}
            onSelectLayer={setActiveLayerId}
          />
          <div className="flex-1 overflow-y-auto p-4">
            <EditorPanel 
              config={config} 
              onChange={setConfig} 
              activeLayerId={activeLayerId}
              onSelectLayer={setActiveLayerId}
            />
          </div>
        </motion.div>
      )}

      {/* Background Grid Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.05] z-0">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      </div>

      {/* Subtle Noise Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.02] mix-blend-overlay z-10" style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }} />
    </div>
  );
}

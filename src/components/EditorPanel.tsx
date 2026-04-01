/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { useEditor } from "../core/EditorContext";
import { motion, AnimatePresence } from "motion/react";
import { 
  Settings, Type, Video, Layers, Smartphone, Square, Monitor, 
  ChevronLeft, MoreVertical, Plus, Sun, Contrast, Droplets, Palette, Film, Sparkles, Activity 
} from "lucide-react";

interface NavButtonProps {
  id: string;
  key?: string | number;
  icon: any;
  label: string;
  active: boolean;
  color: string;
  onClick: () => void;
}

const NavButton = ({ id, icon: Icon, label, active, color, onClick }: NavButtonProps) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative flex items-center justify-center">
      <motion.button
        id={`tab-btn-${id}`}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.08)" }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        className={`w-12 h-12 flex items-center justify-center rounded-2xl transition-all duration-300 relative ${
          active 
            ? "bg-white/10 text-white shadow-lg ring-1 ring-white/10" 
            : "text-white/30 hover:text-white/60"
        }`}
      >
        <Icon size={20} className={active ? color : "text-current"} />
        {active && (
          <motion.div 
            layoutId="active-indicator"
            className={`absolute -left-1 w-1 h-6 rounded-r-full ${color.replace('text-', 'bg-')}`}
          />
        )}
      </motion.button>

      {/* Tooltip */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 20 }}
            exit={{ opacity: 0, x: 10 }}
            className="absolute left-full ml-4 px-3 py-1.5 bg-neutral-900 border border-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white whitespace-nowrap z-50 shadow-2xl pointer-events-none"
          >
            {label}
            <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-neutral-900 border-l border-b border-white/10 rotate-45" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default function EditorPanel() {
  const { state, actions } = useEditor();
  const { config, activeLayerId: activeTab } = state;

  const setActiveTab = actions.selectLayer;

  const handleGlobalChange = (key: string, value: any) => {
    actions.updateGlobalConfig({ [key]: value });
  };

  const handleLayerChange = (layerId: string, key: string, value: any) => {
    actions.updateLayer(layerId, { [key]: value });
  };

  const globalTabs = [
    { id: "media", icon: Video, label: "Fondo & Webcam", color: "text-green-400" },
    { id: "post", icon: Layers, label: "Post-Procesado", color: "text-orange-400" },
    { id: "curves", icon: Activity, label: "Curvatura", color: "text-blue-400" },
    { id: "immersive", icon: Film, label: "Inmersión", color: "text-purple-400" },
  ];

  const effectiveTab = activeTab || "media";
  const selectedLayer = config.layers.find((l: any) => l.id === effectiveTab);
  const isGlobalTab = globalTabs.some(t => t.id === effectiveTab);

  return (
    <motion.div 
      id="sidebar-editor-panel"
      className="absolute top-8 right-8 bottom-8 w-[460px] bg-neutral-950/90 backdrop-blur-3xl border border-white/10 rounded-[3.5rem] text-white shadow-[0_64px_128px_-32px_rgba(0,0,0,1)] z-40 overflow-hidden flex"
    >
      {/* Vertical Navigation Rail */}
      <div id="sidebar-nav-rail" className="w-[80px] flex flex-col items-center py-10 gap-6 bg-white/[0.02] border-r border-white/5 shrink-0">
        <div className="flex flex-col gap-4">
          {globalTabs.map((tab) => (
            <NavButton
              key={tab.id}
              id={tab.id}
              icon={tab.icon}
              label={tab.label}
              active={effectiveTab === tab.id}
              color={tab.color}
              onClick={() => setActiveTab(tab.id)}
            />
          ))}
        </div>

        <div className="w-8 h-px bg-white/10 my-4" />

        <NavButton
          id="layers"
          icon={Type}
          label="Capa de Texto"
          active={!isGlobalTab}
          color="text-blue-500"
          onClick={() => {
            if (config.layers.length > 0) setActiveTab(config.layers[0].id);
          }}
        />
      </div>

      {/* Main Content Area */}
      <div id="panel-content-area" className="flex-1 p-10 overflow-y-auto custom-scrollbar-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={effectiveTab}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Header */}
            <div id="section-header" className="mb-10">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl bg-white/5 ${isGlobalTab ? globalTabs.find(t => t.id === effectiveTab)?.color : "text-blue-400"}`}>
                  {(() => {
                    if (isGlobalTab) {
                      const Icon = globalTabs.find(t => t.id === effectiveTab)?.icon || Settings;
                      return <Icon size={24} />;
                    }
                    return <Type size={24} />;
                  })()}
                </div>
                <div className="flex flex-col">
                  <h2 className="text-lg font-black uppercase tracking-[0.25em]">
                    {isGlobalTab ? globalTabs.find(t => t.id === effectiveTab)?.label : "Ajustes de Capa"}
                  </h2>
                  {!isGlobalTab && (
                    <span className="text-xs text-white/30 font-bold uppercase tracking-widest mt-1">{selectedLayer?.name}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Tab: Media (Background & Webcam) */}
            {effectiveTab === "media" && (
              <div id="tab-content-media" className="space-y-10">
                <div id="section-video-source" className="space-y-6">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Video de Fondo</label>
                  <div className="relative group">
                    <select
                      value={config.videoUrl}
                      onChange={(e) => handleGlobalChange("videoUrl", e.target.value)}
                      className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm focus:outline-none appearance-none cursor-pointer hover:bg-white/[0.06] transition-all font-bold text-white shadow-inner"
                    >
                      <option value="https://assets.mixkit.co/videos/preview/mixkit-abstract-neon-lights-in-motion-27371-large.mp4">Abstract Neon</option>
                      <option value="https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-with-neon-lights-27368-large.mp4">City Night</option>
                    </select>
                    <ChevronLeft size={18} className="absolute right-5 top-1/2 -translate-y-1/2 -rotate-90 text-white/20 pointer-events-none group-hover:text-white/40 transition-colors" />
                  </div>
                </div>

                <div id="section-webcam-config" className="space-y-6 pt-10 border-t border-white/5">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Cámara en Vivo</label>
                      <span className="text-[9px] text-white/20 font-bold">Activar sensor de video local</span>
                    </div>
                    <button
                      id="control-use-webcam"
                      onClick={() => handleGlobalChange("useWebcam", !config.useWebcam)}
                      className={`w-12 h-6 rounded-full transition-all relative ${config.useWebcam ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]" : "bg-white/10"}`}
                    >
                      <motion.div animate={{ x: config.useWebcam ? 26 : 2 }} className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Post-Processing */}
            {effectiveTab === "post" && (
              <div id="tab-content-post" className="space-y-12">
                <div id="section-color-correction" className="space-y-8">
                  <div className="flex items-center gap-3">
                    <Palette size={16} className="text-blue-400" />
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Master Grading</label>
                  </div>
                  <div className="grid grid-cols-1 gap-8 bg-white/[0.02] p-8 rounded-[2.5rem] border border-white/5 shadow-2xl">
                    <div className="grid grid-cols-2 gap-10">
                      <div id="control-video-brightness" className="space-y-4">
                        <div className="flex justify-between text-[9px] font-black tracking-widest text-white/20">
                          <span className="flex items-center gap-2 tracking-[0.2em]"><Sun size={12} /> BRILLO</span>
                          <span className="text-blue-400">{Math.round(config.videoBrightness * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="2" step="0.01" value={config.videoBrightness} onChange={(e) => handleGlobalChange("videoBrightness", parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full" />
                      </div>
                      <div id="control-video-contrast" className="space-y-4">
                        <div className="flex justify-between text-[9px] font-black tracking-widest text-white/20">
                          <span className="flex items-center gap-2 tracking-[0.2em]"><Contrast size={12} /> CONTRASTE</span>
                          <span className="text-blue-400">{Math.round(config.videoContrast * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="2" step="0.01" value={config.videoContrast} onChange={(e) => handleGlobalChange("videoContrast", parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>

                <div id="section-post-effects" className="space-y-8 pt-10 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <Sparkles size={16} className="text-orange-400" />
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Óptica & Sensor</label>
                  </div>
                  <div className="grid grid-cols-2 gap-10">
                    <div id="control-vignette-intensity" className="space-y-4">
                      <div className="flex justify-between text-[9px] font-black tracking-widest text-white/20"><span>VIÑETA</span><span className="text-orange-400">{config.vignetteIntensity}</span></div>
                      <input type="range" min="0" max="100" value={config.vignetteIntensity} onChange={(e) => handleGlobalChange("vignetteIntensity", parseInt(e.target.value))} className="w-full accent-orange-500 h-1.5 bg-white/5 rounded-full" />
                    </div>
                    <div id="control-video-blur" className="space-y-4">
                      <div className="flex justify-between text-[9px] font-black tracking-widest text-white/20"><span>LENS BLUR</span><span className="text-orange-400">{config.videoBlur}px</span></div>
                      <input type="range" min="0" max="20" value={config.videoBlur} onChange={(e) => handleGlobalChange("videoBlur", parseInt(e.target.value))} className="w-full accent-orange-500 h-1.5 bg-white/5 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Curves (Curvature) */}
            {effectiveTab === "curves" && (
              <div id="tab-content-curves" className="space-y-12">
                <div id="section-gamma-correction" className="space-y-8">
                  <div className="flex items-center gap-3">
                    <Activity size={16} className="text-blue-400" />
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Gradación por Curva (Gamma)</label>
                  </div>
                  <p className="text-[10px] text-white/20 uppercase font-black tracking-[0.2em] leading-relaxed max-w-[80%]">Ajuste orgánico de la respuesta tonal para simular emulsión cinematográfica.</p>
                  
                  <div className="space-y-10 bg-white/[0.02] p-8 rounded-[3rem] border border-white/5 shadow-inner">
                    <div id="control-gamma-master" className="space-y-4">
                      <div className="flex justify-between text-[9px] font-black tracking-widest text-white/20 uppercase"><span>Curva Maestra</span><span className="text-blue-400">{config.videoGamma.toFixed(2)}</span></div>
                      <input type="range" min="0.2" max="3" step="0.01" value={config.videoGamma} onChange={(e) => handleGlobalChange("videoGamma", parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full" />
                    </div>

                    <div className="grid grid-cols-1 gap-8 pt-8 border-t border-white/5">
                      <div id="control-gamma-red" className="space-y-4">
                        <div className="flex justify-between text-[9px] font-black tracking-widest text-red-500/40 uppercase"><span>Curva Rojo (S)</span><span className="text-red-400">{config.videoGammaR.toFixed(2)}</span></div>
                        <input type="range" min="0.5" max="2" step="0.01" value={config.videoGammaR} onChange={(e) => handleGlobalChange("videoGammaR", parseFloat(e.target.value))} className="w-full accent-red-500 h-1.5 bg-white/5 rounded-full" />
                      </div>
                      <div id="control-gamma-green" className="space-y-4">
                        <div className="flex justify-between text-[9px] font-black tracking-widest text-green-500/40 uppercase"><span>Curva Verde (R)</span><span className="text-green-400">{config.videoGammaG.toFixed(2)}</span></div>
                        <input type="range" min="0.5" max="2" step="0.01" value={config.videoGammaG} onChange={(e) => handleGlobalChange("videoGammaG", parseFloat(e.target.value))} className="w-full accent-green-500 h-1.5 bg-white/5 rounded-full" />
                      </div>
                      <div id="control-gamma-blue" className="space-y-4">
                        <div className="flex justify-between text-[9px] font-black tracking-widest text-blue-500/40 uppercase"><span>Curva Azul (G)</span><span className="text-blue-400">{config.videoGammaB.toFixed(2)}</span></div>
                        <input type="range" min="0.5" max="2" step="0.01" value={config.videoGammaB} onChange={(e) => handleGlobalChange("videoGammaB", parseFloat(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab: Immersive (New!) */}
            {effectiveTab === "immersive" && (
              <div id="tab-content-immersive" className="space-y-12">
                <div id="section-immersive-treatment" className="space-y-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Film size={16} className="text-purple-400" />
                      <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Tratamiento Inmersivo</label>
                    </div>
                    <button
                      id="control-immersive-overlay-toggle"
                      onClick={() => handleGlobalChange("showImmersiveOverlay", !config.showImmersiveOverlay)}
                      className={`w-12 h-6 rounded-full transition-all relative ${config.showImmersiveOverlay ? "bg-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.4)]" : "bg-white/10"}`}
                    >
                      <motion.div animate={{ x: config.showImmersiveOverlay ? 26 : 2 }} className="absolute top-1 left-0 w-4 h-4 bg-white rounded-full shadow-lg" />
                    </button>
                  </div>

                  <AnimatePresence>
                    {config.showImmersiveOverlay && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-10 overflow-hidden"
                      >
                        <div id="control-immersive-grain" className="space-y-4">
                          <div className="flex justify-between text-[9px] font-black tracking-widest text-white/20 uppercase">
                            <span>Grano Fílmico</span>
                            <span className="text-purple-400">{Math.round(config.immersiveGrain * 100)}%</span>
                          </div>
                          <input type="range" min="0" max="0.5" step="0.01" value={config.immersiveGrain} onChange={(e) => handleGlobalChange("immersiveGrain", parseFloat(e.target.value))} className="w-full accent-purple-500 h-1.5 bg-white/5 rounded-full" />
                        </div>

                        <div id="control-immersive-scanlines" className="space-y-4">
                          <div className="flex justify-between text-[9px] font-black tracking-widest text-white/20 uppercase">
                            <span>Scanlines (CRT)</span>
                            <span className="text-purple-400">{Math.round(config.immersiveScanlines * 100)}%</span>
                          </div>
                          <input type="range" min="0" max="0.5" step="0.01" value={config.immersiveScanlines} onChange={(e) => handleGlobalChange("immersiveScanlines", parseFloat(e.target.value))} className="w-full accent-purple-500 h-1.5 bg-white/5 rounded-full" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Tab: Selected Layer Settings */}
            {!isGlobalTab && selectedLayer && (
              <div id="layer-properties-form" className="space-y-10">
                <div id="control-layer-text" className="space-y-6">
                  <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Contenido del Texto</label>
                  <textarea
                    value={selectedLayer.text}
                    onChange={(e) => handleLayerChange(selectedLayer.id, "text", e.target.value)}
                    className="w-full bg-white/[0.03] border border-white/10 rounded-3xl px-6 py-6 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all min-h-[120px] resize-none font-medium text-white shadow-inner"
                    placeholder="Escribe el mensaje..."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-10">
                  <div id="control-layer-style" className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Tipografía</label>
                    <select
                      value={selectedLayer.editorialStyle}
                      onChange={(e) => handleLayerChange(selectedLayer.id, "editorialStyle", e.target.value)}
                      className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-5 text-sm focus:outline-none appearance-none cursor-pointer hover:bg-white/[0.06] transition-all font-bold text-white"
                    >
                      <option value="default">Default</option>
                      <option value="minimalist">Minimalista</option>
                      <option value="brutalist">Brutalista</option>
                      <option value="magazine">Revista</option>
                      <option value="cyberpunk">Cyberpunk</option>
                    </select>
                  </div>
                  <div id="control-layer-font-size" className="space-y-4">
                    <div className="flex justify-between">
                      <label className="text-[10px] uppercase tracking-[0.3em] text-white/40 font-black">Escala</label>
                      <span className="text-xs font-mono text-blue-400">{selectedLayer.fontSize}px</span>
                    </div>
                    <input type="range" min="20" max="300" value={selectedLayer.fontSize} onChange={(e) => handleLayerChange(selectedLayer.id, "fontSize", parseInt(e.target.value))} className="w-full accent-blue-500 h-1.5 bg-white/5 rounded-full" />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

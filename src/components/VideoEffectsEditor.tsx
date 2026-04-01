/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sliders, ChevronRight, ChevronLeft, Sun, Contrast, Droplets, Palette, Film } from "lucide-react";

interface VideoEffectsEditorProps {
  config: any;
  onConfigChange: (key: string, value: any) => void;
}

export default function VideoEffectsEditor({ config, onConfigChange }: VideoEffectsEditorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute left-6 top-1/2 -translate-y-1/2 z-40 flex items-center gap-2">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            className="w-64 bg-black/40 backdrop-blur-3xl border border-white/10 rounded-3xl p-5 shadow-2xl space-y-6"
          >
            <div className="flex items-center gap-3 border-b border-white/5 pb-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Sliders size={16} className="text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-black text-[10px] uppercase tracking-widest">Video Master</h3>
                <p className="text-white/30 text-[8px] uppercase tracking-tighter">Color Curves & Overlays</p>
              </div>
            </div>

            <div className="space-y-5">
              {/* Brightness */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white/40">
                    <Sun size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Brillo</span>
                  </div>
                  <span className="text-[9px] font-mono text-blue-400">{Math.round(config.videoBrightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={config.videoBrightness}
                  onChange={(e) => onConfigChange("videoBrightness", parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Contrast */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white/40">
                    <Contrast size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Contraste</span>
                  </div>
                  <span className="text-[9px] font-mono text-blue-400">{Math.round(config.videoContrast * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={config.videoContrast}
                  onChange={(e) => onConfigChange("videoContrast", parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Saturation */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white/40">
                    <Droplets size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Saturación</span>
                  </div>
                  <span className="text-[9px] font-mono text-blue-400">{Math.round(config.videoSaturation * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.01"
                  value={config.videoSaturation}
                  onChange={(e) => onConfigChange("videoSaturation", parseFloat(e.target.value))}
                  className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Hue */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-white/40">
                    <Palette size={12} />
                    <span className="text-[9px] font-bold uppercase tracking-wider">Tono</span>
                  </div>
                  <span className="text-[9px] font-mono text-blue-400">{config.videoHue}°</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={config.videoHue}
                  onChange={(e) => onConfigChange("videoHue", parseInt(e.target.value))}
                  className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Immersive Overlay Toggle */}
              <div className="pt-4 border-t border-white/5">
                <button
                  onClick={() => onConfigChange("showImmersiveOverlay", !config.showImmersiveOverlay)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    config.showImmersiveOverlay 
                      ? "bg-blue-500/20 border border-blue-500/30 text-blue-400" 
                      : "bg-white/5 border border-white/10 text-white/40 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Film size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Tratamiento Inmersivo</span>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${config.showImmersiveOverlay ? "bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]" : "bg-white/10"}`} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.1, backgroundColor: "rgba(255,255,255,0.1)" }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center text-white/60 hover:text-white transition-all shadow-xl"
      >
        {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
      </motion.button>
    </div>
  );
}

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { Play, Pause, SkipBack, SkipForward, Clock, Layers, Trash2, Plus, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { motion } from "motion/react";

interface TimelineProps {
  config: any;
  onChange: (newConfig: any) => void;
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
}

export default function Timeline({ config, onChange, activeLayerId, onSelectLayer }: TimelineProps) {
  const addLayer = () => {
    const newId = `layer-${Date.now()}`;
    const newLayer = {
      id: newId,
      name: `Capa ${config.layers.length + 1}`,
      type: "text",
      text: "NUEVA CAPA",
      fontSize: 80,
      fontFamily: "Space Grotesk",
      color: "#ffffff",
      colorSecondary: "#cccccc",
      fillOpacity: 0.8,
      gradientConfig: {
        type: 'linear',
        angle: 180,
        stops: [
          { color: "#ffffff", position: 0, opacity: 1 },
          { color: "#cccccc", position: 100, opacity: 1 }
        ]
      },
      glowIntensity: 5,
      sparkleSpeed: 2,
      neonEmboss: true,
      diegeticTexture: true,
      glitch: false,
      chromaticAberration: true,
      bloom: true,
      lightWrap: true,
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
    };
    onChange({ ...config, layers: [...config.layers, newLayer] });
    onSelectLayer(newId);
  };

  const removeLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (config.layers.length <= 1) return;
    const newLayers = config.layers.filter((l: any) => l.id !== id);
    onChange({ ...config, layers: newLayers });
    if (activeLayerId === id) {
      onSelectLayer(newLayers[0].id);
    }
  };

  const toggleLayerVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLayers = config.layers.map((l: any) => 
      l.id === id ? { ...l, visible: !l.visible } : l
    );
    onChange({ ...config, layers: newLayers });
  };

  const toggleLayerLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const newLayers = config.layers.map((l: any) => 
      l.id === id ? { ...l, locked: !l.locked } : l
    );
    onChange({ ...config, layers: newLayers });
  };

  return (
    <div className="w-full px-8 py-4 bg-neutral-950/40 backdrop-blur-3xl border-y border-white/5 flex flex-col gap-4 flex-shrink-0 z-20">
      {/* Controls & Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1.5 border border-white/5 shadow-inner">
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-white/40 hover:text-white transition-colors">
              <SkipBack size={16} />
            </motion.button>
            <motion.button 
              whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.15)" }} 
              whileTap={{ scale: 0.95 }} 
              className="p-3.5 bg-white/10 rounded-xl text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10"
            >
              <Play size={20} fill="currentColor" />
            </motion.button>
            <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="p-2 text-white/40 hover:text-white transition-colors">
              <SkipForward size={16} />
            </motion.button>
          </div>
          
          <div className="flex items-center gap-4 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <Clock size={14} className="text-blue-400" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-mono font-black tracking-[0.2em] text-white/90">00:04:12</span>
              <span className="text-[10px] font-mono text-white/20">/</span>
              <span className="text-[10px] font-mono text-white/40">00:15:00</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
            <Layers size={12} className="text-white/40" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{config.layers.length} Capas</span>
          </div>
          <motion.button
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.98 }}
            onClick={addLayer}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(37,99,235,0.25)]"
          >
            <Plus size={14} />
            Nueva Capa
          </motion.button>
        </div>
      </div>

      {/* Timeline Bar with Layer Tracks */}
      <div className="relative flex flex-col gap-1.5 bg-black/40 rounded-2xl border border-white/5 overflow-hidden group p-3 shadow-inner">
        {/* Grid Lines */}
        <div className="absolute inset-0 flex justify-between px-6 pointer-events-none opacity-20">
          {Array.from({ length: 24 }).map((_, i) => (
            <div key={i} className={`w-px h-full ${i % 6 === 0 ? "bg-white/40" : "bg-white/10"}`} />
          ))}
        </div>

        {/* Layer Tracks Scrollable Area */}
        <div className="relative z-0 space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
          {config.layers.map((layer: any, i: number) => (
            <motion.div 
              key={layer.id}
              onClick={() => onSelectLayer(layer.id)}
              className={`h-8 rounded-xl relative overflow-hidden transition-all duration-500 cursor-pointer group/track flex items-center px-4 border ${
                activeLayerId === layer.id 
                  ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]" 
                  : "bg-white/[0.02] border-transparent hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3 z-10 w-64 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <button 
                    onClick={(e) => toggleLayerVisibility(layer.id, e)}
                    className={`p-1 transition-colors ${layer.visible ? "text-blue-400" : "text-white/10 hover:text-white/30"}`}
                  >
                    {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button 
                    onClick={(e) => toggleLayerLock(layer.id, e)}
                    className={`p-1 transition-colors ${layer.locked ? "text-orange-400" : "text-white/10 hover:text-white/30"}`}
                  >
                    {layer.locked ? <Lock size={12} /> : <Unlock size={12} />}
                  </button>
                </div>
                <span className={`text-[10px] font-black uppercase tracking-[0.15em] truncate flex-1 ${
                  activeLayerId === layer.id ? "text-white" : "text-white/40 group-hover/track:text-white/60"
                }`}>
                  {layer.name || layer.id}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1, color: "#ef4444" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => removeLayer(layer.id, e)}
                  className="opacity-0 group-hover/track:opacity-100 p-1.5 text-white/20 transition-all hover:bg-red-500/10 rounded-lg"
                >
                  <Trash2 size={12} />
                </motion.button>
              </div>

              <div className="flex-1 h-full relative ml-4">
                <motion.div 
                  initial={{ width: "0%" }}
                  animate={{ width: layer.visible ? `${85 - (i % 5) * 8}%` : "0%" }}
                  transition={{ type: "spring", stiffness: 100, damping: 20 }}
                  className={`absolute inset-y-1.5 rounded-full ${
                    activeLayerId === layer.id 
                      ? "bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]" 
                      : "bg-white/10"
                  }`}
                />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Playhead */}
        <motion.div 
          animate={{ left: "45%" }}
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10 pointer-events-none"
        >
          <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-xl" />
        </motion.div>
      </div>
    </div>
  );
}

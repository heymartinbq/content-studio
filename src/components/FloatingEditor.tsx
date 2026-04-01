/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Type, X, GripVertical, Palette, Sliders, Layout, Plus, Trash2 } from "lucide-react";

interface FloatingEditorProps {
  layer: any;
  onChange: (key: string, value: any) => void;
  onClose: () => void;
  dragConstraints?: React.RefObject<HTMLDivElement | null>;
}

export default function FloatingEditor({ layer, onChange, onClose, dragConstraints }: FloatingEditorProps) {
  if (!layer) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      drag
      dragMomentum={false}
      dragConstraints={dragConstraints}
      className="absolute top-10 left-10 z-[100] w-80 bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden"
    >
      <div className="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/5 cursor-grab active:cursor-grabbing">
        <div className="flex items-center gap-3">
          <GripVertical size={14} className="text-white/20" />
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Type size={14} className="text-blue-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{layer.name}</span>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/40 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>
      
      <div className="p-5 space-y-6">
        {/* Text Area */}
        <div className="space-y-2">
          <textarea
            value={layer.text}
            onChange={(e) => onChange("text", e.target.value)}
            className="w-full bg-black/40 border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all min-h-[80px] resize-none font-medium"
            placeholder="Escribe aquí..."
            autoFocus
          />
        </div>

        {/* Quick Controls */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-white/40">
                <Sliders size={12} />
                <span className="text-[9px] font-black uppercase tracking-widest">Tamaño</span>
              </div>
              <span className="text-[9px] font-mono text-blue-400">{layer.fontSize}px</span>
            </div>
            <input
              type="range"
              min="20"
              max="300"
              value={layer.fontSize}
              onChange={(e) => onChange("fontSize", parseInt(e.target.value))}
              className="w-full h-1 bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-white/40">
              <Palette size={12} />
              <span className="text-[9px] font-black uppercase tracking-widest">Color</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={layer.color}
                onChange={(e) => onChange("color", e.target.value)}
                className="w-8 h-8 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
              />
              <input
                type="color"
                value={layer.colorSecondary || layer.color}
                onChange={(e) => onChange("colorSecondary", e.target.value)}
                className="w-8 h-8 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>

        {/* Gradient Editor */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Gradiente Avanzado</span>
            <div className="flex gap-2">
              <button 
                onClick={() => onChange("gradientConfig", { ...(layer.gradientConfig || { angle: 180, stops: [] }), type: 'linear' })}
                className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${layer.gradientConfig?.type === 'linear' ? "bg-blue-500 text-white" : "bg-white/5 text-white/40"}`}
              >
                Linear
              </button>
              <button 
                onClick={() => onChange("gradientConfig", { ...(layer.gradientConfig || { angle: 180, stops: [] }), type: 'radial' })}
                className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${layer.gradientConfig?.type === 'radial' ? "bg-blue-500 text-white" : "bg-white/5 text-white/40"}`}
              >
                Radial
              </button>
            </div>
          </div>

          {layer.gradientConfig?.type === 'linear' && (
            <div className="space-y-2">
              <div className="flex justify-between text-[8px] text-white/20 font-black tracking-widest">
                <span>ÁNGULO</span>
                <span>{layer.gradientConfig.angle || 180}°</span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={layer.gradientConfig.angle || 180}
                onChange={(e) => onChange("gradientConfig", { ...layer.gradientConfig, angle: parseInt(e.target.value) })}
                className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
              />
            </div>
          )}

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Paradas de Color</span>
              <button 
                onClick={() => {
                  const newStops = [...(layer.gradientConfig?.stops || [])];
                  newStops.push({ color: "#ffffff", position: 100, opacity: 1 });
                  onChange("gradientConfig", { ...(layer.gradientConfig || { type: 'linear', angle: 180 }), stops: newStops });
                }}
                className="p-1 hover:bg-white/5 rounded-md text-white/40 hover:text-white transition-all"
              >
                <Plus size={12} />
              </button>
            </div>
            
            <div className="space-y-3 max-h-[120px] overflow-y-auto pr-1 custom-scrollbar">
              {layer.gradientConfig?.stops?.map((stop: any, index: number) => (
                <div key={index} className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => {
                      const newStops = [...layer.gradientConfig.stops];
                      newStops[index] = { ...stop, color: e.target.value };
                      onChange("gradientConfig", { ...layer.gradientConfig, stops: newStops });
                    }}
                    className="w-6 h-6 bg-transparent border-none cursor-pointer rounded-md overflow-hidden"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[7px] text-white/20 font-black">
                      <span>POS: {stop.position}%</span>
                      <span>OP: {Math.round(stop.opacity * 100)}%</span>
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stop.position}
                        onChange={(e) => {
                          const newStops = [...layer.gradientConfig.stops];
                          newStops[index] = { ...stop, position: parseInt(e.target.value) };
                          onChange("gradientConfig", { ...layer.gradientConfig, stops: newStops });
                        }}
                        className="flex-1 h-0.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={stop.opacity * 100}
                        onChange={(e) => {
                          const newStops = [...layer.gradientConfig.stops];
                          newStops[index] = { ...stop, opacity: parseInt(e.target.value) / 100 };
                          onChange("gradientConfig", { ...layer.gradientConfig, stops: newStops });
                        }}
                        className="flex-1 h-0.5 bg-white/5 rounded-full appearance-none accent-purple-500 cursor-pointer"
                      />
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      const newStops = layer.gradientConfig.stops.filter((_: any, i: number) => i !== index);
                      onChange("gradientConfig", { ...layer.gradientConfig, stops: newStops });
                    }}
                    className="p-1 hover:bg-red-500/10 rounded-md text-white/20 hover:text-red-400 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fill Opacity Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-white/40">
              <span className="text-[9px] font-black uppercase tracking-widest">Opacidad Relleno</span>
            </div>
            <span className="text-[9px] font-mono text-cyan-400">{Math.round((layer.fillOpacity ?? 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={(layer.fillOpacity ?? 1) * 100}
            onChange={(e) => onChange("fillOpacity", parseInt(e.target.value) / 100)}
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-cyan-500 cursor-pointer"
          />
        </div>

        {/* Opacity Control */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-white/40">
              <div className="w-3 h-3 rounded-full border border-white/20 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/40" />
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest">Opacidad</span>
            </div>
            <span className="text-[9px] font-mono text-blue-400">{Math.round((layer.opacity ?? 1) * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={(layer.opacity ?? 1) * 100}
            onChange={(e) => onChange("opacity", parseInt(e.target.value) / 100)}
            className="w-full h-1 bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer"
          />
        </div>

        {/* Style Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/40">
            <Layout size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Estilo Editorial</span>
          </div>
          <select
            value={layer.editorialStyle}
            onChange={(e) => onChange("editorialStyle", e.target.value)}
            className="w-full h-10 bg-black/40 border border-white/5 rounded-xl px-3 text-[10px] text-white/80 focus:outline-none appearance-none cursor-pointer hover:bg-white/5 transition-all font-bold tracking-wide"
          >
            <option value="default">Por Defecto</option>
            <option value="minimalist">Minimalista</option>
            <option value="brutalist">Brutalista</option>
            <option value="magazine">Revista</option>
            <option value="cyberpunk">Cyberpunk</option>
            <option value="swiss">Suizo</option>
            <option value="retro">Retro</option>
            <option value="classic">Clásico</option>
          </select>
        </div>

        {/* Diegetic Toggles */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
          {[
            { id: "diegeticTexture", label: "Textura" },
            { id: "bloom", label: "Bloom" },
            { id: "lightWrap", label: "Wrap" },
          ].map((effect) => (
            <button
              key={effect.id}
              onClick={() => onChange(effect.id, !layer[effect.id])}
              className={`flex flex-col items-center gap-2 p-2 rounded-xl border transition-all ${
                layer[effect.id] 
                  ? "bg-blue-500/10 border-blue-500/30 text-blue-300" 
                  : "bg-white/[0.02] border-white/5 text-white/20 hover:bg-white/5"
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${layer[effect.id] ? "bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,1)]" : "bg-white/10"}`} />
              <span className="text-[7px] uppercase font-black tracking-widest">{effect.label}</span>
            </button>
          ))}
        </div>

        {/* Selection Border Quick Controls */}
        <div className="space-y-3 pt-3 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-[8px] font-black uppercase tracking-widest text-white/30">Borde Selección</span>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={layer.selectionBorderColor || "#3b82f6"}
                onChange={(e) => onChange("selectionBorderColor", e.target.value)}
                className="w-4 h-4 bg-transparent border-none cursor-pointer rounded-full overflow-hidden"
              />
              <input
                type="range"
                min="1"
                max="8"
                value={layer.selectionBorderWidth || 2}
                onChange={(e) => onChange("selectionBorderWidth", parseInt(e.target.value))}
                className="w-16 h-1 bg-white/10 rounded-full appearance-none accent-blue-500 cursor-pointer"
              />
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-white/5">
            <div className="flex justify-between text-[9px] text-white/40 font-black tracking-widest uppercase">
              <span>Intensidad Textura</span>
              <span>{Math.round((layer.textureIntensity ?? 0.15) * 100)}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={layer.textureIntensity ?? 0.15}
              onChange={(e) => onChange("textureIntensity", parseFloat(e.target.value))}
              className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
            />
          </div>
        </div>

        <div className="pt-2 flex justify-between items-center border-t border-white/5">
          <span className="text-[8px] text-white/20 font-mono uppercase tracking-[0.2em]">Canvas Editor Mode</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-pulse" />
            <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-pulse delay-75" />
            <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-pulse delay-150" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

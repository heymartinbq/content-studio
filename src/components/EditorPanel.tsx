/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Reorder, motion, AnimatePresence } from "motion/react";
import { Settings, Type, Video, Layers, Sparkles, Monitor, Smartphone, Square, Camera, ChevronRight, ChevronLeft, Plus, Trash2, Eye, EyeOff, MoreVertical, Lock, Unlock, Copy, GripVertical as GripIcon } from "lucide-react";

interface EditorPanelProps {
  config: any;
  onChange: (newConfig: any) => void;
  activeLayerId: string;
  onSelectLayer: (id: string) => void;
}

type TabType = string;

export default function EditorPanel({ config, onChange, activeLayerId, onSelectLayer }: EditorPanelProps) {
  const activeTab = activeLayerId;
  const setActiveTab = onSelectLayer;

  const handleChange = (key: string, value: any) => {
    onChange({ ...config, [key]: value });
  };

  const handleLayerChange = (layerId: string, key: string, value: any) => {
    const newLayers = config.layers.map((l: any) => 
      l.id === layerId ? { ...l, [key]: value } : l
    );
    onChange({ ...config, layers: newLayers });
  };

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
      glowIntensity: 5,
      sparkleSpeed: 2,
      neonEmboss: true,
      diegeticTexture: true,
      glitch: false,
      editorialStyle: "default",
      textAlign: "center",
      mixBlendMode: "normal",
      locked: false,
      visible: true,
      x: 0,
      y: 0,
    };
    onChange({ ...config, layers: [...config.layers, newLayer] });
    setActiveTab(newId);
  };

  const removeLayer = (id: string) => {
    if (config.layers.length <= 1) return;
    const newLayers = config.layers.filter((l: any) => l.id !== id);
    onChange({ ...config, layers: newLayers });
    if (activeTab === id) {
      setActiveTab(newLayers[0].id);
    }
  };

  const toggleLayerVisibility = (id: string) => {
    const newLayers = config.layers.map((l: any) => 
      l.id === id ? { ...l, visible: !l.visible } : l
    );
    onChange({ ...config, layers: newLayers });
  };

  const toggleLayerLock = (id: string) => {
    const newLayers = config.layers.map((l: any) => 
      l.id === id ? { ...l, locked: !l.locked } : l
    );
    onChange({ ...config, layers: newLayers });
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
    onChange({ ...config, layers: [...config.layers, newLayer] });
    setActiveTab(newId);
  };

  const globalTabs = [
    { id: "media", icon: Video, label: "Fondo & Webcam", color: "text-green-400" },
    { id: "post", icon: Layers, label: "Post-Procesado", color: "text-orange-400" },
  ];

  const selectedLayer = config.layers.find((l: any) => l.id === activeTab);
  const isGlobalTab = globalTabs.some(t => t.id === activeTab);

  return (
    <motion.div 
      className="w-full max-w-6xl bg-neutral-950/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-3 text-white shadow-2xl mx-auto overflow-hidden flex flex-col gap-4"
    >
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between px-6 py-2 bg-white/[0.02] rounded-[2rem] border border-white/5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-black/40 rounded-2xl border border-white/5">
            {globalTabs.map((tab) => (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2.5 px-5 py-2 rounded-xl transition-all duration-300 ${
                  activeTab === tab.id 
                    ? "bg-white/10 text-white shadow-lg ring-1 ring-white/10" 
                    : "text-white/30 hover:text-white/50 hover:bg-white/5"
                }`}
              >
                <tab.icon size={14} className={activeTab === tab.id ? tab.color : "text-current"} />
                <span className="text-[10px] font-black uppercase tracking-[0.15em]">{tab.label}</span>
              </motion.button>
            ))}
          </div>
          
          <div className="w-px h-6 bg-white/10 mx-2" />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              if (config.layers.length > 0) {
                setActiveTab(activeLayerId || config.layers[0].id);
              }
            }}
            className={`flex items-center gap-2.5 px-5 py-2 rounded-xl transition-all duration-300 ${
              !isGlobalTab 
                ? "bg-blue-600 text-white shadow-[0_0_20px_rgba(37,99,235,0.3)]" 
                : "text-white/30 hover:text-white/50 hover:bg-white/5"
            }`}
          >
            <Type size={14} className={!isGlobalTab ? "text-white" : "text-current"} />
            <span className="text-[10px] font-black uppercase tracking-[0.15em]">Propiedades de Capa</span>
          </motion.button>
        </div>

        {!isGlobalTab && selectedLayer && (
          <div className="flex items-center gap-3 px-4 py-1.5 bg-blue-500/10 rounded-full border border-blue-500/20">
            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400">Editando: {selectedLayer.name}</span>
          </div>
        )}
      </div>

      {/* Properties Editor Area */}
      <div className="flex-1 p-8 bg-white/[0.01] rounded-[2rem] border border-white/5 overflow-y-auto custom-scrollbar min-h-[400px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -10, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="h-full"
          >
            {/* Properties content... */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-white/5 ${isGlobalTab ? globalTabs.find(t => t.id === activeTab)?.color : "text-blue-400"}`}>
                    {(() => {
                      if (isGlobalTab) {
                        const Icon = globalTabs.find(t => t.id === activeTab)?.icon || Settings;
                        return <Icon size={18} />;
                      }
                      return <Type size={18} />;
                    })()}
                  </div>
                  <div className="flex flex-col">
                    <h2 className="text-sm font-black uppercase tracking-[0.2em]">
                      {isGlobalTab ? `Ajustes de ${globalTabs.find(t => t.id === activeTab)?.label}` : `Ajustes de Capa`}
                    </h2>
                    {!isGlobalTab && (
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{selectedLayer?.name}</span>
                    )}
                  </div>
                </div>
                <button className="p-2 text-white/20 hover:text-white transition-colors">
                  <MoreVertical size={18} />
                </button>
              </div>

              {selectedLayer && (
                <div className="space-y-8">
                  {/* Content Section */}
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Contenido del Texto</label>
                      <textarea
                        value={selectedLayer.text}
                        onChange={(e) => handleLayerChange(selectedLayer.id, "text", e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/5 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500/40 transition-all min-h-[80px] resize-none font-medium"
                        placeholder="Escribe el mensaje..."
                      />
                    </div>
                    
                    <div className="grid grid-cols-3 gap-6">
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Estilo Editorial</label>
                        <div className="relative group">
                          <select
                            value={selectedLayer.editorialStyle}
                            onChange={(e) => handleLayerChange(selectedLayer.id, "editorialStyle", e.target.value)}
                            className="w-full h-12 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-xs focus:outline-none appearance-none cursor-pointer hover:bg-white/[0.06] transition-all font-bold tracking-wide"
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
                          <ChevronLeft size={14} className="absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-white/20 pointer-events-none group-hover:text-white/40 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Alineación</label>
                        <div className="relative group">
                          <select
                            value={selectedLayer.textAlign}
                            onChange={(e) => handleLayerChange(selectedLayer.id, "textAlign", e.target.value)}
                            className="w-full h-12 bg-white/[0.03] border border-white/5 rounded-xl px-4 text-xs focus:outline-none appearance-none cursor-pointer hover:bg-white/[0.06] transition-all font-bold tracking-wide"
                          >
                            <option value="left">Izquierda</option>
                            <option value="center">Centro</option>
                            <option value="right">Derecha</option>
                          </select>
                          <ChevronLeft size={14} className="absolute right-4 top-1/2 -translate-y-1/2 -rotate-90 text-white/20 pointer-events-none group-hover:text-white/40 transition-colors" />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Tamaño</label>
                          <span className="text-[10px] font-mono text-blue-400">{selectedLayer.fontSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="20"
                          max="300"
                          value={selectedLayer.fontSize}
                          onChange={(e) => handleLayerChange(selectedLayer.id, "fontSize", parseInt(e.target.value))}
                          className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Position Controls */}
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Posicionamiento</label>
                        <button 
                          onClick={() => {
                            handleLayerChange(selectedLayer.id, "x", 0);
                            handleLayerChange(selectedLayer.id, "y", 0);
                          }}
                          className="text-[9px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                        >
                          Resetear Posición
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Eje X</label>
                            <span className="text-[10px] font-mono text-blue-400">{Math.round(selectedLayer.x || 0)}px</span>
                          </div>
                          <input
                            type="range"
                            min="-1000"
                            max="1000"
                            value={selectedLayer.x || 0}
                            onChange={(e) => handleLayerChange(selectedLayer.id, "x", parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Eje Y</label>
                            <span className="text-[10px] font-mono text-blue-400">{Math.round(selectedLayer.y || 0)}px</span>
                          </div>
                          <input
                            type="range"
                            min="-1000"
                            max="1000"
                            value={selectedLayer.y || 0}
                            onChange={(e) => handleLayerChange(selectedLayer.id, "y", parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Effects Section */}
                  <div className="space-y-6 pt-6 border-t border-white/5">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Color & Brillo</label>
                        <div className="flex items-center gap-6">
                          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                            <input
                              type="color"
                              value={selectedLayer.color}
                              onChange={(e) => handleLayerChange(selectedLayer.id, "color", e.target.value)}
                              className="w-14 h-14 bg-transparent border-none cursor-pointer rounded-full overflow-hidden shadow-lg shadow-black/20"
                            />
                          </motion.div>
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-[9px] text-white/20 font-black tracking-widest">
                              <span>GLOW INTENSITY</span>
                              <span>{selectedLayer.glowIntensity}</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="20"
                              value={selectedLayer.glowIntensity}
                              onChange={(e) => handleLayerChange(selectedLayer.id, "glowIntensity", parseInt(e.target.value))}
                              className="w-full h-1 bg-white/5 rounded-full appearance-none accent-purple-500 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] text-white/20 font-black tracking-widest">
                            <span>OPACIDAD</span>
                            <span>{Math.round((selectedLayer.opacity ?? 1) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={(selectedLayer.opacity ?? 1) * 100}
                            onChange={(e) => handleLayerChange(selectedLayer.id, "opacity", parseInt(e.target.value) / 100)}
                            className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                          />
                        </div>
                        <div className="space-y-4">
                          <label className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold">Gradiente Avanzado</label>
                          <div className="flex gap-4">
                            <button 
                              onClick={() => handleLayerChange(selectedLayer.id, "gradientConfig", { ...(selectedLayer.gradientConfig || { angle: 180, stops: [] }), type: 'linear' })}
                              className={`flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase transition-all border ${selectedLayer.gradientConfig?.type === 'linear' ? "bg-blue-500/10 border-blue-500/30 text-blue-300" : "bg-white/5 border-white/5 text-white/40"}`}
                            >
                              Linear
                            </button>
                            <button 
                              onClick={() => handleLayerChange(selectedLayer.id, "gradientConfig", { ...(selectedLayer.gradientConfig || { angle: 180, stops: [] }), type: 'radial' })}
                              className={`flex-1 py-3 rounded-2xl text-[10px] font-bold uppercase transition-all border ${selectedLayer.gradientConfig?.type === 'radial' ? "bg-blue-500/10 border-blue-500/30 text-blue-300" : "bg-white/5 border-white/5 text-white/40"}`}
                            >
                              Radial
                            </button>
                          </div>

                          {selectedLayer.gradientConfig?.type === 'linear' && (
                            <div className="space-y-3">
                              <div className="flex justify-between text-[9px] text-white/20 font-black tracking-widest">
                                <span>ÁNGULO DEL GRADIENTE</span>
                                <span>{selectedLayer.gradientConfig.angle || 180}°</span>
                              </div>
                              <input
                                type="range"
                                min="0"
                                max="360"
                                value={selectedLayer.gradientConfig.angle || 180}
                                onChange={(e) => handleLayerChange(selectedLayer.id, "gradientConfig", { ...selectedLayer.gradientConfig, angle: parseInt(e.target.value) })}
                                className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                              />
                            </div>
                          )}

                          <div className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Paradas de Color</span>
                              <button 
                                onClick={() => {
                                  const newStops = [...(selectedLayer.gradientConfig?.stops || [])];
                                  newStops.push({ color: "#ffffff", position: 100, opacity: 1 });
                                  handleLayerChange(selectedLayer.id, "gradientConfig", { ...(selectedLayer.gradientConfig || { type: 'linear', angle: 180 }), stops: newStops });
                                }}
                                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all border border-white/5"
                              >
                                <Plus size={14} />
                              </button>
                            </div>
                            
                            <div className="space-y-3 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
                              {selectedLayer.gradientConfig?.stops?.map((stop: any, index: number) => (
                                <div key={index} className="flex items-center gap-4 bg-white/[0.02] p-3 rounded-2xl border border-white/5 group">
                                  <input
                                    type="color"
                                    value={stop.color}
                                    onChange={(e) => {
                                      const newStops = [...selectedLayer.gradientConfig.stops];
                                      newStops[index] = { ...stop, color: e.target.value };
                                      handleLayerChange(selectedLayer.id, "gradientConfig", { ...selectedLayer.gradientConfig, stops: newStops });
                                    }}
                                    className="w-8 h-8 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                                  />
                                  <div className="flex-1 space-y-2">
                                    <div className="flex justify-between text-[8px] text-white/20 font-black tracking-widest">
                                      <span>POSICIÓN: {stop.position}%</span>
                                      <span>OPACIDAD: {Math.round(stop.opacity * 100)}%</span>
                                    </div>
                                    <div className="flex gap-4">
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={stop.position}
                                        onChange={(e) => {
                                          const newStops = [...selectedLayer.gradientConfig.stops];
                                          newStops[index] = { ...stop, position: parseInt(e.target.value) };
                                          handleLayerChange(selectedLayer.id, "gradientConfig", { ...selectedLayer.gradientConfig, stops: newStops });
                                        }}
                                        className="flex-1 h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                                      />
                                      <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={stop.opacity * 100}
                                        onChange={(e) => {
                                          const newStops = [...selectedLayer.gradientConfig.stops];
                                          newStops[index] = { ...stop, opacity: parseInt(e.target.value) / 100 };
                                          handleLayerChange(selectedLayer.id, "gradientConfig", { ...selectedLayer.gradientConfig, stops: newStops });
                                        }}
                                        className="flex-1 h-1 bg-white/5 rounded-full appearance-none accent-purple-500 cursor-pointer"
                                      />
                                    </div>
                                  </div>
                                  <button 
                                    onClick={() => {
                                      const newStops = selectedLayer.gradientConfig.stops.filter((_: any, i: number) => i !== index);
                                      handleLayerChange(selectedLayer.id, "gradientConfig", { ...selectedLayer.gradientConfig, stops: newStops });
                                    }}
                                    className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/10 rounded-xl text-white/20 hover:text-red-400 transition-all"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 pt-4 border-t border-white/5">
                          <div className="flex justify-between text-[9px] text-white/20 font-black tracking-widest">
                            <span>INTENSIDAD TEXTURA</span>
                            <span>{Math.round((selectedLayer.textureIntensity ?? 0.15) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={(selectedLayer.textureIntensity ?? 0.15) * 100}
                            onChange={(e) => handleLayerChange(selectedLayer.id, "textureIntensity", parseInt(e.target.value) / 100)}
                            className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                          />
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between text-[9px] text-white/20 font-black tracking-widest">
                            <span>OPACIDAD RELLENO</span>
                            <span>{Math.round((selectedLayer.fillOpacity ?? 1) * 100)}%</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={(selectedLayer.fillOpacity ?? 1) * 100}
                            onChange={(e) => handleLayerChange(selectedLayer.id, "fillOpacity", parseInt(e.target.value) / 100)}
                            className="w-full h-1.5 bg-white/5 rounded-full appearance-none accent-cyan-500 cursor-pointer"
                          />
                        </div>
                      </div>
                      <div className="space-y-4">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Modo de Mezcla</label>
                        <select
                          value={selectedLayer.mixBlendMode}
                          onChange={(e) => handleLayerChange(selectedLayer.id, "mixBlendMode", e.target.value)}
                          className="w-full h-12 bg-white/5 border border-white/5 rounded-2xl px-4 text-xs focus:outline-none appearance-none cursor-pointer hover:bg-white/10 transition-all font-medium tracking-wide"
                        >
                          <option value="normal">Normal</option>
                          <option value="screen">Trama (Screen)</option>
                          <option value="overlay">Superponer (Overlay)</option>
                          <option value="soft-light">Luz Suave</option>
                          <option value="hard-light">Luz Fuerte</option>
                          <option value="color-dodge">Esquivar Color</option>
                          <option value="multiply">Multiplicar</option>
                          <option value="difference">Diferencia</option>
                          <option value="exclusion">Exclusión</option>
                          <option value="luminosity">Luminosidad</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      {[
                        { id: "neonEmboss", label: "Relieve Neón" },
                        { id: "diegeticTexture", label: "Textura Orgánica" },
                        { id: "glitch", label: "Glitch Activo" },
                        { id: "chromaticAberration", label: "Aberración" },
                        { id: "bloom", label: "Bloom" },
                        { id: "lightWrap", label: "Light Wrap" },
                      ].map((effect) => (
                        <motion.button
                          key={effect.id}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleLayerChange(selectedLayer.id, effect.id, !selectedLayer[effect.id])}
                          className={`flex flex-col items-center justify-center gap-3 p-5 rounded-[2rem] border transition-all duration-700 ${
                            selectedLayer[effect.id] 
                              ? "bg-purple-500/10 border-purple-500/30 text-purple-200 shadow-[0_0_40px_rgba(168,85,247,0.15)]" 
                              : "bg-white/[0.02] border-white/5 text-white/30 hover:bg-white/5"
                          }`}
                        >
                          <div className={`w-2.5 h-2.5 rounded-full transition-all duration-700 ${selectedLayer[effect.id] ? "bg-purple-400 scale-125 shadow-[0_0_12px_rgba(168,85,247,1)]" : "bg-white/10"}`} />
                          <span className="text-[9px] uppercase font-black tracking-[0.25em]">{effect.label}</span>
                        </motion.button>
                      ))}
                    </div>

                    {/* Selection Border Controls */}
                    <div className="space-y-4 pt-6 border-t border-white/5">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Borde de Selección (Editor)</label>
                      <div className="grid grid-cols-2 gap-8">
                        <div className="flex items-center gap-4">
                          <input
                            type="color"
                            value={selectedLayer.selectionBorderColor || "#3b82f6"}
                            onChange={(e) => handleLayerChange(selectedLayer.id, "selectionBorderColor", e.target.value)}
                            className="w-10 h-10 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                          />
                          <div className="flex-1 space-y-2">
                            <div className="flex justify-between text-[9px] text-white/20 font-black tracking-widest">
                              <span>GROSOR</span>
                              <span>{selectedLayer.selectionBorderWidth || 2}px</span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              value={selectedLayer.selectionBorderWidth || 2}
                              onChange={(e) => handleLayerChange(selectedLayer.id, "selectionBorderWidth", parseInt(e.target.value))}
                              className="w-full h-1 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-center p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                          <span className="text-[8px] text-white/20 uppercase font-black tracking-widest text-center">Personaliza el indicador visual de la capa activa</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "media" && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Relación de Aspecto</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: "16/9", icon: Monitor, label: "16:9" },
                        { id: "9/16", icon: Smartphone, label: "9:16" },
                        { id: "1/1", icon: Square, label: "1:1" },
                      ].map((ratio) => (
                        <button
                          key={ratio.id}
                          onClick={() => handleChange("aspectRatio", ratio.id)}
                          className={`flex items-center justify-center gap-3 p-4 rounded-2xl border transition-all duration-500 ${
                            config.aspectRatio === ratio.id 
                              ? "bg-green-500/10 border-green-500/40 text-green-300 shadow-[0_0_20px_rgba(34,197,94,0.1)]" 
                              : "bg-white/5 border-white/5 text-white/40 hover:bg-white/10"
                          }`}
                        >
                          <ratio.icon size={16} />
                          <span className="text-xs font-bold">{ratio.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Video de Fondo</label>
                      <select
                        value={config.videoUrl}
                        onChange={(e) => handleChange("videoUrl", e.target.value)}
                        className="w-full h-11 bg-white/5 border border-white/5 rounded-xl px-3 text-xs focus:outline-none appearance-none cursor-pointer hover:bg-white/10 transition-colors"
                      >
                        <option value="https://assets.mixkit.co/videos/preview/mixkit-abstract-neon-lights-in-motion-27371-large.mp4">Abstract Neon</option>
                        <option value="https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-with-neon-lights-27368-large.mp4">City Night</option>
                        <option value="https://assets.mixkit.co/videos/preview/mixkit-digital-animation-of-neon-lines-27365-large.mp4">Digital Lines</option>
                      </select>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Webcam</label>
                        <button
                          onClick={() => handleChange("useWebcam", !config.useWebcam)}
                          className={`w-10 h-5 rounded-full transition-all duration-500 relative ${config.useWebcam ? "bg-red-500" : "bg-white/10"}`}
                        >
                          <motion.div 
                            animate={{ x: config.useWebcam ? 22 : 2 }}
                            className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm"
                          />
                        </button>
                      </div>
                      {config.useWebcam && (
                        <div className="space-y-4">
                          <div className="space-y-1">
                            <div className="flex justify-between text-[9px] text-white/40 uppercase tracking-widest">
                              <span>Opacidad</span>
                              <span>{config.webcamOpacity}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={config.webcamOpacity}
                              onChange={(e) => handleChange("webcamOpacity", parseInt(e.target.value))}
                              className="w-full accent-red-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "post" && (
                <div className="space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                          <span>Viñeta</span>
                          <span className="text-orange-400">{config.vignetteIntensity}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.vignetteIntensity}
                          onChange={(e) => handleChange("vignetteIntensity", parseInt(e.target.value))}
                          className="w-full accent-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                          <span>Desenfoque Video</span>
                          <span className="text-orange-400">{config.videoBlur}px</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="20"
                          value={config.videoBlur}
                          onChange={(e) => handleChange("videoBlur", parseInt(e.target.value))}
                          className="w-full accent-orange-500"
                        />
                      </div>
                    </div>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">Color de Viñeta</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="color"
                            value={config.vignetteColor}
                            onChange={(e) => handleChange("vignetteColor", e.target.value)}
                            className="w-12 h-12 bg-transparent border-none cursor-pointer rounded-full overflow-hidden"
                          />
                          <span className="text-xs font-mono text-white/40">{config.vignetteColor.toUpperCase()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                          <span>Radio Viñeta</span>
                          <span className="text-orange-400">{config.vignetteRadius}</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={config.vignetteRadius}
                          onChange={(e) => handleChange("vignetteRadius", parseInt(e.target.value))}
                          className="w-full accent-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase tracking-[0.2em] text-white/30 font-bold">
                          <span>Intensidad de Ruido</span>
                          <span className="text-orange-400">{Math.round(config.noiseIntensity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="0.5"
                          step="0.01"
                          value={config.noiseIntensity}
                          onChange={(e) => handleChange("noiseIntensity", parseFloat(e.target.value))}
                          className="w-full accent-orange-500"
                        />
                      </div>
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

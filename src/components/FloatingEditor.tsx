import React, { useRef, useEffect } from "react";
import { Type, X, GripVertical, Palette, Sliders, Layout, Plus, Trash2 } from "lucide-react";
import { useEditor } from "../core/EditorContext";

export default function FloatingEditor() {
  const { state, actions, engine } = useEditor();
  const { config, activeLayerId, showFloatingEditor } = state;
  const dragRef = useRef<HTMLDivElement>(null);
  const widgetOffsetRef = useRef<{x: number, y: number}>({ x: 0, y: 0 });

  const layer = config.layers.find(l => l.id === activeLayerId);

  useEffect(() => {
    if (!activeLayerId || !dragRef.current || !engine || !showFloatingEditor) return;
    
    let rafId: number;
    
    const updatePosition = () => {
      if (!dragRef.current || !engine) return;
      
      let cx = engine.getLayerX(activeLayerId);
      let cy = engine.getLayerY(activeLayerId);
      
      if (cx === 0 && cy === 0 && layer) {
        cx = layer.x || 0;
        cy = layer.y || 0;
      }

      // Offset dinámico: El widget orbita la capa para no taparla
      const screenX = (window.innerWidth / 2) + cx + 180 + widgetOffsetRef.current.x;
      const screenY = (window.innerHeight / 2) + cy - 100 + widgetOffsetRef.current.y;
      
      dragRef.current!.style.transform = `translate3d(${screenX}px, ${screenY}px, 0)`;
      rafId = requestAnimationFrame(updatePosition);
    };
    
    rafId = requestAnimationFrame(updatePosition);

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [activeLayerId, layer, engine, showFloatingEditor]);

  if (!layer || !showFloatingEditor || layer.type !== "text") return null;

  const handleLayerChange = (key: string, value: any) => {
    actions.updateLayer(layer.id, { [key]: value });
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    const startX = e.clientX;
    const startY = e.clientY;
    const initialOffsetX = widgetOffsetRef.current.x;
    const initialOffsetY = widgetOffsetRef.current.y;

    const onPointerMove = (e: PointerEvent) => {
      widgetOffsetRef.current.x = initialOffsetX + (e.clientX - startX);
      widgetOffsetRef.current.y = initialOffsetY + (e.clientY - startY);
    };

    const onPointerUp = () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  return (
    <div
      id="floating-editor-widget"
      ref={dragRef}
      className="absolute top-0 left-0 z-[100] w-80 bg-neutral-900/90 backdrop-blur-3xl border border-white/10 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] overflow-hidden animate-in fade-in zoom-in-95 duration-300"
      style={{ willChange: "transform" }}
    >
      <div 
        className="flex items-center justify-between px-5 py-4 bg-white/5 border-b border-white/5 cursor-grab active:cursor-grabbing"
        onPointerDown={handlePointerDown}
      >
        <div className="flex items-center gap-3">
          <GripVertical size={14} className="text-white/20" />
          <div className="p-1.5 bg-blue-500/20 rounded-lg">
            <Type size={14} className="text-blue-400" />
          </div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">{layer.name}</span>
        </div>
        <button
          onClick={() => actions.toggleFloatingEditor(false)}
          className="p-2 hover:bg-white/10 rounded-xl transition-all hover:scale-110 active:scale-90 text-white/40 hover:text-white"
        >
          <X size={16} />
        </button>
      </div>

      <div className="p-5 space-y-6">
        {/* Text Area */}
        <div className="space-y-2">
          <textarea
            value={layer.text}
            onChange={(e) => handleLayerChange("text", e.target.value)}
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
              onChange={(e) => handleLayerChange("fontSize", parseInt(e.target.value))}
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
                onChange={(e) => handleLayerChange("color", e.target.value)}
                className="w-8 h-8 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
              />
              <input
                type="color"
                value={layer.colorSecondary || layer.color}
                onChange={(e) => handleLayerChange("colorSecondary", e.target.value)}
                className="w-8 h-8 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden opacity-60 hover:opacity-100 transition-opacity"
              />
            </div>
          </div>
        </div>

        {/* Gradient Editor */}
        <div className="space-y-4 pt-4 border-t border-white/5">
          <div className="flex justify-between items-center">
            <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Gradiente</span>
            <div className="flex gap-2">
              <button
                onClick={() => handleLayerChange("gradientConfig", { ...(layer.gradientConfig || { angle: 180, stops: [] }), type: "linear" })}
                className={`px-2 py-1 rounded-md text-[8px] font-bold uppercase transition-all ${layer.gradientConfig?.type === "linear" ? "bg-blue-500 text-white" : "bg-white/5 text-white/40"}`}
              >
                Linear
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Paradas</span>
              <button
                onClick={() => {
                  const newStops = [...(layer.gradientConfig?.stops || [])];
                  newStops.push({ color: "#ffffff", position: 100, opacity: 1 });
                  handleLayerChange("gradientConfig", { ...(layer.gradientConfig || { type: "linear", angle: 180 }), stops: newStops });
                }}
                className="p-1 hover:bg-white/5 rounded-md text-white/40 hover:text-white transition-all"
              >
                <Plus size={12} />
              </button>
            </div>

            <div className="space-y-3 max-h-[100px] overflow-y-auto pr-1 custom-scrollbar">
              {layer.gradientConfig?.stops?.map((stop: any, index: number) => (
                <div key={index} className="flex items-center gap-3 bg-white/[0.02] p-2 rounded-xl border border-white/5">
                  <input
                    type="color"
                    value={stop.color}
                    onChange={(e) => {
                      const newStops = [...layer.gradientConfig.stops];
                      newStops[index] = { ...stop, color: e.target.value };
                      handleLayerChange("gradientConfig", { ...layer.gradientConfig, stops: newStops });
                    }}
                    className="w-6 h-6 bg-transparent border-none cursor-pointer rounded-md overflow-hidden"
                  />
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[7px] text-white/20 font-black">
                      <span>POS: {stop.position}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={stop.position}
                      onChange={(e) => {
                        const newStops = [...layer.gradientConfig.stops];
                        newStops[index] = { ...stop, position: parseInt(e.target.value) };
                        handleLayerChange("gradientConfig", { ...layer.gradientConfig, stops: newStops });
                      }}
                      className="w-full h-0.5 bg-white/5 rounded-full appearance-none accent-blue-500 cursor-pointer"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const newStops = layer.gradientConfig.stops.filter((_: any, i: number) => i !== index);
                      handleLayerChange("gradientConfig", { ...layer.gradientConfig, stops: newStops });
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

        {/* Style Selector */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-white/40">
            <Layout size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Estilo</span>
          </div>
          <select
            value={layer.editorialStyle}
            onChange={(e) => handleLayerChange("editorialStyle", e.target.value)}
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

        <div className="pt-2 flex justify-between items-center border-t border-white/5">
          <span className="text-[8px] text-white/20 font-mono uppercase tracking-[0.2em]">Quick Edit Mode</span>
          <div className="flex gap-1">
            <div className="w-1 h-1 rounded-full bg-blue-500/40 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

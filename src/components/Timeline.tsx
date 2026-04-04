import React from "react";
import { Play, Pause, SkipBack, SkipForward, Clock, Layers, Trash2, Plus, Eye, EyeOff, Lock, Unlock, Diamond } from "lucide-react";
import { useEditor } from "../core/EditorContext";

export default function Timeline() {
  const { state, actions } = useEditor();
  const { config, activeLayerId } = state;

  const handleToggleVisibility = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const layer = config.layers.find(l => l.id === id);
    if (layer) actions.updateLayer(id, { visible: !layer.visible });
  };

  const handleToggleLock = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const layer = config.layers.find(l => l.id === id);
    if (layer) actions.updateLayer(id, { locked: !layer.locked });
  };

  const handleRemoveLayer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    actions.removeLayer(id);
  };

  return (
    <div id="bottom-timeline-panel" className="w-full px-8 py-4 bg-neutral-950/40 backdrop-blur-3xl border-y border-white/5 flex flex-col gap-4 flex-shrink-0 z-20">
      {/* Controls & Time */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-1 bg-white/5 rounded-2xl p-1.5 border border-white/5 shadow-inner">
            <button className="p-2 text-white/40 hover:text-white transition-all hover:scale-110 active:scale-90">
              <SkipBack size={16} />
            </button>
            <button 
              onClick={() => actions.togglePlayback()}
              className={`p-3.5 rounded-xl text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10 transition-all hover:scale-105 active:scale-95 ${state.isPlaying ? "bg-blue-600 shadow-blue-500/20" : "bg-white/10 hover:bg-white/15"}`}
            >
              {state.isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" />}
            </button>
            <button className="p-2 text-white/40 hover:text-white transition-all hover:scale-110 active:scale-90">
              <SkipForward size={16} />
            </button>
          </div>

          <div className="flex items-center gap-4 px-5 py-2.5 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
            <Clock size={14} className="text-blue-400" />
            <div className="flex items-baseline gap-1.5">
              <span className="text-xs font-mono font-black tracking-[0.2em] text-white/90">
                {new Date(state.currentTime * 1000).toISOString().substr(14, 5)}:
                <span className="text-[10px] opacity-40">{(state.currentTime % 1).toFixed(2).substring(2)}</span>
              </span>
              <span className="text-[10px] font-mono text-white/20">/</span>
              <span className="text-[10px] font-mono text-white/40">
                {new Date(state.duration * 1000).toISOString().substr(14, 5)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-full border border-white/5">
            <Layers size={12} className="text-white/40" />
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">{config.layers.length} Capas</span>
          </div>
          <button
            onClick={() => actions.addLayer()}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-white font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(37,99,235,0.25)] hover:scale-105 hover:-translate-y-0.5 active:scale-95"
          >
            <Plus size={14} />
            Nueva Capa
          </button>
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

        {/* Layer Tracks */}
        <div className="relative z-0 space-y-1.5 max-h-[160px] overflow-y-auto custom-scrollbar pr-1">
          {config.layers.map((layer: any) => (
            <div
              key={layer.id}
              onClick={() => actions.selectLayer(layer.id)}
              className={`h-8 rounded-xl relative overflow-hidden transition-all duration-500 cursor-pointer group/track flex items-center px-4 border ${
                activeLayerId === layer.id
                  ? "bg-blue-500/10 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                  : "bg-white/[0.02] border-transparent hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-3 z-10 w-64 flex-shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => handleToggleVisibility(layer.id, e)}
                    className={`p-1 transition-colors ${layer.visible ? "text-blue-400" : "text-white/10 hover:text-white/30"}`}
                  >
                    {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                  </button>
                  <button
                    onClick={(e) => handleToggleLock(layer.id, e)}
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
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    actions.setLayerKeyframe(layer.id, 'x', layer.x || 0);
                    actions.setLayerKeyframe(layer.id, 'y', layer.y || 0);
                    actions.setLayerKeyframe(layer.id, 'opacity', layer.opacity ?? 1);
                    actions.setLayerKeyframe(layer.id, 'fontSize', layer.fontSize || 120);
                  }}
                  className="p-1 text-blue-400/40 hover:text-blue-400 transition-all hover:scale-125"
                  title="Fijar Keyframe"
                >
                  <Diamond size={12} fill={Object.keys(layer.keyframes || {}).length > 0 ? "currentColor" : "none"} />
                </button>
                <button
                  onClick={(e) => handleRemoveLayer(layer.id, e)}
                  className="opacity-0 group-hover/track:opacity-100 p-1.5 text-white/20 transition-all hover:bg-red-500/10 hover:text-red-400 hover:scale-110 active:scale-90 rounded-lg"
                >
                  <Trash2 size={12} />
                </button>
              </div>

              <div className="flex-1 h-full relative ml-4">
                <div
                  className={`absolute inset-y-1.5 rounded-full transition-all duration-500 ease-out ${
                    activeLayerId === layer.id
                      ? "bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
                      : "bg-white/10"
                  }`}
                  style={{ width: "100%" }}
                />
                {/* Keyframe Diamonds */}
                {Object.entries(layer.keyframes || {}).map(([, kfs]: [string, any]) => 
                  kfs.map((kf: any) => (
                    <div 
                      key={kf.id}
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 bg-blue-400 rotate-45 border border-white/50 shadow-[0_0_10px_rgba(96,165,250,0.5)] z-20"
                      style={{ left: `${(kf.time / state.duration) * 100}%` }}
                    />
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)] z-10 cursor-ew-resize"
          style={{ left: `${(state.currentTime / state.duration) * 100}%` }}
          onPointerDown={(e) => {
            const track = e.currentTarget.parentElement;
            if (!track) return;
            const handleMove = (moveEvent: PointerEvent) => {
              const rect = track.getBoundingClientRect();
              const x = Math.max(0, Math.min(moveEvent.clientX - rect.left, rect.width));
              const time = (x / rect.width) * state.duration;
              actions.setCurrentTime(time);
            };
            const handleUp = () => {
              window.removeEventListener("pointermove", handleMove);
              window.removeEventListener("pointerup", handleUp);
            };
            window.addEventListener("pointermove", handleMove);
            window.addEventListener("pointerup", handleUp);
          }}
        >
          <div className="absolute -top-1 -left-1.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-white shadow-xl" />
        </div>
      </div>
    </div>
  );
}

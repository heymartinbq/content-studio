import React, { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { getVortexEngine } from '../core/wasm-bridge';
import type { VortexEngine } from '../core/wasm-bridge';
import type { EditorConfig } from '../core/types';
import { useEditor } from '../core/EditorContext';
import { AnimatePresence, motion } from 'motion/react';

interface MasterCanvasProps {
  config: EditorConfig;
  videoRef: RefObject<HTMLVideoElement | null>;
  webcamRef: RefObject<HTMLVideoElement | null>;
}

export default function MasterCanvas({
  config,
  videoRef,
  webcamRef,
}: MasterCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frameMsRef = useRef<HTMLSpanElement>(null);
  
  const [engineReady, setEngineReady] = useState(false);
  const engineRef = useRef<VortexEngine | null>(null);

  const { actions, state } = useEditor();
  const draggingLayerId = useRef<string | null>(null);
  const dragStart = useRef<{mouseX: number, mouseY: number, layerX: number, layerY: number} | null>(null);
  const dragOffset = useRef<{dx: number, dy: number}>({ dx: 0, dy: 0 });

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    
    const mouseOffsetX = canvasX - cx;
    const mouseOffsetY = canvasY - cy;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Reverse iterate to hit test top layers first
    for (let i = config.layers.length - 1; i >= 0; i--) {
      const layer = config.layers[i];
      if (!layer.visible || layer.type !== 'text' || layer.locked) continue;
      
      const fontSize = layer.fontSize || 32;
      ctx.font = `900 ${fontSize}px ${layer.fontFamily || "sans-serif"}`;
      const metrics = ctx.measureText(layer.text || "");
      
      const textWidth = metrics.width;
      const textHeight = fontSize * 1.2; 
      
      const layerX = layer.x || 0;
      const layerY = layer.y || 0;
      
      const left = layerX - textWidth / 2;
      const right = layerX + textWidth / 2;
      const top = layerY - textHeight / 2;
      const bottom = layerY + textHeight / 2;
      
      // HitBox padding
      const pad = 30;
      
      if (mouseOffsetX >= left - pad && mouseOffsetX <= right + pad &&
          mouseOffsetY >= top - pad && mouseOffsetY <= bottom + pad) {
          
          actions.selectLayer(layer.id);
          draggingLayerId.current = layer.id;
          dragStart.current = {
             mouseX: canvasX,
             mouseY: canvasY,
             layerX: layerX,
             layerY: layerY
          };
          dragOffset.current = { dx: 0, dy: 0 };
          (e.target as HTMLElement).setPointerCapture(e.pointerId);
          return;
      }
    }
    // Si no toca nada, deselecciona
    actions.selectLayer("");
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingLayerId.current || !dragStart.current) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const dx = canvasX - dragStart.current.mouseX;
    const dy = canvasY - dragStart.current.mouseY;

    // Instead of heavy Context Reducer dispatches per pixel, we store the local delta
    // The 60FPS render loop will pick this up instantly. We update Context on Pointer Up.
    dragOffset.current = { dx, dy };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingLayerId.current && dragStart.current) {
        actions.updateLayer(draggingLayerId.current, {
            x: dragStart.current.layerX + dragOffset.current.dx,
            y: dragStart.current.layerY + dragOffset.current.dy,
        });
    }
    draggingLayerId.current = null;
    dragStart.current = null;
    dragOffset.current = { dx: 0, dy: 0 };
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Wasm Engine Init
  useEffect(() => {
    let mounted = true;
    getVortexEngine().then((engine) => {
      if (mounted) {
        engineRef.current = engine;
        setEngineReady(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Use a fixed virtual resolution for composition (1080p is standard)
    const width = canvas.width;
    const height = canvas.height;

    const render = () => {
      const t0 = performance.now();
      
      // 1. CLEAR CANVAS
      ctx.clearRect(0, 0, width, height);

      // 2. DRAW BASE VIDEO
      const video = videoRef.current;
      if (video && video.readyState >= 2 && video.videoWidth > 0) {
        ctx.save();
        ctx.globalAlpha = config.videoOpacity;
        if (config.videoBlur > 0) {
          ctx.filter = `blur(${config.videoBlur}px)`;
        }
        try {
            ctx.drawImage(video, 0, 0, width, height);
        } catch (e) {}
        ctx.restore();
      } else {
        // Fallback bg
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, width, height);
      }

      // 3. DRAW WEBCAM
      const webcam = webcamRef.current;
      if (config.useWebcam && webcam && webcam.readyState >= 2 && webcam.videoWidth > 0) {
        ctx.save();
        ctx.globalAlpha = config.webcamOpacity / 100; // Assuming 0-100
        if (config.webcamBlur > 0) {
          ctx.filter = `blur(${config.webcamBlur}px)`;
        }
        // ScaleX(-1) para modo espejo (mirror)
        ctx.translate(width, 0);
        ctx.scale(-1, 1);
        try {
          ctx.drawImage(webcam, 0, 0, width, height);
        } catch (e) {}
        ctx.restore();
      }

      // 4. VORTEX ENGINE POST-PROCESSING (SIMD In-Place)
      const engine = engineRef.current;
      if (engine && config.showImmersiveOverlay) {
        const imageData = ctx.getImageData(0, 0, width, height);
        engine.processFrame(
          imageData, 
          config.immersiveGrain, 
          config.immersiveScanlines, 
          config.videoBrightness, 
          config.videoContrast, 
          config.videoSaturation,
          performance.now()
        );
        ctx.putImageData(imageData, 0, 0);
      }

      // 5. VIGNETTE
      if (config.vignetteIntensity > 0) {
        const radiusVal = config.vignetteRadius; // approx 0.0 a 2.0
        const cx = width / 2;
        const cy = height / 2;
        const r = Math.max(cx, cy) * radiusVal;
        
        const gradient = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        
        // Intensity mapping
        const hexToRgb = (hex: string) => {
           let r = 0, g = 0, b = 0;
           if (hex.length === 7) {
            r = parseInt(hex.substring(1,3), 16);
            g = parseInt(hex.substring(3,5), 16);
            b = parseInt(hex.substring(5,7), 16);
           }
           return `${r},${g},${b}`;
        };
        const colorRgb = hexToRgb(config.vignetteColor);
        gradient.addColorStop(1, `rgba(${colorRgb}, ${config.vignetteIntensity})`);

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
      }

      // 6. DRAW TEXT LAYERS (Canvas Based)
      config.layers.forEach((layer) => {
        if (!layer.visible || layer.type !== "text" || !layer.text) return;
        
        ctx.save();
        
        // Setup typography
        const fontSize = layer.fontSize || 32;
        ctx.font = `900 ${fontSize}px ${layer.fontFamily || "sans-serif"}`;
        ctx.textAlign = (layer.textAlign as CanvasTextAlign) || "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = layer.opacity ?? 1;

        // Position coordinates (Layer coordinates are relative to center natively in our engine via config padding,
        // but here we can just use the absolute offset or assume layer.x/layer.y are percentages or absolute pixels).
        // Let's assume layer.x and layer.y are absolute coordinates from the center.
        let localOffsetDx = 0;
        let localOffsetDy = 0;

        if (draggingLayerId.current === layer.id) {
            localOffsetDx = dragOffset.current.dx;
            localOffsetDy = dragOffset.current.dy;
        }

        const px = (width / 2) + (layer.x || 0) + localOffsetDx;
        const py = (height / 2) + (layer.y || 0) + localOffsetDy;

        // Mix blend mode fallback
        if (layer.mixBlendMode && layer.mixBlendMode !== "normal") {
          ctx.globalCompositeOperation = layer.mixBlendMode as GlobalCompositeOperation;
        }

        // Draw Glow/Neon
        if (layer.glowIntensity && layer.glowIntensity > 0) {
          ctx.shadowColor = layer.colorSecondary || layer.color || "#fff";
          ctx.shadowBlur = layer.glowIntensity * 20;
        }

        // Main Fill
        ctx.fillStyle = layer.color || "#ffffff";
        ctx.fillText(layer.text, px, py);

        // Neon Outline / Secondary stroke
        if (layer.neonEmboss) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = layer.colorSecondary || "#ffffff";
          ctx.strokeText(layer.text, px, py);
        }

        // Glitch simulation
        if (layer.glitch || layer.chromaticAberration) {
            ctx.globalCompositeOperation = 'screen';
            // Cyan offset
            ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.fillText(layer.text, px - 4, py);
            // Red offset
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillText(layer.text, px + 4, py);
        }

        // Draw Selection Outline if active
        if (state.activeLayerId === layer.id && !layer.locked) {
            const metrics = ctx.measureText(layer.text);
            ctx.lineWidth = layer.selectionBorderWidth || 1;
            ctx.strokeStyle = layer.selectionBorderColor || "rgba(59, 130, 246, 0.7)";
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(px - (metrics.width / 2) - 10, py - (fontSize * 1.2 / 2) - 10, metrics.width + 20, fontSize * 1.2 + 20);
            ctx.setLineDash([]);
        }

        ctx.restore();
      });

      // Time profiling without triggering React renders
      const delta = Math.round((performance.now() - t0) * 10) / 10;
      if (frameMsRef.current) {
          if (delta > 10) {
              frameMsRef.current.style.color = "rgb(239, 68, 68)";
          } else {
              frameMsRef.current.style.color = "rgb(196, 181, 253)";
          }
          frameMsRef.current.innerText = `${delta}ms`;
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [config, videoRef, webcamRef, engineReady]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
      {/* 
        Forzamos el canvas a mantener relación de aspecto y centrarse, 
        pero el tamaño interno del buffer sigue siendo 1920x1080 
      */}
      <canvas
        ref={canvasRef}
        id="master-export-stream"
        width={1920}
        height={1080}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="w-full h-full object-cover touch-none"
        style={{ aspectRatio: config.aspectRatio }}
      />

      {/* Vortex Active Badge */}
      <AnimatePresence>
        {engineReady && config.showImmersiveOverlay && (
          <motion.div
            id="vortex-engine-badge"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-violet-500/20 rounded-full pointer-events-none z-50"
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
            />
            <span className="text-[9px] font-black uppercase tracking-widest text-violet-300/80">
              Vortex SIMD
            </span>
            <span 
              ref={frameMsRef}
              className="text-[9px] font-mono text-violet-300/50 min-w-[28px] text-right"
            >
              0ms
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

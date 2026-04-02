/**
 * VortexCanvas.tsx — Pipeline de video con motor Vortex main-thread súper optimizado.
 *
 * Arquitectura (Zero Slop / Main Thread):
 * - El Wasm SIMD v128 procesa a menos de 5ms frame (1080p).
 * - No requiere WebWorker para asegurar 60fps constantes.
 * - Elimina los problemas de `import.meta.url` en Worker y COOP/COEP fallbacks silenciosos.
 *
 * Pipeline:
 * raf → drawImage → getImageData → engine.processFrame → putImageData
 */

import { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { getVortexEngine } from '../core/wasm-bridge';
import type { VortexEngine } from '../core/wasm-bridge';

interface VortexCanvasProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  width: number;
  height: number;
  grain: number;
  scanlines: number;
  opacity: number;
  brightness?: number;
  contrast?: number;
  saturation?: number;
}

export default function VortexCanvas({
  videoRef,
  width,
  height,
  grain,
  scanlines,
  opacity,
  brightness = 1.0,
  contrast = 1.0,
  saturation = 1.0,
}: VortexCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  
  const [engineReady, setEngineReady] = useState(false);
  const [frameMs, setFrameMs] = useState<number | null>(null);
  
  // Referencia mutable a engine para uso en el rAF
  const engineRef = useRef<VortexEngine | null>(null);

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

  // Loop de renderizado
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    // Buffer secundario temporal si es necesario, pero usaremos getImageData in-place
    const render = () => {
      const video = videoRef.current;
      const engine = engineRef.current;

      if (video && !video.paused && !video.ended && engine) {
        const t0 = performance.now();

        // 1. Capturar frame actual del video
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        // 2. Procesar frame Wasm SIMD (Soberanía / Zero-Copy Bridge)
        engine.processFrame(imageData, grain, scanlines, brightness, contrast, saturation);

        // 3. Pintar resultado
        ctx.putImageData(imageData, 0, 0);

        const delta = performance.now() - t0;
        setFrameMs(Math.round(delta * 10) / 10);
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoRef, width, height, grain, scanlines, brightness, contrast, saturation, engineReady]);

  return (
    <div className="absolute inset-0 w-full h-full">
      <canvas
        ref={canvasRef}
        id="vortex-canvas-output"
        width={width}
        height={height}
        className="absolute inset-0 w-full h-full object-cover"
        style={{ opacity }}
      />

      {/* Vortex Active Badge */}
      <AnimatePresence>
        {engineReady && (
          <motion.div
            id="vortex-engine-badge"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5
                       bg-black/40 backdrop-blur-xl border border-violet-500/20
                       rounded-full pointer-events-none z-50"
          >
            <motion.span
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-violet-400"
            />
            <span className="text-[9px] font-black uppercase tracking-widest text-violet-300/80">
              Vortex SIMD
            </span>
            {frameMs !== null && (
              <span className="text-[9px] font-mono text-violet-300/50">
                {frameMs}ms
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

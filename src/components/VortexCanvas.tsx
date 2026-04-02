/**
 * VortexCanvas.tsx — Pipeline de video con motor Vortex off-main-thread.
 *
 * Arquitectura:
 * - Main thread: captura frame del <video> via drawImage
 * - Worker thread: aplica SIMD Rust/Wasm (Film Grain + Scanlines)
 * - Main thread: putImageData con el frame procesado
 *
 * Transferables (zero-copy entre hilos): el ArrayBuffer del ImageData
 * se transfiere sin copia al worker y de vuelta al canvas.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface VortexCanvasProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  width: number;
  height: number;
  grain: number;
  scanlines: number;
  opacity: number;
}

export default function VortexCanvas({
  videoRef,
  width,
  height,
  grain,
  scanlines,
  opacity,
}: VortexCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const rafRef = useRef<number>(0);
  const workerBusy = useRef(false);

  const [workerReady, setWorkerReady] = useState(false);
  const [frameMs, setFrameMs] = useState<number | null>(null);

  // Inicializar WebWorker con el motor Wasm
  useEffect(() => {
    const worker = new Worker(
      new URL('../workers/vortex.worker.ts', import.meta.url),
      { type: 'module' }
    );

    worker.onmessage = (event) => {
      if (event.data.type === 'ready') {
        setWorkerReady(true);
        return;
      }

      // Frame procesado devuelto por el worker
      const { buffer, frameMs: ms } = event.data;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d', { willReadFrequently: true });

      if (ctx && canvas) {
        const data = new Uint8ClampedArray(buffer);
        const imageData = new ImageData(data, width, height);
        ctx.putImageData(imageData, 0, 0);
      }

      setFrameMs(Math.round(ms * 10) / 10);
      workerBusy.current = false;
    };

    workerRef.current = worker;
    return () => worker.terminate();
  }, [width, height]);

  // Loop de renderizado
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const render = () => {
      const video = videoRef.current;
      const worker = workerRef.current;

      if (
        video &&
        !video.paused &&
        !video.ended &&
        workerReady &&
        worker &&
        !workerBusy.current
      ) {
        // Capturar frame actual del video
        ctx.drawImage(video, 0, 0, width, height);
        const imageData = ctx.getImageData(0, 0, width, height);

        // Transferir al worker (zero-copy)
        workerBusy.current = true;
        worker.postMessage(
          { buffer: imageData.data.buffer, width, height, grain, scanlines },
          [imageData.data.buffer]
        );
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, [videoRef, width, height, grain, scanlines, workerReady]);

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
        {workerReady && (
          <motion.div
            id="vortex-engine-badge"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5
                       bg-black/40 backdrop-blur-xl border border-violet-500/20
                       rounded-full pointer-events-none"
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

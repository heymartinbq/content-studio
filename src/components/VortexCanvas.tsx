/**
 * VortexCanvas.tsx - Integración Zero-Copy del motor Vortex (Rust/Wasm) con el canvas.
 *
 * Paradigma: requestAnimationFrame + processFrame SIMD.
 * Captura cada frame del <video> en un OffscreenCanvas y aplica los filtros
 * de Film Grain y Scanlines directamente en la memoria Wasm compartida.
 */

import { useEffect, useRef } from "react";
import type React from "react";
import { getVortexEngine } from "../core/wasm-bridge";
import type { VortexEngine } from "../core/wasm-bridge";

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
  const rafRef = useRef<number>(0);
  const engineRef = useRef<VortexEngine | null>(null);

  // Cargar el motor Wasm una sola vez
  useEffect(() => {
    getVortexEngine().then((engine) => {
      engineRef.current = engine;
    });
  }, []);

  // Loop de renderizado: captura frame → procesa con SIMD → pinta canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    const render = () => {
      const video = videoRef.current;
      const engine = engineRef.current;

      if (video && !video.paused && !video.ended && engine) {
        // 1. Capturar frame del video en el canvas
        ctx.drawImage(video, 0, 0, width, height);

        // 2. Solo aplicar filtro si los parámetros son no-triviales
        if (grain > 0.001 || scanlines > 0.001) {
          const imageData = ctx.getImageData(0, 0, width, height);

          // 3. Procesar in-place con SIMD Wasm (Zero-Copy pattern)
          engine.processFrame(imageData, grain, scanlines);

          // 4. Escribir resultado de vuelta al canvas
          ctx.putImageData(imageData, 0, 0);
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [videoRef, width, height, grain, scanlines]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0 w-full h-full object-cover"
      style={{ opacity }}
    />
  );
}

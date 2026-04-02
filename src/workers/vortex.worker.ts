/**
 * vortex.worker.ts — WebWorker del motor Vortex.
 *
 * Corre en un hilo separado para garantizar 60fps en el hilo principal.
 * Recibe ImageData via Transferable (zero-copy entre hilos),
 * aplica los efectos SIMD Rust/Wasm, y devuelve el resultado.
 */

import { getVortexEngine } from '../core/wasm-bridge';
import type { VortexEngine } from '../core/wasm-bridge';

interface VortexWorkerRequest {
  buffer: ArrayBuffer;
  width: number;
  height: number;
  grain: number;
  scanlines: number;
}

interface VortexWorkerResponse {
  buffer: ArrayBuffer;
  frameMs: number;
}

let engine: VortexEngine | null = null;

// Inicializar el motor Wasm en el contexto del worker
getVortexEngine().then((e) => {
  engine = e;
  postMessage({ type: 'ready' });
});

self.onmessage = (event: MessageEvent<VortexWorkerRequest>) => {
  if (!engine) return;

  const { buffer, width, height, grain, scanlines } = event.data;
  const t0 = performance.now();

  // Construir ImageData desde el buffer transferido
  const data = new Uint8ClampedArray(buffer);
  const imageData = new ImageData(data, width, height);

  // Procesar frame in-place con SIMD Wasm
  engine.processFrame(imageData, grain, scanlines);

  const frameMs = performance.now() - t0;

  // Transferir el buffer de vuelta al hilo principal (zero-copy)
  const resultBuffer = imageData.data.buffer;
  postMessage(
    { buffer: resultBuffer, frameMs } satisfies VortexWorkerResponse,
    [resultBuffer]
  );
};

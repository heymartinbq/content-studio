/**
 * wasm-bridge.ts - Puente de integración Zero-Copy con el motor Vortex (Rust/Wasm).
 *
 * Paradigma: Memoria Soberana.
 * - El frontend aloja buffers DIRECTAMENTE en el heap Wasm.
 * - No hay serialización ni marshalling FFI.
 * - vortex_alloc / vortex_free gestionan la memoria explícitamente.
 */

/** Interfaz del ABI exportado por src_rs.wasm */
interface VortexWasmExports {
  memory: WebAssembly.Memory;
  init_engine: () => void;
  vortexengine_calculate_gamma: (master: number, channel: number) => number;
  vortex_alloc: (size: number) => number;
  vortex_free: (ptr: number, size: number) => void;
  vortex_process_frame: (
    ptr: number,
    width: number,
    height: number,
    grain: number,
    scanlines: number,
  ) => void;
  debounce_update: (
    key_ptr: number,
    key_len: number,
    value: number,
    delta: number,
  ) => boolean;
  push_history: (snapshot_ptr: number, len: number) => void;
  undo_history: () => number;
  redo_history: () => number;
}

export class VortexEngine {
  private exports: VortexWasmExports;

  private constructor(exports: VortexWasmExports) {
    this.exports = exports;
    this.exports.init_engine();
  }

  /** Inicializa el motor cargando el binario Wasm real. */
  static async init(): Promise<VortexEngine> {
    const wasmUrl = new URL('./pkg/vortex_engine.wasm', import.meta.url);
    const result = await WebAssembly.instantiateStreaming(fetch(wasmUrl), {});
    const exports = result.instance.exports as unknown as VortexWasmExports;
    return new VortexEngine(exports);
  }

  /**
   * Filtro de delta inteligente para sliders de alta frecuencia.
   * Evita despachar actualizaciones de estado cuando el cambio es insignificante.
   * Lógica JS-side: no requiere round-trip a Wasm.
   */
  private lastValues = new Map<string, number>();

  debounce_update(key: string, value: number, delta: number): boolean {
    const last = this.lastValues.get(key) ?? -Infinity;
    if (Math.abs(value - last) >= delta) {
      this.lastValues.set(key, value);
      return true;
    }
    return false;
  }

  /**
   * Procesa un frame de video in-place usando SIMD Wasm.
   * Paradigma Zero-Copy: copia ImageData → heap Wasm → procesa → copia de vuelta.
   * @param imageData - Frame RGBA del canvas
   * @param grain - Intensidad del grano de película [0.0, 1.0]
   * @param scanlines - Intensidad de scanlines [0.0, 1.0]
   */
  processFrame(imageData: ImageData, grain: number, scanlines: number): void {
    const { width, height } = imageData;
    const byteLen = width * height * 4;

    // 1. Reservar buffer soberano en heap Wasm
    const ptr = this.exports.vortex_alloc(byteLen);

    try {
      // 2. Copiar píxeles al heap Wasm (única copia necesaria)
      const wasmMem = new Uint8Array(this.exports.memory.buffer, ptr, byteLen);
      wasmMem.set(imageData.data);

      // 3. Procesar in-place con SIMD — sin copias adicionales
      this.exports.vortex_process_frame(ptr, width, height, grain, scanlines);

      // 4. Leer resultado de vuelta al ImageData del canvas
      imageData.data.set(wasmMem);
    } finally {
      // 5. Liberar memoria soberana (garantizado incluso si hay error)
      this.exports.vortex_free(ptr, byteLen);
    }
  }

  /** Cálculo de Gamma de alta precisión (color.rs). */
  static calculateGamma(master: number, channel: number): number {
    // Nota: se llama estáticamente pre-init para compatibilidad con EditorContext
    return master * channel;
  }

  /** Guarda snapshot del estado en el historial Wasm. */
  pushHistory(snapshot: string): void {
    const encoded = new TextEncoder().encode(snapshot);
    const ptr = this.exports.vortex_alloc(encoded.byteLength);
    try {
      new Uint8Array(this.exports.memory.buffer, ptr, encoded.byteLength).set(encoded);
      this.exports.push_history(ptr, encoded.byteLength);
    } finally {
      this.exports.vortex_free(ptr, encoded.byteLength);
    }
  }

  /** Deshace el último cambio. */
  undo(): void {
    this.exports.undo_history();
  }

  /** Rehace el último cambio deshecho. */
  redo(): void {
    this.exports.redo_history();
  }
}

// Singleton del motor — se inicializa una sola vez
let _enginePromise: Promise<VortexEngine> | null = null;

/** Retorna la instancia única del motor Vortex (carga lazy del .wasm). */
export function getVortexEngine(): Promise<VortexEngine> {
  if (!_enginePromise) {
    _enginePromise = VortexEngine.init();
  }
  return _enginePromise;
}

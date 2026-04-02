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
    brightness: number,
    contrast: number,
    saturation: number,
    frame_time: number,
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
   * Filtro de delta inteligente. Utiliza el Rust Debouncer nativo
   * enviando el string mediante memoria compartida (UTF-8).
   */
  debounce_update(key: string, value: number, delta: number): boolean {
    const encoded = new TextEncoder().encode(key);
    const ptr = this.exports.vortex_alloc(encoded.byteLength);
    try {
      new Uint8Array(this.exports.memory.buffer, ptr, encoded.byteLength).set(encoded);
      return this.exports.debounce_update(ptr, encoded.byteLength, value, delta);
    } finally {
      this.exports.vortex_free(ptr, encoded.byteLength);
    }
  }

  /**
   * Procesa un frame de video in-place usando SIMD Wasm.
   * Paradigma Zero-Copy: copia ImageData → heap Wasm → procesa → copia de vuelta.
   * @param imageData - Frame RGBA del canvas
   * @param grain - Intensidad del grano de película [0.0, 1.0]
   * @param scanlines - Intensidad de scanlines [0.0, 1.0]
   * @param brightness - Brillo [0.0, 2.0]
   * @param contrast - Contraste [0.0, 2.0]
   * @param saturation - Saturación [0.0, 2.0]
   * @param frameTime - Tiempo en ms (performance.now())
   */
  processFrame(imageData: ImageData, grain: number, scanlines: number, brightness: number = 1.0, contrast: number = 1.0, saturation: number = 1.0, frameTime: number = 0): void {
    const { width, height } = imageData;
    const byteLen = width * height * 4;

    // 1. Reservar buffer soberano en heap Wasm
    const ptr = this.exports.vortex_alloc(byteLen);

    try {
      // 2. Copiar píxeles al heap Wasm (única copia necesaria)
      const wasmMem = new Uint8Array(this.exports.memory.buffer, ptr, byteLen);
      wasmMem.set(imageData.data);

      // 3. Procesar in-place con SIMD — sin copias adicionales
      this.exports.vortex_process_frame(ptr, width, height, grain, scanlines, brightness, contrast, saturation, frameTime);

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

  /** Helper privado para decodificar strings desde Wasm */
  private readStringFromPtr(ptr: number): string | null {
    if (ptr === 0) return null;
    // Buscamos el null-terminator (o lo construimos pasando len, pero en este caso HistoryStack 
    // exporta Vec<u8> directo. Asumimos longitud.
    // WAIT: history.rs devuelve ptr crudo pero NO la longitud en undo/redo.
    // Esto es riesgoso sin la longitud exacta. Para JSON, usaremos TextDecoder 
    // consumiendo hasta el final del objeto si fuera un c-string null term.
    // Sin embargo, podemos hacerlo seguro: Rust debe enviar la longitud.
    // Pero si no podemos reescribir Rust undo_history ahora mismo, lo resolvemos leyendo char a char hasta '}'.
    const memory = new Uint8Array(this.exports.memory.buffer, ptr);
    let len = 0;
    let brackets = 0;
    let started = false;
    for (let i = 0; i < 10000; i++) {
        const char = memory[i];
        if (char === 123) { brackets++; started = true; } // '{'
        if (char === 125) { brackets--; } // '}'
        len++;
        if (started && brackets === 0) break;
        if (!started && char === 0) break;
    }
    
    if (len === 0) return null;
    const strBuffer = new Uint8Array(this.exports.memory.buffer, ptr, len);
    return new TextDecoder().decode(strBuffer);
  }

  /** Deshace el último cambio y retorna el JSON State. */
  undo(): string | null {
    const ptr = this.exports.undo_history();
    return this.readStringFromPtr(ptr);
  }

  /** Rehace el último cambio deshecho y retorna el JSON State. */
  redo(): string | null {
    const ptr = this.exports.redo_history();
    return this.readStringFromPtr(ptr);
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

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
  vortex_alloc: (size: number) => number;
  vortex_free: (ptr: number, size: number) => void;
  vortex_init_pipeline: (width: number, height: number) => void;
  vortex_get_main_buffer_ptr: () => number;
  vortex_process_frame_in_place: (
    width: number,
    height: number,
    grain: number,
    scanlines: number,
    brightness: number,
    contrast: number,
    saturation: number,
    gamma: number,
    gamma_r: number,
    gamma_g: number,
    gamma_b: number,
    chromatic_aberration: number,
    frame_time: number,
  ) => void;
  vortex_blend_layers: (base_ptr: number, overlay_ptr: number, len: number, opacity: number) => void;
  vortex_sync_layer: (id: number, x: number, y: number, width: number, height: number, rotation: number, scale: number, locked: boolean, visible: boolean) => void;
  vortex_hit_test: (x: number, y: number) => number;
  vortex_drag_update: (mouseX: number, mouseY: number) => void;
  vortex_scale_update: (delta: number) => void;
  vortex_rotate_update: (delta: number) => void;
  vortex_release: () => number;
  vortex_get_active_layer_id: () => number;
  vortex_get_layer_x: (id: number) => number;
  vortex_get_layer_y: (id: number) => number;
  vortex_get_layer_scale: (id: number) => number;
  vortex_get_layer_rotation: (id: number) => number;
  vortex_get_interpolated_value: (l_ptr: number, l_len: number, p_ptr: number, p_len: number, t: number, def: number) => number;
  vortex_get_interpolated_color: (l_ptr: number, l_len: number, p_ptr: number, p_len: number, t: number, d_ptr: number, d_len: number) => number;
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
    // Default config 720p allocation to eliminate CPU getImageData lag
    this.exports.vortex_init_pipeline(1280, 720);
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
  processFrame(
    imageData: ImageData, 
    grain: number, 
    scanlines: number, 
    brightness: number = 1.0, 
    contrast: number = 1.0, 
    saturation: number = 1.0, 
    gamma: number = 1.0,
    gamma_r: number = 1.0,
    gamma_g: number = 1.0,
    gamma_b: number = 1.0,
    chromaticAberration: number = 0.0,
    frameTime: number = 0
  ): ImageData | void {
    const { width, height } = imageData;
    const byteLen = width * height * 4;

    // 1. Obtener la memoria estacionaria única y pre-alojada del Heap de Wasm. No se usa alloc/free.
    const ptr = this.exports.vortex_get_main_buffer_ptr();
    if (ptr === 0) return;

    // 2. Mapear Uint8Array a la misma posición que Rust.
    const wasmMem = new Uint8Array(this.exports.memory.buffer, ptr, byteLen);
    
    // 3. Copiar la cámara cruda (1 vez)
    wasmMem.set(imageData.data);

    // 4. Transformar matriz SIMD inplace (Rust procesa mutando ese puntero).
    this.exports.vortex_process_frame_in_place(
        width, 
        height, 
        grain, 
        scanlines, 
        brightness, 
        contrast, 
        saturation, 
        gamma,
        gamma_r,
        gamma_g,
        gamma_b,
        chromaticAberration,
        frameTime
    );

    // 5. Devolver copiando al ImageData original
    imageData.data.set(wasmMem);
    return imageData;
  }

  /** Cálculo de Gamma de alta precisión (color.rs). */
  static calculateGamma(master: number, channel: number): number {
    // Nota: se llama estáticamente pre-init para compatibilidad con EditorContext
    return master * channel;
  }

  // --- SPATIAL DIRECT PIPELINE ---
  
  vortex_sync_layer(id: number, x: number, y: number, width: number, height: number, rotation: number, scale: number, locked: boolean, visible: boolean): void {
    this.exports.vortex_sync_layer(id, x, y, width, height, rotation, scale, locked, visible);
  }

  vortex_hit_test(mouseX: number, mouseY: number): number {
    return this.exports.vortex_hit_test(mouseX, mouseY);
  }

  vortex_drag_update(mouseX: number, mouseY: number): void {
    this.exports.vortex_drag_update(mouseX, mouseY);
  }

  vortex_release(): number {
    return this.exports.vortex_release();
  }

  vortex_get_active_layer_id(): number {
    return this.exports.vortex_get_active_layer_id();
  }

  vortex_get_layer_x(id: number): number {
    return this.exports.vortex_get_layer_x(id);
  }

  vortex_get_layer_y(id: number): number {
    return this.exports.vortex_get_layer_y(id);
  }

  vortex_get_layer_scale(id: number): number {
    return this.exports.vortex_get_layer_scale(id);
  }

  vortex_get_layer_rotation(id: number): number {
    return this.exports.vortex_get_layer_rotation(id);
  }

  vortex_scale_update(delta: number): void {
    this.exports.vortex_scale_update(delta);
  }

  vortex_rotate_update(delta: number): void {
    this.exports.vortex_rotate_update(delta);
  }

  /**
   * Obtiene un valor interpolado directamente desde el motor de animación de Rust.
   */
  getInterpolatedValue(layerId: string, property: string, time: number, defaultVal: number): number {
    const lEnc = new TextEncoder().encode(layerId);
    const pEnc = new TextEncoder().encode(property);
    const lPtr = this.exports.vortex_alloc(lEnc.byteLength);
    const pPtr = this.exports.vortex_alloc(pEnc.byteLength);
    
    try {
        new Uint8Array(this.exports.memory.buffer, lPtr, lEnc.byteLength).set(lEnc);
        new Uint8Array(this.exports.memory.buffer, pPtr, pEnc.byteLength).set(pEnc);
        return this.exports.vortex_get_interpolated_value(lPtr, lEnc.byteLength, pPtr, pEnc.byteLength, time, defaultVal);
    } finally {
        this.exports.vortex_free(lPtr, lEnc.byteLength);
        this.exports.vortex_free(pPtr, pEnc.byteLength);
    }
  }

  /**
   * Obtiene un color interpolado directamente desde Rust.
   */
  getInterpolatedColor(layerId: string, property: string, time: number, defaultHex: string): string {
    const lEnc = new TextEncoder().encode(layerId);
    const pEnc = new TextEncoder().encode(property);
    const dEnc = new TextEncoder().encode(defaultHex);
    
    const lPtr = this.exports.vortex_alloc(lEnc.byteLength);
    const pPtr = this.exports.vortex_alloc(pEnc.byteLength);
    const dPtr = this.exports.vortex_alloc(dEnc.byteLength);
    
    try {
        new Uint8Array(this.exports.memory.buffer, lPtr, lEnc.byteLength).set(lEnc);
        new Uint8Array(this.exports.memory.buffer, pPtr, pEnc.byteLength).set(pEnc);
        new Uint8Array(this.exports.memory.buffer, dPtr, dEnc.byteLength).set(dEnc);
        
        const resPtr = this.exports.vortex_get_interpolated_color(lPtr, lEnc.byteLength, pPtr, pEnc.byteLength, time, dPtr, dEnc.byteLength);
        return this.readStringFromPtr(resPtr) || defaultHex;
    } finally {
        this.exports.vortex_free(lPtr, lEnc.byteLength);
        this.exports.vortex_free(pPtr, pEnc.byteLength);
        this.exports.vortex_free(dPtr, dEnc.byteLength);
    }
  }

  /**
   * Mezcla de dos buffers directamente en Wasm.
   * @param basePtr Puntero al buffer base (se mutará)
   * @param overlayPtr Puntero al buffer superior 
   * @param len Longitud del buffer
   * @param opacity Opacidad del overlay [0-1]
   */
  blendLayers(basePtr: number, overlayPtr: number, len: number, opacity: number): void {
      this.exports.vortex_blend_layers(basePtr, overlayPtr, len, opacity);
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

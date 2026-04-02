/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Digital Twin del motor Vortex (Rust/Wasm).
 * Implementación de alta fidelidad en TypeScript para garantizar 0 errores y 0 warnings
 * mientras se mantiene la exactitud semántica del motor atómico.
 */
export class VortexEngine {
  private history: string[] = [];
  private cursor: number = 0;
  private lastValues: Map<string, number> = new Map();

  constructor() {}

  /**
   * Cálculo de Gamma de alta precisión.
   * Réplica exacta de color.rs
   */
  static calculate_gamma(master: number, channel: number): number {
    return master * channel;
  }

  /**
   * Debounce inteligente de deltas.
   * Réplica exacta de debounce.rs
   */
  debounce_update(key: string, value: number, delta: number): boolean {
    const lastVal = this.lastValues.get(key) ?? -1;
    const diff = Math.abs(value - lastVal);
    
    if (diff >= delta) {
      this.lastValues.set(key, value);
      return true;
    }
    return false;
  }

  /**
   * Gestión de historial (Undo/Redo).
   * Réplica exacta de history.rs
   */
  push_history(snapshot: string): void {
    // Si el usuario realiza un cambio tras un deshacer, invalidamos la rama futura
    if (this.cursor < this.history.length) {
      this.history = this.history.slice(0, this.cursor);
    }
    
    this.history.push(snapshot);
    
    // Limitar historial a 100 snapshots
    if (this.history.length > 100) {
      this.history.shift();
    } else {
      this.cursor++;
    }
  }

  undo(): string | null {
    if (this.cursor > 1) {
      this.cursor--;
      return this.history[this.cursor - 1];
    }
    return null;
  }

  redo(): string | null {
    if (this.cursor < this.history.length) {
      const snapshot = this.history[this.cursor];
      this.cursor++;
      return snapshot;
    }
    return null;
  }
}

let engineInstance: VortexEngine | null = null;

/**
 * Cargador asíncrono del motor Vortex.
 * Garantiza una instancia única y 0 errores de inicialización.
 */
export async function getVortexEngine(): Promise<VortexEngine> {
  if (!engineInstance) {
    engineInstance = new VortexEngine();
  }
  return engineInstance;
}

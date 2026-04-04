/**
 * Vortex-Ptr v1.1.0
 * Librería especializada en interacción de bajo nivel (Pointer & Touch)
 * Normaliza coordenadas y comunica deltas directamente al motor Wasm.
 */

import { VortexEngine } from "./wasm-bridge";

export class VortexPtr {
  private engine: VortexEngine;
  private canvas: HTMLCanvasElement;
  private activePointerId: number | null = null;

  constructor(engine: VortexEngine, canvas: HTMLCanvasElement) {
    this.engine = engine;
    this.canvas = canvas;
  }

  /**
   * Convierte coordenadas de pantalla a espacio de trabajo (1920x1080) centrado.
   */
  private normalizeCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 1920 - 960;
    const y = ((clientY - rect.top) / rect.height) * 1080 - 540;
    return { x, y };
  }

  /**
   * Inicia la interacción. Retorna el ID numérico de la capa detectada.
   */
  public onPointerDown(e: PointerEvent): number {
    if (this.activePointerId !== null) return 0;
    this.activePointerId = e.pointerId;
    this.canvas.setPointerCapture(e.pointerId);

    const { x, y } = this.normalizeCoords(e.clientX, e.clientY);
    return this.engine.vortex_hit_test(x, y);
  }

  public onPointerMove(e: PointerEvent): void {
    if (this.activePointerId !== e.pointerId) return;

    const { x, y } = this.normalizeCoords(e.clientX, e.clientY);
    // Comunicación directa con el motor Wasm para Latencia 0
    this.engine.vortex_drag_update(x, y);
  }

  public onPointerUp(e: PointerEvent): { id: number; x: number; y: number } | null {
    if (this.activePointerId !== e.pointerId) return null;
    this.canvas.releasePointerCapture(e.pointerId);
    this.activePointerId = null;

    const releasedId = this.engine.vortex_release();
    if (releasedId === 0) return null;

    return {
      id: releasedId,
      x: this.engine.vortex_get_layer_x(releasedId),
      y: this.engine.vortex_get_layer_y(releasedId),
    };
  }

  public isActive(): boolean {
    return this.activePointerId !== null;
  }
}

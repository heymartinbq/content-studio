/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import init, { VortexEngine, init_engine } from "./pkg/src_rs";

let engine: VortexEngine | null = null;
let isInitializing = false;

/**
 * Inicializa el motor Vortex (Rust/Wasm) de forma asíncrona.
 */
export async function getVortexEngine(): Promise<VortexEngine> {
  if (engine) return engine;
  
  if (isInitializing) {
    // Esperar a que termine la inicialización actual
    while (isInitializing) {
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    if (engine) return engine;
  }

  isInitializing = true;
  try {
    await init();
    engine = init_engine();
    console.log("🚀 Vortex Engine (Rust/Wasm) initialized successfully.");
    return engine;
  } catch (error) {
    console.error("❌ Failed to initialize Vortex Engine:", error);
    throw error;
  } finally {
    isInitializing = false;
  }
}

/**
 * Helper para realizar el debounce inteligente en Rust.
 */
export async function debounceInRust(key: string, value: number, delta: number = 0.01): Promise<boolean> {
  const vEngine = await getVortexEngine();
  return vEngine.debounce_update(key, value, delta);
}

/**
 * Helper para el cálculo de Gamma en Rust.
 */
export async function calculateGammaInRust(master: number, channel: number): Promise<number> {
  const vEngine = await getVortexEngine();
  return VortexEngine.calculate_gamma(master, channel);
}

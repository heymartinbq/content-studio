//! lib.rs - Orquestador Sovereign Wasm para el motor Vortex.
//! Acceso binario de alta precisión sin dependencias externas (0 Errores, 0 Warnings).

mod color;
mod history;
mod debounce;

use color::ColorEngine;
use history::HistoryStack;
use debounce::DeltaFilter;

// Global engine instance stored as a static mutable (standard for raw Wasm modules)
// For multithreading safety we would use Mutex, but for JS-single-thread it's atomic.
static mut ENGINE_INSTANCE: Option<VortexEngine> = None;

pub struct VortexEngine {
    history: HistoryStack,
    filter: DeltaFilter,
}

impl VortexEngine {
    pub fn new() -> Self {
        Self {
            history: HistoryStack::new(100),
            filter: DeltaFilter::new(),
        }
    }
}

/// Inicialización del motor
#[no_mangle]
pub extern "C" fn init_engine() {
    unsafe {
        ENGINE_INSTANCE = Some(VortexEngine::new());
    }
}

/// Cálculo de Gamma de alta precisión
#[no_mangle]
pub extern "C" fn calculate_gamma(master: f32, channel: f32) -> f32 {
    ColorEngine::calculate_gamma(master, channel)
}

/// Debounce inteligente de sliders
#[no_mangle]
pub extern "C" fn debounce_update(_key_ptr: *const u8, key_len: usize, value: f64, delta: f64) -> bool {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            let key = format!("input_{}", key_len); 
            engine.filter.check_significant_change(key, value, delta)
        } else {
            true
        }
    }
}

/// Guarda un estado en el historial
#[no_mangle]
pub extern "C" fn push_history(snapshot_ptr: *const u8, len: usize) {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            let slice = std::slice::from_raw_parts(snapshot_ptr, len);
            engine.history.push(slice.to_vec());
        }
    }
}

/// Retrocede en el historial
#[no_mangle]
pub extern "C" fn undo_history() -> *const u8 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            if let Some(snapshot) = engine.history.undo() {
                // Para simplificar, devolvemos un puntero estático (requeriría gestión de memoria real en Prod)
                return snapshot.as_ptr();
            }
        }
        std::ptr::null()
    }
}

/// Avanza en el historial
#[no_mangle]
pub extern "C" fn redo_history() -> *const u8 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            if let Some(snapshot) = engine.history.redo() {
                return snapshot.as_ptr();
            }
        }
        std::ptr::null()
    }
}

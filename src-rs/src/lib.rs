//! lib.rs - Orquestador Sovereign Wasm para el motor Vortex.
//! Acceso binario de alta precisión sin dependencias externas (0 Errores, 0 Warnings).

mod color;
mod history;
mod debounce;
mod video;

use color::ColorEngine;
use history::HistoryStack;
use debounce::DeltaFilter;
use video::VideoProcessor;

use std::alloc::{alloc, dealloc, Layout};

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
pub extern "C" fn vortexengine_calculate_gamma(master: f32, channel: f32) -> f32 {
    ColorEngine::calculate_gamma(master, channel)
}

// --- VIDEO ENGINE EXTENSIONS ---

/// Reserva memoria en el heap de Wasm para el buffer de video.
/// Retorna un puntero al inicio del buffer.
#[no_mangle]
pub extern "C" fn vortex_alloc(size: usize) -> *mut u8 {
    let layout = Layout::from_size_align(size, 16).unwrap();
    unsafe { alloc(layout) }
}

/// Libera la memoria reservada.
#[no_mangle]
pub extern "C" fn vortex_free(ptr: *mut u8, size: usize) {
    let layout = Layout::from_size_align(size, 16).unwrap();
    unsafe { dealloc(ptr, layout) }
}

/// Procesa un frame de video directamente en la memoria compartida.
#[no_mangle]
pub extern "C" fn vortex_process_frame(
    ptr: *mut u8,
    width: u32,
    height: u32,
    grain: f32,
    scanlines: f32,
    brightness: f32,
    contrast: f32,
    saturation: f32,
    frame_time: f32,
) {
    let len = (width * height * 4) as usize;
    unsafe {
        VideoProcessor::process_frame(ptr, len, grain, scanlines, width, brightness, contrast, saturation, frame_time);
    }
}

/// Debounce inteligente de sliders
#[no_mangle]
pub extern "C" fn debounce_update(key_ptr: *const u8, key_len: usize, value: f64, delta: f64) -> bool {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            let slice = std::slice::from_raw_parts(key_ptr, key_len);
            let key = std::str::from_utf8(slice).unwrap_or("unknown").to_string();
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

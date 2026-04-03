//! lib.rs - Orquestador Sovereign Wasm para el motor Vortex.
//! Acceso binario de alta precisión sin dependencias externas (0 Errores, 0 Warnings).

mod color;
mod history;
mod debounce;
mod video;
mod spatial;
mod state;

use color::ColorEngine;
use history::HistoryStack;
use debounce::DeltaFilter;
use video::VideoProcessor;
use spatial::SpatialEngine;
use state::StateMachine;

use std::alloc::{alloc, dealloc, Layout};

// Global engine instance stored as a static mutable (standard for raw Wasm modules)
// For multithreading safety we would use Mutex, but for JS-single-thread it's atomic.
static mut ENGINE_INSTANCE: Option<VortexEngine> = None;

pub struct VortexEngine {
    history: HistoryStack,
    filter: DeltaFilter,
    main_buffer: Vec<u8>,
    spatial: SpatialEngine,
    pub state_machine: StateMachine,
}

impl VortexEngine {
    pub fn new() -> Self {
        Self {
            history: HistoryStack::new(100),
            filter: DeltaFilter::new(),
            main_buffer: Vec::new(),
            spatial: SpatialEngine::new(),
            state_machine: StateMachine::new(),
        }
    }

    pub fn init_pipeline(&mut self, width: u32, height: u32) {
        let size = (width * height * 4) as usize;
        if self.main_buffer.capacity() < size {
            // Re-alojar de forma soberana
            self.main_buffer = vec![0u8; size];
        } else if self.main_buffer.len() < size {
            self.main_buffer.resize(size, 0);
        }
    }

    pub fn get_main_buffer_ptr(&mut self) -> *mut u8 {
        self.main_buffer.as_mut_ptr()
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

// --- VIDEO MAIN BUFFER PIPELINE ---

#[no_mangle]
pub extern "C" fn vortex_init_pipeline(width: u32, height: u32) {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.init_pipeline(width, height);
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_get_main_buffer_ptr() -> *mut u8 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.get_main_buffer_ptr()
        } else {
            std::ptr::null_mut()
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_process_frame_in_place(
    width: u32,
    height: u32,
    grain: f32,
    scanlines: f32,
    brightness: f32,
    contrast: f32,
    saturation: f32,
    frame_time: f32,
) {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            let ptr = engine.get_main_buffer_ptr();
            let len = (width * height * 4) as usize;
            if !ptr.is_null() && engine.main_buffer.len() >= len {
                VideoProcessor::process_frame(ptr, len, grain, scanlines, width, brightness, contrast, saturation, frame_time);
            }
        }
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

// --- SPATIAL ENGINE DIRECT PIPELINE ---

#[no_mangle]
pub extern "C" fn vortex_sync_layer(id: u16, x: f32, y: f32, width: f32, height: f32, locked: bool, visible: bool) {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.sync_layer(id, x, y, width, height, locked, visible);
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_hit_test(mouse_x: f32, mouse_y: f32) -> u16 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.hit_test(mouse_x, mouse_y)
        } else {
            0
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_drag_update(delta_x: f32, delta_y: f32) {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.drag_update(delta_x, delta_y);
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_get_layer_x(id: u16) -> f32 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.get_layer_x(id)
        } else {
            0.0
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_get_layer_y(id: u16) -> f32 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.get_layer_y(id)
        } else {
            0.0
        }
    }
}

// --- STATE MACHINE GOVERNANCE ---

#[no_mangle]
pub extern "C" fn vortex_hydrate_state(json_ptr: *const u8, len: usize) -> bool {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            let slice = std::slice::from_raw_parts(json_ptr, len);
            if let Ok(json_str) = std::str::from_utf8(slice) {
                return engine.state_machine.hydrate(json_str);
            }
        }
        false
    }
}

// Como devolver un string JSON desde FFI es tedioso de allocar cada ciclo,
// se expone un puntero estático de lectura que es seguro (read-only)
// en un modelo mono-hilo interactivo. JS usará un String Decoder.
#[no_mangle]
pub extern "C" fn vortex_get_state() -> *const u8 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            return engine.state_machine.get_json();
        }
        std::ptr::null()
    }
}

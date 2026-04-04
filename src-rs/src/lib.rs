//! lib.rs - Orquestador Sovereign Wasm para el motor Vortex.
//! Acceso binario de alta precisión sin dependencias externas (0 Errores, 0 Warnings).

mod history;
mod debounce;
mod video;
mod spatial;
mod state;
mod animation;

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

impl Default for VortexEngine {
    fn default() -> Self {
        Self::new()
    }
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

// --- CALCULO GAMMA ---
// Removido por ineficiencia de FFI overhead. Realizado en JS para parámetros simples
// y en VideoProcessor SIMD para cuadros masivos.

// --- VIDEO ENGINE EXTENSIONS ---

/// Reserva memoria en el heap de Wasm para el buffer de video.
/// Retorna un puntero al inicio del buffer.
///
/// # Safety
///
/// Esta función es insegura porque devuelve un puntero sin gestionar de forma atómica.
/// El llamador debe asegurarse de liberar esta memoria usando `vortex_free`.
#[no_mangle]
pub unsafe extern "C" fn vortex_alloc(size: usize) -> *mut u8 {
    let layout = Layout::from_size_align(size, 16).unwrap();
    alloc(layout)
}

/// Libera la memoria reservada.
///
/// # Safety
///
/// Esta función es insegura ya que desreferencia un puntero de memoria cruda.
/// El llamador debe asegurarse de que el puntero sea válido y haya sido obtenido vía `vortex_alloc`.
#[no_mangle]
pub unsafe extern "C" fn vortex_free(ptr: *mut u8, size: usize) {
    let layout = Layout::from_size_align(size, 16).unwrap();
    dealloc(ptr, layout)
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

/// Procesa un cuadro de video aplicando todos los filtros en una sola pasada SIMD.
///
/// # Safety
///
/// Esta función desreferencia el puntero interno del buffer gestionado de forma soberana.
/// El llamador debe asegurar que el motor haya sido inicializado.
#[no_mangle]
#[allow(clippy::too_many_arguments)]
pub unsafe extern "C" fn vortex_process_frame_in_place(
    width: u32,
    height: u32,
    grain: f32,
    scanlines: f32,
    brightness: f32,
    contrast: f32,
    saturation: f32,
    gamma: f32,
    gamma_r: f32,
    gamma_g: f32,
    gamma_b: f32,
    chromatic_aberration: f32,
    frame_time: f32,
) {
    // # Safety: Esta función desreferencia el puntero interno del buffer gestionado de forma soberana.
    if let Some(ref mut engine) = ENGINE_INSTANCE {
        let ptr = engine.get_main_buffer_ptr();
        let len = (width * height * 4) as usize;
        if !ptr.is_null() && engine.main_buffer.len() >= len {
            VideoProcessor::process_frame(
                ptr,
                len,
                grain,
                scanlines,
                width,
                brightness,
                contrast,
                saturation,
                gamma,
                gamma_r,
                gamma_g,
                gamma_b,
                chromatic_aberration,
                frame_time,
            );
        }
    }
}

/// Mezcla dos buffers de video en memoria Wasm
///
/// # Safety
///
/// Los punteros deben ser válidos y tener la misma longitud `len`.
#[no_mangle]
pub unsafe extern "C" fn vortex_blend_layers(base_ptr: *mut u8, overlay_ptr: *const u8, len: usize, opacity: f32) {
    if let Some(_) = ENGINE_INSTANCE {
        VideoProcessor::blend_layers(base_ptr, overlay_ptr, len, opacity);
    }
}

/// Debounce inteligente de sliders
///
/// # Safety
///
/// Esta función desreferencia `key_ptr` asumiendo que es un buffer UTF-8 válido de longitud `key_len`.
#[no_mangle]
pub unsafe extern "C" fn debounce_update(key_ptr: *const u8, key_len: usize, value: f64, delta: f64) -> bool {
    if let Some(ref mut engine) = ENGINE_INSTANCE {
        let slice = std::slice::from_raw_parts(key_ptr, key_len);
        let key = std::str::from_utf8(slice).unwrap_or("unknown").to_string();
        engine.filter.check_significant_change(key, value, delta)
    } else {
        true
    }
}

/// Guarda un estado en el historial
///
/// # Safety
///
/// Esta función desreferencia `snapshot_ptr` asumiendo que apunta a memoria válida de longitud `len`.
#[no_mangle]
pub unsafe extern "C" fn push_history(snapshot_ptr: *const u8, len: usize) {
    if let Some(ref mut engine) = ENGINE_INSTANCE {
        let slice = std::slice::from_raw_parts(snapshot_ptr, len);
        engine.history.push(slice.to_vec());
    }
}

/// Retrocede en el historial
///
/// # Safety
///
/// Devuelve un puntero a memoria interna que debe ser tratada como solo lectura.
#[no_mangle]
pub unsafe extern "C" fn undo_history() -> *const u8 {
    if let Some(ref mut engine) = ENGINE_INSTANCE {
        if let Some(snapshot) = engine.history.undo() {
            // Para simplificar, devolvemos un puntero estático (requeriría gestión de memoria real en Prod)
            return snapshot.as_ptr();
        }
    }
    std::ptr::null()
}

/// Avanza en el historial
///
/// # Safety
///
/// Devuelve un puntero a memoria interna que debe ser tratada como solo lectura.
#[no_mangle]
pub unsafe extern "C" fn redo_history() -> *const u8 {
    if let Some(ref mut engine) = ENGINE_INSTANCE {
        if let Some(snapshot) = engine.history.redo() {
            return snapshot.as_ptr();
        }
    }
    std::ptr::null()
}

// --- SPATIAL ENGINE DIRECT PIPELINE ---

#[no_mangle]
pub extern "C" fn vortex_sync_layer(id: u16, x: f32, y: f32, width: f32, height: f32, rotation: f32, scale: f32, locked: bool, visible: bool) {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.sync_layer(id, x, y, width, height, rotation, scale, locked, visible);
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
pub extern "C" fn vortex_drag_update(mouse_x: f32, mouse_y: f32) {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.drag_update(mouse_x, mouse_y);
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_release() -> u16 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.release()
        } else {
            0
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_get_active_layer_id() -> u16 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.get_active_layer_id()
        } else {
            0
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

#[no_mangle]
pub extern "C" fn vortex_get_layer_scale(id: u16) -> f32 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.get_layer_scale(id)
        } else {
            1.0
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_get_layer_rotation(id: u16) -> f32 {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.get_layer_rotation(id)
        } else {
            0.0
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_scale_update(delta: f32) {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.scale_update(delta);
        }
    }
}

#[no_mangle]
pub extern "C" fn vortex_rotate_update(delta: f32) {
    unsafe {
        if let Some(ref mut engine) = ENGINE_INSTANCE {
            engine.spatial.rotate_update(delta);
        }
    }
}

// --- STATE MACHINE GOVERNANCE ---

/// Hidrata el estado de la máquina desde un JSON
///
/// # Safety
///
/// Esta función desreferencia `json_ptr` asumiendo un string UTF-8 válido.
#[no_mangle]
pub unsafe extern "C" fn vortex_hydrate_state(json_ptr: *const u8, len: usize) -> bool {
    if let Some(ref mut engine) = ENGINE_INSTANCE {
        let slice = std::slice::from_raw_parts(json_ptr, len);
        if let Ok(json_str) = std::str::from_utf8(slice) {
            return engine.state_machine.hydrate(json_str);
        }
    }
    false
}

// Como devolver un string JSON desde FFI es tedioso de allocar cada ciclo,
// se expone un puntero estático de lectura que es seguro (read-only)
// en un modelo mono-hilo interactivo. JS usará un String Decoder.
///
/// # Safety
///
/// Devuelve un puntero a la memoria interna del estado JSON. El llamador no debe liberar esta memoria.
#[no_mangle]
pub unsafe extern "C" fn vortex_get_state() -> *const u8 {
    if let Some(ref mut engine) = ENGINE_INSTANCE {
        return engine.state_machine.get_json();
    }
    std::ptr::null()
}

/// Obtiene un valor interpolado desde el motor de animación de Rust
///
/// # Safety
///
/// Desreferencia `layer_id_ptr` y `prop_ptr` como strings UTF-8.
#[no_mangle]
pub unsafe extern "C" fn vortex_get_interpolated_value(
    layer_id_ptr: *const u8, layer_id_len: usize,
    prop_ptr: *const u8, prop_len: usize,
    time: f32, default_val: f32
) -> f32 {
    if let Some(ref engine) = ENGINE_INSTANCE {
        let l_slice = std::slice::from_raw_parts(layer_id_ptr, layer_id_len);
        let p_slice = std::slice::from_raw_parts(prop_ptr, prop_len);
        
        let layer_id = std::str::from_utf8(l_slice).unwrap_or("");
        let property = std::str::from_utf8(p_slice).unwrap_or("");
        
        engine.state_machine.get_interpolated_value(layer_id, property, time, default_val)
    } else {
        default_val
    }
}

/// Obtiene un color Hex interpolado desde Rust
///
/// # Safety
///
/// Desreferencia punteros de string UTF-8.
#[no_mangle]
pub unsafe extern "C" fn vortex_get_interpolated_color(
    layer_id_ptr: *const u8, layer_id_len: usize,
    prop_ptr: *const u8, prop_len: usize,
    time: f32, default_hex_ptr: *const u8, default_hex_len: usize
) -> *const u8 {
    if let Some(ref mut engine) = ENGINE_INSTANCE {
        let l_slice = std::slice::from_raw_parts(layer_id_ptr, layer_id_len);
        let p_slice = std::slice::from_raw_parts(prop_ptr, prop_len);
        let d_slice = std::slice::from_raw_parts(default_hex_ptr, default_hex_len);
        
        let layer_id = std::str::from_utf8(l_slice).unwrap_or("");
        let property = std::str::from_utf8(p_slice).unwrap_or("");
        let default_hex = std::str::from_utf8(d_slice).unwrap_or("#ffffff");
        
        engine.state_machine.get_interpolated_color(layer_id, property, time, default_hex)
    } else {
        std::ptr::null()
    }
}

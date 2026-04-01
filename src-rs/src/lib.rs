use wasm_bindgen::prelude::*;
use std::collections::HashMap;

#[wasm_bindgen]
pub struct VortexEngine {
    history: Vec<Vec<u8>>,
    last_values: HashMap<String, f64>,
}

#[wasm_bindgen]
impl VortexEngine {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        Self {
            history: Vec::with_capacity(100),
            last_values: HashMap::new(),
        }
    }

    /// Calcula las curvas de forma precisa en Rust
    pub fn calculate_gamma(master: f32, channel: f32) -> f32 {
        master * channel
    }

    /// Debounce inteligente: retorna true si el cambio es significativo (superior a delta)
    pub fn debounce_update(&mut self, key: String, value: f64, delta: f64) -> bool {
        let last_val = self.last_values.get(&key).cloned().unwrap_or(-1.0);
        let diff = (value - last_val).abs();
        
        if diff >= delta {
            self.last_values.insert(key, value);
            true
        } else {
            false
        }
    }

    /// Guarda un snapshot binario del estado (simulado con Vec<u8> para este MVP)
    pub fn push_history(&mut self, snapshot: Vec<u8>) {
        if self.history.len() >= 100 {
            self.history.remove(0);
        }
        self.history.push(snapshot);
    }
}

#[wasm_bindgen]
pub fn init_engine() -> VortexEngine {
    VortexEngine::new()
}

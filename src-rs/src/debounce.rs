//! debounce.rs - Filtro de deltas para entradas analógicas (sliders).

use std::collections::HashMap;

pub struct DeltaFilter {
    /// Último valor procesado por clave de control
    last_values: HashMap<String, f64>,
}

impl Default for DeltaFilter {
    fn default() -> Self {
        Self::new()
    }
}

impl DeltaFilter {
    pub fn new() -> Self {
        Self {
            last_values: HashMap::new(),
        }
    }

    /// Retorna true si el cambio es significativo (superior al delta)
    pub fn check_significant_change(&mut self, key: String, value: f64, delta: f64) -> bool {
        let last_val = self.last_values.get(&key).cloned().unwrap_or(-1.0);
        let diff = (value - last_val).abs();
        
        if diff >= delta {
            self.last_values.insert(key, value);
            true
        } else {
            false
        }
    }
}

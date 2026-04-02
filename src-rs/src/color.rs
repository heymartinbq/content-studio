//! color.rs - Motor de cálculo puro para gradación y curvas sRGB.

pub struct ColorEngine;

impl ColorEngine {
    /// Calcula el exponente Gamma corregido entre el canal maestro y el individual.
    /// Garantiza precisión decimal f32 para el pipeline de filtros SVG.
    pub fn calculate_gamma(master: f32, channel: f32) -> f32 {
        master * channel
    }
}

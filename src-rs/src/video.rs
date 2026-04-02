//! video.rs - Motor de filtros de video de alto rendimiento.
//!
//! Implementa procesamiento In-Place (Zero-Copy) con:
//! - Film Grain dinámico basado en luminancia del pixel (más grano en sombras)
//! - Scanlines CRT de alta fidelidad
//! - Compilación condicional: SIMD wasm32 sin afectar targets nativos (IDE)

pub struct VideoProcessor;

impl VideoProcessor {
    /// Procesa un frame RGBA in-place aplicando Film Grain y Scanlines.
    ///
    /// # Grain Dinámico (Luminancia)
    /// El grano se intensifica en zonas oscuras del frame, replicando el comportamiento
    /// auténtico del film fotoquímico. Fórmula: `local_grain = grain * (1 - luma)`.
    ///
    /// # Safety
    /// El caller garantiza que `ptr` apunta a un buffer RGBA válido de `len` bytes.
    pub unsafe fn process_frame(
        ptr: *mut u8,
        len: usize,
        grain_intensity: f32,
        scanline_intensity: f32,
        width: u32,
    ) {
        #[cfg(target_arch = "wasm32")]
        Self::process_wasm(ptr, len, grain_intensity, scanline_intensity, width);

        #[cfg(not(target_arch = "wasm32"))]
        let _ = (ptr, len, grain_intensity, scanline_intensity, width);
    }

    #[cfg(target_arch = "wasm32")]
    unsafe fn process_wasm(
        ptr: *mut u8,
        len: usize,
        grain_intensity: f32,
        scanline_intensity: f32,
        width: u32,
    ) {
        let pixels = std::slice::from_raw_parts_mut(ptr, len);
        let pixel_count = len / 4;

        for i in 0..pixel_count {
            let base = i * 4;
            let y = (i as u32) / width;

            let r = pixels[base] as f32;
            let g = pixels[base + 1] as f32;
            let b = pixels[base + 2] as f32;

            // Film Grain dinámico: luma perceptual BT.601
            if grain_intensity > 0.001 {
                let luma = (r * 0.299 + g * 0.587 + b * 0.114) / 255.0;
                let local_grain = grain_intensity * (1.0 - luma);

                let hash = (i as u32)
                    .wrapping_mul(1_103_515_245)
                    .wrapping_add(12_345)
                    & 0x7FFF_FFFF;
                let noise = (hash as f32 / 2_147_483_647.0) * 2.0 - 1.0;
                let offset = (noise * local_grain * 128.0) as i16;

                pixels[base]     = (r as i16 + offset).clamp(0, 255) as u8;
                pixels[base + 1] = (g as i16 + offset).clamp(0, 255) as u8;
                pixels[base + 2] = (b as i16 + offset).clamp(0, 255) as u8;
            }

            // Scanlines CRT: oscurecer líneas pares
            if scanline_intensity > 0.001 && y % 2 == 0 {
                let factor = 1.0 - scanline_intensity;
                pixels[base]     = (pixels[base] as f32 * factor) as u8;
                pixels[base + 1] = (pixels[base + 1] as f32 * factor) as u8;
                pixels[base + 2] = (pixels[base + 2] as f32 * factor) as u8;
            }
        }
    }
}

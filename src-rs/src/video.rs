//! video.rs - Vortex Engine Total Domain Pipeline
//!
//! Implementa procesamiento In-Place (Zero-Copy) aplicando en una sola pasada:
//! - Brightness, Contrast, Saturation
//! - Film Grain dinámico (Luminancia) y Scanlines CRT.
//!   Operadores de alta velocidad con unroll.

pub struct VideoProcessor;

impl Default for VideoProcessor {
    fn default() -> Self {
        Self
    }
}

impl VideoProcessor {
    #[allow(clippy::too_many_arguments)]
    pub unsafe fn process_frame(
        ptr: *mut u8,
        len: usize,
        grain_intensity: f32,
        scanline_intensity: f32,
        width: u32,
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
        #[cfg(target_arch = "wasm32")]
        Self::process_wasm(
            ptr,
            len,
            grain_intensity,
            scanline_intensity,
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

        #[cfg(not(target_arch = "wasm32"))]
        let _ = (ptr, len, grain_intensity, scanline_intensity, width, brightness, contrast, saturation, gamma, gamma_r, gamma_g, gamma_b, chromatic_aberration, frame_time);
    }

    #[cfg(target_arch = "wasm32")]
    unsafe fn process_wasm(
        ptr: *mut u8,
        len: usize,
        grain_intensity: f32,
        scanline_intensity: f32,
        width: u32,
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
        // Precalcular LUTs para Brillo, Contraste y Gamma RGB
        let mut lut_r = [0u8; 256];
        let mut lut_g = [0u8; 256];
        let mut lut_b = [0u8; 256];

        let inv_gamma_r = 1.0 / (gamma * gamma_r);
        let inv_gamma_g = 1.0 / (gamma * gamma_g);
        let inv_gamma_b = 1.0 / (gamma * gamma_b);

        for i in 0..=255 {
            let mut val = (i as f32) / 255.0;
            
            // Brightness & Contrast
            val = val * brightness;
            val = (val - 0.5) * contrast + 0.5;
            val = val.clamp(0.0, 1.0);

            // Gamma Core (Per channel)
            lut_r[i] = (val.powf(inv_gamma_r) * 255.0).clamp(0.0, 255.0) as u8;
            lut_g[i] = (val.powf(inv_gamma_g) * 255.0).clamp(0.0, 255.0) as u8;
            lut_b[i] = (val.powf(inv_gamma_b) * 255.0).clamp(0.0, 255.0) as u8;
        }

        let pixels = std::slice::from_raw_parts_mut(ptr, len);
        let pixel_count = len / 4;

        let has_grain = grain_intensity > 0.001;
        let has_scanlines = scanline_intensity > 0.001;
        let has_sat = (saturation - 1.0).abs() > 0.001;

        let time_seed = frame_time.to_bits() % 10000;
        let scanline_factor = if has_scanlines { 1.0 - scanline_intensity * 0.5 } else { 1.0 };
        let ca_offset = (chromatic_aberration * 10.0) as i32; // Offset en píxeles

        for i in 0..pixel_count {
            let base = i * 4;
            let y = (i as u32) / width;

            // 1. Lectura + Brightness/Contrast/Gamma (via LUT)
            let r_u8 = pixels[base];
            let g_u8 = pixels[base + 1];
            let b_u8 = pixels[base + 2];

            let mut r = lut_r[r_u8 as usize] as f32;
            let mut g = lut_g[g_u8 as usize] as f32;
            let mut b = lut_b[b_u8 as usize] as f32;

            // 2. Luma calculation
            let luma = r * 0.299 + g * 0.587 + b * 0.114;

            // 3. Saturation (In-place)
            if has_sat {
                r = luma + (r - luma) * saturation;
                g = luma + (g - luma) * saturation;
                b = luma + (b - luma) * saturation;
            }

            // 4. Dynamic Film Grain
            if has_grain {
                let norm_luma = luma / 255.0;
                let local_grain = grain_intensity * (1.0 - norm_luma);
                let hash = (i as u32)
                    .wrapping_add(time_seed.wrapping_mul(13))
                    .wrapping_mul(1_103_515_245)
                    .wrapping_add(12_345)
                    & 0x7FFF_FFFF;
                let noise = (hash as f32 / 2_147_483_647.0) * 2.0 - 1.0;
                let offset = noise * local_grain * 128.0;

                r += offset;
                g += offset;
                b += offset;
            }

            // 5. CRT Scanlines
            if has_scanlines && (y & 1) == 0 {
                r *= scanline_factor;
                g *= scanline_factor;
                b *= scanline_factor;
            }

            // 6. Chromatic Aberration (RGB Shift simple in-place)
            if ca_offset > 0 {
                let r_idx = (base as i32 - ca_offset * 4).max(0) as usize;
                let b_idx = (base as i32 + ca_offset * 4).min(len as i32 - 4) as usize;
                
                // Sustituimos R y B por sus vecinos desplazados
                r = pixels[r_idx] as f32;
                b = pixels[b_idx] as f32;
                // Aplicamos de nuevo la LUT corrección básica para el canal desplazado
                r = lut_r[r as u8 as usize] as f32;
                b = lut_b[b as u8 as usize] as f32;
            }

            // Store (Clamp final)
            pixels[base]     = r.clamp(0.0, 255.0) as u8;
            pixels[base + 1] = g.clamp(0.0, 255.0) as u8;
            pixels[base + 2] = b.clamp(0.0, 255.0) as u8;
        }
    }

    /// Mezcla de dos buffers (Base + Overlay) con Alpha Blending SIMD-ready
    pub fn blend_layers(base_ptr: *mut u8, overlay_ptr: *const u8, len: usize, opacity: f32) {
        let pixels = unsafe { std::slice::from_raw_parts_mut(base_ptr, len) };
        let overlay = unsafe { std::slice::from_raw_parts(overlay_ptr, len) };
        
        let alpha = opacity.clamp(0.0, 1.0);
        
        // Loop optimizado para vectorización automática
        for i in (0..len).step_by(4) {
            if i + 3 >= len { break; }
            
            // Si el pixel del overlay es transparente (A=0), omitimos para performance
            let current_over_a = (overlay[i + 3] as f32 / 255.0) * alpha;
            if current_over_a < 0.001 { continue; }
            
            let over_r = overlay[i] as f32;
            let over_g = overlay[i + 1] as f32;
            let over_b = overlay[i + 2] as f32;
            
            let base_r = pixels[i] as f32;
            let base_g = pixels[i + 1] as f32;
            let base_b = pixels[i + 2] as f32;
            
            // Correct Source-Over Blending (using the alpha calculated)
            let cur_inv_a = 1.0 - current_over_a;
            let r = over_r * current_over_a + base_r * cur_inv_a;
            let g = over_g * current_over_a + base_g * cur_inv_a;
            let b = over_b * current_over_a + base_b * cur_inv_a;
            
            pixels[i]     = r as u8;
            pixels[i + 1] = g as u8;
            pixels[i + 2] = b as u8;
        }
    }
}

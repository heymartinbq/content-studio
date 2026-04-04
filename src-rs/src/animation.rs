pub enum EasingType {
    Linear,
    EaseIn,
    EaseOut,
    EaseInOut,
}

impl From<&str> for EasingType {
    fn from(s: &str) -> Self {
        match s {
            "easeIn" => EasingType::EaseIn,
            "easeOut" => EasingType::EaseOut,
            "easeInOut" => EasingType::EaseInOut,
            _ => EasingType::Linear,
        }
    }
}

/// Motor de Interpolación Sovereign
pub struct AnimationEngine;

impl AnimationEngine {
    pub fn lerp(start: f32, end: f32, t: f32, easing: EasingType) -> f32 {
        let t = match easing {
            EasingType::Linear => t,
            EasingType::EaseIn => t * t * t,
            EasingType::EaseOut => 1.0 - (1.0 - t).powi(3),
            EasingType::EaseInOut => {
                if t < 0.5 {
                    4.0 * t * t * t
                } else {
                    1.0 - (-2.0 * t + 2.0).powi(3) / 2.0
                }
            }
        };
        start + (end - start) * t.clamp(0.0, 1.0)
    }

    pub fn lerp_color(start_hex: &str, end_hex: &str, t: f32) -> String {
        let s_rgb = Self::hex_to_rgb(start_hex);
        let e_rgb = Self::hex_to_rgb(end_hex);
        
        let r = (s_rgb.0 as f32 + (e_rgb.0 as f32 - s_rgb.0 as f32) * t) as u8;
        let g = (s_rgb.1 as f32 + (e_rgb.1 as f32 - s_rgb.1 as f32) * t) as u8;
        let b = (s_rgb.2 as f32 + (e_rgb.2 as f32 - s_rgb.2 as f32) * t) as u8;
        
        format!("#{:02x}{:02x}{:02x}", r, g, b)
    }

    fn hex_to_rgb(hex: &str) -> (u8, u8, u8) {
        let hex = hex.trim_start_matches('#');
        if hex.len() != 6 { return (255, 255, 255); }
        let r = u8::from_str_radix(&hex[0..2], 16).unwrap_or(255);
        let g = u8::from_str_radix(&hex[2..4], 16).unwrap_or(255);
        let b = u8::from_str_radix(&hex[4..6], 16).unwrap_or(255);
        (r, g, b)
    }
}

use serde::{Serialize, Deserialize};
use crate::animation::{AnimationEngine, EasingType};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GradientStop {
    pub color: String,
    pub position: u8,
    pub opacity: f32,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct GradientConfig {
    #[serde(rename = "type")]
    pub gradient_type: String,
    pub angle: i32,
    pub stops: Vec<GradientStop>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Keyframe {
    pub id: String,
    pub time: f32,
    pub value: serde_json::Value,
    pub easing: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Layer {
    pub id: String,
    pub name: String,
    #[serde(rename = "type")]
    pub layer_type: String,
    pub text: Option<String>,
    #[serde(rename = "fontSize")]
    pub font_size: Option<f32>,
    #[serde(rename = "fontFamily")]
    pub font_family: Option<String>,
    pub color: Option<String>,
    #[serde(rename = "colorSecondary")]
    pub color_secondary: Option<String>,
    #[serde(rename = "fillOpacity")]
    pub fill_opacity: Option<f32>,
    #[serde(rename = "gradientConfig")]
    pub gradient_config: Option<GradientConfig>,
    #[serde(rename = "glowIntensity")]
    pub glow_intensity: Option<f32>,
    #[serde(rename = "sparkleSpeed")]
    pub sparkle_speed: Option<f32>,
    #[serde(rename = "neonEmboss")]
    pub neon_emboss: Option<bool>,
    #[serde(rename = "diegeticTexture")]
    pub diegetic_texture: Option<bool>,
    pub glitch: Option<bool>,
    #[serde(rename = "chromaticAberration")]
    pub chromatic_aberration: Option<bool>,
    pub bloom: Option<bool>,
    #[serde(rename = "lightWrap")]
    pub light_wrap: Option<bool>,
    #[serde(rename = "textureIntensity")]
    pub texture_intensity: Option<f32>,
    #[serde(rename = "editorialStyle")]
    pub editorial_style: Option<String>,
    #[serde(rename = "textAlign")]
    pub text_align: Option<String>,
    #[serde(rename = "mixBlendMode")]
    pub mix_blend_mode: Option<String>,
    pub locked: Option<bool>,
    pub visible: Option<bool>,
    pub opacity: Option<f32>,
    #[serde(rename = "selectionBorderColor")]
    pub selection_border_color: Option<String>,
    #[serde(rename = "selectionBorderWidth")]
    pub selection_border_width: Option<f32>,
    pub x: Option<f32>,
    pub y: Option<f32>,
    pub rotation: Option<f32>,
    pub scale: Option<f32>,
    pub keyframes: Option<std::collections::HashMap<String, Vec<Keyframe>>>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct EditorConfig {
    #[serde(rename = "aspectRatio")]
    pub aspect_ratio: String,
    #[serde(rename = "videoUrl")]
    pub video_url: String,
    #[serde(rename = "videoOpacity")]
    pub video_opacity: f32,
    #[serde(rename = "videoBlur")]
    pub video_blur: f32,
    #[serde(rename = "videoBrightness")]
    pub video_brightness: f32,
    #[serde(rename = "videoContrast")]
    pub video_contrast: f32,
    #[serde(rename = "videoSaturation")]
    pub video_saturation: f32,
    #[serde(rename = "videoHue")]
    pub video_hue: f32,
    #[serde(rename = "showImmersiveOverlay")]
    pub show_immersive_overlay: bool,
    #[serde(rename = "vignetteIntensity")]
    pub vignette_intensity: f32,
    #[serde(rename = "vignetteRadius")]
    pub vignette_radius: f32,
    #[serde(rename = "vignetteColor")]
    pub vignette_color: String,
    #[serde(rename = "useWebcam")]
    pub use_webcam: bool,
    #[serde(rename = "webcamOpacity")]
    pub webcam_opacity: f32,
    #[serde(rename = "webcamBlur")]
    pub webcam_blur: f32,
    #[serde(rename = "noiseIntensity")]
    pub noise_intensity: f32,
    #[serde(rename = "videoGamma")]
    pub video_gamma: f32,
    #[serde(rename = "videoGammaR")]
    pub video_gamma_r: f32,
    #[serde(rename = "videoGammaG")]
    pub video_gamma_g: f32,
    #[serde(rename = "videoGammaB")]
    pub video_gamma_b: f32,
    #[serde(rename = "immersiveGrain")]
    pub immersive_grain: f32,
    #[serde(rename = "immersiveScanlines")]
    pub immersive_scanlines: f32,
    #[serde(rename = "chromaticAberration")]
    pub chromatic_aberration: f32,
    pub layers: Vec<Layer>,
}

pub struct StateMachine {
    pub current_state: EditorConfig,
    pub last_json: String,
}

impl Default for StateMachine {
    fn default() -> Self {
        Self::new()
    }
}

impl StateMachine {
    pub fn new() -> Self {
        // Inicializar vacío, JS nos pasará el estado inicial
        Self {
            current_state: EditorConfig {
                aspect_ratio: "16/9".to_string(),
                video_url: "/".to_string(),
                video_opacity: 1.0,
                video_blur: 0.0,
                video_brightness: 1.0,
                video_contrast: 1.0,
                video_saturation: 1.0,
                video_hue: 0.0,
                show_immersive_overlay: false,
                vignette_intensity: 0.0,
                vignette_radius: 0.0,
                vignette_color: "#000000".to_string(),
                use_webcam: false,
                webcam_opacity: 1.0,
                webcam_blur: 0.0,
                noise_intensity: 0.0,
                video_gamma: 1.0,
                video_gamma_r: 1.0,
                video_gamma_g: 1.0,
                video_gamma_b: 1.0,
                immersive_grain: 0.0,
                immersive_scanlines: 0.0,
                chromatic_aberration: 0.0,
                layers: Vec::new(),
            },
            last_json: String::new(),
        }
    }

    pub fn hydrate(&mut self, json_str: &str) -> bool {
        if let Ok(config) = serde_json::from_str::<EditorConfig>(json_str) {
            self.current_state = config;
            return true;
        }
        false
    }

    pub fn get_json(&mut self) -> *const u8 {
        self.last_json = serde_json::to_string(&self.current_state).unwrap_or_else(|_| "{}".to_string());
        // Null terminated string para C-Str reading
        self.last_json.push('\0');
        self.last_json.as_ptr()
    }

    /// Calcula el valor interpolado de una propiedad para una capa en un tiempo T
    pub fn get_interpolated_value(&self, layer_id: &str, property: &str, time: f32, default_val: f32) -> f32 {
        let layer = if let Some(l) = self.current_state.layers.iter().find(|l| l.id == layer_id) {
            l
        } else {
            return default_val;
        };

        if let Some(keyframes_map) = &layer.keyframes {
            if let Some(keyframes) = keyframes_map.get(property) {
                if keyframes.is_empty() { return default_val; }
                
                let mut sorted_kf = keyframes.clone();
                sorted_kf.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());

                if time <= sorted_kf[0].time {
                    return sorted_kf[0].value.as_f64().unwrap_or(default_val as f64) as f32;
                }
                
                if time >= sorted_kf.last().unwrap().time {
                    return sorted_kf.last().unwrap().value.as_f64().unwrap_or(default_val as f64) as f32;
                }

                for i in 0..sorted_kf.len() - 1 {
                    let start_kf = &sorted_kf[i];
                    let end_kf = &sorted_kf[i+1];
                    
                    if time >= start_kf.time && time <= end_kf.time {
                        let duration = end_kf.time - start_kf.time;
                        let t = (time - start_kf.time) / duration;
                        let start_val = start_kf.value.as_f64().unwrap_or(default_val as f64) as f32;
                        let end_val = end_kf.value.as_f64().unwrap_or(default_val as f64) as f32;
                        let easing = EasingType::from(start_kf.easing.as_deref().unwrap_or("linear"));
                        
                        return AnimationEngine::lerp(start_val, end_val, t, easing);
                    }
                }
            }
        }
        
        default_val
    }

    /// Calcula el color interpolado (Hex) para una capa en un tiempo T
    pub fn get_interpolated_color(&mut self, layer_id: &str, property: &str, time: f32, default_hex: &str) -> *const u8 {
        let layer = if let Some(l) = self.current_state.layers.iter().find(|l| l.id == layer_id) {
            l
        } else {
            self.last_json = default_hex.to_string();
            self.last_json.push('\0');
            return self.last_json.as_ptr();
        };

        if let Some(keyframes_map) = &layer.keyframes {
            if let Some(keyframes) = keyframes_map.get(property) {
                if keyframes.is_empty() { 
                    self.last_json = default_hex.to_string();
                } else {
                    let mut sorted_kf = keyframes.clone();
                    sorted_kf.sort_by(|a, b| a.time.partial_cmp(&b.time).unwrap());

                    if time <= sorted_kf[0].time {
                        self.last_json = sorted_kf[0].value.as_str().unwrap_or(default_hex).to_string();
                    } else if time >= sorted_kf.last().unwrap().time {
                        self.last_json = sorted_kf.last().unwrap().value.as_str().unwrap_or(default_hex).to_string();
                    } else {
                        for i in 0..sorted_kf.len() - 1 {
                            let start_kf = &sorted_kf[i];
                            let end_kf = &sorted_kf[i+1];
                            
                            if time >= start_kf.time && time <= end_kf.time {
                                let duration = end_kf.time - start_kf.time;
                                let t = (time - start_kf.time) / duration;
                                let start_hex_val = start_kf.value.as_str().unwrap_or(default_hex);
                                let end_hex_val = end_kf.value.as_str().unwrap_or(default_hex);
                                
                                self.last_json = AnimationEngine::lerp_color(start_hex_val, end_hex_val, t);
                                break;
                            }
                        }
                    }
                }
            } else {
                self.last_json = default_hex.to_string();
            }
        } else {
            self.last_json = default_hex.to_string();
        }

        self.last_json.push('\0');
        self.last_json.as_ptr()
    }
}

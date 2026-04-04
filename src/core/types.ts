/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface GradientStop {
  color: string;
  position: number;
  opacity: number;
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  angle: number;
  stops: GradientStop[];
}

export type AnimationEasing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'elastic';

export interface Keyframe {
  id: string;
  time: number; // en segundos
  value: any;
  easing: AnimationEasing;
}

export interface Layer {
  id: string;
  name: string;
  type: "text" | "video" | "image";
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  colorSecondary?: string;
  fillOpacity?: number;
  gradientConfig?: GradientConfig;
  glowIntensity?: number;
  sparkleSpeed?: number;
  neonEmboss?: boolean;
  diegeticTexture?: boolean;
  glitch?: boolean;
  chromaticAberration?: boolean;
  bloom?: boolean;
  lightWrap?: boolean;
  textureIntensity?: number;
  editorialStyle?: "default" | "minimalist" | "brutalist" | "magazine" | "cyberpunk" | "swiss" | "retro" | "classic";
  mixBlendMode?: string;
  textAlign?: "left" | "center" | "right";
  locked: boolean;
  visible: boolean;
  opacity: number;
  selectionBorderColor?: string;
  selectionBorderWidth?: number;
  x: number;
  y: number;
  keyframes?: Record<string, Keyframe[]>;
}

export interface EditorConfig {
  aspectRatio: string;
  videoUrl: string;
  videoOpacity: number;
  videoBlur: number;
  videoBrightness: number;
  videoContrast: number;
  videoSaturation: number;
  videoHue: number;
  showImmersiveOverlay: boolean;
  vignetteIntensity: number;
  vignetteRadius: number;
  vignetteSoftness: number;
  vignetteColor: string;
  lensDistortion: number;
  halationIntensity: number;
  useWebcam: boolean;
  webcamOpacity: number;
  webcamBlur: number;
  noiseIntensity: number;
  videoGamma: number;
  videoGammaR: number;
  videoGammaG: number;
  videoGammaB: number;
  immersiveGrain: number;
  immersiveScanlines: number;
  chromaticAberration: number;
  layers: Layer[];
}

export interface JournalEntry {
  id: string;
  timestamp: number;
  action: string;
  payload?: any;
}

export interface EditorState {
  config: EditorConfig;
  activeLayerId: string;
  isPreview: boolean;
  showFloatingEditor: boolean;
  journal: JournalEntry[];
  currentTime: number;
  isPlaying: boolean;
  duration: number;
}

export type EditorAction =
  | { type: 'UPDATE_GLOBAL_CONFIG'; payload: Partial<EditorConfig> }
  | { type: 'SELECT_LAYER'; payload: string }
  | { type: 'ADD_LAYER'; payload?: Partial<Layer> }
  | { type: 'REMOVE_LAYER'; payload: string }
  | { type: 'UPDATE_LAYER'; payload: { id: string; updates: Partial<Layer> } }
  | { type: 'DUPLICATE_LAYER'; payload: string }
  | { type: 'TOGGLE_PREVIEW'; payload?: boolean }
  | { type: 'TOGGLE_FLOATING_EDITOR'; payload?: boolean }
  | { type: 'REORDER_LAYERS'; payload: Layer[] }
  | { type: 'UNDO'; payload: EditorConfig }
  | { type: 'REDO'; payload: EditorConfig }
  | { type: 'SET_CURRENT_TIME'; payload: number }
  | { type: 'SET_KEYFRAME'; payload: { layerId: string, property: string, time: number, value: any, easing: any } }
  | { type: 'TOGGLE_PLAYBACK'; payload?: boolean }
  | { type: 'CLEAR_JOURNAL' };

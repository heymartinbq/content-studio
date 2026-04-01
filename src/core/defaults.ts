/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Layer, EditorConfig } from "./types";

export const DEFAULT_LAYER_TEMPLATE: Omit<Layer, "id" | "name"> = {
  type: "text",
  text: "CONTENT STUDIO",
  fontSize: 120,
  fontFamily: "Space Grotesk",
  color: "#00f2ff",
  colorSecondary: "#0066ff",
  fillOpacity: 0.8,
  gradientConfig: {
    type: 'linear',
    angle: 180,
    stops: [
      { color: "#00f2ff", position: 0, opacity: 1 },
      { color: "#0066ff", position: 100, opacity: 1 }
    ]
  },
  glowIntensity: 10,
  sparkleSpeed: 3,
  neonEmboss: true,
  diegeticTexture: true,
  glitch: false,
  chromaticAberration: true,
  bloom: true,
  lightWrap: true,
  textureIntensity: 0.15,
  editorialStyle: "default",
  textAlign: "center",
  mixBlendMode: "normal",
  locked: false,
  visible: true,
  opacity: 1,
  selectionBorderColor: "#3b82f6",
  selectionBorderWidth: 2,
  x: 0,
  y: 0,
};

export const INITIAL_LAYERS: Layer[] = [
  {
    ...DEFAULT_LAYER_TEMPLATE,
    id: "layer-1",
    name: "Texto Principal",
  } as Layer
];

export const INITIAL_CONFIG: EditorConfig = {
  aspectRatio: "16/9",
  videoUrl: "https://assets.mixkit.co/videos/preview/mixkit-abstract-neon-lights-in-motion-27371-large.mp4",
  videoOpacity: 0.8,
  videoBlur: 2,
  videoBrightness: 1,
  videoContrast: 1,
  videoSaturation: 1,
  videoHue: 0,
  showImmersiveOverlay: false,
  vignetteIntensity: 60,
  vignetteRadius: 20,
  vignetteColor: "#000000",
  useWebcam: false,
  webcamOpacity: 100,
  webcamBlur: 0,
  noiseIntensity: 0.05,
  videoGamma: 1.0,
  videoGammaR: 1.0,
  videoGammaG: 1.0,
  videoGammaB: 1.0,
  immersiveGrain: 0.05,
  immersiveScanlines: 0.1,
  layers: INITIAL_LAYERS,
};

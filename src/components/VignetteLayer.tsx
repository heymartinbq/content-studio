/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface VignetteLayerProps {
  intensity: number;
  color: string;
  radius: number;
}

export default function VignetteLayer({ intensity, color, radius }: VignetteLayerProps) {
  return (
    <div
      id="layer-vignette-overlay"
      className="absolute inset-0 pointer-events-none"
      style={{
        background: `radial-gradient(circle, transparent ${radius}%, ${color} ${100 + intensity}%)`,
        mixBlendMode: "multiply",
        opacity: intensity / 100,
      }}
    />
  );
}

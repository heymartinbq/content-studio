/**
 * VideoLayer.tsx - Capa de video con integración del motor Vortex.
 *
 * Cuando grain > 0 o scanlines > 0, el frame es capturado y procesado
 * por VortexCanvas (Rust/Wasm SIMD) en tiempo real.
 */

import { useRef } from "react";
import VortexCanvas from "./VortexCanvas";

interface VideoLayerProps {
  videoUrl: string;
  opacity: number;
  blur: number;
  showImmersiveOverlay?: boolean;
  grain?: number;
  scanlines?: number;
}

export default function VideoLayer({
  videoUrl,
  opacity,
  blur,
  showImmersiveOverlay = false,
  grain = 0,
  scanlines = 0,
}: VideoLayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasVortexEffects = showImmersiveOverlay;

  return (
    <div id="layer-video-bg" className="absolute inset-0 w-full h-full overflow-hidden">
      {/* Video fuente — visible solo si no hay efectos Vortex activos */}
      <video
        ref={videoRef}
        key={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover transition-all duration-500"
        style={{
          opacity: hasVortexEffects ? 0 : opacity,
          filter: `blur(${blur}px) url(#video-color-curves)`,
        }}
      >
        <source src={videoUrl} type="video/mp4" />
      </video>

      {/* Motor Vortex: procesa frames con SIMD Rust/Wasm */}
      {hasVortexEffects && (
        <div
          style={{
            filter: `blur(${blur}px) url(#video-color-curves)`,
          }}
          className="absolute inset-0"
        >
          <VortexCanvas
            videoRef={videoRef}
            width={1920}
            height={1080}
            grain={grain}
            scanlines={scanlines}
            opacity={opacity}
          />
        </div>
      )}
    </div>
  );
}

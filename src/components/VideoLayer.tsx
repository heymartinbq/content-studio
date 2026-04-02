/**
 * VideoLayer.tsx - Capa de video con integración del motor Vortex.
 *
 * Cuando grain > 0 o scanlines > 0, el frame es capturado y procesado
 * por VortexCanvas (Rust/Wasm SIMD) en tiempo real.
 */

import { useEffect } from "react";
import type { RefObject } from "react";

interface VideoLayerProps {
  videoUrl: string;
  videoRef: RefObject<HTMLVideoElement | null>;
}

export default function VideoLayer({
  videoUrl,
  videoRef,
}: VideoLayerProps) {
  
  // Forzamos el play si fuera necesario
  useEffect(() => {
    if (videoRef.current) {
        videoRef.current.play().catch(e => console.warn("Autoplay blocked:", e));
    }
  }, [videoUrl, videoRef]);

  return (
    <video
      ref={videoRef}
      key={videoUrl}
      autoPlay
      loop
      muted
      playsInline
      crossOrigin="anonymous"
      onLoadedMetadata={() => videoRef.current?.play().catch(e => console.warn(e))}
      className="absolute inset-0 w-full h-full object-cover z-[-1] opacity-0 pointer-events-none"
    >
      <source src={videoUrl} type="video/mp4" />
    </video>
  );
}

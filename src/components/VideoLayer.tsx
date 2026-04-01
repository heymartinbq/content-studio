/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface VideoLayerProps {
  videoUrl: string;
  opacity: number;
  blur: number;
  showImmersiveOverlay?: boolean;
}

export default function VideoLayer({ videoUrl, opacity, blur, showImmersiveOverlay = false }: VideoLayerProps) {
  return (
    <div id="layer-video-bg" className="absolute inset-0 w-full h-full overflow-hidden">
      <video
        key={videoUrl}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover transition-all duration-500"
        style={{
          opacity: opacity,
          filter: `blur(${blur}px) url(#video-color-curves) ${showImmersiveOverlay ? "url(#immersive-overlay)" : ""}`,
        }}
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}

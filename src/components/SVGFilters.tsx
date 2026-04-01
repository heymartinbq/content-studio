/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

interface SVGFiltersProps {
  noiseIntensity?: number;
  textureIntensity?: number;
  videoBrightness?: number;
  videoContrast?: number;
  videoSaturation?: number;
  videoHue?: number;
}

export default function SVGFilters({ 
  noiseIntensity = 0.05, 
  textureIntensity = 0.15,
  videoBrightness = 1,
  videoContrast = 1,
  videoSaturation = 1,
  videoHue = 0
}: SVGFiltersProps) {
  return (
    <svg className="hidden" aria-hidden="true">
      <defs>
        {/* Video Color Correction Filter */}
        <filter id="video-color-curves">
          <feColorMatrix type="saturate" values={`${videoSaturation}`} />
          <feComponentTransfer>
            <feFuncR type="linear" slope={`${videoBrightness}`} intercept={`${(1 - videoContrast) / 2}`} />
            <feFuncG type="linear" slope={`${videoBrightness}`} intercept={`${(1 - videoContrast) / 2}`} />
            <feFuncB type="linear" slope={`${videoBrightness}`} intercept={`${(1 - videoContrast) / 2}`} />
          </feComponentTransfer>
          <feColorMatrix type="hueRotate" values={`${videoHue}`} />
        </filter>

        {/* Immersive Film Overlay (Grain + Scanlines) */}
        <filter id="immersive-overlay">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" result="grain" />
          <feFlood floodColor="black" result="black" />
          <feTurbulence type="fractalNoise" baseFrequency="0 0.5" numOctaves="1" result="scanlinesNoise" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.1 0" result="scanlines" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="grain" />
            <feMergeNode in="scanlines" />
          </feMerge>
        </filter>

        {/* Subtle Noise Filter for Post-Processing */}
        <filter id="subtle-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" result="noise" />
          <feColorMatrix type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${noiseIntensity} 0`} />
          <feComposite operator="in" in2="SourceGraphic" />
          <feBlend mode="overlay" in2="SourceGraphic" />
        </filter>

        {/* Refined Neon Glow with smoother falloff and desaturated core */}
        <filter id="neon-glow" x="-100%" y="-100%" width="300%" height="300%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.5" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur2" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur3" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur4" />
          <feColorMatrix in="blur4" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.2 0" result="softGlow" />
          <feMerge>
            <feMergeNode in="softGlow" />
            <feMergeNode in="blur3" />
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Advanced Chromatic Aberration Filter */}
        <filter id="chromatic-aberration" x="-20%" y="-20%" width="140%" height="140%">
          <feOffset in="SourceGraphic" dx="1.5" dy="0" result="red" />
          <feOffset in="SourceGraphic" dx="-1.5" dy="0" result="blue" />
          <feColorMatrix in="red" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="redMatrix" />
          <feColorMatrix in="blue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blueMatrix" />
          <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="greenMatrix" />
          <feBlend in="redMatrix" in2="blueMatrix" mode="screen" result="rb" />
          <feBlend in="rb" in2="greenMatrix" mode="screen" />
        </filter>

        {/* High-End Bloom Filter for Diegetic Light */}
        <filter id="bloom-filter" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur2" />
          <feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur3" />
          <feColorMatrix in="blur3" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.3 0" result="softBloom" />
          <feMerge>
            <feMergeNode in="softBloom" />
            <feMergeNode in="blur2" />
            <feMergeNode in="blur1" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Advanced Diegetic Texture (Film Grain + Dust) */}
        <filter id="diegetic-texture-advanced">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="4" result="noise" />
          <feColorMatrix type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${textureIntensity} 0`} result="grain" />
          <feTurbulence type="turbulence" baseFrequency="0.01" numOctaves="2" result="dust" />
          <feColorMatrix type="matrix" values={`0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${textureIntensity / 3} 0`} result="dustMatrix" />
          <feBlend in="grain" in2="dustMatrix" mode="screen" result="texture" />
          <feComposite operator="in" in="texture" in2="SourceGraphic" result="maskedTexture" />
          <feBlend mode="overlay" in="maskedTexture" in2="SourceGraphic" />
        </filter>

        {/* Realistic Light Wrap (Bleeds video colors into text edges) */}
        <filter id="realistic-light-wrap">
          <feMorphology operator="dilate" radius="1" in="SourceAlpha" result="dilated" />
          <feGaussianBlur in="dilated" stdDeviation="3" result="blurred" />
          <feComposite in="SourceGraphic" in2="blurred" operator="out" result="wrap" />
          <feBlend mode="screen" in="wrap" in2="SourceGraphic" opacity="0.8" />
        </filter>

        {/* Glitch Filter */}
        <filter id="glitch-filter">
          <feTurbulence type="fractalNoise" baseFrequency="0.01 0.1" numOctaves="1" result="warp" />
          <feDisplacementMap xChannelSelector="R" yChannelSelector="G" scale="20" in="SourceGraphic" in2="warp" />
        </filter>

        {/* Refined Embossed Neon Filter (Subtle Edge) */}
        <filter id="neon-emboss">
          <feGaussianBlur in="SourceAlpha" stdDeviation="0.8" result="blur" />
          <feSpecularLighting in="blur" surfaceScale="2" specularConstant="0.5" specularExponent="30" lightingColor="#f0f0f0" result="specular">
            <fePointLight x="-5000" y="-10000" z="15000" />
          </feSpecularLighting>
          <feComposite in="specular" in2="SourceAlpha" operator="in" result="composite" />
          <feMerge>
            <feMergeNode in="SourceGraphic" />
            <feMergeNode in="composite" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  );
}

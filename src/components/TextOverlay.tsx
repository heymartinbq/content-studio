/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";

interface GradientStop {
  color: string;
  position: number;
  opacity: number;
}

interface GradientConfig {
  type: 'linear' | 'radial';
  angle: number;
  stops: GradientStop[];
}

interface TextOverlayProps {
  id: string;
  key?: string | number;
  text: string;
  color: string;
  colorSecondary?: string;
  fillOpacity?: number;
  gradientConfig?: GradientConfig;
  glowIntensity: number;
  sparkleSpeed: number;
  fontSize: number;
  fontFamily: string;
  neonEmboss: boolean;
  diegeticTexture: boolean;
  glitch: boolean;
  chromaticAberration: boolean;
  bloom: boolean;
  lightWrap: boolean;
  textureIntensity?: number;
  editorialStyle: "default" | "minimalist" | "brutalist" | "magazine" | "cyberpunk" | "swiss" | "retro" | "classic";
  mixBlendMode: string;
  textAlign: "left" | "center" | "right";
  opacity: number;
  x: number;
  y: number;
  isActive: boolean;
  locked?: boolean;
  selectionBorderColor?: string;
  selectionBorderWidth?: number;
  onPositionChange: (x: number, y: number) => void;
  onSelect: () => void;
  dragConstraints?: React.RefObject<HTMLDivElement | null>;
}

export default function TextOverlay({
  id,
  text,
  color,
  colorSecondary,
  fillOpacity = 1,
  gradientConfig,
  glowIntensity,
  sparkleSpeed,
  fontSize,
  fontFamily,
  neonEmboss,
  diegeticTexture,
  glitch,
  chromaticAberration,
  bloom,
  lightWrap,
  editorialStyle,
  mixBlendMode,
  textAlign,
  opacity,
  x,
  y,
  isActive,
  locked,
  selectionBorderColor = "#3b82f6",
  selectionBorderWidth = 2,
  onPositionChange,
  onSelect,
  dragConstraints,
}: TextOverlayProps) {
  const filterString = [
    diegeticTexture ? "url(#diegetic-texture-advanced)" : "",
    neonEmboss ? "url(#neon-emboss)" : "",
    glowIntensity > 0 ? "url(#neon-glow)" : "",
    glitch ? "url(#glitch-filter)" : "",
    chromaticAberration ? "url(#chromatic-aberration)" : "",
    bloom ? "url(#bloom-filter)" : "",
    lightWrap ? "url(#realistic-light-wrap)" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const getStyleProps = () => {
    switch (editorialStyle) {
      case "minimalist":
        return {
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "0.4em",
          fontWeight: "200",
          textTransform: "uppercase" as const,
          fontStyle: "normal" as const,
          lineHeight: "1.5",
        };
      case "brutalist":
        return {
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "-0.08em",
          fontWeight: "900",
          textTransform: "uppercase" as const,
          fontStyle: "normal" as const,
          lineHeight: "0.85",
          transform: "skewX(-5deg)",
        };
      case "magazine":
        return {
          fontFamily: "'Playfair Display', serif",
          letterSpacing: "-0.02em",
          fontWeight: "500",
          fontStyle: "italic" as const,
          textTransform: "none" as const,
          lineHeight: "1.1",
        };
      case "cyberpunk":
        return {
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.15em",
          fontWeight: "800",
          textTransform: "uppercase" as const,
          fontStyle: "normal" as const,
          lineHeight: "1",
          textShadow: "2px 2px 0px rgba(255,0,255,0.5), -2px -2px 0px rgba(0,255,255,0.5)",
        };
      case "swiss":
        return {
          fontFamily: "'Inter', sans-serif",
          letterSpacing: "-0.04em",
          fontWeight: "800",
          textTransform: "none" as const,
          fontStyle: "normal" as const,
          lineHeight: "0.9",
        };
      case "retro":
        return {
          fontFamily: "'Space Grotesk', sans-serif",
          letterSpacing: "0.08em",
          fontWeight: "700",
          textTransform: "uppercase" as const,
          fontStyle: "italic" as const,
          lineHeight: "1.2",
        };
      case "classic":
        return {
          fontFamily: "'Playfair Display', serif",
          letterSpacing: "0.1em",
          fontWeight: "400",
          textTransform: "uppercase" as const,
          fontStyle: "normal" as const,
          lineHeight: "1.4",
        };
      default:
        return {
          fontFamily: fontFamily,
          letterSpacing: "normal",
          fontWeight: "900",
          textTransform: "uppercase" as const,
          fontStyle: "normal" as const,
          lineHeight: "1",
        };
    }
  };

  const styleProps = getStyleProps();

  // Professional Blend Mode Adjustments
  const getBlendAdjustments = () => {
    switch (mixBlendMode) {
      case "screen":
        return { opacity: 0.9, filter: `${filterString} brightness(1.2)` };
      case "overlay":
        return { opacity: 0.85, filter: `${filterString} contrast(1.1)` };
      case "soft-light":
        return { opacity: 0.95, filter: `${filterString} saturate(0.9)` };
      case "color-dodge":
        return { opacity: 0.8, filter: `${filterString} brightness(1.5) contrast(1.2)` };
      case "hard-light":
        return { opacity: 0.9, filter: `${filterString} contrast(1.3)` };
      default:
        return { opacity: 1, filter: filterString };
    }
  };

  const getGradientString = () => {
    if (!gradientConfig || !gradientConfig.stops || gradientConfig.stops.length === 0) {
      return colorSecondary ? `linear-gradient(to bottom, ${color}, ${colorSecondary})` : "none";
    }

    const stopsString = gradientConfig.stops
      .sort((a, b) => a.position - b.position)
      .map(stop => {
        // Convert hex to rgba to apply stop opacity
        const hex = stop.color.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 4), 16);
        const b = parseInt(hex.substring(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, ${stop.opacity}) ${stop.position}%`;
      })
      .join(', ');

    if (gradientConfig.type === 'radial') {
      return `radial-gradient(circle, ${stopsString})`;
    }
    return `linear-gradient(${gradientConfig.angle}deg, ${stopsString})`;
  };

  const gradientString = getGradientString();
  const { opacity: blendOpacity, filter: finalFilter } = getBlendAdjustments();

  return (
    <motion.div
      id={`text-overlay-item-${id}`}
      drag={!locked}
      dragMomentum={false}
      dragElastic={0.05}
      dragConstraints={dragConstraints}
      onDragEnd={(_, info) => {
        onPositionChange(x + info.offset.x, y + info.offset.y);
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      initial={false}
      whileHover={!locked ? { 
        scale: 1.02,
        backgroundColor: "rgba(255,255,255,0.02)",
        transition: { duration: 0.2 }
      } : {}}
      whileDrag={{ 
        scale: 1.05,
        zIndex: 100,
        cursor: "grabbing",
        boxShadow: "0 20px 40px rgba(0,0,0,0.4)",
        transition: { type: "spring", stiffness: 400, damping: 25 }
      }}
      animate={{ 
        opacity: blendOpacity * opacity, 
        scale: 1, 
        x, 
        y,
        transition: { type: "spring", stiffness: 300, damping: 30 }
      }}
      className={`absolute select-none z-20 p-4 rounded-2xl group/overlay ${isActive ? "z-30" : "hover:z-25"} ${locked ? "cursor-default" : "cursor-move"}`}
      style={{ 
        mixBlendMode: mixBlendMode as any,
        left: 0,
        top: 0,
      }}
    >
      {/* Selection Border */}
      {isActive && (
        <motion.div 
          layoutId="selection-border"
          className={`absolute -inset-1 rounded-xl pointer-events-none shadow-[0_0_20px_rgba(59,130,246,0.3)]`}
          style={{
            border: `${selectionBorderWidth}px solid ${locked ? "#f9731688" : selectionBorderColor + "88"}`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {!locked && (
            <>
              <div className="absolute -top-2 -left-2 w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: selectionBorderColor }} />
              <div className="absolute -top-2 -right-2 w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: selectionBorderColor }} />
              <div className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: selectionBorderColor }} />
              <div className="absolute -bottom-2 -right-2 w-4 h-4 rounded-full border-2 border-white shadow-lg" style={{ backgroundColor: selectionBorderColor }} />
            </>
          )}
          {locked && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full text-white shadow-lg">
              Bloqueado
            </div>
          )}
        </motion.div>
      )}

      <h1
        className="relative break-words whitespace-nowrap"
        style={{
          color: (colorSecondary || gradientConfig) ? "transparent" : color,
          backgroundImage: gradientString !== "none" ? gradientString : (colorSecondary ? `linear-gradient(to bottom, ${color}, ${colorSecondary})` : "none"),
          WebkitBackgroundClip: (colorSecondary || gradientConfig) ? "text" : "none",
          opacity: fillOpacity,
          fontSize: `${fontSize}px`,
          filter: finalFilter,
          textShadow: glowIntensity > 0 
            ? `0 0 ${glowIntensity}px ${color}, 0 0 ${glowIntensity * 2}px ${color}44` 
            : "none",
          textAlign: textAlign,
          ...styleProps,
        }}
      >
        {text}
        {/* Subtle Sparkle/Glint Effect */}
        <span
          className="absolute inset-0 block pointer-events-none opacity-20"
          style={{
            background: `linear-gradient(135deg, transparent 45%, rgba(255,255,255,0.3) 50%, transparent 55%)`,
            backgroundSize: "400% 100%",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: `sparkle ${sparkleSpeed * 2}s ease-in-out infinite`,
            ...styleProps,
          }}
          aria-hidden="true"
        >
          {text}
        </span>
      </h1>

      <style>{`
        @keyframes sparkle {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `}</style>
    </motion.div>
  );
}

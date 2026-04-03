import React, { useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { getVortexEngine } from '../core/wasm-bridge';
import type { VortexEngine } from '../core/wasm-bridge';
import type { EditorConfig } from '../core/types';
import { useEditor } from '../core/EditorContext';


interface MasterCanvasProps {
  config: EditorConfig;
  videoRef: RefObject<HTMLVideoElement | null>;
  webcamRef: RefObject<HTMLVideoElement | null>;
}

export default function MasterCanvas({
  config,
  videoRef,
  webcamRef,
}: MasterCanvasProps) {
  const glCanvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const frameMsRef = useRef<HTMLSpanElement>(null);
  
  const [engineReady, setEngineReady] = useState(false);
  const engineRef = useRef<VortexEngine | null>(null);

  const { actions, state } = useEditor();
  const configRef = useRef(config);
  const stateRef = useRef(state);
  const draggingLayerId = useRef<string | null>(null);
  const prevMouseCoords = useRef<{x: number, y: number} | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;

    // Sincronizar capas a Wasm antes del hit test para asegurar que tiene lo último
    if (engineRef.current) {
        config.layers.forEach((layer) => {
            if (layer.type === 'text') {
                const ctx = canvas.getContext('2d');
                let width = 100;
                let height = 38;
                if (ctx) {
                    const fontSize = layer.fontSize || 32;
                    ctx.font = `900 ${fontSize}px ${layer.fontFamily || "sans-serif"}`;
                    width = ctx.measureText(layer.text || "").width;
                    height = fontSize * 1.2;
                }
                engineRef.current!.syncLayer(layer.id, layer.x || 0, layer.y || 0, width, height, layer.locked || false, layer.visible !== false);
            }
        });
    }

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;
    
    const mouseOffsetX = canvasX - canvas.width / 2;
    const mouseOffsetY = canvasY - canvas.height / 2;

    const engine = engineRef.current;
    if (!engine) return;

    const hitId = engine.hitTest(mouseOffsetX, mouseOffsetY);
    if (hitId) {
        actions.selectLayer(hitId);
        draggingLayerId.current = hitId;
        prevMouseCoords.current = { x: mouseOffsetX, y: mouseOffsetY };
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } else {
        actions.selectLayer("");
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingLayerId.current || !engineRef.current || !prevMouseCoords.current) return;
    
    const canvas = overlayCanvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const mouseOffsetX = canvasX - canvas.width / 2;
    const mouseOffsetY = canvasY - canvas.height / 2;

    const dx = mouseOffsetX - prevMouseCoords.current.x;
    const dy = mouseOffsetY - prevMouseCoords.current.y;

    engineRef.current.dragUpdate(dx, dy);
    prevMouseCoords.current = { x: mouseOffsetX, y: mouseOffsetY };
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (draggingLayerId.current && engineRef.current) {
        // Al terminar el drag guardamos el absolute X/Y en el estado JSON de React
        const newX = engineRef.current.getLayerX(draggingLayerId.current);
        const newY = engineRef.current.getLayerY(draggingLayerId.current);

        actions.updateLayer(draggingLayerId.current, { x: newX, y: newY });
    }
    draggingLayerId.current = null;
    prevMouseCoords.current = null;
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  };

  // Wasm Engine Init
  useEffect(() => {
    let mounted = true;
    getVortexEngine().then((engine) => {
      if (mounted) {
        engineRef.current = engine;
        setEngineReady(true);
      }
    });
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    configRef.current = config;
    stateRef.current = state;
  }, [config, state]);

  // Main Render Loop (WebGL + 2D Overlay)
  useEffect(() => {
    const glCanvas = glCanvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!glCanvas || !overlayCanvas) return;

    const gl = glCanvas.getContext('webgl2', { alpha: false, antialias: false, preserveDrawingBuffer: false });
    const ctx = overlayCanvas.getContext('2d');
    if (!gl || !ctx) return;

    // --- WEBGL SETUP ---
    const vsSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_texCoord;
      void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        v_texCoord = a_position * 0.5 + 0.5;
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      in vec2 v_texCoord;
      out vec4 outColor;

      uniform sampler2D u_videoTexture;
      uniform sampler2D u_webcamTexture;
      uniform sampler2D u_uiTexture;
      uniform vec2 u_resolution;
      uniform float u_webcamOpacity;
      uniform float u_brightness;
      uniform float u_contrast;
      uniform float u_saturation;
      uniform float u_grain;
      uniform float u_scanlines;
      uniform float u_time;
      
      uniform float u_vignetteIntensity;
      uniform float u_vignetteRadius;
      uniform float u_vignetteSoftness;
      uniform vec3 u_vignetteColor;
      
      uniform float u_gamma;
      uniform float u_gammaR;
      uniform float u_gammaG;
      uniform float u_gammaB;
      
      uniform float u_lensDistortion;
      uniform float u_halationIntensity;
      
      float random(vec2 co) {
          return fract(sin(dot(co.xy ,vec2(12.9898,78.233))) * 43758.5453);
      }

      // Lens Distortion Logic (Barrel)
      vec2 distort(vec2 uv, float k) {
          if (k == 0.0) return uv;
          vec2 d = uv - 0.5;
          float r2 = dot(d, d);
          return 0.5 + d * (1.0 + k * r2);
      }

      void main() {
          // Normalize coordinates with universal distortion
          vec2 uvBase = distort(v_texCoord, u_lensDistortion);
          
          // Coordinate Correction (Flipping Vertical for all, Mirroring Webcam)
          vec2 uvVideo = vec2(uvBase.x, 1.0 - uvBase.y);
          vec2 uvWebcam = vec2(1.0 - uvBase.x, 1.0 - uvBase.y);
          vec2 uvUI = vec2(uvBase.x, 1.0 - uvBase.y);
          
          vec4 video = texture(u_videoTexture, uvVideo);
          vec4 webcam = texture(u_webcamTexture, uvWebcam);
          vec4 ui = texture(u_uiTexture, uvUI);
          
          // Basic mix (Video & Webcam)
          vec4 color = mix(video, webcam, u_webcamOpacity);
          
          // Diegetic UI Injection (Mix with text BEFORE post-processing)
          // Text color blending with halation (Optional fringe)
          vec3 halation = vec3(1.0, 0.4, 0.1) * ui.a * u_halationIntensity;
          vec3 uiFinal = ui.rgb + halation;
          
          color = mix(color, vec4(uiFinal, 1.0), ui.a);
          
          // Master BCS (Brightness, Contrast, Saturation)
          color.rgb = color.rgb * u_brightness;
          color.rgb = (color.rgb - 0.5) * u_contrast + 0.5;
          
          // Gamma Correction (Curvatura)
          color.r = pow(max(color.r, 0.0), 1.0 / (u_gamma * u_gammaR));
          color.g = pow(max(color.g, 0.0), 1.0 / (u_gamma * u_gammaG));
          color.b = pow(max(color.b, 0.0), 1.0 / (u_gamma * u_gammaB));
          
          // Saturation
          float luma = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          color.rgb = mix(vec3(luma), color.rgb, u_saturation);
          
          // Dynamic Grain
          if (u_grain > 0.0) {
              float noise = random(uvBase + fract(u_time * 0.001));
              color.rgb += (noise - 0.5) * u_grain * (1.0 - luma * 0.5);
          }
          
          // Scanlines
          if (u_scanlines > 0.0) {
              float s = sin(uvBase.y * u_resolution.y * 3.14159);
              if (s < 0.0) color.rgb *= (1.0 - u_scanlines * 0.5);
          }
          
          // Vignette
          if (u_vignetteIntensity > 0.0) {
              float dist = distance(uvBase, vec2(0.5));
              float inner = u_vignetteRadius * (1.0 - u_vignetteSoftness);
              float v = smoothstep(inner, u_vignetteRadius, dist);
              color.rgb = mix(color.rgb, u_vignetteColor, v * u_vignetteIntensity);
          }
          
          outColor = vec4(clamp(color.rgb, 0.0, 1.0), 1.0);
      }
    `;

    const createShader = (gl: WebGL2RenderingContext, type: number, source: string) => {
      const shader = gl.createShader(type)!;
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Vortex Shader Error:", gl.getShaderInfoLog(shader));
      }
      return shader;
    };

    const program = gl.createProgram()!;
    gl.attachShader(program, createShader(gl, gl.VERTEX_SHADER, vsSource));
    gl.attachShader(program, createShader(gl, gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(program);
    gl.useProgram(program);

    // Quad Buffer
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
    const aPos = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    // Textures
    const createTexture = () => {
      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tex;
    };

    const videoTex = createTexture()!;
    const webcamTex = createTexture()!;
    const uiTex = createTexture()!;

    // Uniform Locations
    const locs = {
      video: gl.getUniformLocation(program, "u_videoTexture"),
      webcam: gl.getUniformLocation(program, "u_webcamTexture"),
      ui: gl.getUniformLocation(program, "u_uiTexture"),
      res: gl.getUniformLocation(program, "u_resolution"),
      webcamOpacity: gl.getUniformLocation(program, "u_webcamOpacity"),
      brightness: gl.getUniformLocation(program, "u_brightness"),
      contrast: gl.getUniformLocation(program, "u_contrast"),
      saturation: gl.getUniformLocation(program, "u_saturation"),
      grain: gl.getUniformLocation(program, "u_grain"),
      scanlines: gl.getUniformLocation(program, "u_scanlines"),
      time: gl.getUniformLocation(program, "u_time"),
      vignetteIntensity: gl.getUniformLocation(program, "u_vignetteIntensity"),
      vignetteRadius: gl.getUniformLocation(program, "u_vignetteRadius"),
      vignetteSoftness: gl.getUniformLocation(program, "u_vignetteSoftness"),
      vignetteColor: gl.getUniformLocation(program, "u_vignetteColor"),
      gamma: gl.getUniformLocation(program, "u_gamma"),
      gammaR: gl.getUniformLocation(program, "u_gammaR"),
      gammaG: gl.getUniformLocation(program, "u_gammaG"),
      gammaB: gl.getUniformLocation(program, "u_gammaB"),
      dist: gl.getUniformLocation(program, "u_lensDistortion"),
      hal: gl.getUniformLocation(program, "u_halationIntensity"),
    };

    const hexToNormRgb = (hex: string) => {
       let r = 0, g = 0, b = 0;
       if (hex.length === 7) {
        r = parseInt(hex.substring(1,3), 16) / 255;
        g = parseInt(hex.substring(3,5), 16) / 255;
        b = parseInt(hex.substring(5,7), 16) / 255;
       }
       return [r, g, b];
    };

    // Use a fixed virtual resolution for composition (1080p is standard)
    const width = glCanvas.width;
    const height = glCanvas.height;

    const render = () => {
      const currentConfig = configRef.current;
      const currentState = stateRef.current;
      const t0 = performance.now();
      
      const video = videoRef.current;
      const webcam = webcamRef.current;
      const updateTexture = (tex: WebGLTexture, source: HTMLVideoElement | HTMLCanvasElement) => {
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
      };

      // --- 1. OVERLAY PASS (TEXT + D&D) ---
      // We do this first so we can upload it as a texture for the diegetic/cinematic pass
      ctx.clearRect(0, 0, width, height);

      currentConfig.layers.forEach((layer) => {
        if (!layer.visible || layer.type !== "text" || !layer.text) return;
        
        ctx.save();
        let fontSize = layer.fontSize || 120;
        let fontFamily = layer.fontFamily || "Space Grotesk";
        let fontWeight = "900";
        let letterSpacing = 0;
        
        // --- PRESETS: EDITORIAL STYLES ---
        switch (layer.editorialStyle) {
          case "minimalist":
            fontWeight = "300";
            letterSpacing = fontSize * 0.2;
            break;
          case "brutalist":
            fontWeight = "950";
            fontFamily = "system-ui";
            break;
          case "magazine":
            fontFamily = "serif";
            fontWeight = "700";
            break;
          case "cyberpunk":
            fontWeight = "900";
            letterSpacing = 2;
            break;
          case "swiss":
            fontFamily = "Helvetica, Arial, sans-serif";
            fontWeight = "800";
            letterSpacing = -2;
            break;
          case "retro":
            fontFamily = "monospace";
            fontWeight = "400";
            break;
        }

        ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        if (letterSpacing !== 0) ctx.canvas.style.letterSpacing = `${letterSpacing}px`;
        else ctx.canvas.style.letterSpacing = "0px";
        
        ctx.textAlign = (layer.textAlign as CanvasTextAlign) || "center";
        ctx.textBaseline = "middle";
        ctx.globalAlpha = layer.opacity ?? 1;

        let currentX = layer.x || 0;
        let currentY = layer.y || 0;

        if (engineRef.current) {
            const wX = engineRef.current.getLayerX(layer.id);
            const wY = engineRef.current.getLayerY(layer.id);
            if (wX !== 0 || wY !== 0) {
                currentX = wX;
                currentY = wY;
            }
        }

        const px = (width / 2) + currentX;
        const py = (height / 2) + currentY;

        if (layer.mixBlendMode && layer.mixBlendMode !== "normal") {
          ctx.globalCompositeOperation = layer.mixBlendMode as GlobalCompositeOperation;
        }

        if (layer.glowIntensity && layer.glowIntensity > 0) {
          ctx.shadowColor = layer.colorSecondary || layer.color || "#fff";
          ctx.shadowBlur = layer.glowIntensity * 20;
        }

        ctx.fillStyle = layer.color || "#ffffff";
        ctx.fillText(layer.text, px, py);

        if (layer.neonEmboss) {
          ctx.lineWidth = 2;
          ctx.strokeStyle = layer.colorSecondary || "#ffffff";
          ctx.strokeText(layer.text, px, py);
        }

        if (layer.glitch || layer.chromaticAberration) {
            ctx.globalCompositeOperation = 'screen';
            ctx.fillStyle = 'rgba(0, 255, 255, 0.5)';
            ctx.fillText(layer.text, px - 4, py);
            ctx.fillStyle = 'rgba(255, 0, 0, 0.5)';
            ctx.fillText(layer.text, px + 4, py);
        }

        if (currentState.activeLayerId === layer.id && !layer.locked) {
            const metrics = ctx.measureText(layer.text);
            ctx.lineWidth = layer.selectionBorderWidth || 1;
            ctx.strokeStyle = layer.selectionBorderColor || "rgba(59, 130, 246, 0.7)";
            ctx.setLineDash([10, 5]);
            ctx.strokeRect(px - (metrics.width / 2) - 10, py - (fontSize * 1.2 / 2) - 10, metrics.width + 20, fontSize * 1.2 + 20);
            ctx.setLineDash([]);
        }
        ctx.restore();
      });

      // --- 2. WEBGL PASS (VIDEO + EFFECTS) ---
      gl.viewport(0, 0, width, height);
      gl.clearColor(0,0,0,1);
      gl.clear(gl.COLOR_BUFFER_BIT);

      if (video && video.readyState >= 2) {
        gl.activeTexture(gl.TEXTURE0);
        updateTexture(videoTex, video);
      }
      
      if (webcam && webcam.readyState >= 2 && currentConfig.useWebcam) {
        gl.activeTexture(gl.TEXTURE1);
        updateTexture(webcamTex, webcam);
      }

      // Diegetic UI Injection: Upload CURRENT Frame 2D Canvas to WebGL Texture
      gl.activeTexture(gl.TEXTURE2);
      updateTexture(uiTex, overlayCanvas);

      // --- 3. SET UNIFORMS & DRAW ---
      gl.useProgram(program);
      gl.uniform1i(locs.video, 0);
      gl.uniform1i(locs.webcam, 1);
      gl.uniform1i(locs.ui, 2);
      gl.uniform2f(locs.res, width, height);

      gl.uniform1f(locs.webcamOpacity, (currentConfig.useWebcam && webcam && webcam.readyState >= 2) ? (currentConfig.webcamOpacity / 100) : 0.0);
      gl.uniform1f(locs.brightness, currentConfig.videoBrightness);
      gl.uniform1f(locs.contrast, currentConfig.videoContrast);
      gl.uniform1f(locs.saturation, currentConfig.videoSaturation);
      
      gl.uniform1f(locs.vignetteIntensity, currentConfig.vignetteIntensity / 100.0);
      gl.uniform1f(locs.vignetteRadius, currentConfig.vignetteRadius / 100.0 * 2.0);
      gl.uniform1f(locs.vignetteSoftness, currentConfig.vignetteSoftness / 100.0);
      const vColor = hexToNormRgb(currentConfig.vignetteColor);
      gl.uniform3f(locs.vignetteColor, vColor[0], vColor[1], vColor[2]);

      gl.uniform1f(locs.grain, currentConfig.showImmersiveOverlay ? currentConfig.immersiveGrain : 0.0);
      gl.uniform1f(locs.scanlines, currentConfig.showImmersiveOverlay ? currentConfig.immersiveScanlines : 0.0);
      gl.uniform1f(locs.time, performance.now() / 1000.0);
      
      gl.uniform1f(locs.gamma, currentConfig.videoGamma);
      gl.uniform1f(locs.gammaR, currentConfig.videoGammaR);
      gl.uniform1f(locs.gammaG, currentConfig.videoGammaG);
      gl.uniform1f(locs.gammaB, currentConfig.videoGammaB);
      
      gl.uniform1f(locs.dist, currentConfig.lensDistortion);
      gl.uniform1f(locs.hal, currentConfig.halationIntensity);

      gl.drawArrays(gl.TRIANGLES, 0, 6);

      // --- 3. PROFILE ---
      const delta = Math.round((performance.now() - t0) * 10) / 10;
      if (frameMsRef.current) {
          frameMsRef.current.style.color = delta > 4 ? "rgb(239, 68, 68)" : "rgb(196, 181, 253)";
          frameMsRef.current.innerText = `${delta}ms`;
      }
      
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => {
        cancelAnimationFrame(rafRef.current);
        gl.deleteTexture(videoTex);
        gl.deleteTexture(webcamTex);
        gl.deleteProgram(program);
        gl.deleteBuffer(positionBuffer);
    };
  }, [videoRef, webcamRef, engineReady]); // Loop independiente de config/state para performance extrema

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden bg-black flex items-center justify-center">
      {/* WebGL Base (Background + Processing) */}
      <canvas
        ref={glCanvasRef}
        id="vortex-gl-surface"
        width={1280}
        height={720}
        className="absolute w-full h-full object-cover pointer-events-none"
        style={{ aspectRatio: config.aspectRatio }}
      />

      {/* 2D Overlay (Text + Interactions) */}
      <canvas
        ref={overlayCanvasRef}
        id="vortex-2d-overlay"
        width={1280}
        height={720}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="absolute w-full h-full object-cover touch-none z-10"
        style={{ aspectRatio: config.aspectRatio }}
      />

      {/* Vortex Active Badge */}
      {engineReady && config.showImmersiveOverlay && (
        <div
          id="vortex-engine-badge"
          className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-black/40 backdrop-blur-xl border border-violet-500/20 rounded-full pointer-events-none z-50 animate-in fade-in slide-in-from-bottom-2 duration-500"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" />
          <span className="text-[9px] font-black uppercase tracking-widest text-violet-300/80">
            WebGL GPU
          </span>
          <span
            ref={frameMsRef}
            className="text-[9px] font-mono text-violet-300/50 min-w-[28px] text-right"
          >
            0ms
          </span>
        </div>
      )}
    </div>
  );
}

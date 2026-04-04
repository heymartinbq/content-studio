import React, { useEffect, useRef, RefObject } from "react";
import { useEditor } from "../core/EditorContext";
import { EditorConfig } from "../core/types";
import { VortexPtr } from "../core/vortex-ptr";

interface MasterCanvasProps {
  config: EditorConfig;
  videoRef: RefObject<HTMLVideoElement | null>;
  webcamRef: RefObject<HTMLVideoElement | null>;
}

export default function MasterCanvas({ config, videoRef, webcamRef }: MasterCanvasProps) {
  const { state, actions, engineReady, engine } = useEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const configRef = useRef(config);
  const stateRef = useRef(state);
  const engineRef = useRef(engine);
  const rafRef = useRef<number>(0);
  const vortexPtrRef = useRef<VortexPtr | null>(null);
  const videoProcRef = useRef<HTMLCanvasElement | null>(null);
  const webcamProcRef = useRef<HTMLCanvasElement | null>(null);

  // Mapeo persistente de IDs (React String ID -> Wasm u16 ID)
  const idMapRef = useRef<Map<string, number>>(new Map());

  const getWasmId = (reactId: string): number => {
    if (!idMapRef.current.has(reactId)) {
        const nextId = idMapRef.current.size + 1;
        idMapRef.current.set(reactId, nextId);
    }
    return idMapRef.current.get(reactId) || 0;
  };

  const getReactIdFromWasm = (wasmId: number): string | null => {
      for (const [rId, wId] of idMapRef.current.entries()) {
          if (wId === wasmId) return rId;
      }
      return null;
  };

  useEffect(() => {
    configRef.current = config;
    stateRef.current = state;
    if (engine && !engineRef.current) {
        engineRef.current = engine;
    }
    if (engine && canvasRef.current && !vortexPtrRef.current) {
        vortexPtrRef.current = new VortexPtr(engine, canvasRef.current);
    }
  }, [config, state, engine]);

  // --- NATIVE INTERACTION HUB (Modular Vortex-Spatial Interaction) ---
  const handleNativePointerDown = (e: PointerEvent) => {
      if (!vortexPtrRef.current) return;
      const hitId = vortexPtrRef.current.onPointerDown(e);
      if (hitId > 0) {
          const rId = getReactIdFromWasm(hitId);
          if (rId) actions.selectLayer(rId);
      } else {
          actions.selectLayer("media");
      }
  };

  const handleNativePointerMove = (e: PointerEvent) => {
      vortexPtrRef.current?.onPointerMove(e);
  };

  const handleNativePointerUp = (e: PointerEvent) => {
      const result = vortexPtrRef.current?.onPointerUp(e);
      if (result) {
          const rId = getReactIdFromWasm(result.id);
          if (rId) actions.updateLayer(rId, { x: result.x, y: result.y });
      }
  };

  useEffect(() => {
    const glCanvas = canvasRef.current;
    const overlayCanvas = overlayCanvasRef.current;
    if (!glCanvas || !overlayCanvas) return;

    const gl = glCanvas.getContext("webgl2", { preserveDrawingBuffer: true, alpha: false, antialias: true })!;
    const ctx = overlayCanvas.getContext("2d")!;

    // --- SHADERS WEBGL 2 ---
    const vsSource = `#version 300 es
      in vec2 a_position;
      out vec2 v_texCoord;
      void main() {
        v_texCoord = a_position * 0.5 + 0.5;
        gl_Position = vec4(a_position, 0.0, 1.0);
      }
    `;

    const fsSource = `#version 300 es
      precision highp float;
      uniform sampler2D u_videoTexture, u_webcamTexture, u_uiTexture;
      uniform float u_webcamOpacity, u_lensDistortion, u_halationIntensity, u_vignetteIntensity, u_vignetteRadius, u_vignetteSoftness;
      uniform vec3 u_vignetteColor;
      out vec4 outColor;
      in vec2 v_texCoord;
      vec2 distort(vec2 uv, float k) {
        vec2 d = uv - 0.5;
        float r2 = dot(d, d);
        return 0.5 + d * (1.0 + k * r2);
      }
      void main() {
          vec2 uvBase = distort(v_texCoord, u_lensDistortion);
          vec4 video = texture(u_videoTexture, vec2(uvBase.x, 1.0 - uvBase.y));
          vec4 webcam = texture(u_webcamTexture, vec2(1.0 - uvBase.x, 1.0 - uvBase.y));
          vec2 uvUI = vec2(v_texCoord.x, 1.0 - v_texCoord.y);
          vec4 ui = texture(u_uiTexture, uvUI);
          
          // Video y Webcam ya vienen pre-procesados por Wasm SIMD (B/C/S/Gamma/Grain/RGBShift)
          vec4 color = mix(video, webcam, u_webcamOpacity);
          
          float sl = dot(color.rgb, vec3(0.299, 0.587, 0.114));
          vec3 dt = ui.rgb * (0.8 + sl * 0.4);
          if (u_halationIntensity > 0.0) {
              float hal = texture(u_uiTexture, uvUI + vec2(0.002, 0.0)).a * u_halationIntensity;
              color.rgb += vec3(1.0, 0.2, 0.0) * hal * 0.5;
          }
          color.rgb = mix(color.rgb, dt, ui.a);
          float d = distance(v_texCoord, vec2(0.5));
          float vig = smoothstep(u_vignetteRadius * 0.01, (u_vignetteRadius + u_vignetteSoftness) * 0.01, d);
          color.rgb = mix(color.rgb, u_vignetteColor, vig * (u_vignetteIntensity / 100.0));
          outColor = vec4(clamp(color.rgb, 0.0, 1.0), 1.0);
      }
    `;

    const pr = gl.createProgram()!;
    const crS = (t: number, s: string) => {
        const sh = gl.createShader(t)!; gl.shaderSource(sh, s); gl.compileShader(sh); return sh;
    };
    gl.attachShader(pr, crS(gl.VERTEX_SHADER, vsSource));
    gl.attachShader(pr, crS(gl.FRAGMENT_SHADER, fsSource));
    gl.linkProgram(pr);
    const posB = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, posB);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW);

    const vT = gl.createTexture(), wT = gl.createTexture(), uT = gl.createTexture();
    const stT = (t: WebGLTexture | null) => {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    };
    stT(vT); stT(wT); stT(uT);

    const loc = {
        vid: gl.getUniformLocation(pr, "u_videoTexture"),
        web: gl.getUniformLocation(pr, "u_webcamTexture"),
        ui: gl.getUniformLocation(pr, "u_uiTexture"),
        wOp: gl.getUniformLocation(pr, "u_webcamOpacity"),
        dst: gl.getUniformLocation(pr, "u_lensDistortion"),
        hal: gl.getUniformLocation(pr, "u_halationIntensity"),
        vI: gl.getUniformLocation(pr, "u_vignetteIntensity"),
        vR: gl.getUniformLocation(pr, "u_vignetteRadius"),
        vS: gl.getUniformLocation(pr, "u_vignetteSoftness"),
        vC: gl.getUniformLocation(pr, "u_vignetteColor")
    };


    const upT = (t: WebGLTexture | null, s: any) => {
        gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s);
    };

    const hToR = (h: string) => [parseInt(h.slice(1,3), 16)/255, parseInt(h.slice(3,5),16)/255, parseInt(h.slice(5,7),16)/255];
    const w = glCanvas.width, h = glCanvas.height;

    // Removiendo getI de JS - La autoridad es de Rust.

    let lastT = performance.now();

    const render = () => {
      const cfg = configRef.current;
      const st = stateRef.current;
      const now = performance.now();
      const dt = (now - lastT)/1000; lastT = now;

      if (st.isPlaying) {
          const nt = st.currentTime + dt;
          if (nt >= st.duration) { actions.togglePlayback(false); actions.setCurrentTime(0); }
          else { actions.setCurrentTime(nt); }
      }

      const ct = st.currentTime;
      ctx.clearRect(0, 0, w, h);
      cfg.layers.forEach((layer) => {
        if (!layer.visible || layer.type !== "text" || !layer.text) return;
        ctx.save();
        
        let fz = layer.fontSize || 120;
        let opacity = layer.opacity ?? 1;
        let cx = layer.x || 0;
        let cy = layer.y || 0;
        let rotation = layer.rotation || 0;
        let scale = layer.scale || 1.0;
        let color = layer.color || "#ffffff";

        if (engine) {
            fz = engine.getInterpolatedValue(layer.id, "fontSize", ct, fz);
            opacity = engine.getInterpolatedValue(layer.id, "opacity", ct, opacity);
            cx = engine.getInterpolatedValue(layer.id, "x", ct, cx);
            cy = engine.getInterpolatedValue(layer.id, "y", ct, cy);
            rotation = engine.getInterpolatedValue(layer.id, "rotation", ct, rotation);
            scale = engine.getInterpolatedValue(layer.id, "scale", ct, scale);
            color = engine.getInterpolatedColor(layer.id, "color", ct, color);
        }

        ctx.font = `900 ${fz}px Space Grotesk`; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.globalAlpha = opacity;

        const wasmId = getWasmId(layer.id);
        
        // Prioridad absoluta al Wasm durante la interacción (Authority Hand-off)
        const isDragging = st.activeLayerId === layer.id && vortexPtrRef.current?.isActive();
        if (isDragging && engine) {
            cx = engine.vortex_get_layer_x(wasmId);
            cy = engine.vortex_get_layer_y(wasmId);
            scale = engine.vortex_get_layer_scale(wasmId);
            rotation = engine.vortex_get_layer_rotation(wasmId);
        }

        const m = ctx.measureText(layer.text);
        if (engine) engine.vortex_sync_layer(wasmId, cx, cy, m.width, fz, rotation, scale, layer.locked, layer.visible);

        const px = (w/2) + cx, py = (h/2) + cy;
        ctx.translate(px, py);
        ctx.rotate(rotation);
        ctx.scale(scale, scale);
        
        ctx.fillStyle = color; ctx.fillText(layer.text, 0, 0);
        
        if (st.activeLayerId === layer.id && !layer.locked) {
            ctx.lineWidth = 1; ctx.strokeStyle = "rgba(59, 130, 246, 0.7)";
            ctx.strokeRect(-(m.width/2)-10, -(fz/2)-10, m.width+20, fz+20);
        }
        ctx.restore();
      });

      gl.viewport(0, 0, w, h); gl.clear(gl.COLOR_BUFFER_BIT);
      
      const processSource = (vid: HTMLVideoElement, procRef: React.MutableRefObject<HTMLCanvasElement | null>) => {
        if (!vid.readyState || vid.readyState < 2) return null;
        if (!procRef.current) procRef.current = document.createElement("canvas");
        const pc = procRef.current; 
        if (pc.width !== vid.videoWidth) { pc.width = vid.videoWidth; pc.height = vid.videoHeight; }
        const pctx = pc.getContext("2d", { willReadFrequently: true })!;
        pctx.drawImage(vid, 0, 0, pc.width, pc.height);
        const img = pctx.getImageData(0, 0, pc.width, pc.height);
        
        if (engine && engineReady) {
            engine.processFrame(
                img,
                cfg.immersiveGrain || 0,
                cfg.immersiveScanlines || 0,
                cfg.videoBrightness,
                cfg.videoContrast,
                cfg.videoSaturation,
                cfg.videoGamma,
                cfg.videoGammaR,
                cfg.videoGammaG,
                cfg.videoGammaB,
                cfg.chromaticAberration || 0,
                performance.now()
            );
            pctx.putImageData(img, 0, 0);
        }
        return pc;
      };

      const processedVideo = videoRef.current ? processSource(videoRef.current, videoProcRef) : null;
      
      if (processedVideo && cfg.useWebcam && webcamRef.current) {
          const wVid = webcamRef.current;
          if (wVid.readyState >= 2) {
              if (!webcamProcRef.current) webcamProcRef.current = document.createElement("canvas");
              const wc = webcamProcRef.current;
              if (wc.width !== wVid.videoWidth) { wc.width = wVid.videoWidth; wc.height = wVid.videoHeight; }
              const wct = wc.getContext("2d", { willReadFrequently: true })!;
              wct.drawImage(wVid, 0, 0, wc.width, wc.height);
              const wImg = wct.getImageData(0, 0, wc.width, wc.height);
              
              if (engine) {
                  // Buffer Secundario para mezcla SIMD
                  const size = wImg.data.byteLength;
                  let overlayPtr = 0;
                  // Reusar o alocar buffer de overlay
                  // Nota: En una implementación de alta gama usaríamos un pool de buffers.
                  // Aquí usamos vortex_alloc temporalmente por simplicidad.
                  // Sin embargo, para no saturar memoria, preferimos una dirección fija si es posible.
                  // Usaremos la memoria un paso después del main buffer.
                  overlayPtr = engine.vortex_get_main_buffer_ptr() + size + 1024;
                  
                  const overlayMem = new Uint8Array(engine.getMemoryBuffer(), overlayPtr, size);
                  overlayMem.set(wImg.data);
                  
                  engine.blendLayers(engine.vortex_get_main_buffer_ptr(), overlayPtr, size, cfg.webcamOpacity/100);
                  
                  const pctx = processedVideo.getContext("2d")!;
                  const mainImg = pctx.getImageData(0, 0, processedVideo.width, processedVideo.height);
                  mainImg.data.set(new Uint8Array(engine.getMemoryBuffer(), engine.vortex_get_main_buffer_ptr(), size));
                  pctx.putImageData(mainImg, 0, 0);
              }
          }
      }

      if (processedVideo) { gl.activeTexture(gl.TEXTURE0); upT(vT, processedVideo); }
      // El canvas de webcam ya no necesita textura propia si fue mezclado en Wasm
      gl.activeTexture(gl.TEXTURE1); upT(wT, overlayCanvas); // Placeholder o UI
      
      gl.activeTexture(gl.TEXTURE2); upT(uT, overlayCanvas);
      
      gl.useProgram(pr);
      gl.uniform1i(loc.vid, 0); gl.uniform1i(loc.web, 1); gl.uniform1i(loc.ui, 2);
      gl.uniform1f(loc.wOp, 0); // Ya mezclado en Wasm
      gl.uniform1f(loc.dst, cfg.lensDistortion); gl.uniform1f(loc.hal, cfg.halationIntensity);
      gl.uniform1f(loc.vI, cfg.vignetteIntensity); gl.uniform1f(loc.vR, cfg.vignetteRadius); gl.uniform1f(loc.vS, cfg.vignetteSoftness);
      const c = hToR(cfg.vignetteColor); gl.uniform3f(loc.vC, c[0], c[1], c[2]);

      gl.bindBuffer(gl.ARRAY_BUFFER, posB);
      const pL = gl.getAttribLocation(pr, "a_position");
      gl.enableVertexAttribArray(pL); gl.vertexAttribPointer(pL, 2, gl.FLOAT, false, 0, 0);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => { cancelAnimationFrame(rafRef.current); gl.deleteTexture(vT); gl.deleteTexture(wT); gl.deleteTexture(uT); gl.deleteProgram(pr); gl.deleteBuffer(posB); };
  }, [videoRef, webcamRef, engineReady, engine]);

  useEffect(() => {
      const el = canvasRef.current;
      if (!el || !engine) return;
      el.addEventListener("pointerdown", handleNativePointerDown);
      el.addEventListener("pointermove", handleNativePointerMove);
      el.addEventListener("pointerup", handleNativePointerUp);
      return () => { el.removeEventListener("pointerdown", handleNativePointerDown); el.removeEventListener("pointermove", handleNativePointerMove); el.removeEventListener("pointerup", handleNativePointerUp); };
  }, [engine]);

  return (
    <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
      <canvas ref={canvasRef} width={1920} height={1080} className="w-full h-full object-contain cursor-crosshair" />
      <canvas ref={overlayCanvasRef} width={1920} height={1080} className="hidden" />
    </div>
  );
}

"use client";

/**
 * WaterCanvas — renders an image as an interactive water surface.
 *
 * The cursor drags across the image like a finger across water: a height-field
 * ripple simulation runs on the GPU (ping-pong FBOs), and its gradient refracts
 * the image texture in the render pass.
 *
 * Progressive enhancement contract:
 *   server / pre-hydration / reduced-motion / no-WebGL / decode failure
 *     -> a plain <Image> (next/image renders a real <img>), never nothing.
 *   after mount, when everything is available -> <canvas> with the same
 *     className, so existing CSS keeps laying it out.
 */

import Image from "next/image";
import { useEffect, useRef, useState, type JSX } from "react";

/* -------------------------------------------------------------------------- */
/* Tunables                                                                    */
/* -------------------------------------------------------------------------- */

const SIM_SIZE = 256; // simulation grid (independent of canvas resolution)
const MAX_DPR = 2;
const DAMPING = 0.978; // per simulation step — settles in ~1.5s
const REFRACTION = 0.05; // UV offset per unit of height gradient
const SPECULAR = 0.32;
const STEP_MS = 1000 / 60;
const MAX_STEPS_PER_FRAME = 2;
const SETTLE_MS = 2000; // idle time after last input before the loop parks
const RADIUS = 0.035; // injection blob radius, in UV units
const MIN_STRENGTH = 0.015; // per pointermove; a drag accumulates these
const MAX_STRENGTH = 0.09;
const TAP_STRENGTH = 0.7; // single-shot impulse on pointerdown
const SPEED_FOR_MAX = 0.012; // UV per ms that saturates the strength ramp

/* WebGL enum values not present on the WebGL1 context object. */
const GL_RGBA16F = 0x881a;
const GL_HALF_FLOAT = 0x140b;

type GL = WebGLRenderingContext | WebGL2RenderingContext;

/* -------------------------------------------------------------------------- */
/* Shaders (GLSL ES 1.00 — valid in both WebGL1 and WebGL2 contexts)           */
/* -------------------------------------------------------------------------- */

const VERTEX_SRC = `
attribute vec2 aPosition;
varying vec2 vUv;
void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

/**
 * Simulation pass. State texture packs (height, previousHeight) in (r, g).
 * height' = (N + S + E + W) / 2 - previousHeight, damped, plus the pointer
 * stroke injected as a Gaussian around the segment travelled this frame.
 */
const SIM_SRC = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uState;
uniform vec2 uTexel;
uniform vec2 uStrokeA;
uniform vec2 uStrokeB;
uniform float uStrength;
uniform float uRadius;
uniform float uAspect;
uniform float uDamping;

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float t = clamp(dot(pa, ba) / max(dot(ba, ba), 1e-6), 0.0, 1.0);
  return length(pa - ba * t);
}

void main() {
  vec2 state = texture2D(uState, vUv).rg;
  float current = state.r;
  float previous = state.g;

  float n = texture2D(uState, vUv + vec2(0.0, uTexel.y)).r;
  float s = texture2D(uState, vUv - vec2(0.0, uTexel.y)).r;
  float e = texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r;
  float w = texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r;

  float height = (n + s + e + w) * 0.5 - previous;
  height *= uDamping;

  if (uStrength > 0.0) {
    vec2 p = vec2(vUv.x * uAspect, vUv.y);
    vec2 a = vec2(uStrokeA.x * uAspect, uStrokeA.y);
    vec2 b = vec2(uStrokeB.x * uAspect, uStrokeB.y);
    float d = segmentDistance(p, a, b);
    height += uStrength * exp(-(d * d) / (uRadius * uRadius));
  }

  // Fade the border so waves die at the edge instead of reflecting forever.
  vec2 lo = smoothstep(vec2(0.0), uTexel * 3.0, vUv);
  vec2 hi = smoothstep(vec2(0.0), uTexel * 3.0, vec2(1.0) - vUv);
  height *= lo.x * lo.y * hi.x * hi.y;

  gl_FragColor = vec4(height, current, 0.0, 1.0);
}
`;

/**
 * Render pass. Central differences on the height field give a surface normal;
 * its xy refracts the image UV, its z drives a soft specular highlight.
 * uCover reproduces `object-fit: cover` in UV space.
 */
const RENDER_SRC = `
precision highp float;
varying vec2 vUv;
uniform sampler2D uState;
uniform sampler2D uImage;
uniform vec2 uTexel;
uniform vec2 uCover;
uniform float uRefraction;
uniform float uSpecular;

void main() {
  float e = texture2D(uState, vUv + vec2(uTexel.x, 0.0)).r;
  float w = texture2D(uState, vUv - vec2(uTexel.x, 0.0)).r;
  float n = texture2D(uState, vUv + vec2(0.0, uTexel.y)).r;
  float s = texture2D(uState, vUv - vec2(0.0, uTexel.y)).r;
  vec2 gradient = vec2(e - w, n - s);

  vec2 uv = 0.5 + (vUv - 0.5) * uCover + gradient * uRefraction;
  vec3 color = texture2D(uImage, clamp(uv, 0.0, 1.0)).rgb;

  vec3 normal = normalize(vec3(-gradient * 8.0, 1.0));
  vec3 light = normalize(vec3(-0.35, 0.65, 0.7));
  float spec = pow(max(dot(normal, light), 0.0), 48.0);
  color += vec3(spec * uSpecular);

  gl_FragColor = vec4(color, 1.0);
}
`;

/* -------------------------------------------------------------------------- */
/* GL helpers                                                                  */
/* -------------------------------------------------------------------------- */

function compile(gl: GL, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("WaterCanvas: shader compile failed", gl.getShaderInfoLog(shader));
    }
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function link(gl: GL, vertexSrc: string, fragmentSrc: string): WebGLProgram | null {
  const vertex = compile(gl, gl.VERTEX_SHADER, vertexSrc);
  const fragment = compile(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  if (!vertex || !fragment) {
    if (vertex) gl.deleteShader(vertex);
    if (fragment) gl.deleteShader(fragment);
    return null;
  }
  const program = gl.createProgram();
  if (!program) {
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    return null;
  }
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.bindAttribLocation(program, 0, "aPosition");
  gl.linkProgram(program);
  // Shaders can be released as soon as they are linked into the program.
  gl.detachShader(program, vertex);
  gl.detachShader(program, fragment);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("WaterCanvas: program link failed", gl.getProgramInfoLog(program));
    }
    gl.deleteProgram(program);
    return null;
  }
  return program;
}

function hasWebGL(): boolean {
  try {
    const probe = document.createElement("canvas");
    const gl = probe.getContext("webgl2") ?? probe.getContext("webgl");
    if (!gl) return false;
    (gl as GL).getExtension("WEBGL_lose_context")?.loseContext();
    return true;
  } catch {
    return false;
  }
}

function prefersReducedMotion(): boolean {
  return (
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/* -------------------------------------------------------------------------- */
/* Component                                                                   */
/* -------------------------------------------------------------------------- */

export default function WaterCanvas(props: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}): JSX.Element {
  const { src, alt, width, height, className, priority } = props;

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textureRef = useRef<HTMLImageElement | null>(null);
  const failedRef = useRef(false);

  // `false` on the server and on the first client render, so hydration matches.
  const [engaged, setEngaged] = useState(false);
  const [textureSrc, setTextureSrc] = useState<string | null>(null);

  /* --- phase 1: decide whether to engage, and decode the texture ---------- */
  useEffect(() => {
    if (failedRef.current) return;
    if (prefersReducedMotion() || !hasWebGL()) return;

    let cancelled = false;

    const decode = (url: string) => {
      const texture = new window.Image();
      texture.decoding = "async";
      texture.onload = () => {
        if (cancelled || texture.naturalWidth === 0) return;
        textureRef.current = texture;
        setTextureSrc(url);
        setEngaged(true);
      };
      texture.onerror = () => {
        // Leave the <img> in place.
      };
      texture.src = url;
    };

    const el = imgRef.current;
    if (!el) return;

    // Reuse whatever the browser already fetched for the <img> so the texture
    // comes straight from cache instead of costing a second download.
    const start = () => decode(el.currentSrc || el.src || src);

    if (el.complete && el.naturalWidth > 0) {
      start();
      return () => {
        cancelled = true;
      };
    }

    el.addEventListener("load", start);
    return () => {
      cancelled = true;
      el.removeEventListener("load", start);
    };
  }, [src]);

  /* --- phase 2: run the simulation ---------------------------------------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    const image = textureRef.current;
    if (!engaged || !canvas || !image) return;

    const options: WebGLContextAttributes = {
      alpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      premultipliedAlpha: true,
      preserveDrawingBuffer: false,
      powerPreference: "low-power",
    };
    const gl = (canvas.getContext("webgl2", options) ??
      canvas.getContext("webgl", options)) as GL | null;

    if (!gl) {
      failedRef.current = true;
      setEngaged(false);
      return;
    }

    const isGL2 =
      typeof WebGL2RenderingContext !== "undefined" && gl instanceof WebGL2RenderingContext;

    /* ---------- resources ---------- */
    let quad: WebGLBuffer | null = null;
    let simProgram: WebGLProgram | null = null;
    let renderProgram: WebGLProgram | null = null;
    let imageTexture: WebGLTexture | null = null;
    const stateTextures: (WebGLTexture | null)[] = [null, null];
    const stateBuffers: (WebGLFramebuffer | null)[] = [null, null];
    let front = 0;

    let simUniforms: Record<string, WebGLUniformLocation | null> = {};
    let renderUniforms: Record<string, WebGLUniformLocation | null> = {};

    let ready = false;
    let contextLost = false;
    let running = false;
    let raf = 0;
    let accumulator = 0;
    let lastFrame = 0;
    let lastInput = Number.NEGATIVE_INFINITY;
    let visible = true;
    let pointerInside = false;

    let cssWidth = 0;
    let cssHeight = 0;

    // Pointer stroke pending for the next simulation step.
    let strokeAx = 0;
    let strokeAy = 0;
    let strokeBx = 0;
    let strokeBy = 0;
    let strokeStrength = 0;
    let lastPointerX = 0;
    let lastPointerY = 0;
    let lastPointerTime = 0;
    let hasPointerSample = false;

    const createStateTexture = (): WebGLTexture | null => {
      const texture = gl.createTexture();
      if (!texture) return null;
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      return texture;
    };

    /** Allocates the two float/half-float ping-pong targets. */
    const allocateState = (): boolean => {
      let internalFormat: number = gl.RGBA;
      let type: number = gl.UNSIGNED_BYTE;

      if (isGL2) {
        const gl2 = gl as WebGL2RenderingContext;
        if (gl2.getExtension("EXT_color_buffer_half_float") || gl2.getExtension("EXT_color_buffer_float")) {
          internalFormat = GL_RGBA16F;
          type = GL_HALF_FLOAT;
        } else {
          return false;
        }
      } else {
        const half = gl.getExtension("OES_texture_half_float");
        if (half) {
          internalFormat = gl.RGBA;
          type = half.HALF_FLOAT_OES;
        } else if (gl.getExtension("OES_texture_float")) {
          internalFormat = gl.RGBA;
          type = gl.FLOAT;
        } else {
          return false;
        }
      }

      for (let i = 0; i < 2; i += 1) {
        const texture = createStateTexture();
        const framebuffer = gl.createFramebuffer();
        if (!texture || !framebuffer) return false;
        stateTextures[i] = texture;
        stateBuffers[i] = framebuffer;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(
          gl.TEXTURE_2D,
          0,
          internalFormat,
          SIM_SIZE,
          SIM_SIZE,
          0,
          gl.RGBA,
          type,
          null,
        );
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0,
        );
        if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
          return false;
        }
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      return true;
    };

    const createResources = (): boolean => {
      quad = gl.createBuffer();
      if (!quad) return false;
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );

      simProgram = link(gl, VERTEX_SRC, SIM_SRC);
      renderProgram = link(gl, VERTEX_SRC, RENDER_SRC);
      if (!simProgram || !renderProgram) return false;

      simUniforms = {
        uState: gl.getUniformLocation(simProgram, "uState"),
        uTexel: gl.getUniformLocation(simProgram, "uTexel"),
        uStrokeA: gl.getUniformLocation(simProgram, "uStrokeA"),
        uStrokeB: gl.getUniformLocation(simProgram, "uStrokeB"),
        uStrength: gl.getUniformLocation(simProgram, "uStrength"),
        uRadius: gl.getUniformLocation(simProgram, "uRadius"),
        uAspect: gl.getUniformLocation(simProgram, "uAspect"),
        uDamping: gl.getUniformLocation(simProgram, "uDamping"),
      };
      renderUniforms = {
        uState: gl.getUniformLocation(renderProgram, "uState"),
        uImage: gl.getUniformLocation(renderProgram, "uImage"),
        uTexel: gl.getUniformLocation(renderProgram, "uTexel"),
        uCover: gl.getUniformLocation(renderProgram, "uCover"),
        uRefraction: gl.getUniformLocation(renderProgram, "uRefraction"),
        uSpecular: gl.getUniformLocation(renderProgram, "uSpecular"),
      };

      imageTexture = gl.createTexture();
      if (!imageTexture) return false;
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

      if (!allocateState()) return false;

      gl.disable(gl.DEPTH_TEST);
      gl.disable(gl.BLEND);
      return true;
    };

    const destroyResources = () => {
      if (contextLost) return; // the context already dropped everything
      for (let i = 0; i < 2; i += 1) {
        if (stateTextures[i]) gl.deleteTexture(stateTextures[i]);
        if (stateBuffers[i]) gl.deleteFramebuffer(stateBuffers[i]);
        stateTextures[i] = null;
        stateBuffers[i] = null;
      }
      if (imageTexture) gl.deleteTexture(imageTexture);
      if (simProgram) gl.deleteProgram(simProgram);
      if (renderProgram) gl.deleteProgram(renderProgram);
      if (quad) gl.deleteBuffer(quad);
      imageTexture = null;
      simProgram = null;
      renderProgram = null;
      quad = null;
    };

    const bindQuad = (program: WebGLProgram) => {
      gl.useProgram(program);
      gl.bindBuffer(gl.ARRAY_BUFFER, quad);
      gl.enableVertexAttribArray(0);
      gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const nextCssWidth = Math.max(1, Math.round(rect.width));
      const nextCssHeight = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(MAX_DPR, window.devicePixelRatio || 1);
      const pixelWidth = Math.max(1, Math.round(nextCssWidth * dpr));
      const pixelHeight = Math.max(1, Math.round(nextCssHeight * dpr));
      cssWidth = nextCssWidth;
      cssHeight = nextCssHeight;
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
      }
    };

    /** `object-fit: cover` expressed as a UV scale around the centre. */
    const coverScale = (): [number, number] => {
      const imageAspect = image.naturalWidth / Math.max(1, image.naturalHeight);
      const canvasAspect = cssWidth / Math.max(1, cssHeight);
      return canvasAspect > imageAspect
        ? [1, imageAspect / canvasAspect]
        : [canvasAspect / imageAspect, 1];
    };

    const simulate = () => {
      if (!simProgram) return;
      const back = 1 - front;
      gl.bindFramebuffer(gl.FRAMEBUFFER, stateBuffers[back]);
      gl.viewport(0, 0, SIM_SIZE, SIM_SIZE);
      bindQuad(simProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, stateTextures[front]);
      gl.uniform1i(simUniforms.uState, 0);
      gl.uniform2f(simUniforms.uTexel, 1 / SIM_SIZE, 1 / SIM_SIZE);
      gl.uniform2f(simUniforms.uStrokeA, strokeAx, strokeAy);
      gl.uniform2f(simUniforms.uStrokeB, strokeBx, strokeBy);
      gl.uniform1f(simUniforms.uStrength, strokeStrength);
      gl.uniform1f(simUniforms.uRadius, RADIUS);
      gl.uniform1f(simUniforms.uAspect, cssWidth / Math.max(1, cssHeight));
      gl.uniform1f(simUniforms.uDamping, DAMPING);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      front = back;
      strokeStrength = 0; // each stroke is injected exactly once
    };

    const draw = () => {
      if (!renderProgram) return;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      bindQuad(renderProgram);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, stateTextures[front]);
      gl.uniform1i(renderUniforms.uState, 0);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, imageTexture);
      gl.uniform1i(renderUniforms.uImage, 1);
      gl.uniform2f(renderUniforms.uTexel, 1 / SIM_SIZE, 1 / SIM_SIZE);
      const [coverX, coverY] = coverScale();
      gl.uniform2f(renderUniforms.uCover, coverX, coverY);
      gl.uniform1f(renderUniforms.uRefraction, REFRACTION);
      gl.uniform1f(renderUniforms.uSpecular, SPECULAR);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    const clearState = () => {
      for (let i = 0; i < 2; i += 1) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, stateBuffers[i]);
        gl.viewport(0, 0, SIM_SIZE, SIM_SIZE);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      running = false;
    };

    const frame = (now: number) => {
      if (!ready || contextLost) {
        running = false;
        return;
      }
      const delta = Math.min(100, now - lastFrame);
      lastFrame = now;
      accumulator = Math.min(accumulator + delta, STEP_MS * MAX_STEPS_PER_FRAME);

      let steps = 0;
      while (accumulator >= STEP_MS && steps < MAX_STEPS_PER_FRAME) {
        simulate();
        accumulator -= STEP_MS;
        steps += 1;
      }
      if (steps === 0 && strokeStrength > 0) simulate();
      draw();

      // Park the loop once the pointer is gone and the surface has settled.
      if (!pointerInside && now - lastInput > SETTLE_MS) {
        clearState();
        draw();
        running = false;
        raf = 0;
        return;
      }
      raf = requestAnimationFrame(frame);
    };

    const play = () => {
      if (running || !ready || contextLost || !visible) return;
      running = true;
      lastFrame = performance.now();
      accumulator = 0;
      raf = requestAnimationFrame(frame);
    };

    const renderStill = () => {
      if (!ready || contextLost) return;
      draw();
    };

    /* ---------- pointer ---------- */
    const toUv = (event: PointerEvent): [number, number] => {
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / Math.max(1, rect.width);
      const y = 1 - (event.clientY - rect.top) / Math.max(1, rect.height);
      return [x, y];
    };

    /**
     * Queue a stroke segment for the next simulation step. Several pointermove
     * events can land inside one frame, so the segment is extended rather than
     * replaced — the wake stays continuous instead of breaking into dots.
     */
    const inject = (ax: number, ay: number, bx: number, by: number, strength: number) => {
      if (strokeStrength > 0) {
        strokeBx = bx;
        strokeBy = by;
        strokeStrength = Math.max(strokeStrength, strength);
      } else {
        strokeAx = ax;
        strokeAy = ay;
        strokeBx = bx;
        strokeBy = by;
        strokeStrength = strength;
      }
      lastInput = performance.now();
      play();
    };

    const onPointerMove = (event: PointerEvent) => {
      pointerInside = true;
      const [x, y] = toUv(event);
      const now = performance.now();

      // The segment travelled since the previous sample, so a fast drag lays
      // down an unbroken wake and its speed sets the wave amplitude.
      let ax = x;
      let ay = y;
      let strength = MIN_STRENGTH;
      if (hasPointerSample) {
        ax = lastPointerX;
        ay = lastPointerY;
        const dt = Math.max(1, now - lastPointerTime);
        const speed = Math.hypot(x - lastPointerX, y - lastPointerY) / dt;
        strength =
          MIN_STRENGTH + (MAX_STRENGTH - MIN_STRENGTH) * Math.min(1, speed / SPEED_FOR_MAX);
      }

      lastPointerX = x;
      lastPointerY = y;
      lastPointerTime = now;
      hasPointerSample = true;
      inject(ax, ay, x, y, strength);
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerInside = true;
      const [x, y] = toUv(event);
      hasPointerSample = true;
      lastPointerX = x;
      lastPointerY = y;
      lastPointerTime = performance.now();
      inject(x, y, x, y, TAP_STRENGTH);
    };

    const onPointerLeave = () => {
      pointerInside = false;
      hasPointerSample = false;
      lastInput = performance.now();
    };

    /* ---------- context loss ---------- */
    const onContextLost = (event: Event) => {
      event.preventDefault();
      contextLost = true;
      ready = false;
      stop();
    };

    const onContextRestored = () => {
      contextLost = false;
      ready = false;
      destroyResources();
      if (createResources()) {
        ready = true;
        resize();
        renderStill();
      } else {
        failedRef.current = true;
        setEngaged(false);
      }
    };

    canvas.addEventListener("webglcontextlost", onContextLost);
    canvas.addEventListener("webglcontextrestored", onContextRestored);

    /* ---------- boot ---------- */
    if (!createResources()) {
      destroyResources();
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      failedRef.current = true;
      setEngaged(false);
      return;
    }
    ready = true;
    resize();
    renderStill();

    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointercancel", onPointerLeave);

    const resizeObserver = new ResizeObserver(() => {
      resize();
      renderStill();
    });
    resizeObserver.observe(canvas);

    const intersectionObserver = new IntersectionObserver(
      (entries) => {
        visible = entries.some((entry) => entry.isIntersecting);
        if (!visible) {
          stop();
        } else if (pointerInside || performance.now() - lastInput < SETTLE_MS) {
          play();
        } else {
          renderStill();
        }
      },
      { threshold: 0 },
    );
    intersectionObserver.observe(canvas);

    const motionQuery =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    const onMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        failedRef.current = true;
        setEngaged(false);
      }
    };
    motionQuery?.addEventListener("change", onMotionChange);

    return () => {
      stop();
      motionQuery?.removeEventListener("change", onMotionChange);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointercancel", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      canvas.removeEventListener("webglcontextrestored", onContextRestored);
      destroyResources();
      if (!contextLost) gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [engaged]);

  if (engaged && textureSrc) {
    return (
      <canvas
        ref={canvasRef}
        className={className}
        width={width}
        height={height}
        role="img"
        aria-label={alt}
        // Painted underneath the WebGL output: if a frame is ever missing —
        // during the swap, or after an unrecoverable context loss — the image
        // is still there, cropped exactly like the shader crops it.
        style={{
          backgroundImage: `url(${JSON.stringify(textureSrc)})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          touchAction: "pan-y",
        }}
      />
    );
  }

  return (
    <Image
      ref={imgRef}
      className={className}
      src={src}
      alt={alt}
      width={width}
      height={height}
      preload={priority}
    />
  );
}

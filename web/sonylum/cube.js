/* El cubo de vidrio de sonylum.ar/stack.
   Refracta con dispersión cromática una palabra gigante dibujada detrás;
   la palabra cambia con cada sección y el cubo responde al puntero y al scroll. */
import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { mergeVertices, mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { ConvexGeometry } from "three/addons/geometries/ConvexGeometry.js";

const MODEL_URL = "https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260929_212926_92423081-b0e4-4f5a-b650-14af6c05c058.glb";
const canvas = document.getElementById("scene");
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const DESKTOP = matchMedia("(min-width: 1024px)").matches;
const DPR = DESKTOP ? 1 : Math.min(devicePixelRatio, 1.5);
const RT_SCALE = DESKTOP ? 0.5 : 0.6;

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
} catch (e) {
  renderer = null;
}

if (renderer) {
  renderer.setClearColor(0x050507, 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(DPR);

  const scene = new THREE.Scene();
  const bgScene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 0, 10);

  const pivot = new THREE.Group();
  const spinner = new THREE.Group();
  pivot.add(spinner);
  scene.add(pivot);
  spinner.rotation.set(-0.42, 0.62, 0.18);

  /* ---------- fondo: la palabra que el cubo refracta ---------- */
  const bgCanvas = document.createElement("canvas");
  const bgCtx = bgCanvas.getContext("2d");
  const bgTex = new THREE.CanvasTexture(bgCanvas);
  bgTex.colorSpace = THREE.SRGBColorSpace;
  bgTex.minFilter = THREE.LinearFilter;
  bgTex.generateMipmaps = false;
  const bgQuad = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: { uTex: { value: bgTex } },
      vertexShader: "varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}",
      fragmentShader: "uniform sampler2D uTex;varying vec2 vUv;void main(){gl_FragColor=texture2D(uTex,vUv);\n#include <colorspace_fragment>\n}",
      depthTest: false, depthWrite: false
    })
  );
  bgQuad.frustumCulled = false;
  bgScene.add(bgQuad);

  /* ---------- material de vidrio (mismo shader que /stack) ---------- */
  const common = {
    uResolution: new THREE.Vector2(1, 1),
    uIorR: 1.15, uIorY: 1.16, uIorG: 1.18, uIorC: 1.22, uIorB: 1.22, uIorP: 1.22,
    uChromatic: 0.5, uSaturation: 1.08, uShininess: 90.0, uDiffuseness: 0.02,
    uFresnelPower: 5.0, uLight: new THREE.Vector3(-1, 1, 1).normalize()
  };
  const uniforms = (extra) => {
    const u = {};
    for (const [k, v] of Object.entries(common)) u[k] = { value: v && v.clone ? v.clone() : v };
    for (const [k, v] of Object.entries(extra)) u[k] = { value: v };
    return u;
  };
  const vert = `
    varying vec3 vNormal; varying vec3 vEye;
    void main(){
      vec4 mv = viewMatrix * modelMatrix * vec4(position,1.0);
      gl_Position = projectionMatrix * mv;
      vNormal = normalize(normalMatrix * normal);
      vEye = normalize(mv.xyz);
    }`;
  const frag = `
    uniform sampler2D uTexture; uniform vec2 uResolution;
    uniform float uIorR,uIorY,uIorG,uIorC,uIorB,uIorP;
    uniform float uRefractPower,uChromatic,uSaturation,uShininess,uDiffuseness,uFresnelPower,uBackside;
    uniform vec3 uLight;
    varying vec3 vNormal; varying vec3 vEye;
    float specularTerm(vec3 n,vec3 eye,vec3 l,float sh,float df){
      vec3 L=normalize(l); vec3 V=normalize(-eye); vec3 H=normalize(L+V);
      return pow(max(dot(n,H),0.0),sh)+max(0.0,dot(n,L))*df;
    }
    void main(){
      vec2 uv=gl_FragCoord.xy/uResolution;
      vec3 n=normalize(vNormal); if(uBackside>0.5) n=-n;
      vec3 eye=normalize(vEye); vec3 color=vec3(0.0);
      const int LOOP=5;
      for(int i=0;i<LOOP;i++){
        float slide=float(i)/float(LOOP)*0.045;
        vec3 rr=refract(eye,n,1.0/uIorR), ry=refract(eye,n,1.0/uIorY), rg=refract(eye,n,1.0/uIorG);
        vec3 rc=refract(eye,n,1.0/uIorC), rb=refract(eye,n,1.0/uIorB), rp=refract(eye,n,1.0/uIorP);
        vec3 tR=texture2D(uTexture,uv+rr.xy*(uRefractPower+slide)*uChromatic).rgb;
        vec3 tY=texture2D(uTexture,uv+ry.xy*(uRefractPower+slide)*uChromatic).rgb;
        vec3 tG=texture2D(uTexture,uv+rg.xy*(uRefractPower+slide*2.0)*uChromatic).rgb;
        vec3 tC=texture2D(uTexture,uv+rc.xy*(uRefractPower+slide*2.5)*uChromatic).rgb;
        vec3 tB=texture2D(uTexture,uv+rb.xy*(uRefractPower+slide*3.0)*uChromatic).rgb;
        vec3 tP=texture2D(uTexture,uv+rp.xy*(uRefractPower+slide)*uChromatic).rgb;
        float r=tR.r*0.5, y=(tY.r*2.0+tY.g*2.0-tY.b)/6.0, g=tG.g*0.5;
        float c=(tC.g*2.0+tC.b*2.0-tC.r)/6.0, b=tB.b*0.5, p=(tP.b*2.0+tP.r*2.0-tP.g)/6.0;
        color+=vec3(r+(2.0*p+2.0*y-c)/3.0, g+(2.0*y+2.0*c-p)/3.0, b+(2.0*c+2.0*p-y)/3.0);
      }
      color/=float(LOOP);
      float luma=dot(color,vec3(0.2125,0.7154,0.0721));
      color=mix(vec3(luma),color,uSaturation);
      float spec=specularTerm(n,eye,normalize(-uLight),uShininess,uDiffuseness);
      spec+=0.6*specularTerm(n,eye,normalize(vec3(1.0,1.0,-1.0)),uShininess*0.6,uDiffuseness*0.5);
      color+=spec*(uBackside>0.5?0.35:1.0);
      float f=pow(1.0+dot(eye,n),uFresnelPower);
      color=mix(color,vec3(1.0),f*(uBackside>0.5?0.25:0.55));
      // vidrio transparente como el original de /stack, con un tono violáceo suave
      color*=vec3(0.95,0.92,1.0);
      color+=vec3(0.014,0.006,0.026);
      gl_FragColor=vec4(color,1.0);
      #include <colorspace_fragment>
    }`;
  const backMat = new THREE.ShaderMaterial({ uniforms: uniforms({ uTexture: bgTex, uRefractPower: 0.22, uBackside: 1.0 }), vertexShader: vert, fragmentShader: frag, side: THREE.BackSide });
  const frontMat = new THREE.ShaderMaterial({ uniforms: uniforms({ uTexture: bgTex, uRefractPower: 0.30, uBackside: 0.0 }), vertexShader: vert, fragmentShader: frag, side: THREE.FrontSide });

  let cubeBack = null, cubeFront = null, rtBack = null, rtFront = null;

  function normalize(g) {
    g.computeBoundingBox();
    const c = new THREE.Vector3(); g.boundingBox.getCenter(c);
    g.translate(-c.x, -c.y, -c.z);
    g.computeBoundingBox();
    const s = new THREE.Vector3(); g.boundingBox.getSize(s);
    const m = Math.max(s.x, s.y, s.z) || 1;
    g.scale(1 / m, 1 / m, 1 / m);
    g.computeVertexNormals();
    return g;
  }
  function attach(geo) {
    geo = normalize(geo);
    if (cubeBack) {
      cubeBack.geometry.dispose(); cubeFront.geometry.dispose();
      cubeBack.geometry = geo; cubeFront.geometry = geo.clone();
    } else {
      cubeBack = new THREE.Mesh(geo, backMat);
      cubeFront = new THREE.Mesh(geo.clone(), frontMat);
      spinner.add(cubeBack, cubeFront);
    }
    document.documentElement.classList.add("webgl-ready");
  }
  // Cubo facetado tipo gema: caras grandes, biseles planos en cada arista y un triángulo en cada esquina.
  // Es el respaldo; en el dominio real se reemplaza por el modelo original de /stack.
  // Cubo bien cuadrado: caras planas grandes y un bisel fino y plano en cada arista y esquina.
  function facetedCube() {
    const pts = [], v = [1, 0.955, 0.955];
    const perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
    for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) for (const p of perms) {
      pts.push(new THREE.Vector3(sx * v[p[0]], sy * v[p[1]], sz * v[p[2]]));
    }
    const g = new ConvexGeometry(pts);
    return g.index ? g.toNonIndexed() : g;
  }
  attach(facetedCube());

  // El modelo original de /stack reemplaza al cubo procedural cuando termina de cargar.
  const loadModel = () => new GLTFLoader().load(MODEL_URL, (gltf) => {
    try {
      gltf.scene.updateMatrixWorld(true);
      const parts = [];
      gltf.scene.traverse((o) => {
        if (!o.isMesh || !o.geometry) return;
        let g = o.geometry.clone();
        ["uv", "color", "tangent", "uv1", "uv2"].forEach((a) => { if (g.getAttribute(a)) g.deleteAttribute(a); });
        g.applyMatrix4(o.matrixWorld);
        g = mergeVertices(g, 1e-4);
        parts.push(g);
      });
      const merged = parts.length && mergeGeometries(parts, false);
      if (merged) attach(merged);
    } catch (err) { /* el cubo procedural sigue activo */ }
  }, undefined, () => {});
  if ("requestIdleCallback" in window) requestIdleCallback(loadModel, { timeout: 900 }); else setTimeout(loadModel, 300);

  /* ---------- palabra de fondo con fundido ---------- */
  let words = window.sonyWords || ["SONY", "LUM"], prevWords = null, fade = 1, fadeStart = 0;
  let pos = { x: 0.5, y: 0.3 };

  function placement() {
    const W = innerWidth, H = innerHeight;
    return DESKTOP || W >= 1024 ? { x: 0.72, y: 0.45, size: Math.min(H * 0.22, W * 0.13), font: Math.min(H * 0.14, W * 0.07), maxW: W * 0.34 }
                                : { x: 0.5, y: 0.24, size: Math.min(H * 0.16, W * 0.34), font: Math.min(H * 0.1, W * 0.15), maxW: W * 0.76 };
  }
  function drawWords(list, alpha, P, W, H) {
    if (!list || alpha <= 0) return;
    let fs = P.font;
    bgCtx.font = `800 ${fs}px Poppins`;
    const widest = Math.max(...list.map((t) => bgCtx.measureText(t).width));
    if (widest > P.maxW) fs *= P.maxW / widest;
    bgCtx.font = `800 ${fs}px Poppins`;
    bgCtx.textAlign = "center";
    bgCtx.textBaseline = "alphabetic";
    bgCtx.globalAlpha = alpha;
    bgCtx.fillStyle = "#e9e9e9";
    const cx = W * P.x, cy = H * P.y, gap = fs * 0.92, cap = fs * 0.7;
    bgCtx.fillText(list[0], cx, cy + cap / 2 - gap / 2);
    if (list[1]) bgCtx.fillText(list[1], cx, cy + cap / 2 + gap / 2);
    bgCtx.globalAlpha = 1;
  }
  function drawBackground() {
    const W = innerWidth, H = innerHeight, P = placement();
    bgCanvas.width = Math.max(2, Math.round(W * DPR));
    bgCanvas.height = Math.max(2, Math.round(H * DPR));
    bgCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
    bgCtx.fillStyle = "#050507";
    bgCtx.fillRect(0, 0, W, H);
    const e = fade * fade * (3 - 2 * fade);
    drawWords(prevWords, 1 - e, P, W, H);
    drawWords(words, e, P, W, H);
    const cx = W * P.x, cy = H * P.y;
    const grad = bgCtx.createRadialGradient(cx, cy, 0, cx, cy, Math.min(W, H) * 0.42);
    grad.addColorStop(0, "rgba(104,66,255,0.08)");
    grad.addColorStop(1, "rgba(104,66,255,0)");
    bgCtx.globalCompositeOperation = "screen";
    bgCtx.fillStyle = grad;
    bgCtx.fillRect(0, 0, W, H);
    bgCtx.globalCompositeOperation = "source-over";
    bgTex.needsUpdate = true;
  }

  /* ---------- tamaño y posición ---------- */
  const makeRT = (w, h) => new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
  function layout() {
    const W = innerWidth, H = innerHeight, P = placement();
    renderer.setSize(W, H, false);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    const db = new THREE.Vector2(); renderer.getDrawingBufferSize(db);
    const rw = Math.max(2, Math.round(db.x * RT_SCALE)), rh = Math.max(2, Math.round(db.y * RT_SCALE));
    rtBack && rtBack.dispose(); rtFront && rtFront.dispose();
    rtBack = makeRT(rw, rh); rtFront = makeRT(rw, rh);
    backMat.uniforms.uTexture.value = rtBack.texture;
    frontMat.uniforms.uTexture.value = rtFront.texture;
    backMat.uniforms.uResolution.value.set(rw, rh);
    frontMat.uniforms.uResolution.value.set(db.x, db.y);
    drawBackground();
    const visH = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2) * 10, visW = visH * camera.aspect;
    pivot.position.set((P.x - 0.5) * visW, (0.5 - P.y) * visH, 0);
    pivot.scale.setScalar((P.size / H) * visH);
    pos = P;
  }

  /* ---------- interacción: puntero, scroll e impulsos ---------- */
  const qY = new THREE.Quaternion(), qX = new THREE.Quaternion();
  const axY = new THREE.Vector3(0, 1, 0), axX = new THREE.Vector3(1, 0, 0);
  function rotate(dx, dy) {
    qY.setFromAxisAngle(axY, dx); qX.setFromAxisAngle(axX, dy);
    spinner.quaternion.premultiply(qY).premultiply(qX);
  }
  let velX = 0, velY = 0, lastX = null, lastY = null, idleSince = performance.now(), lastScroll = scrollY;
  if (finePointer && !reduce) {
    addEventListener("pointermove", (e) => {
      if (lastX !== null) {
        if (drag) { lastX = e.clientX; lastY = e.clientY; return; }
        const dx = (e.clientX - lastX) * 0.004, dy = (e.clientY - lastY) * 0.004;
        rotate(dx, dy);
        velX = dx * 0.6; velY = dy * 0.6; idleSince = performance.now();
      }
      lastX = e.clientX; lastY = e.clientY;
    }, { passive: true });
  }

  // Tocar o arrastrar el cubo: gira loco. Solo se activa sobre el cubo, el resto de la página scrollea normal.
  function onCube(x, y, target) {
    if (target && target.closest && target.closest("a,button,input,label,.card,.works,.caps,.cv,.peek,.rail,.top")) return false;
    const dx = x - innerWidth * pos.x, dy = y - innerHeight * pos.y;
    return Math.hypot(dx, dy) < pos.size * 0.85;
  }
  let drag = null;
  function grab(x, y, target) {
    if (!onCube(x, y, target)) return false;
    drag = { x, y, t: performance.now(), moved: 0, vx: 0, vy: 0 };
    document.documentElement.classList.add("cube-grab");
    return true;
  }
  function pull(x, y) {
    if (!drag) return;
    const now = performance.now(), dt = Math.max(1, now - drag.t);
    const dx = (x - drag.x) * 0.012, dy = (y - drag.y) * 0.012;
    rotate(dx, dy);
    drag.vx = dx * 16.7 / dt; drag.vy = dy * 16.7 / dt;
    drag.moved += Math.abs(x - drag.x) + Math.abs(y - drag.y);
    drag.x = x; drag.y = y; drag.t = now; idleSince = now;
  }
  function drop() {
    if (!drag) return;
    if (drag.moved < 8) {           // toque: giro loco
      velX += (velX >= 0 ? 1 : -1) * (0.55 + Math.random() * 0.25);
      velY += (Math.random() - 0.5) * 0.5;
    } else {                        // arrastre: lo suelta con su velocidad, amplificada
      velX += drag.vx * 2.2; velY += drag.vy * 2.2;
    }
    velX = Math.max(-1.4, Math.min(1.4, velX)); velY = Math.max(-1.2, Math.min(1.2, velY));
    idleSince = performance.now();
    drag = null;
    document.documentElement.classList.remove("cube-grab");
  }
  addEventListener("pointerdown", (e) => { if (e.pointerType !== "touch" && grab(e.clientX, e.clientY, e.target)) e.preventDefault(); });
  addEventListener("pointermove", (e) => { if (e.pointerType !== "touch") pull(e.clientX, e.clientY); }, { passive: true });
  addEventListener("pointerup", (e) => { if (e.pointerType !== "touch") drop(); });
  addEventListener("touchstart", (e) => { const t = e.touches[0]; if (e.touches.length === 1 && grab(t.clientX, t.clientY, e.target)) e.preventDefault(); }, { passive: false });
  addEventListener("touchmove", (e) => { if (!drag) return; const t = e.touches[0]; pull(t.clientX, t.clientY); e.preventDefault(); }, { passive: false });
  addEventListener("touchend", drop);
  addEventListener("touchcancel", drop);

  window.sonyCube = {
    setWords(list) {
      if (list.join("|") === words.join("|")) return;
      prevWords = words; words = list; fade = reduce ? 1 : 0; fadeStart = performance.now();
      if (!reduce) { velX += 0.09; velY += 0.02; idleSince = performance.now(); }
      if (reduce) drawBackground();
    }
  };

  function render() {
    const db = new THREE.Vector2(); renderer.getDrawingBufferSize(db);
    renderer.setRenderTarget(rtBack); renderer.autoClear = true; renderer.render(bgScene, camera);
    renderer.setRenderTarget(rtFront); renderer.render(bgScene, camera);
    renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera);
    renderer.setRenderTarget(null); renderer.autoClear = true; renderer.render(bgScene, camera);
    cubeBack.visible = false; renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera); cubeBack.visible = true;
  }

  let last = performance.now(), presented = 0, paused = false;
  window.addEventListener("sony:motion", (e) => { paused = !e.detail; });
  function loop(now) {
    requestAnimationFrame(loop);
    if (document.hidden) return;
    const active = Math.abs(velX) + Math.abs(velY) > 0.0002 || fade < 1;
    const fps = active || drag ? (DESKTOP ? 50 : 45) : 30;
    if (now - presented < 1000 / fps) return;
    presented = now;
    const frame = Math.min((now - last) / 1000, 0.055) * 60; last = now;

    // el scroll también hace girar el cubo (en el celular es la interacción principal)
    const sy = scrollY, ds = sy - lastScroll; lastScroll = sy;
    if (!reduce && !paused && ds) { velY += ds * 0.00012; velX += ds * 0.00005; idleSince = now; }

    if (fade < 1) { fade = Math.min(1, (now - fadeStart) / 650); drawBackground(); }

    if (!reduce && !paused) {
      if (Math.abs(velX) + Math.abs(velY) > 0.00002) {
        rotate(velX * frame, velY * frame);
        const d = Math.pow(0.94, frame); velX *= d; velY *= d;
      }
      const blend = drag ? 0 : THREE.MathUtils.clamp(((now - idleSince) / 1000 - 0.9) / 1.4, 0, 1);
      if (blend > 0) rotate((DESKTOP ? 0.0016 : 0.0027) * frame * blend, 0.00045 * frame * blend);
    }
    render();
  }

  layout();
  requestAnimationFrame(loop);
  Promise.race([document.fonts.load("800 100px Poppins"), new Promise((r) => setTimeout(r, 1500))]).then(drawBackground);
  let rt = 0;
  addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(layout, 120); }, { passive: true });
}

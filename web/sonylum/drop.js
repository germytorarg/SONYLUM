/* La gota. Un cuerpo de vidrio líquido renderizado con raymarching (WebGL1).
   Recibe un objetivo (posición, tamaño, forma) y lo persigue con física de resorte;
   se arrastra, se tira, se divide y refracta la foto que tiene debajo. */
(function () {
  "use strict";

  var SHAPES = {
    sphere: [1, 0, 0, 0, 0],
    box:    [0, 1, 0, 0, 0],
    prism:  [0, 0, 1, 0, 0],
    torus:  [0, 0, 0, 1, 0],
    swarm:  [1, 0, 0, 0, 1]
  };
  var TINTS = {
    rojo:    { c: [0.89, 0.27, 0.18], a: 0.38 },
    oro:     { c: [0.86, 0.66, 0.36], a: 0.42 },
    cristal: { c: [0.86, 0.94, 0.97], a: 0.08 },
    tinta:   { c: [0.10, 0.09, 0.09], a: 0.72 }
  };

  var VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";

  var FRAG = [
    "precision highp float;",
    "uniform vec2 uRes;uniform vec2 uC;uniform float uR;uniform float uT;",
    "uniform vec4 uW;uniform float uSpread;uniform vec2 uVel;uniform float uEnergy;uniform float uSplash;",
    "uniform vec3 uTint;uniform float uTintAmt;",
    "uniform sampler2D uEnv;uniform float uEnvAmt;uniform vec4 uEnvRect;uniform vec2 uEnvSize;uniform float uDpr;",
    "const vec3 INK=vec3(.047,.043,.039);",
    "mat2 rot(float a){float c=cos(a),s=sin(a);return mat2(c,-s,s,c);}",
    "float smin(float a,float b,float k){float h=clamp(.5+.5*(b-a)/k,0.,1.);return mix(b,a,h)-k*h*(1.-h);}",
    "float sdBox(vec3 p,vec3 b,float r){vec3 q=abs(p)-b+r;return length(max(q,0.))+min(max(q.x,max(q.y,q.z)),0.)-r;}",
    "float sdTri(vec3 p,vec2 h){vec3 q=abs(p);return max(q.z-h.y,max(q.x*.866025+p.y*.5,-p.y)-h.x*.5);}",
    "float sdTorus(vec3 p,vec2 t){vec2 q=vec2(length(p.xy)-t.x,p.z);return length(q)-t.y;}",
    "float map(vec3 p){",
    "  float k=min(length(uVel),.75);",
    "  if(k>.001){vec2 d=uVel/length(uVel);float a=dot(p.xy,d);vec2 pp=p.xy-a*d;p.xy=d*a/(1.+k)+pp*(1.+k*.3);}",
    "  float s=1.-.42*uSpread;",
    "  vec3 q=p/s;",
    "  q.xz*=rot(uT*.31);q.xy*=rot(sin(uT*.23)*.6);q.yz*=rot(.35+sin(uT*.17)*.3);",
    "  float ws=uW.x+uW.y+uW.z+uW.w+1e-4;",
    "  float d=(uW.x*(length(q)-1.)+uW.y*sdBox(q,vec3(.86),.15)+uW.z*(sdTri(q,vec2(1.45,.62))-.1)+uW.w*sdTorus(q,vec2(.8,.3)))/ws;",
    "  d+=sin(q.x*3.1+uT*1.7)*sin(q.y*2.7+uT*1.3)*sin(q.z*3.3+uT*1.1)*(.03+.1*uEnergy);",
    "  d*=s;",
    "  float sp=max(uSpread,uSplash);",
    "  if(sp>.001){",
    "    for(int i=0;i<7;i++){",
    "      float fi=float(i);",
    "      float a=uT*(.32+.09*fi)*(1.+uEnergy)+fi*1.71;",
    "      float rr=uSpread*(1.5+.4*sin(uT*.5+fi*2.1))+uSplash*(1.3+fi*.17);",
    "      vec3 c=vec3(cos(a)*rr,sin(a*1.13)*rr*.72,sin(a*.7)*rr*.3);",
    "      float sr=(.13+.06*mod(fi,3.))*(.6+.4*sp);",
    "      d=smin(d,length(p-c)-sr,.38);",
    "    }",
    "  }",
    "  return d;",
    "}",
    "vec3 nrm(vec3 p){vec2 e=vec2(.0015,-.0015);return normalize(e.xyy*map(p+e.xyy)+e.yyx*map(p+e.yyx)+e.yxy*map(p+e.yxy)+e.xxx*map(p+e.xxx));}",
    "vec3 env(vec2 px,vec3 dir){",
    "  vec2 css=vec2(px.x,uRes.y-px.y)/uDpr;",
    "  vec2 uv=(css-uEnvRect.xy)/uEnvRect.zw;",
    "  float inside=step(0.,uv.x)*step(uv.x,1.)*step(0.,uv.y)*step(uv.y,1.);",
    "  float s=(uEnvRect.z/uEnvRect.w)/(uEnvSize.x/uEnvSize.y);",
    "  if(s>1.)uv.y=.5+(uv.y-.5)/s;else uv.x=.5+(uv.x-.5)*s;",
    "  vec3 tex=texture2D(uEnv,clamp(uv,0.,1.)).rgb;",
    "  vec3 studio=INK*1.4+vec3(.9,.86,.8)*smoothstep(.3,1.,dir.y)*.5+vec3(.89,.27,.18)*smoothstep(.2,1.,-dir.x)*.25+vec3(.86,.66,.36)*smoothstep(.4,1.,dir.x)*.18;",
    "  return mix(studio,mix(INK,tex,inside),uEnvAmt);",
    "}",
    "void main(){",
    "  vec2 fc=gl_FragCoord.xy;",
    "  vec2 q=(fc-uC)/uR;",
    "  float bound=1.5+2.4*max(uSpread,uSplash)+min(length(uVel),.75)*1.2;",
    "  if(length(q)>bound){gl_FragColor=vec4(0.);return;}",
    "  vec3 ro=vec3(0.,0.,5.);vec3 rd=normalize(vec3(q,-5.));",
    "  float t=2.4;float md=1e3;bool hit=false;",
    "  for(int i=0;i<72;i++){float d=map(ro+rd*t);md=min(md,d);if(d<.0018){hit=true;break;}t+=d*.82;if(t>8.)break;}",
    "  if(!hit){float g=exp(-md*22.)*.10;gl_FragColor=vec4(uTint*g,0.);return;}",
    "  vec3 p=ro+rd*t;vec3 n=nrm(p);",
    "  float fr=pow(1.-max(dot(n,-rd),0.),2.4);",
    "  vec3 rf=refract(rd,n,.7);",
    "  vec2 off=rf.xy*uR*.6;",
    "  vec3 col=vec3(env(fc+off,rf).r,env(fc+off*1.07,rf).g,env(fc+off*1.15,rf).b);",
    "  col*=mix(vec3(1.),uTint*1.6,uTintAmt)*1.06;",
    "  vec3 rl=reflect(rd,n);",
    "  vec3 refl=vec3(1.,.98,.94)*smoothstep(.5,.95,rl.y)*.85+vec3(1.,.74,.42)*smoothstep(.55,1.,rl.x)*.45+uTint*smoothstep(.4,1.,-rl.y)*.7;",
    "  vec3 ir=.5+.5*cos(6.2831*(fr*1.2+vec3(0.,.33,.67))+uT*.25);",
    "  vec3 rim=mix(uTint,ir,.22);",
    "  vec3 L=normalize(vec3(-.6,.8,.75));",
    "  float spc=pow(max(dot(reflect(-L,n),-rd),0.),70.)*1.7;",
    "  vec3 L2=normalize(vec3(.8,-.3,.5));",
    "  float spc2=pow(max(dot(reflect(-L2,n),-rd),0.),24.)*.35;",
    "  col=mix(col,refl+rim*.55,fr*.85)+spc+vec3(1.,.72,.4)*spc2;",
    "  float a=clamp(mix(.3,.9,uEnvAmt)+fr*.55+spc,0.,1.);",
    "  gl_FragColor=vec4(col*a,a);",
    "}"
  ].join("\n");

  function create(canvas, fallbackEl) {
    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var gl = null;
    try {
      gl = canvas.getContext("webgl", { premultipliedAlpha: true, alpha: true, antialias: false, powerPreference: "high-performance" });
    } catch (e) { gl = null; }

    var prog, U = {}, tex, texSize = [1, 1];
    if (gl) {
      var compile = function (type, src) {
        var s = gl.createShader(type);
        gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; }
        return s;
      };
      var vs = compile(gl.VERTEX_SHADER, VERT), fs = compile(gl.FRAGMENT_SHADER, FRAG);
      if (vs && fs) {
        prog = gl.createProgram();
        gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
        if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) prog = null;
      }
      if (!prog) gl = null;
    }
    if (!gl) {
      document.documentElement.classList.add("no-webgl");
    } else {
      gl.useProgram(prog);
      var buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, "a");
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      ["uRes", "uC", "uR", "uT", "uW", "uSpread", "uVel", "uEnergy", "uSplash", "uTint", "uTintAmt", "uEnv", "uEnvAmt", "uEnvRect", "uEnvSize", "uDpr"].forEach(function (n) {
        U[n] = gl.getUniformLocation(prog, n);
      });
      tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([12, 11, 10, 255]));
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(U.uEnv, 0);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    }

    /* ---------- estado ---------- */
    var W = innerWidth, H = innerHeight, dpr = 1;
    var s = {
      x: W * 0.7, y: H * 0.46, vx: 0, vy: 0, r: Math.min(W, H) * 0.27,
      tx: W * 0.7, ty: H * 0.46, tr: Math.min(W, H) * 0.27,
      w: SHAPES.sphere.slice(0, 4), tw: SHAPES.sphere.slice(0, 4),
      spread: 0, tspread: 0, splash: 0,
      energy: 0.55, tint: TINTS.rojo, tintC: TINTS.rojo.c.slice(), tintA: TINTS.rojo.a,
      override: null, scale: 1, t: Math.random() * 40,
      drag: false, dragMoved: 0, px: -9999, py: -9999, lastPX: 0, lastPY: 0, free: 0,
      env: null, envWanted: null, envAmt: 0, envRect: [0, 0, 1, 1]
    };
    var finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;

    function resize() {
      W = innerWidth; H = innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, W < 768 ? 1.25 : 1.5);
      if (gl) {
        canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
    }
    resize();
    addEventListener("resize", resize);

    /* ---------- arrastre ---------- */
    function hitDrop(x, y) {
      var dx = x - s.x, dy = y - s.y;
      return Math.sqrt(dx * dx + dy * dy) < s.r * 1.02;
    }
    function isInteractive(el) {
      return el && el.closest && el.closest("a,button,input,label,select,textarea,summary,[role=radio]");
    }
    function start(x, y, target) {
      if (s.drag || isInteractive(target) || !hitDrop(x, y)) return false;
      s.drag = true; s.dragMoved = 0; s.lastPX = x; s.lastPY = y;
      s.offX = s.x - x; s.offY = s.y - y;
      document.documentElement.classList.add("is-dragging");
      return true;
    }
    function move(x, y) {
      s.px = x; s.py = y;
      if (!s.drag) return;
      s.dragMoved += Math.abs(x - s.lastPX) + Math.abs(y - s.lastPY);
      s.vx = (x - s.lastPX) * 0.9; s.vy = (y - s.lastPY) * 0.9;
      s.lastPX = x; s.lastPY = y;
      s.x = x + s.offX; s.y = y + s.offY;
    }
    function end() {
      if (!s.drag) return;
      s.drag = false;
      document.documentElement.classList.remove("is-dragging");
      if (s.dragMoved < 6) splash();
      s.free = 70; // unos frames de vuelo libre antes de que el resorte la reclame
    }
    addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      if (start(e.clientX, e.clientY, e.target)) e.preventDefault();
    });
    addEventListener("pointermove", function (e) { if (e.pointerType !== "touch") move(e.clientX, e.clientY); }, { passive: true });
    addEventListener("pointerup", end);
    addEventListener("pointercancel", end);
    addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      if (e.touches.length === 1 && start(t.clientX, t.clientY, e.target)) e.preventDefault();
    }, { passive: false });
    addEventListener("touchmove", function (e) {
      if (!s.drag) return;
      var t = e.touches[0]; move(t.clientX, t.clientY); e.preventDefault();
    }, { passive: false });
    addEventListener("touchend", end);
    addEventListener("touchcancel", end);

    function splash() { if (!reduce) s.splash = 1.15; }

    /* ---------- entorno: la foto que la gota refracta ---------- */
    var envCache = new Map();
    function loadEnv(imgEl) {
      var src = imgEl.currentSrc || imgEl.src;
      if (envCache.has(src)) return envCache.get(src);
      var rec = { img: new Image(), ok: false, el: imgEl };
      rec.img.crossOrigin = "anonymous";
      rec.img.onload = function () { rec.ok = true; };
      rec.img.src = src;
      envCache.set(src, rec);
      return rec;
    }

    /* ---------- loop ---------- */
    var last = performance.now();
    function frame(now) {
      var dt = Math.min((now - last) / 16.667, 3); last = now;
      var e = reduce ? 0 : s.energy;
      s.t += dt * 0.016 * (0.5 + e * 1.6);

      // objetivo + deriva propia
      var tx = s.tx, ty = s.ty;
      if (!reduce) {
        tx += Math.sin(s.t * 0.9) * s.tr * 0.16 * (0.3 + e);
        ty += Math.cos(s.t * 0.7) * s.tr * 0.12 * (0.3 + e);
      }
      if (finePointer && !s.drag) {
        var dx = s.px - tx, dy = s.py - ty, dd = Math.sqrt(dx * dx + dy * dy);
        if (dd < s.r * 2.6) { var m = (1 - dd / (s.r * 2.6)) * 0.22; tx += dx * m; ty += dy * m; }
      }

      if (!s.drag) {
        var k = reduce ? 0.2 : (s.free > 0 ? 0.004 : 0.045), damp = reduce ? 0.5 : (s.free > 0 ? 0.985 : 0.84);
        if (s.free > 0) s.free -= dt;
        // rebote suave en los bordes cuando vuela libre
        if (s.free > 0) {
          if (s.x < s.r * 0.6 || s.x > W - s.r * 0.6) s.vx *= -0.7;
          if (s.y < s.r * 0.6 || s.y > H - s.r * 0.6) s.vy *= -0.7;
        }
        s.vx = s.vx * Math.pow(damp, dt) + (tx - s.x) * k * dt;
        s.vy = s.vy * Math.pow(damp, dt) + (ty - s.y) * k * dt;
        s.x += s.vx * dt; s.y += s.vy * dt;
      }
      var lerp = function (a, b, f) { return a + (b - a) * Math.min(1, f * dt); };
      s.r = lerp(s.r, s.tr * s.scale, 0.06);
      var tw = s.override ? SHAPES[s.override] : s.tw.concat([s.tspread]);
      for (var i = 0; i < 4; i++) s.w[i] = lerp(s.w[i], tw[i], 0.07);
      s.spread = lerp(s.spread, s.override ? tw[4] : s.tspread, 0.05);
      s.splash = Math.max(0, s.splash - 0.012 * dt);
      for (var c = 0; c < 3; c++) s.tintC[c] = lerp(s.tintC[c], s.tint.c[c], 0.06);
      s.tintA = lerp(s.tintA, s.tint.a, 0.06);

      if (gl) {
        // fundido de la foto de entorno
        var want = s.envWanted;
        if (want && s.env === want && want.ok) s.envAmt = lerp(s.envAmt, 1, 0.06);
        else {
          s.envAmt = lerp(s.envAmt, 0, 0.12);
          if (s.envAmt < 0.02 && want && want.ok && s.env !== want) {
            try {
              gl.bindTexture(gl.TEXTURE_2D, tex);
              gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, want.img);
              texSize = [want.img.naturalWidth, want.img.naturalHeight];
              s.env = want;
            } catch (err) { want.ok = false; } // sin CORS no se puede usar como textura
          }
        }
        if (s.env && s.env.el) {
          var rc = s.env.el.getBoundingClientRect();
          s.envRect = [rc.left, rc.top, Math.max(rc.width, 1), Math.max(rc.height, 1)];
        }
        var vel = reduce ? 0 : 1;
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(U.uRes, canvas.width, canvas.height);
        gl.uniform2f(U.uC, s.x * dpr, (H - s.y) * dpr);
        gl.uniform1f(U.uR, s.r * dpr);
        gl.uniform1f(U.uT, s.t);
        gl.uniform4f(U.uW, s.w[0], s.w[1], s.w[2], s.w[3]);
        gl.uniform1f(U.uSpread, s.spread);
        gl.uniform2f(U.uVel, vel * s.vx / s.r * 1.8, -vel * s.vy / s.r * 1.8);
        gl.uniform1f(U.uEnergy, e);
        gl.uniform1f(U.uSplash, s.splash);
        gl.uniform3f(U.uTint, s.tintC[0], s.tintC[1], s.tintC[2]);
        gl.uniform1f(U.uTintAmt, s.tintA);
        gl.uniform1f(U.uEnvAmt, s.envAmt);
        gl.uniform4f(U.uEnvRect, s.envRect[0], s.envRect[1], s.envRect[2], s.envRect[3]);
        gl.uniform2f(U.uEnvSize, texSize[0], texSize[1]);
        gl.uniform1f(U.uDpr, dpr);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      } else if (fallbackEl) {
        var sc = s.r / 100 * (1 + s.splash * 0.15);
        var st = Math.min(Math.sqrt(s.vx * s.vx + s.vy * s.vy) / 40, 0.25);
        var ang = Math.atan2(s.vy, s.vx);
        fallbackEl.style.transform = "translate(" + s.x + "px," + s.y + "px) rotate(" + ang + "rad) scale(" + sc * (1 + st) + "," + sc * (1 - st * 0.6) + ")";
      }
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);

    return {
      webgl: !!gl,
      setTarget: function (x, y, r, shape, spread) {
        s.tx = x; s.ty = y; s.tr = r;
        if (shape) { for (var i = 0; i < 4; i++) s.tw[i] = shape[i]; }
        s.tspread = spread;
      },
      setEnv: function (imgEl) { s.envWanted = imgEl ? loadEnv(imgEl) : null; },
      setEnergy: function (v) { s.energy = v; },
      setScale: function (v) { s.scale = v; },
      setTint: function (name) { if (TINTS[name]) s.tint = TINTS[name]; },
      setOverride: function (name) { s.override = name && SHAPES[name] ? name : null; },
      splash: splash,
      shapes: SHAPES
    };
  }

  window.SonylumDrop = { create: create, SHAPES: SHAPES };
})();

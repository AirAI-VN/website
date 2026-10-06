/* Solution: exploded view of a building's HVAC system.
   A still wireframe tower, centred in the panel. It waits for a click: the building then slides into
   the left third, the panel is pinned (GSAP ScrollTrigger) and, as the page scrolls, the HVAC parts
   leave the building and settle into three columns: Sensing, Decision-making, Actuation.
   The camera never moves. Everything is drawn in screen pixels with an orthographic
   camera, and every part keeps the same fixed 3D tilt, so the layout maths is plain 2D.
   Once the parts have separated (70% of the sequence) they can be hovered, tapped or reached with
   Tab, and an HTML tooltip explains each one. Reduced motion shows the finished state directly. */
(function () {
  'use strict';

  var root = document.getElementById('xp');
  if (!root) return;
  var stage = root.querySelector('.xp__stage');
  var canvas = root.querySelector('.xp__canvas');
  var cols = Array.prototype.slice.call(root.querySelectorAll('.xp__col'));
  var heads = cols.map(function (c) { return c.querySelector('.xp__head'); });
  var dots = Array.prototype.slice.call(root.querySelectorAll('.xp__dots li'));
  var cap = root.querySelector('.xp__cap');
  var tip = document.getElementById('xpTip');
  var tipName = tip.querySelector('.xp__tip-name'), tipStep = tip.querySelector('.xp__tip-step span');
  var tipStatus = tip.querySelector('.xp__tip-status'), tipText = tip.querySelector('.xp__tip-text');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function T(k) { return window.I18N ? window.I18N.t(k) : ''; }
  function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
  function smooth(a, b, x) { var t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); }
  function trap(x, a, b, c, d) { return Math.min(smooth(a, b, x), 1 - smooth(c, d, x)); }
  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  function hasWebGL() {
    try { var c = document.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl2') || c.getContext('webgl'))); }
    catch (e) { return false; }
  }
  // offline (libraries missing) or no WebGL: a plain three-column summary instead
  if (!window.THREE || !hasWebGL()) { root.classList.add('xp--static'); return; }
  var THREE = window.THREE;

  var renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' }); }
  catch (e) { root.classList.add('xp--static'); return; }
  renderer.setClearColor(0x0A1628, 1);

  /* ---------- Model ---------- */
  var STEP = [0x00E5FF, 0x8B9CFF, 0x2DD4BF];          // Sensing, Decision-making, Actuation
  var SHELL = 0x6F8DB0;                                // blue-grey building wireframe
  var SEG = [[0.10, 0.30], [0.30, 0.50], [0.50, 0.70]];   // scroll share in which each group separates
  var LIVE = 0.70;                                     // hover, tap and tooltips from here on
  var FH = 0.11, FLOORS = 11, BW = 1.0, BD = 0.62, BH = FH * FLOORS;
  function fy(f) { return f * FH; }                    // height of floor f (0 = ground)
  var VAV_FLOORS = [3, 5, 7, 9];

  // line-segment builder: every part is a set of straight lines
  function S() { this.p = []; }
  S.prototype.l = function (a, b) { this.p.push(a[0], a[1], a[2], b[0], b[1], b[2]); return this; };
  S.prototype.poly = function (pts, closed) {
    for (var i = 0; i < pts.length - 1; i++) this.l(pts[i], pts[i + 1]);
    if (closed) this.l(pts[pts.length - 1], pts[0]);
    return this;
  };
  S.prototype.box = function (c, w, h, d) {
    var x0 = c[0] - w / 2, x1 = c[0] + w / 2, y0 = c[1] - h / 2, y1 = c[1] + h / 2, z0 = c[2] - d / 2, z1 = c[2] + d / 2;
    var v = [[x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1], [x0, y1, z1]];
    var E = [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7];
    for (var i = 0; i < E.length; i += 2) this.l(v[E[i]], v[E[i + 1]]);
    return this;
  };
  // circle around c in the plane across the given axis
  function onRing(c, r, axis, a) {
    var u = Math.cos(a) * r, v = Math.sin(a) * r;
    return axis === 'x' ? [c[0], c[1] + u, c[2] + v] : axis === 'y' ? [c[0] + u, c[1], c[2] + v] : [c[0] + u, c[1] + v, c[2]];
  }
  S.prototype.ring = function (c, r, axis, n) {
    n = n || 24;
    for (var i = 0; i < n; i++) this.l(onRing(c, r, axis, i / n * Math.PI * 2), onRing(c, r, axis, (i + 1) / n * Math.PI * 2));
    return this;
  };
  S.prototype.spokes = function (c, r, axis, k, a0) {
    for (var i = 0; i < k; i++) this.l(c, onRing(c, r, axis, (a0 || 0) + i / k * Math.PI * 2));
    return this;
  };
  S.prototype.cyl = function (c, r, h, n, k) {          // upright cylinder: two rings and k edges
    this.ring([c[0], c[1] - h / 2, c[2]], r, 'y', n).ring([c[0], c[1] + h / 2, c[2]], r, 'y', n);
    for (var i = 0; i < k; i++) {
      var q = onRing(c, r, 'y', Math.PI / 4 + i / k * Math.PI * 2);
      this.l([q[0], c[1] - h / 2, q[2]], [q[0], c[1] + h / 2, q[2]]);
    }
    return this;
  };
  S.prototype.geo = function () {
    var g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3));
    return g;
  };

  /* The parts. st: 'in' already in the building, 'ai' added by AirAI, 'full' added by AirAI Full
     where missing, 'opt' optional. homes: where each copy sits inside the building. */
  var PARTS = [
    { id: 'temp', g: 0, st: 'full',
      homes: [[-.36, fy(2) + .06, -.18], [.3, fy(3) + .06, .12], [-.1, fy(5) + .06, -.24], [.38, fy(7) + .06, -.06], [-.3, fy(8) + .06, .16], [.14, fy(10) + .06, -.16]],
      build: function (s) {
        s.box([0, 0, 0], .036, .05, .014).ring([0, -.012, .008], .007, 'z', 12).l([0, -.005, .008], [0, .016, .008]);
      } },
    { id: 'co2', g: 0, st: 'opt',
      homes: [[.06, fy(5) - .008, .04], [-.22, fy(7) - .008, -.04], [.26, fy(10) - .008, -.1]],
      build: function (s) {
        s.cyl([0, 0, 0], .026, .012, 20, 4).ring([0, -.006, 0], .013, 'y', 16).l([-.008, -.006, 0], [.008, -.006, 0]);
      } },
    { id: 'ct', g: 0, st: 'ai',
      homes: [[-.02, .06, .14], [.28, .07, -.22], [.36, BH + .05, .16]],
      build: function (s) {
        s.ring([0, -.004, 0], .022, 'y', 20).ring([0, .006, 0], .022, 'y', 20).ring([0, .001, 0], .012, 'y', 16)
         .box([.03, .001, 0], .016, .016, .012)
         .l([0, -.06, 0], [0, .06, 0]);                    // the power cable it clamps onto
      } },
    { id: 'gw', g: 1, st: 'ai',
      homes: [[-.3, BH + .016, .12]],
      build: function (s) {
        s.box([0, 0, 0], .09, .032, .06).l([.03, .016, -.02], [.03, .066, -.02]).ring([.03, .066, -.02], .005, 'y', 8);
        for (var i = 0; i < 3; i++) s.l([-.03 + i * .014, 0, .031], [-.024 + i * .014, 0, .031]);
      } },
    { id: 'cloud', g: 1, st: 'ai',
      homes: [[0, BH + .4, 0]],
      build: function (s) {
        s.ring([-.05, -.004, 0], .034, 'z', 22).ring([0, .022, 0], .046, 'z', 26).ring([.054, -.002, 0], .032, 'z', 22)
         .l([-.084, -.034, 0], [.086, -.034, 0]);
        var n = [[-.03, -.008, .01], [0, .016, .01], [.034, -.006, .01], [.004, -.022, .01]];
        n.forEach(function (c) { s.ring(c, .005, 'z', 8); });
        [[0, 1], [1, 2], [0, 3], [3, 2], [1, 3]].forEach(function (e) { s.l(n[e[0]], n[e[1]]); });
      } },
    { id: 'bms', g: 2, st: 'in',
      homes: [[.38, .065, -.17]],
      build: function (s) {
        s.box([0, 0, 0], .07, .12, .035)
         .poly([[-.024, .018, .018], [.024, .018, .018], [.024, .044, .018], [-.024, .044, .018]], true);
        for (var i = 0; i < 3; i++) s.l([-.024, -.006 - i * .016, .018], [.024, -.006 - i * .016, .018]);
      } },
    { id: 'act', g: 2, st: 'full',
      homes: VAV_FLOORS.map(function (f) { return [-.05, fy(f) + .085, .17]; }),
      build: function (s) {
        s.cyl([0, 0, 0], .014, .028, 14, 4).l([0, 0, -.014], [0, 0, -.022]);
      },
      // the lever turns once as commands arrive
      mov: { pivot: [0, .014, 0], axis: 'y', build: function (s) { s.l([0, 0, 0], [.028, 0, 0]).ring([.028, 0, 0], .004, 'y', 8); } } },
    { id: 'vav', g: 2, st: 'in',
      homes: VAV_FLOORS.map(function (f) { return [-.09, fy(f) + .085, .12]; }),
      build: function (s) {
        s.box([0, 0, 0], .12, .045, .06).ring([-.06, 0, 0], .018, 'x', 16).ring([-.08, 0, 0], .018, 'x', 16);
        for (var i = 0; i < 4; i++) { var a = Math.PI / 4 + i * Math.PI / 2; s.l(onRing([-.06, 0, 0], .018, 'x', a), onRing([-.08, 0, 0], .018, 'x', a)); }
      },
      // the damper blade inside the box turns once as commands arrive
      mov: { pivot: [0, 0, 0], axis: 'x', build: function (s) { s.poly([[0, -.017, -.024], [0, .017, -.024], [0, .017, .024], [0, -.017, .024]], true).l([0, 0, -.024], [0, 0, .024]); } } },
    { id: 'ahu', g: 2, st: 'in',
      homes: [[-.2, .05, .06]],
      build: function (s) {
        s.box([0, 0, 0], .28, .085, .15)
         .l([-.06, -.0425, .075], [-.06, .0425, .075]).l([.05, -.0425, .075], [.05, .0425, .075])
         .ring([.1, 0, .076], .03, 'z', 20).spokes([.1, 0, .076], .03, 'z', 3, .3);
        var zig = [];
        for (var i = 0; i <= 8; i++) zig.push([-.115 + i * .012, i % 2 ? .028 : -.028, .076]);
        s.poly(zig, false);
      } },
    { id: 'duct', g: 2, st: 'in',
      homes: [[-.33, 0, .12]],
      build: function (s) {
        var top = fy(9) + .1;
        s.box([0, (.09 + top) / 2, 0], .045, top - .09, .045);
        VAV_FLOORS.forEach(function (f) { s.box([.1, fy(f) + .085, 0], .155, .03, .03); });
      } },
    { id: 'chiller', g: 2, st: 'in',
      homes: [[.16, BH, -.04]],
      build: function (s) {
        s.cyl([-.05, .06, 0], .055, .12, 22, 6).ring([-.05, .12, 0], .036, 'y', 18).spokes([-.05, .12, 0], .036, 'y', 3, .5)
         .box([.08, .03, 0], .11, .06, .08).ring([.08, .03, .041], .018, 'z', 14)
         .l([.025, .015, .02], [-.005, .015, .02]).l([.025, .045, -.02], [-.005, .045, -.02]);
      } }
  ];

  /* ---------- Scene ---------- */
  var Q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.36, -0.62, 0, 'XYZ'));   // the one fixed view
  var scene = new THREE.Scene();
  var camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, 6000);
  camera.position.z = 3000;
  var building = new THREE.Group();
  building.quaternion.copy(Q);
  scene.add(building);
  var V = new THREE.Vector3(), V2 = new THREE.Vector3();

  function lineMat(color, opacity) {
    return new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: opacity, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
  }

  // building shell: floor plates, corners, mullions, parapet and a faint site grid
  var shellPts = [];
  (function () {
    var s = new S(), m = new S(), g = new S(), x0 = -BW / 2, x1 = BW / 2, z0 = -BD / 2, z1 = BD / 2, f, x, z;
    for (f = 0; f <= FLOORS; f++) s.poly([[x0, fy(f), z0], [x1, fy(f), z0], [x1, fy(f), z1], [x0, fy(f), z1]], true);
    [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].forEach(function (c) { s.l([c[0], 0, c[1]], [c[0], BH + .025, c[1]]); });
    s.poly([[x0, BH + .025, z0], [x1, BH + .025, z0], [x1, BH + .025, z1], [x0, BH + .025, z1]], true);
    for (x = -.375; x < .38; x += .125) { m.l([x, 0, z0], [x, BH, z0]); m.l([x, 0, z1], [x, BH, z1]); }
    for (z = -.155; z < .16; z += .155) { m.l([x0, 0, z], [x0, BH, z]); m.l([x1, 0, z], [x1, BH, z]); }
    var gx = .66, gz = .46;
    g.poly([[-gx, 0, -gz], [gx, 0, -gz], [gx, 0, gz], [-gx, 0, gz]], true);
    for (x = -gx + .22; x < gx - .01; x += .22) g.l([x, 0, -gz], [x, 0, gz]);
    for (z = -gz + .23; z < gz - .01; z += .23) g.l([-gx, 0, z], [gx, 0, z]);
    building.add(new THREE.LineSegments(s.geo(), lineMat(SHELL, .32)));
    building.add(new THREE.LineSegments(m.geo(), lineMat(SHELL, .12)));
    building.add(new THREE.LineSegments(g.geo(), lineMat(SHELL, .07)));
    shellPts = s.p;
  })();

  // the gateway's link up to the cloud, drawn while both are still in place
  var uplinkMat = lineMat(STEP[1], .35);
  building.add(new THREE.LineSegments(new S().l([-.27, BH + .066, .1], [0, BH + .366, 0]).geo(), uplinkMat));

  var hitGeo = new THREE.BoxGeometry(1, 1, 1), hitMat = new THREE.MeshBasicMaterial({ visible: false });
  var hitMeshes = [];
  var byId = {};

  var types = PARTS.map(function (def) {
    var s = new S(); def.build(s);
    var color = new THREE.Color(STEP[def.g]);
    var ty = { def: def, id: def.id, g: def.g, added: def.st !== 'in', color: color, geo: s.geo(), k: 0, n: 1, s: 1 };
    ty.base = ty.added ? 1 : .42;                    // parts AirAI adds are drawn brighter
    ty.mat = lineMat(color.clone(), ty.base);
    var verts = s.p.slice();
    if (def.mov) {
      var m = new S(); def.mov.build(m);
      ty.movGeo = m.geo();
      for (var i = 0; i < m.p.length; i++) verts.push(m.p[i] + def.mov.pivot[i % 3]);
    }
    // bounds in 3D, and in 2D as seen from the fixed view
    var box = new THREE.Box3(), x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
    for (var v = 0; v < verts.length; v += 3) {
      box.expandByPoint(V.set(verts[v], verts[v + 1], verts[v + 2]));
      V.applyQuaternion(Q);
      x0 = Math.min(x0, V.x); x1 = Math.max(x1, V.x); y0 = Math.min(y0, V.y); y1 = Math.max(y1, V.y);
    }
    ty.verts = verts;
    ty.center = box.getCenter(new THREE.Vector3());
    ty.size = box.getSize(new THREE.Vector3());
    ty.pw = x1 - x0; ty.ph = y1 - y0; ty.cx = (x0 + x1) / 2; ty.cy = (y0 + y1) / 2;

    ty.inst = def.homes.map(function (h, j) {
      var it = { ty: ty, j: j, t: 0, home: new THREE.Vector3(h[0], h[1], h[2]),
                 homeW: new THREE.Vector3(), targetW: new THREE.Vector3(), ghostW: new THREE.Vector3() };
      it.obj = new THREE.Group();
      it.obj.quaternion.copy(Q);
      scene.add(it.obj);
      it.lines = new THREE.LineSegments(ty.geo, ty.mat);
      it.obj.add(it.lines);
      if (ty.movGeo) {
        it.mov = new THREE.LineSegments(ty.movGeo, ty.mat);
        it.mov.position.fromArray(def.mov.pivot);
        it.obj.add(it.mov);
      }
      // a slightly enlarged invisible box makes small parts easy to hover
      var hit = new THREE.Mesh(hitGeo, hitMat);
      hit.position.copy(ty.center);
      hit.scale.set(Math.max(ty.size.x * 1.5, .04), Math.max(ty.size.y * 1.5, .04), Math.max(ty.size.z * 1.5, .04));
      hit.userData.it = it;
      it.obj.add(hit);
      hitMeshes.push(hit);
      // the ghost stays where the part was; a dotted line joins the two
      it.ghostMat = lineMat(color, 0);
      it.ghost = new THREE.LineSegments(ty.geo, it.ghostMat);
      it.ghost.position.copy(it.home);
      building.add(it.ghost);
      it.dashMat = new THREE.LineDashedMaterial({ color: color, dashSize: 3, gapSize: 5, transparent: true, opacity: 0, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending });
      it.dash = new THREE.Line(new THREE.BufferGeometry(), it.dashMat);
      it.dash.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      it.dash.frustumCulled = false;
      it.dash.visible = false;
      scene.add(it.dash);
      return it;
    });
    byId[def.id] = ty;
    return ty;
  });

  // the building's 2D extent (shell plus every part at home), used to fit it into its area
  var bBox = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
  function grow(x, y, z) {
    V.set(x, y, z).applyQuaternion(Q);
    bBox.x0 = Math.min(bBox.x0, V.x); bBox.x1 = Math.max(bBox.x1, V.x);
    bBox.y0 = Math.min(bBox.y0, V.y); bBox.y1 = Math.max(bBox.y1, V.y);
  }
  for (var sp = 0; sp < shellPts.length; sp += 3) grow(shellPts[sp], shellPts[sp + 1], shellPts[sp + 2]);
  types.forEach(function (ty) {
    ty.inst.forEach(function (it) {
      for (var v = 0; v < ty.verts.length; v += 3) grow(ty.verts[v] + it.home.x, ty.verts[v + 1] + it.home.y, ty.verts[v + 2] + it.home.z);
    });
  });

  // data and command links between the columns, and the pulses that travel along them
  var LINKS = [['temp', 'gw', 0], ['co2', 'gw', 0], ['ct', 'gw', 0], ['gw', 'cloud', 1],
               ['gw', 'bms', 2], ['gw', 'act', 2], ['gw', 'vav', 2], ['gw', 'ahu', 2], ['gw', 'duct', 2], ['gw', 'chiller', 2]];
  var KIND_COLOR = [new THREE.Color(STEP[0]), new THREE.Color(STEP[1]), new THREE.Color(STEP[2])];
  var linkMats = [lineMat(STEP[0], 0), lineMat(STEP[1], 0), lineMat(STEP[2], 0)];
  var linkObjs = linkMats.map(function (mat) {
    var o = new THREE.LineSegments(new THREE.BufferGeometry(), mat);
    o.frustumCulled = false;
    scene.add(o);
    return o;
  });
  var links = [];
  var PER = 2;                                         // pulses per link
  var pulsePos = new Float32Array(LINKS.length * PER * 3), pulseCol = new Float32Array(LINKS.length * PER * 3);
  var pulseGeo = new THREE.BufferGeometry();
  pulseGeo.setAttribute('position', new THREE.BufferAttribute(pulsePos, 3));
  pulseGeo.setAttribute('color', new THREE.BufferAttribute(pulseCol, 3));
  var pulses = new THREE.Points(pulseGeo, new THREE.PointsMaterial({
    size: 9, sizeAttenuation: false, map: dotTexture(), vertexColors: true, transparent: true,
    depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending
  }));
  pulses.frustumCulled = false;
  scene.add(pulses);
  function dotTexture() {
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(.22, 'rgba(255,255,255,.85)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  }

  // forecast next to the cloud: the predicted load (bright) rises ahead of the actual load (dim)
  var FN = 48;
  var fcAxisMat = lineMat(STEP[1], .25), fcPredMat = lineMat(STEP[1], 1), fcRealMat = lineMat(0x8FA6C4, .5);
  function lineObj(n, mat, Ctor) {
    var o = new Ctor(new THREE.BufferGeometry(), mat);
    o.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(n * 3), 3));
    o.frustumCulled = false;
    scene.add(o);
    return o;
  }
  var fcAxis = lineObj(6, fcAxisMat, THREE.LineSegments);
  var fcPred = lineObj(FN, fcPredMat, THREE.Line), fcReal = lineObj(FN, fcRealMat, THREE.Line);

  /* ---------- Rendering, with a soft bloom ---------- */
  var composer = null, bloomOn = false;
  if (THREE.EffectComposer && THREE.RenderPass && THREE.UnrealBloomPass) {
    try {
      var rt = new THREE.WebGLRenderTarget(1, 1, { samples: renderer.capabilities.isWebGL2 ? 4 : 0 });
      composer = new THREE.EffectComposer(renderer, rt);
      composer.addPass(new THREE.RenderPass(scene, camera));
      composer.addPass(new THREE.UnrealBloomPass(new THREE.Vector2(256, 256), 0.95, 0.5, 0.16));
      bloomOn = true;
    } catch (e) { composer = null; }
  }
  function draw() {
    if (bloomOn) composer.render(); else renderer.render(scene, camera);
  }

  /* ---------- Layout ----------
     Wide: the building in the left third, three columns to its right.
     Narrow (phones): the building on top, the three groups stacked below it. */
  var W = 0, H = 0, narrow = false, sB = 1, sIdle = 1, headBottom = 0, capTop = 0;
  var bPosOn = new THREE.Vector3(), bPosIdle = new THREE.Vector3();
  var ORDER = {
    wide: [['temp', 'co2', 'ct'], ['cloud', 'gw'], ['bms', 'act', 'vav', 'ahu', 'duct', 'chiller']],
    narrow: [['temp', 'co2', 'ct'], ['gw', 'cloud'], ['bms', 'act', 'vav', 'ahu', 'duct', 'chiller']]
  };
  var GRID = { wide: [[1, 3], [1, 2], [2, 3]], narrow: [[3, 1], [2, 1], [3, 2]] };
  var colPos = [];

  function toWorld(x, y, out) { return out.set(x - W / 2, H / 2 - y, 0); }
  function place(el, x, y) { el.style.transform = 'translate(' + Math.round(x) + 'px,' + Math.round(y) + 'px)'; }

  function layout() {
    W = stage.clientWidth; H = stage.clientHeight;
    if (!W || !H) return false;
    narrow = W < 760;
    root.classList.toggle('xp--narrow', narrow);
    var pr = Math.min(window.devicePixelRatio || 1, bloomOn ? 1.5 : 2);   // bloom is the costly part
    renderer.setPixelRatio(pr);
    renderer.setSize(W, H, false);
    if (composer) { composer.setPixelRatio(pr); composer.setSize(W, H); }
    camera.left = -W / 2; camera.right = W / 2; camera.top = H / 2; camera.bottom = -H / 2;
    camera.updateProjectionMatrix();

    var pad = narrow ? 16 : Math.max(24, Math.min(40, W * .03));
    var gap = narrow ? 12 : Math.max(18, Math.min(32, W * .022));
    var regions = [], bR, i;
    if (!narrow) {
      var x0 = Math.round(W / 3 + gap / 2), colW = (W - pad - x0 - 2 * gap) / 3;
      cap.style.width = (W - x0 - pad) + 'px';
      capTop = H - pad - cap.offsetHeight;
      cap._x = x0; cap._y = capTop;
      headBottom = 0;
      cols.forEach(function (c, g) {
        c.style.width = colW + 'px';
        colPos[g] = { x: x0 + g * (colW + gap), y: pad };
        headBottom = Math.max(headBottom, pad + heads[g].offsetHeight);
      });
      var top = headBottom + 30, bottom = capTop - 24;
      for (i = 0; i < 3; i++) regions.push({ x: colPos[i].x, y: top, w: colW, h: bottom - top });
      bR = { x: pad, y: pad + 44, w: x0 - gap - pad, h: H - pad * 2 - 44 };
    } else {
      cap.style.width = (W - 2 * pad) + 'px';
      capTop = H - pad - cap.offsetHeight;
      cap._x = pad; cap._y = capTop;
      // each row is as tall as its header text plus an equal share of the spare height;
      // the building gets what is left, up to a quarter of the panel
      var hw = Math.round(W * .5) - pad, hh = [], need = 0;
      cols.forEach(function (c, g) { c.style.width = hw + 'px'; hh[g] = heads[g].offsetHeight + 12; need += hh[g] + 24; });
      var bTop = pad + 36, bH = Math.max(110, Math.min(Math.round(H * .26), capTop - 10 - need - bTop - 14));
      bR = { x: pad, y: bTop, w: W - 2 * pad, h: bH };
      var y = bTop + bH + 14, spare = Math.max(0, (capTop - 10 - y - need) / 3);
      headBottom = 0;   // on phones the tooltip docks over the building instead
      cols.forEach(function (c, g) {
        var rh = hh[g] + 24 + spare;
        colPos[g] = { x: pad, y: y };
        regions.push({ x: pad + hw + gap, y: y, w: W - pad - (pad + hw + gap), h: rh - 8 });
        y += rh;
      });
    }

    // fit the building into its area, and into the middle of the panel for the idle state
    // (update() slides it from one to the other once the visitor clicks)
    var bw = bBox.x1 - bBox.x0, bh = bBox.y1 - bBox.y0;
    function fit(R, s, out) {
      toWorld(R.x + R.w / 2, R.y + R.h / 2, out);
      out.x -= (bBox.x0 + bBox.x1) / 2 * s; out.y -= (bBox.y0 + bBox.y1) / 2 * s;
    }
    sB = Math.min(bR.w / bw, bR.h / bh);
    fit(bR, sB, bPosOn);
    // (the idle area leaves room at the bottom for the "click and scroll" line)
    var iR = narrow ? { x: pad, y: pad + 40, w: W - 2 * pad, h: H - 2 * pad - 96 } : { x: W * .25, y: pad + 24, w: W * .5, h: H - 2 * pad - 84 };
    sIdle = Math.min(iR.w / bw, iR.h / bh) * (narrow ? .9 : 1);
    fit(iR, sIdle, bPosIdle);

    // slots: each group's area is a grid, one cell per part type
    var key = narrow ? 'narrow' : 'wide', maxS = Math.min(W, H) * (narrow ? 1.1 : 1.45), anchors = {};
    ORDER[key].forEach(function (ids, g) {
      var R = regions[g], gc = GRID[key][g][0], gr = GRID[key][g][1], cw = R.w / gc, ch = R.h / gr;
      ids.forEach(function (id, k) {
        var ty = byId[id], A = { x: R.x + (k % gc) * cw, y: R.y + Math.floor(k / gc) * ch, w: cw, h: ch };
        ty.k = k; ty.n = ids.length;
        if (id === 'cloud') {                       // share the cell with the forecast
          var side = A.w > A.h * 1.15, fc;
          if (side) { fc = { x: A.x + A.w * .58, y: A.y + A.h * .5 - Math.min(30, A.h * .2), w: A.w * .38, h: Math.min(60, A.h * .4) }; A = { x: A.x, y: A.y, w: A.w * .56, h: A.h }; }
          else { fc = { x: A.x + A.w * .15, y: A.y + A.h * .64, w: A.w * .7, h: A.h * .26 }; A = { x: A.x, y: A.y, w: A.w, h: A.h * .6 }; }
          setForecast(fc);
        }
        placeType(ty, A, maxS);
        anchors[id] = { x: A.x + A.w / 2, y: A.y + A.h / 2, r: Math.min(A.w, A.h) * .34 };
      });
    });
    setLinks(anchors);

    // headers, caption and the hidden part buttons
    cols.forEach(function (c, g) { place(c, colPos[g].x, colPos[g].y); });
    place(cap, cap._x, cap._y);
    types.forEach(function (ty) {
      var c = colPos[ty.g], r = ty.rect;
      ty.btn.style.left = Math.round(r.x - c.x - 4) + 'px';
      ty.btn.style.top = Math.round(r.y - c.y - 4) + 'px';
      ty.btn.style.width = Math.round(r.w + 8) + 'px';
      ty.btn.style.height = Math.round(r.h + 8) + 'px';
    });
    return true;
  }

  function placeType(ty, A, maxS) {
    var n = ty.inst.length;
    var gc = Math.max(1, Math.min(n, Math.round(Math.sqrt(n * A.w / A.h)))), gr = Math.ceil(n / gc);
    var cw = A.w / gc, ch = A.h / gr;
    var s = ty.s = Math.min(cw * .72 / ty.pw, ch * .64 / ty.ph, maxS);
    var hw = ty.pw * s / 2, hh = ty.ph * s / 2, r = { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity };
    ty.inst.forEach(function (it, j) {
      var row = Math.floor(j / gc), inRow = Math.min(gc, n - row * gc);
      var cx = A.x + (j % gc + .5 + (gc - inRow) / 2) * cw, cy = A.y + (row + .5) * ch;
      toWorld(cx, cy, it.targetW);
      it.targetW.x -= ty.cx * s; it.targetW.y -= ty.cy * s;
      r.x0 = Math.min(r.x0, cx - hw); r.x1 = Math.max(r.x1, cx + hw); r.y0 = Math.min(r.y0, cy - hh); r.y1 = Math.max(r.y1, cy + hh);
    });
    ty.rect = { x: r.x0, y: r.y0, w: r.x1 - r.x0, h: r.y1 - r.y0 };
  }

  function setLinks(anchors) {
    links = LINKS.map(function (l) {
      var a = anchors[l[0]], b = anchors[l[1]], dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      var A = toWorld(a.x + dx / d * a.r, a.y + dy / d * a.r, new THREE.Vector3());
      var B = toWorld(b.x - dx / d * b.r, b.y - dy / d * b.r, new THREE.Vector3());
      return { kind: l[2], a: A, b: B };
    });
    linkObjs.forEach(function (o, kind) {
      var pts = [];
      links.forEach(function (L) { if (L.kind === kind) pts.push(L.a.x, L.a.y, 0, L.b.x, L.b.y, 0); });
      o.geometry.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    });
  }

  function setForecast(r) {
    function w(x, y, arr, i) { toWorld(x, y, V); arr[i] = V.x; arr[i + 1] = V.y; arr[i + 2] = 0; }
    var ax = fcAxis.geometry.attributes.position.array;
    w(r.x, r.y + r.h, ax, 0); w(r.x + r.w, r.y + r.h, ax, 3);       // time axis
    w(r.x, r.y, ax, 6); w(r.x, r.y + r.h, ax, 9);                   // load axis
    w(r.x + r.w * .62, r.y + r.h - 3, ax, 12); w(r.x + r.w * .62, r.y + r.h + 3, ax, 15);   // "now"
    fcAxis.geometry.attributes.position.needsUpdate = true;
    var pp = fcPred.geometry.attributes.position.array, rp = fcReal.geometry.attributes.position.array;
    for (var i = 0; i < FN; i++) {
      var u = i / (FN - 1), x = r.x + 2 + u * (r.w - 2);
      w(x, r.y + r.h * (1 - (.1 + .8 / (1 + Math.exp(-(u - .42) * 11)))), pp, i * 3);
      w(x, r.y + r.h * (1 - (.08 + .78 / (1 + Math.exp(-(u - .6) * 11)) + .03 * Math.sin(u * 19))), rp, i * 3);
    }
    fcPred.geometry.attributes.position.needsUpdate = true;
    fcReal.geometry.attributes.position.needsUpdate = true;
  }

  /* ---------- State ---------- */
  var p = 0, targetP = 0, live = false;
  var hovered = null, headG = null, tipMode = null, tipAnchor = null;
  /* phase: 'idle' (building centred, waiting for a click), 'arming' (sliding left while the page
     scrolls to the panel), 'playing' (pinned, scroll drives the sequence), 'done' (exploded, unpinned) */
  var phase = 'idle', shift = 0, slide = null, SLIDE_MS = 1000;

  function focusG() { return hovered ? hovered.ty.g : headG; }
  function gFactor(g, f) { return f === null || f === g ? 1 : .3; }
  // data links matter to Sensing and Decision-making; command links to Decision-making and Actuation
  function linkFactor(kind, f) {
    if (f === null) return 1;
    return (kind === 0 ? f <= 1 : kind === 1 ? f === 1 : f >= 1) ? 1 : .3;
  }

  function update() {
    var f = focusG(), was = live;
    live = p >= LIVE - .002;
    root.classList.toggle('is-live', live);
    if (was && !live && hovered) setHover(null);

    // the building: centred while idle, slid into the left third once the visitor clicks
    var se = ease(shift), sNow = sIdle + (sB - sIdle) * se;
    building.position.lerpVectors(bPosIdle, bPosOn, se);
    building.scale.setScalar(sNow);

    var turn = Math.PI * 2 * ease(clamp01((p - .6) / .1));   // dampers and levers rotate once
    types.forEach(function (ty) {
      var seg = SEG[ty.g], span = seg[1] - seg[0], gf = gFactor(ty.g, f);
      ty.inst.forEach(function (it, j) {
        it.homeW.copy(it.home).applyQuaternion(Q).multiplyScalar(sNow).add(building.position);
        it.ghostW.copy(it.home).add(ty.center).applyQuaternion(Q).multiplyScalar(sNow).add(building.position);
        var a = seg[0] + span * (.04 + .3 * ty.k / ty.n + .12 * j / ty.inst.length), b = a + span * .5;
        var t = it.t = clamp01((p - a) / (b - a)), e = ease(t), sc = sNow + (ty.s - sNow) * e;
        it.obj.position.lerpVectors(it.homeW, it.targetW, e);
        it.obj.position.y += Math.sin(Math.PI * e) * (ty.g === 0 ? 46 : 26);   // lift out, then settle
        it.obj.scale.setScalar(sc);
        if (it.mov) it.mov.rotation[ty.def.mov.axis] = turn;
        it.ghostMat.opacity = .16 * Math.min(1, t * 4) * gf;
        it.dash.visible = t > 0;
        if (t > 0) {
          // clear while the part travels, then a quiet trace once it has settled
          it.dashMat.opacity = .32 * Math.min(1, t * 3) * (1 - .6 * smooth(.75, 1, t)) * gf;
          V.copy(ty.center).applyQuaternion(Q).multiplyScalar(sc).add(it.obj.position);
          var arr = it.dash.geometry.attributes.position.array;
          arr[0] = it.ghostW.x; arr[1] = it.ghostW.y; arr[2] = 0; arr[3] = V.x; arr[4] = V.y; arr[5] = 0;
          it.dash.geometry.attributes.position.needsUpdate = true;
          it.dash.computeLineDistances();
        }
      });
      // the hovered part brightens; other groups dim
      var hot = hovered && hovered.ty === ty;
      ty.mat.opacity = hot ? 1 : ty.base * gf;
      ty.mat.color.copy(ty.color);
      if (hot) ty.mat.color.lerp(new THREE.Color(0xffffff), .35);
    });

    uplinkMat.opacity = .35 * (1 - smooth(.3, .36, p));
    linkMats[0].opacity = .16 * smooth(.36, .42, p) * linkFactor(0, f);
    linkMats[1].opacity = .22 * smooth(.40, .46, p) * linkFactor(1, f);
    linkMats[2].opacity = .14 * smooth(.56, .62, p) * linkFactor(2, f);
    var g1 = gFactor(1, f);
    fcAxisMat.opacity = .25 * smooth(.36, .4, p) * g1;
    fcPredMat.opacity = g1; fcRealMat.opacity = .5 * g1;
    fcPred.geometry.setDrawRange(0, Math.round(FN * smooth(.38, .47, p)));
    fcReal.geometry.setDrawRange(0, Math.round(FN * smooth(.41, .5, p)));

    cols.forEach(function (c, g) {
      var seg = SEG[g], span = seg[1] - seg[0], o = smooth(seg[0] + span * .35, seg[0] + span * .8, p);
      c.style.opacity = o;
      c.style.pointerEvents = o > .5 ? '' : 'none';   // hidden headers must not catch clicks on the panel
      place(c, colPos[g].x, colPos[g].y + (1 - o) * 12);
      dots[g].classList.toggle('is-on', p >= seg[0] + span * .5);
    });
    var co = smooth(.7, .76, p);
    cap.style.opacity = co;
    place(cap, cap._x, cap._y + (1 - co) * 10);
  }

  var t0 = performance.now();
  function updatePulses(now) {
    var tau = (now - t0) / 1000, f = focusG(), any = false, k = 0;
    var hold = reduceMotion ? 0 : smooth(.72, .8, p) * .5;   // a quiet loop once everything is in place
    var env = reduceMotion ? [0, 0, 0] : [Math.max(trap(p, .33, .37, .49, .53), hold), Math.max(trap(p, .39, .43, .49, .53), hold), Math.max(trap(p, .55, .59, .69, .73), hold)];
    links.forEach(function (L, i) {
      var c = KIND_COLOR[L.kind], lf = linkFactor(L.kind, f);
      for (var q = 0; q < PER; q++) {
        var u = (tau / (L.kind === 2 ? 1.8 : 1.4) + q / PER + i * .17) % 1, a = env[L.kind] * Math.sin(Math.PI * u) * lf;
        pulsePos[k * 3] = L.a.x + (L.b.x - L.a.x) * u;
        pulsePos[k * 3 + 1] = L.a.y + (L.b.y - L.a.y) * u;
        pulsePos[k * 3 + 2] = 0;
        pulseCol[k * 3] = c.r * a; pulseCol[k * 3 + 1] = c.g * a; pulseCol[k * 3 + 2] = c.b * a;
        if (a > .002) any = true;
        k++;
      }
    });
    pulseGeo.attributes.position.needsUpdate = true;
    pulseGeo.attributes.color.needsUpdate = true;
    return any;
  }

  /* ---------- Frame loop: runs only while the panel is on screen and something moves ---------- */
  var raf = 0, last = 0, needs = true, visible = true;
  var samples = [], checked = false;
  function frame(now) {
    raf = 0;
    if (!W) return;
    var dt = last ? Math.min(100, now - last) : 0;
    last = now;
    if (p !== targetP) {
      p += (targetP - p) * (1 - Math.pow(1 - .16, (dt || 16.7) / 16.7));   // ease toward the scroll position
      if (Math.abs(targetP - p) < .0005) p = targetP;
      needs = true;
    }
    if (slide) {                                       // the building sliding left after a click
      var k = clamp01((now - slide.t0) / SLIDE_MS);
      shift = slide.from + (slide.to - slide.from) * k;
      if (k >= 1) slide = null;
      needs = true;
    }
    if (needs) { update(); needs = false; }
    var pulsing = updatePulses(now);
    draw();
    var going = visible && (p !== targetP || pulsing || !!slide);
    // phones: if frames run slow, drop the bloom and keep the same picture
    if (!checked && dt && going && bloomOn) {
      samples.push(dt);
      if (samples.length >= 45) {
        checked = true;
        samples.sort(function (a, b) { return a - b; });
        if (narrow && samples[22] > 26) bloomOn = false;
      }
    }
    if (going) raf = requestAnimationFrame(frame); else last = 0;
  }
  function wake(full) {
    if (full) needs = true;
    if (!raf && visible) raf = requestAnimationFrame(frame);
  }
  function renderNow() {
    if (!W) return;
    needs = false; update(); updatePulses(performance.now()); draw();
  }

  /* ---------- Hover, tap, keyboard ---------- */
  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), box3 = new THREE.Box3();
  function pick(e) {
    var r = canvas.getBoundingClientRect();
    ndc.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    scene.updateMatrixWorld();
    ray.setFromCamera(ndc, camera);
    var hits = ray.intersectObjects(hitMeshes, false);
    return hits.length ? hits[0].object.userData.it : null;
  }
  function instRect(it) {
    it.obj.updateMatrixWorld(true);
    box3.setFromObject(it.lines);
    return { x: box3.min.x + W / 2, y: H / 2 - box3.max.y, w: box3.max.x - box3.min.x, h: box3.max.y - box3.min.y };
  }

  function setHover(it, mode) {
    hovered = it || null;
    tipMode = it ? mode : null;
    var f = focusG();
    cols.forEach(function (c, g) { c.classList.toggle('is-dim', f !== null && f !== g); });
    if (it) showTip(it, mode === 'key' ? it.ty.rect : instRect(it)); else tip.classList.remove('is-on');
    wake(true);
  }
  function fillTip(ty) {
    tip.setAttribute('data-g', ty.g);
    if (ty.added) tip.setAttribute('data-added', ''); else tip.removeAttribute('data-added');
    tipName.innerHTML = T('xp.' + ty.id + '.name');
    tipStep.textContent = T('xp.g' + (ty.g + 1) + '.name');
    tipStatus.textContent = T('xp.st.' + ty.def.st);
    tipText.innerHTML = T('xp.' + ty.id + '.text');
  }
  function showTip(it, r) {
    fillTip(it.ty);
    tipAnchor = r;
    positionTip();
    tip.classList.add('is-on');
  }
  // beside the part, inside the panel, and always below the column headers
  function positionTip() {
    var m = 10, x, y, tw, th;
    if (narrow) {
      tip.style.width = (W - 28) + 'px';
      x = 14; y = 14;
    } else {
      tip.style.width = '';
      tw = tip.offsetWidth; th = tip.offsetHeight;
      var r = tipAnchor;
      x = r.x + r.w + 16;
      if (x + tw > W - m) x = r.x - 16 - tw;
      x = Math.max(m, Math.min(W - m - tw, x));
      y = r.y + r.h / 2 - th / 2;
      y = Math.max(headBottom + 12, Math.min(H - m - th, y));
    }
    tip.style.left = Math.round(x) + 'px';
    tip.style.top = Math.round(y) + 'px';
  }

  canvas.addEventListener('pointermove', function (e) {
    if (e.pointerType !== 'mouse') return;
    var it = live ? pick(e) : null;
    canvas.style.cursor = it ? 'pointer' : '';
    if (tipMode === 'key') return;
    if (it !== hovered) setHover(it, 'mouse');
  });
  canvas.addEventListener('pointerleave', function (e) {
    if (e.pointerType !== 'mouse') return;
    canvas.style.cursor = '';
    if (tipMode === 'mouse') setHover(null);
  });
  // touch: a tap (not a scroll) starts the sequence, or shows a part's note once the parts are out;
  // a tap anywhere else closes it. Once started, it never resets.
  var down = null, lastTap = 0;
  canvas.addEventListener('pointerdown', function (e) { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener('pointerup', function (e) {
    if (e.pointerType === 'mouse' || !down) return;
    var moved = Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10;
    down = null;
    if (moved) return;
    lastTap = performance.now();
    if (phase === 'idle') { start(); return; }
    setHover(live ? pick(e) : null, 'tap');
  });
  // a click anywhere on the panel (or on the line, by keyboard too) starts it, once
  stage.addEventListener('click', function () {
    if (phase !== 'idle' || performance.now() - lastTap < 800) return;   // (the click after a tap)
    start();
  });
  canvas.addEventListener('pointercancel', function () { down = null; });
  document.addEventListener('pointerdown', function (e) {
    if (tipMode === 'tap' && e.target !== canvas) setHover(null);
  }, true);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && hovered) setHover(null); });

  heads.forEach(function (h, g) {
    h.addEventListener('mouseenter', function () {
      if (!live || tipMode === 'key') return;
      headG = g;
      setHover(null);
    });
    h.addEventListener('mouseleave', function () {
      headG = null;
      if (!hovered) setHover(null);
    });
  });

  // each part has a button, so Tab reaches it; focusing one before the parts have separated
  // shows the finished state straight away
  root.querySelectorAll('.xp__part').forEach(function (btn) {
    var ty = byId[btn.getAttribute('data-part')];
    ty.btn = btn;
    btn.addEventListener('focus', function () {
      if (phase !== 'done') goDone();
      setHover(ty.inst[0], 'key');
    });
    btn.addEventListener('blur', function () { if (tipMode === 'key') setHover(null); });
  });

  /* ---------- Click to play, then pinning ----------
     Nothing happens on a plain scroll past. A click slides the building left and brings the panel
     to the top of the screen; only then is it pinned, so scrolling plays the sequence once. When
     the sequence has finished and the visitor scrolls on, the pin is removed and the parts stay out. */
  var st = null, gsap = window.gsap, ScrollTrigger = window.ScrollTrigger;
  // reduced motion (or no GSAP): the finished state from the start, never pinned
  var still = reduceMotion || !gsap || !ScrollTrigger;
  if (!still) gsap.registerPlugin(ScrollTrigger);

  function setPhase(ph) {
    phase = ph;
    root.classList.toggle('xp--idle', ph === 'idle');
    root.classList.toggle('xp--done', ph === 'done');
  }
  // the panel stops just under the floating nav, or centred in the space below it on tall screens
  function pinTop() {
    var isl = document.querySelector('.nav__island');
    var top = (isl ? isl.getBoundingClientRect().bottom : 76) + 12;
    return Math.round(top + Math.max(0, (window.innerHeight - top - stage.offsetHeight - 12) / 2));
  }

  function start() {
    if (phase !== 'idle') return;                      // it plays once and never resets
    if (still) { goDone(); return; }
    setPhase('arming');
    slide = { from: shift, to: 1, t0: performance.now() };
    wake(true);
    scrollToY(stage.getBoundingClientRect().top + window.scrollY - pinTop(), function () {
      if (phase === 'arming') pin();
    });
  }

  function pin() {
    st = ScrollTrigger.create({
      trigger: stage, pin: stage, anticipatePin: 1, invalidateOnRefresh: true,
      start: function () { return 'top ' + pinTop() + 'px'; },
      end: function () { return '+=' + Math.round(window.innerHeight * 2.6); },
      onUpdate: function (self) { if (phase === 'playing') { targetP = self.progress; wake(true); } },
      onLeave: function () { setTimeout(finish, 0); },   // after ScrollTrigger's own update, not mid-callback
      onRefresh: function (self) { if (phase === 'playing') targetP = self.progress; relayout(); }
    });
    setPhase('playing');
    targetP = st.progress;
    wake(true);
  }

  // take the pin and its scroll space away without moving the panel on screen
  function unpin() {
    if (!st) return;
    var before = stage.getBoundingClientRect().top;
    st.kill(true);
    st = null;
    var after = stage.getBoundingClientRect().top;
    window.scrollTo({ top: window.scrollY + after - before, behavior: 'instant' });
  }
  function finish() {
    if (phase !== 'playing') return;
    unpin();
    setPhase('done');
    targetP = 1;
    wake(true);
  }
  function goDone() {
    unpin();
    slide = null; shift = 1;
    setPhase('done');
    p = targetP = 1;
    renderNow();
  }

  // eased scroll to the panel; any wheel, touch or key from the visitor ends it early
  function scrollToY(y, done) {
    var from = window.scrollY, d = y - from, t0 = performance.now(), stop = false, ended = false;
    var dur = Math.min(1100, Math.max(450, Math.abs(d) * .9)), EV = ['wheel', 'touchstart', 'keydown'];
    function cancel() { stop = true; }
    function end() {
      if (ended) return;
      ended = true;
      EV.forEach(function (t) { window.removeEventListener(t, cancel); });
      done();
    }
    EV.forEach(function (t) { window.addEventListener(t, cancel, { passive: true }); });
    if (Math.abs(d) < 2) { end(); return; }
    // backstop: animation frames pause in background tabs, so finish the move on a timer
    setTimeout(function () {
      if (ended) return;
      if (!stop && phase === 'arming') window.scrollTo({ top: y, behavior: 'instant' });
      end();
    }, dur + 400);
    (function step(now) {
      if (stop || phase !== 'arming') { end(); return; }
      var k = Math.min(1, (now - t0) / dur);
      window.scrollTo({ top: from + d * ease(k), behavior: 'instant' });
      if (k < 1) requestAnimationFrame(step); else end();
    })(t0);
  }

  layout();   // (if the panel has no size yet, the resize observer lays it out later)
  if (still) { root.classList.add('xp--still'); setPhase('done'); shift = 1; targetP = p = 1; }
  else setPhase('idle');

  function relayout() {
    if (!layout()) return;
    if (hovered) { tipAnchor = tipMode === 'key' ? hovered.ty.rect : null; if (tipAnchor) positionTip(); else setHover(null); }
    renderNow();
  }
  renderNow();

  if ('ResizeObserver' in window) {
    var lastSize = '';
    new ResizeObserver(function () {
      var s = stage.clientWidth + 'x' + stage.clientHeight;
      if (s !== lastSize) { lastSize = s; relayout(); }
    }).observe(stage);
  } else {
    window.addEventListener('resize', relayout);
  }
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) wake(true);
    }, { rootMargin: '80px 0px' }).observe(stage);
  }
  // header heights change with the language and once the fonts arrive
  function refreshAll() {
    if (hovered) fillTip(hovered.ty);
    relayout();
    if (st) ScrollTrigger.refresh();
  }
  document.addEventListener('langchange', refreshAll);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refreshAll);
  // switching to Vietnamese loads Be Vietnam Pro afterwards, which changes the header heights again
  if (document.fonts && document.fonts.addEventListener) document.fonts.addEventListener('loadingdone', refreshAll);

  // for checking the sequence by hand: document.getElementById('xp').xpSeek(0.5)
  root.xpSeek = function (v) { targetP = p = clamp01(v); renderNow(); };
  root.xpState = function () { return { phase: phase, shift: shift, p: p, pinned: !!st }; };
})();

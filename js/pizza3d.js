// Pizza Max — the 3D hero pizza.
// The Veggie Garden from the menu on a round wooden board: 8 real slices you can pull out
// (with stretchy cheese), toppings that drop in, and soft shadows.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const TAU = Math.PI * 2;
const SLICES = 8;
const R = 2.0;             // pizza radius
const SLICE_L = TAU / SLICES;
const GAP = 0.005;         // hairline cut between slices
const TOP_Z = .18;         // cheese surface height (disk frame, z is up)
const CRUST_R = R - .14;
const CRUST_TUBE = .205;
const PULL = .5;           // how far a pulled slice slides out
const SIZE_K = .93;        // the board is shown at Maxi size
// everything the camera must keep in view: board + a pulled slice + air for its shadow
const FIT = (2.22 + PULL) * SIZE_K + .22;

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const TAN15 = Math.tan(Math.PI / 12);
const CAM_DIR = new THREE.Vector3(0, 8.6, 5.4).normalize();
const heroDistance = (aspect) => Math.max(FIT / (TAN15 * aspect), (FIT * .88 + .2) / TAN15);

/* ---------- helpers ---------- */
function rng(seed) {
  let s = seed % 2147483647;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const outBack = (t) => { const c1 = 1.6, c3 = c1 + 1; return 1 + c3 * (t - 1) ** 3 + c1 * (t - 1) ** 2; };
const outCubic = (t) => 1 - (1 - t) ** 3;
const inOut = (t) => (t < .5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

function canvasTex(w, h, draw, srgb = true) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.anisotropy = 8;
  return t;
}
function blob(g, x, y, r, inner, outer = 'rgba(0,0,0,0)') {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr;
  g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill();
}
const mat = (o) => new THREE.MeshStandardMaterial({ roughness: .7, metalness: 0, envMapIntensity: .28, ...o });

/* ---------- textures ---------- */
// melted mozzarella over tomato sauce. One set of features feeds both the colour map and the
// bump map, so the browned blisters and the creamy pools also catch the light.
// UVs come from the slice shape (x,y in -1.8..1.8); the sheet stops short of the crust so a
// thin band of sauce shows at the rim.
const CHEESE = (() => {
  const r = rng(7), f = { pools: [], golden: [], blisters: [], sauce: [], herbs: [] };
  const spot = (max) => { const a = r() * TAU, d = Math.sqrt(r()) * max; return [Math.cos(a) * d, Math.sin(a) * d]; };
  for (let i = 0; i < 130; i++) f.pools.push([...spot(.41), .012 + r() * .032, r()]);
  for (let i = 0; i < 46; i++) f.golden.push([...spot(.41), .025 + r() * .06]);
  for (let i = 0; i < 90; i++) f.blisters.push([...spot(.42), .004 + r() * .012]);
  for (let i = 0; i < 30; i++) { const a = r() * TAU, d = .24 + r() * .19; f.sauce.push([Math.cos(a) * d, Math.sin(a) * d, .007 + r() * .018]); }
  for (let i = 0; i < 220; i++) f.herbs.push([...spot(.4), .6 + r() * 1.4, r() * 3]);
  return f;
})();
function cheeseEdge(g, s) {
  const c = s / 2;
  g.beginPath();
  for (let i = 0; i <= 120; i++) {
    const a = i / 120 * TAU, rr = s * (.43 + Math.sin(a * 7) * .006 + Math.sin(a * 13 + 1) * .005 + Math.sin(a * 31 + 2) * .003);
    g[i ? 'lineTo' : 'moveTo'](c + Math.cos(a) * rr, c + Math.sin(a) * rr);
  }
  g.closePath();
}
const cheeseTex = canvasTex(1024, 1024, (g, s) => {
  const c = s / 2, P = (x, y) => [c + x * s, c + y * s], r = rng(17);
  g.fillStyle = '#9a2817'; g.fillRect(0, 0, s, s);                                    // sauce
  for (let i = 0; i < 90; i++) blob(g, r() * s, r() * s, 10 + r() * 34, r() > .5 ? 'rgba(206,74,38,.45)' : 'rgba(120,22,12,.35)');
  g.save(); cheeseEdge(g, s); g.clip();
  g.fillStyle = '#ebc164'; g.fillRect(0, 0, s, s);                                    // mozzarella sheet
  CHEESE.golden.forEach(([x, y, rr]) => blob(g, ...P(x, y), rr * s, 'rgba(206,128,42,.4)'));
  CHEESE.pools.forEach(([x, y, rr, k]) => blob(g, ...P(x, y), rr * s, k > .5 ? 'rgba(250,224,150,.55)' : 'rgba(246,212,130,.45)'));
  CHEESE.sauce.forEach(([x, y, rr]) => blob(g, ...P(x, y), rr * s, 'rgba(184,62,30,.6)'));
  CHEESE.blisters.forEach(([x, y, rr]) => {                                           // browned bubbles
    const [px, py] = P(x, y);
    blob(g, px, py, rr * s, 'rgba(128,62,16,.8)');
    blob(g, px - rr * s * .3, py - rr * s * .3, rr * s * .4, 'rgba(255,226,160,.35)');
  });
  for (let i = 0; i < 50; i++) blob(g, r() * s, r() * s, 6 + r() * 14, 'rgba(232,130,40,.16)'); // oil sheen
  g.restore();
  g.lineWidth = 6; g.strokeStyle = 'rgba(150,60,25,.35)'; cheeseEdge(g, s); g.stroke(); // melted edge
  CHEESE.herbs.forEach(([x, y, l, a]) => {                                             // oregano
    const [px, py] = P(x, y);
    g.fillStyle = 'rgba(70,82,34,.7)';
    g.beginPath(); g.ellipse(px, py, l * 1.6, l * .8, a, 0, TAU); g.fill();
  });
});
const cheeseBump = canvasTex(512, 512, (g, s) => {
  const c = s / 2, P = (x, y) => [c + x * s, c + y * s];
  g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
  g.fillStyle = '#6a6a6a'; cheeseEdge(g, s); g.fill();
  CHEESE.pools.forEach(([x, y, rr]) => blob(g, ...P(x, y), rr * s, 'rgba(255,255,255,.35)'));
  CHEESE.sauce.forEach(([x, y, rr]) => blob(g, ...P(x, y), rr * s, 'rgba(0,0,0,.5)'));
  CHEESE.blisters.forEach(([x, y, rr]) => blob(g, ...P(x, y), rr * s * 1.1, 'rgba(255,255,255,.75)'));
}, false);
for (const t of [cheeseTex, cheeseBump]) { t.repeat.set(.27, .27); t.offset.set(.5, .5); }

// crust: u runs round the ring, v round the tube (v≈.25 is the top)
const crustTex = canvasTex(1024, 256, (g, w, h) => {
  const gr = g.createLinearGradient(0, 0, 0, h);
  gr.addColorStop(0, '#c9843c'); gr.addColorStop(.25, '#a35f26'); gr.addColorStop(.42, '#cf8f45');
  gr.addColorStop(.6, '#e2ae6a'); gr.addColorStop(.85, '#d89f58'); gr.addColorStop(1, '#c9843c');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = rng(11);
  for (let i = 0; i < 900; i++) {
    const y = h * (.25 + (r() - .5) * .45 * r());
    g.fillStyle = `rgba(${90 + r() * 40},${45 + r() * 20},15,${.15 + r() * .35})`;
    g.beginPath(); g.ellipse(r() * w, (y + h) % h, 1 + r() * 4, 1 + r() * 2.5, r() * 3, 0, TAU); g.fill();
  }
  for (let i = 0; i < 70; i++) blob(g, r() * w, h * (.18 + r() * .16), 5 + r() * 14, 'rgba(60,30,10,.4)'); // leopard char
  for (let i = 0; i < 300; i++) { g.fillStyle = 'rgba(255,240,210,.35)'; g.fillRect(r() * w, r() * h, 1.5, 1.5); } // flour
});
crustTex.flipY = false;   // keep v≈.25 (the top of the tube) on the toasted band
crustTex.wrapS = THREE.RepeatWrapping;

// the inside of the crust where a slice is cut: soft crumb with air pockets, a baked skin round it
const crumbTex = canvasTex(128, 128, (g, s) => {
  const c = s / 2, r = rng(21);
  g.fillStyle = '#a8662c'; g.fillRect(0, 0, s, s);
  blob(g, c, c, c * .92, '#f4deae', '#d9a564');
  for (let i = 0; i < 30; i++) {
    const a = r() * TAU, d = Math.sqrt(r()) * c * .66;
    g.fillStyle = 'rgba(196,146,84,.6)';
    g.beginPath(); g.ellipse(c + Math.cos(a) * d, c + Math.sin(a) * d, 2 + r() * 5, 1.5 + r() * 3.5, r() * 3, 0, TAU); g.fill();
  }
});

const tomTex = canvasTex(256, 256, (g, s) => {
  const c = s / 2;
  g.fillStyle = '#c42a1e'; g.fillRect(0, 0, s, s);
  blob(g, c, c, c, '#e8463a', '#c42a1e');
  for (let i = 0; i < 4; i++) {
    const a = i * TAU / 4 + .4;
    g.fillStyle = 'rgba(255,140,110,.85)';
    g.beginPath(); g.ellipse(c + Math.cos(a) * 52, c + Math.sin(a) * 52, 38, 24, a, 0, TAU); g.fill();
    for (let k = -1; k <= 1; k++) {
      g.fillStyle = '#ffe2a0';
      g.beginPath(); g.ellipse(c + Math.cos(a + k * .3) * 58, c + Math.sin(a + k * .3) * 58, 5, 8, a, 0, TAU); g.fill();
    }
  }
  blob(g, c, c, 22, 'rgba(255,170,140,.9)');
});

const woodTex = canvasTex(1024, 1024, (g, s) => {
  g.fillStyle = '#c38c58'; g.fillRect(0, 0, s, s);
  const r = rng(5);
  for (let i = 0; i < 140; i++) {                       // straight grain
    const x = r() * s, wv = 4 + r() * 10;
    g.strokeStyle = r() > .5 ? `rgba(120,70,32,${.12 + r() * .2})` : `rgba(230,190,140,${.1 + r() * .15})`;
    g.lineWidth = .8 + r() * 3;
    g.beginPath(); g.moveTo(x, 0);
    for (let y = 0; y <= s; y += 32) g.lineTo(x + Math.sin(y / 90 + i) * wv, y);
    g.stroke();
  }
  blob(g, s * .7, s * .3, 40, 'rgba(110,60,25,.25)');    // a knot
});

/* ---------- toppings (disk frame: z is up) ---------- */
// sliced champignon: domed cap, short stem; the texture draws the brown cap skin and the gills
const MUSH_W = .36;
function mushShape(k = 1) {
  const s = new THREE.Shape();
  s.moveTo(-.17 * k, 0);
  s.bezierCurveTo(-.17 * k, .1 * k, -.09 * k, .15 * k, 0, .15 * k);
  s.bezierCurveTo(.09 * k, .15 * k, .17 * k, .1 * k, .17 * k, 0);
  s.quadraticCurveTo(.12 * k, -.012 * k, .055 * k, -.006 * k);
  s.lineTo(.05 * k, -.12 * k); s.quadraticCurveTo(0, -.14 * k, -.05 * k, -.12 * k); s.lineTo(-.055 * k, -.006 * k);
  s.quadraticCurveTo(-.12 * k, -.012 * k, -.17 * k, 0);
  return s;
}
const mushTex = canvasTex(256, 256, (g, s) => {
  const X = (x) => (x / MUSH_W + .5) * s, Y = (y) => (.5 - y / MUSH_W) * s;
  const path = () => {
    g.beginPath();
    mushShape().getPoints(40).forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](X(p.x), Y(p.y)));
    g.closePath();
  };
  g.fillStyle = '#c9b18b'; g.fillRect(0, 0, s, s);
  g.save(); path(); g.clip();
  blob(g, X(0), Y(.02), s * .3, '#dccbae', '#c4aa82');
  g.strokeStyle = 'rgba(120,92,62,.45)'; g.lineWidth = 1.4;            // gills under the cap
  for (let i = 0; i <= 14; i++) {
    const a = Math.PI * (.08 + i / 14 * .84);
    g.beginPath(); g.moveTo(X(Math.cos(a) * .045), Y(.01)); g.lineTo(X(Math.cos(a) * .16), Y(.025 + Math.sin(a) * .015)); g.stroke();
  }
  blob(g, X(-.08), Y(.08), s * .06, 'rgba(196,140,70,.35)');          // roasted spots
  blob(g, X(.1), Y(.05), s * .05, 'rgba(196,140,70,.3)');
  g.restore();
  g.lineWidth = 18; g.strokeStyle = '#6e4a2a'; path(); g.stroke();      // cap skin
  g.lineWidth = 3; g.strokeStyle = 'rgba(245,232,205,.45)';
  g.beginPath();
  mushShape(.9).getPoints(40).slice(0, 21).forEach((p, i) => g[i ? 'lineTo' : 'moveTo'](X(p.x), Y(p.y + .006)));
  g.stroke();
});
mushTex.repeat.set(1 / MUSH_W, 1 / MUSH_W);
mushTex.offset.set(.5, .5);
function mushGeo() {
  // UVs are made at full size, so scaling afterwards keeps the texture on the shape
  return new THREE.ExtrudeGeometry(mushShape(), { depth: .02, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2, curveSegments: 16 }).scale(.86, .86, 1);
}
// bell pepper strip: a thin curved band, slightly curled
function stripGeo() {
  const s = new THREE.Shape(), a0 = -.72, a1 = .72;
  s.absarc(0, 0, .2, a0, a1, false);
  s.absarc(0, 0, .155, a1, a0, true);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: .02, bevelEnabled: true, bevelThickness: .006, bevelSize: .005, bevelSegments: 2, curveSegments: 20 });
  geo.translate(-.175, 0, 0);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + p.getY(i) ** 2 * .7);
  geo.computeVertexNormals();
  return geo;
}
// rocket (arugula): a long lobed leaf, cupped and bent, added fresh after baking
function rocketGeo() {
  const s = new THREE.Shape(), L = .34, N = 28, right = [], left = [];
  for (let i = 0; i <= N; i++) {
    const t = i / N, y = t * L - L / 2;
    const w = .058 * Math.sin(Math.PI * Math.min(1, t * 1.05)) ** .6 * (.68 + .32 * Math.abs(Math.sin(t * Math.PI * 3.5))) + .006;
    right.push([w, y]); left.push([-w * .9, y]);
  }
  right.forEach(([x, y], i) => s[i ? 'lineTo' : 'moveTo'](x, y));
  left.reverse().forEach(([x, y]) => s.lineTo(x, y));
  const geo = new THREE.ExtrudeGeometry(s, { depth: .006, bevelEnabled: false, curveSegments: 4 });
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) + p.getX(i) ** 2 * 2.2 + (p.getY(i) + L / 2) ** 2 * .35);
  geo.computeVertexNormals();
  return geo;
}

// Veggie Garden: peppers, olives, mushrooms, tomatoes, rocket. Big pieces are placed first.
const TOPPINGS = {
  tomato:   { n: 8,  size: .17, h: .015, geo: () => new THREE.CylinderGeometry(.17, .17, .03, 36).rotateX(Math.PI / 2), mat: () => mat({ map: tomTex, roughness: .3, envMapIntensity: .5 }) },
  mushroom: { n: 8,  size: .15, h: .004, spin: true, geo: mushGeo, mat: () => [mat({ map: mushTex, roughness: .66, envMapIntensity: .2 }), mat({ color: 0xb39570, roughness: .7 })] },
  pepper:   { n: 6,  size: .17, h: .008, spin: true, geo: stripGeo, mat: () => mat({ color: 0x3a8a2a, roughness: .3, envMapIntensity: .6 }) },
  pepperY:  { n: 5,  size: .17, h: .008, spin: true, geo: stripGeo, mat: () => mat({ color: 0xe8a91c, roughness: .3, envMapIntensity: .6 }) },
  olive:    { n: 12, size: .085, h: .016, geo: () => new THREE.TorusGeometry(.062, .024, 12, 28).scale(1, 1, .6), mat: () => mat({ color: 0x2a1e23, roughness: .28, envMapIntensity: .8 }) },
  rocket:   { n: 11, size: .16, h: .05, spin: true, free: true, geo: rocketGeo, mat: () => mat({ color: 0x2f6b24, roughness: .5, side: THREE.DoubleSide }) },
};
const TOPPING_KEYS = Object.keys(TOPPINGS);
const assetCache = {};
function topAsset(key) {
  if (!assetCache[key]) { const d = TOPPINGS[key]; assetCache[key] = { def: d, geo: d.geo(), mat: d.mat() }; }
  return assetCache[key];
}

/* ---------- pizza + board builders ---------- */
let shared;
function sharedMats() {
  return shared || (shared = {
    dough: mat({ color: 0xd99f5c, roughness: .85 }),
    crust: mat({ map: crustTex, roughness: .78 }),
    crumb: mat({ map: crumbTex, roughness: .92, side: THREE.DoubleSide }),
    cheese: mat({ map: cheeseTex, bumpMap: cheeseBump, bumpScale: 1, roughness: .45, envMapIntensity: .4 }),
    wood: mat({ map: woodTex, roughness: .62 }),
    rim: mat({ color: 0xa8743f, roughness: .6 }),
    cap: new THREE.CircleGeometry(1, 32),
  });
}
function addLights(scene, renderer, groundY = -.19) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), .04).texture;
  scene.add(new THREE.HemisphereLight(0xfff3e0, 0xb89870, .62));
  const sun = new THREE.DirectionalLight(0xffeedd, 2.7);
  sun.position.set(4, 9, 3);
  sun.castShadow = true;
  const sm = innerWidth < 600 ? 512 : 1024;   // phones: a lighter shadow map
  sun.shadow.mapSize.set(sm, sm);
  Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 1, far: 25 });
  sun.shadow.bias = -.0004;
  sun.shadow.normalBias = .02;
  sun.shadow.radius = 5;
  scene.add(sun);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), new THREE.ShadowMaterial({ opacity: .16 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = groundY;
  ground.receiveShadow = true;
  scene.add(ground);
  return sun;
}
function makeBoard() {
  const m = sharedMats(), g = new THREE.Group();
  const board = new THREE.Mesh(new THREE.CylinderGeometry(2.22, 2.17, .16, 128), m.wood);
  board.position.y = -.08;
  board.receiveShadow = board.castShadow = true;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.205, .022, 8, 128), m.rim);
  rim.rotation.x = -Math.PI / 2;
  g.add(board, rim);
  return g;
}
// the crust's thickness wobbles round the ring; the same value sizes the cut ends
const crustBump = (a) => Math.sin(a * 7 + 1.3) * .02 + Math.sin(a * 17 + .4) * .009 + Math.sin(a * 31 + 2) * .004;
function buildSlices(disk) {
  const m = sharedMats(), slices = [], Z = new THREE.Vector3(0, 0, 1);
  for (let i = 0; i < SLICES; i++) {
    const a0 = i * SLICE_L + GAP, a1 = (i + 1) * SLICE_L - GAP;
    const g = new THREE.Group();
    g.userData = { index: i, mid: (a0 + a1) / 2, out: 0 };

    const base = new THREE.Shape();
    base.moveTo(0, 0); base.absarc(0, 0, R, a0, a1, false); base.lineTo(0, 0);
    const baseMesh = new THREE.Mesh(new THREE.ExtrudeGeometry(base, { depth: .1, bevelEnabled: true, bevelThickness: .025, bevelSize: .025, bevelSegments: 3, curveSegments: 20 }), m.dough);
    baseMesh.castShadow = true;
    g.add(baseMesh);

    const ch = new THREE.Shape();
    ch.moveTo(0, 0); ch.absarc(0, 0, R - .2, a0 + .004, a1 - .004, false); ch.lineTo(0, 0);
    const cheese = new THREE.Mesh(new THREE.ExtrudeGeometry(ch, { depth: .025, bevelEnabled: true, bevelThickness: .015, bevelSize: .015, bevelSegments: 3, curveSegments: 20 }), m.cheese);
    cheese.position.z = .12;
    cheese.receiveShadow = true;
    g.add(cheese);

    // crust ring segment with an irregular, puffy rise
    const tg = new THREE.TorusGeometry(CRUST_R, CRUST_TUBE, 18, 36, a1 - a0);
    tg.computeVertexNormals();
    const p = tg.attributes.position, nn = tg.attributes.normal, v = new THREE.Vector3(), n = new THREE.Vector3();
    for (let k = 0; k < p.count; k++) {
      v.fromBufferAttribute(p, k); n.fromBufferAttribute(nn, k);
      v.addScaledVector(n, crustBump(Math.atan2(v.y, v.x) + a0));
      p.setXYZ(k, v.x, v.y, v.z);
    }
    tg.computeVertexNormals();
    tg.rotateZ(a0);
    const crust = new THREE.Mesh(tg, m.crust);
    crust.position.z = .12;
    crust.scale.z = .85;
    crust.castShadow = crust.receiveShadow = true;
    g.add(crust);
    // the cut ends show the soft inside of the crust instead of a rounded seam
    for (const [a, dir] of [[a0, -1], [a1, 1]]) {
      const holder = new THREE.Group();
      holder.position.set(Math.cos(a) * CRUST_R, Math.sin(a) * CRUST_R, .12);
      holder.scale.z = .85;
      const cap = new THREE.Mesh(m.cap, m.crumb);
      cap.scale.setScalar(CRUST_TUBE + crustBump(a));
      cap.quaternion.setFromUnitVectors(Z, new THREE.Vector3(-Math.sin(a) * dir, Math.cos(a) * dir, 0));
      holder.add(cap);
      g.add(holder);
    }
    disk.add(g);
    slices.push(g);
  }
  return slices;
}
// scatter the toppings; each piece stays inside one slice so it travels with it
function scatter(seed, place) {
  const placed = [], r = rng(seed);
  TOPPING_KEYS.forEach((key) => {
    const { def, geo, mat: m0 } = topAsset(key);
    for (let k = 0; k < def.n; k++) {
      let spot = null;
      for (let tries = 0; tries < 600 && !spot; tries++) {
        const rad = .28 + Math.sqrt(r()) * 1.2, ang = r() * TAU;
        const local = ((ang % SLICE_L) + SLICE_L) % SLICE_L;
        if (rad * Math.sin(Math.min(local, SLICE_L - local)) < def.size * .9) continue;
        const x = Math.cos(ang) * rad, y = Math.sin(ang) * rad;
        if (!def.free && placed.some((q) => (q.x - x) ** 2 + (q.y - y) ** 2 < (q.s + def.size - .03) ** 2)) continue;
        spot = { x, y, ang, s: def.size };
      }
      if (!spot) continue;
      if (!def.free) placed.push(spot);
      const mesh = new THREE.Mesh(geo, m0);
      mesh.castShadow = true;
      mesh.position.set(spot.x, spot.y, TOP_Z + def.h);
      mesh.rotation.z = def.spin ? r() * TAU : 0;
      mesh.rotation.x = (r() - .5) * .08;
      place(mesh, spot);
    }
  });
}

/* ======================================================== */
// autoIntro: false when the page's own intro hands over to the pizza (call api.intro())
export function createPizza(el, { autoIntro = true } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 600 ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  el.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  camera.position.set(0, 8.6, 5.4);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.enableDamping = !reduced;
  controls.autoRotate = !reduced && autoIntro;
  controls.autoRotateSpeed = .7;
  controls.minPolarAngle = .25;
  controls.maxPolarAngle = .9;
  controls.target.set(0, 0, 0);
  renderer.domElement.style.touchAction = 'pan-y';   // OrbitControls sets 'none', which traps page scrolling on phones

  addLights(scene, renderer);
  // Blender-rendered textures replace the canvas ones when present (assets/tex)
  let dirty = true;
  const tl = new THREE.TextureLoader();
  const swap = (url, apply) => tl.load(url, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; apply(t); dirty = true; }, undefined, () => {});
  swap('assets/tex/wood.webp', (t) => { const m = sharedMats().wood; m.map = t; m.needsUpdate = true; });
  swap('assets/tex/tomato.webp', (t) => { const m = topAsset('tomato').mat; m.map = t; m.needsUpdate = true; });
  const stage = new THREE.Group();
  scene.add(stage);
  stage.add(makeBoard());
  stage.scale.setScalar(SIZE_K);

  /* pizza */
  const disk = new THREE.Group();
  disk.rotation.x = -Math.PI / 2;     // disk frame: x,y = plane, z = up
  stage.add(disk);
  const slices = buildSlices(disk);

  /* toppings: placed once, each assigned to the slice it sits in; hidden until the intro drops them in */
  const toppings = [];
  scatter(42, (m, spot) => {
    m.userData.z = m.position.z;
    m.scale.setScalar(.001);
    slices[Math.floor(spot.ang / SLICE_L) % SLICES].add(m);
    toppings.push(m);
  });

  /* cheese strings for slice pulls */
  const strings = [];
  const stringMat = mat({ color: 0xf6dc8c, roughness: .4 });
  for (let k = 0; k < 6; k++) {
    const s = new THREE.Mesh(new THREE.CylinderGeometry(.024, .024, 1, 8), stringMat);
    s.visible = false;
    disk.add(s);
    strings.push({ mesh: s, off: (k - 2.5) * .06, lift: .015 * (k % 2) });
  }

  /* ---------- tweens ---------- */
  const tweens = [];
  const now = () => performance.now() / 1000;
  function tween(dur, fn, { delay = 0, done } = {}) { tweens.push({ t0: now() + delay, dur, fn, done }); }

  // it turns slowly for a while, then rests (a still pizza draws nothing); a drag wakes it for a bit
  let rotateUntil = Infinity;
  let introDone = false;
  // quick: the page intro already showed the toppings, so they are simply there and the board settles
  function intro(quick = false) {
    if (introDone) return; introDone = true;
    rotateUntil = now() + 24;
    controls.autoRotate = !reduced;
    if (quick) {   // the intro's pizza has just landed here: same view, so no extra motion
      toppings.forEach((m) => { m.scale.setScalar(1); m.position.z = m.userData.z; });
      dirty = true;
      return;
    }
    // the board is set down on the table turning, then the toppings drop on, biggest first
    if (!reduced) {
      stage.scale.setScalar(.8);
      tween(1.1, (t) => {
        const e = outCubic(t);
        stage.scale.setScalar(.8 + (SIZE_K - .8) * e);
        stage.rotation.y = (1 - e) * -1.1;
        stage.position.y = (1 - e) * .5;
      });
    }
    toppings.forEach((m, i) => {
      if (reduced) { m.scale.setScalar(1); m.position.z = m.userData.z; dirty = true; return; }
      tween(.55, (t) => { m.scale.setScalar(Math.max(.001, outBack(t))); m.position.z = m.userData.z + (1 - outCubic(t)) * 1.6; }, { delay: .25 + i * .028 });
    });
  }

  /* ---------- slices ---------- */
  let outIdx = -1, stringT = -10, spin = 0;
  function moveSlice(i, to) {
    const g = slices[i], from = g.userData.out;
    const axis = new THREE.Vector3(-Math.sin(g.userData.mid), Math.cos(g.userData.mid), 0);
    tween(reduced ? .25 : to ? .9 : .5, (t) => {
      const o = from + (to - from) * (reduced ? t : to ? outBack(t) : inOut(t));
      g.userData.out = o;
      g.position.set(Math.cos(g.userData.mid) * PULL * o, Math.sin(g.userData.mid) * PULL * o, .32 * Math.sin(Math.min(o, 1) * Math.PI / 2));
      g.rotation.set(0, 0, 0);
      g.rotateOnAxis(axis, -.14 * o);   // lifted by the crust
    });
  }
  function toggleSlice(i) {
    if (outIdx === i) { moveSlice(i, 0); outIdx = -1; return 'in'; }
    if (outIdx >= 0) moveSlice(outIdx, 0);
    outIdx = i;
    moveSlice(i, 1);
    controls.autoRotate = false;
    stringT = now();
    return 'out';
  }
  const A = new THREE.Vector3(), B = new THREE.Vector3(), D = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  function updateStrings() {
    const age = now() - stringT, show = outIdx >= 0 && age < 1.4;
    strings.forEach((s) => (s.mesh.visible = show));
    if (!show) return;
    const g = slices[outIdx], m = g.userData.mid;
    const dir = new THREE.Vector3(Math.cos(m), Math.sin(m), 0), perp = new THREE.Vector3(-dir.y, dir.x, 0);
    const thin = Math.max(.2, 1 - age / 1.4);
    strings.forEach((s) => {
      A.copy(dir).multiplyScalar(.28).addScaledVector(perp, s.off * .6); A.z = .17;
      B.copy(dir).multiplyScalar(.28).addScaledVector(perp, s.off); B.z = .17 + s.lift;
      B.applyMatrix4(g.matrix);
      D.subVectors(B, A);
      const len = Math.max(.001, D.length());
      s.mesh.position.copy(A).addScaledVector(D, .5);
      s.mesh.quaternion.setFromUnitVectors(UP, D.normalize());
      const w = thin / Math.sqrt(1 + len * 2);
      s.mesh.scale.set(w, len, w);
      if (age > 1.15) s.mesh.visible = Math.random() > .5;
    });
  }
  function grabRandom() {
    let i;
    do { i = Math.floor(Math.random() * SLICES); } while (i === outIdx);
    return toggleSlice(i);
  }

  /* ---------- picking (click vs drag) ---------- */
  const ray = new THREE.Raycaster(), ptr = new THREE.Vector2();
  let downAt = null;
  renderer.domElement.addEventListener('pointerdown', (e) => { downAt = [e.clientX, e.clientY]; });
  renderer.domElement.addEventListener('pointerup', (e) => {
    if (!downAt || Math.hypot(e.clientX - downAt[0], e.clientY - downAt[1]) > 6) return;
    const rect = renderer.domElement.getBoundingClientRect();
    ptr.set((e.clientX - rect.left) / rect.width * 2 - 1, -(e.clientY - rect.top) / rect.height * 2 + 1);
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(slices, true)[0];
    if (!hit) return;
    let o = hit.object;
    while (o && o.parent !== disk) o = o.parent;
    if (o) el.dispatchEvent(new CustomEvent('slice', { detail: toggleSlice(o.userData.index) }));
  });
  controls.addEventListener('change', () => { dirty = true; });
  controls.addEventListener('start', () => { controls.autoRotate = false; });
  controls.addEventListener('end', () => {
    if (!reduced) setTimeout(() => { controls.autoRotate = outIdx < 0; rotateUntil = now() + 12; }, 2500);
  });

  /* ---------- sizing + loop ---------- */
  // pull the camera back just far enough that the board, a pulled slice and its shadow all fit
  function resize() {
    const w = el.clientWidth, h = el.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.setLength(heroDistance(camera.aspect));
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(() => { resize(); dirty = true; }).observe(el);
  resize();

  let visible = true;
  new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && autoIntro) intro(); }).observe(el);
  if (autoIntro) setTimeout(intro, 1500);

  let last = now();
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const t = now();
    last = t;
    for (let i = tweens.length - 1; i >= 0; i--) {
      const tw = tweens[i];
      if (t < tw.t0) continue;
      const p = Math.min(1, (t - tw.t0) / tw.dur);
      tw.fn(p);
      if (p >= 1) { tweens.splice(i, 1); tw.done && tw.done(); }
    }
    if (tweens.length) dirty = true;
    if (!reduced && !tweens.length && Math.abs(spin - stage.rotation.y) > 1e-4) { stage.rotation.y += (spin - stage.rotation.y) * .08; dirty = true; }
    if (outIdx >= 0 && now() - stringT < 1.5) dirty = true;
    updateStrings();
    if (controls.autoRotate && t > rotateUntil) controls.autoRotate = false;
    if (controls.update() || controls.autoRotate) dirty = true;
    if (!dirty) return;      // idle: nothing changed, skip the frame
    dirty = false;
    renderer.render(scene, camera);
  });

  el.classList.remove('is-loading');
  return {
    intro,
    setSpin: (v) => { spin = v; },
    grabRandom,
  };
}

/* ======================================================== */
// The page intro: the same Veggie Garden, in a Pizza Max box. js/intro.js drives it every frame
// (lid, tilt, steam) and finally flies the camera to the hero's exact view, so the hand-over is seamless.
const BOX = { half: 2.3, h: .5, floor: -.52, t: .04 };
const PIZZA_Y = BOX.floor + BOX.t / 2;

function boxTextures() {
  const fibres = (g, s, base, seed) => {
    g.fillStyle = base; g.fillRect(0, 0, s, s);
    const r = rng(seed);
    for (let i = 0; i < s * 3; i++) {
      g.fillStyle = r() > .5 ? `rgba(120,80,35,${.04 + r() * .07})` : `rgba(255,240,210,${.04 + r() * .06})`;
      g.fillRect(r() * s, r() * s, 1 + r() * 7, 1 + r());
    }
  };
  const outside = canvasTex(1024, 1024, (g, s) => {
    fibres(g, s, '#d5b17a', 31);
    const c = s / 2;
    g.save(); g.translate(c, c); g.rotate(-.08);
    g.strokeStyle = 'rgba(110,72,30,.45)'; g.lineWidth = 3; g.setLineDash([6, 12]);
    g.beginPath(); g.arc(0, 0, 440, 0, TAU); g.stroke(); g.setLineDash([]);
    const ring = 'STONE OVEN PIZZA · BERLIN-PANKOW · HOT & FRESH · ';
    g.font = '700 30px "Plus Jakarta Sans", sans-serif'; g.fillStyle = 'rgba(96,60,22,.72)'; g.textAlign = 'center';
    [...ring].forEach((ch, i) => { g.save(); g.rotate(i / ring.length * TAU); g.fillText(ch, 0, -392); g.restore(); });
    g.textAlign = 'left'; g.fillStyle = '#1d5d22'; g.font = 'italic 800 84px "Plus Jakarta Sans", sans-serif'; g.fillText('Pizza', -235, -105);
    g.textAlign = 'center'; g.fillStyle = '#a3231c'; g.font = 'italic 800 250px "Plus Jakarta Sans", sans-serif'; g.fillText('MAX', 0, 95);
    g.strokeStyle = '#1d5d22'; g.lineCap = 'round';
    g.lineWidth = 12; g.beginPath(); g.moveTo(-235, 150); g.quadraticCurveTo(0, 92, 240, 135); g.stroke();
    g.lineWidth = 8; g.beginPath(); g.moveTo(-210, 180); g.quadraticCurveTo(10, 130, 228, 164); g.stroke();
    g.textAlign = 'right'; g.fillStyle = '#a3231c'; g.font = '700 74px Caveat, cursive'; g.fillText('...tasty in the box!', 268, 255);
    g.restore();
  });
  const inside = canvasTex(512, 512, (g, s) => { fibres(g, s, '#e3c897', 37); blob(g, s * .38, s * .62, s * .16, 'rgba(150,90,30,.25)'); });
  const floor = canvasTex(512, 512, (g, s) => {
    fibres(g, s, '#e0c28d', 41);
    g.strokeStyle = 'rgba(140,80,25,.16)'; g.lineWidth = s * .05;
    g.beginPath(); g.arc(s / 2, s / 2, s * .41, 0, TAU); g.stroke();       // a grease ring where the pizza sits
  });
  const edge = canvasTex(256, 256, (g, s) => {
    fibres(g, s, '#c49c60', 43);
    for (let x = 0; x < s; x += 6) { g.fillStyle = 'rgba(90,58,22,.16)'; g.fillRect(x, 0, 2, s); }   // corrugation
  });
  return { outside, inside, floor, edge };
}
function buildBox(tex) {
  const { half, h, floor, t } = BOX, g = new THREE.Group();
  const m = (map) => mat({ map, roughness: .92, envMapIntensity: .15, transparent: true });
  const mats = { edge: m(tex.edge), floor: m(tex.floor), out: m(tex.outside), in: m(tex.inside) };
  const part = (w, hh, d, mm, x, y, z, parent = g) => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, hh, d), mm);
    mesh.position.set(x, y, z); mesh.castShadow = mesh.receiveShadow = true;
    parent.add(mesh); return mesh;
  };
  const E = mats.edge;
  part(2 * half, t, 2 * half, [E, E, mats.floor, E, E, E], 0, floor, 0);
  const wy = floor + h / 2;
  part(2 * half, h, t, E, 0, wy, half - t / 2); part(2 * half, h, t, E, 0, wy, -half + t / 2);
  part(t, h, 2 * half, E, half - t / 2, wy, 0); part(t, h, 2 * half, E, -half + t / 2, wy, 0);
  // the lid is hinged on the back top edge: printed top, plain inside, a front flap and two side flaps
  const lid = new THREE.Group();
  lid.position.set(0, floor + h + t / 2, -half - t);
  g.add(lid);
  const L = 2 * half + 2 * t;
  part(L + .02, t, L, [E, E, mats.out, mats.in, E, E], 0, 0, L / 2, lid);
  part(L + .02, h + t, t, E, 0, -h / 2, L, lid);
  part(t, h * .8, L - .2, E, L / 2 + .01, -h * .4, L / 2, lid);
  part(t, h * .8, L - .2, E, -L / 2 - .01, -h * .4, L / 2, lid);
  return { group: g, lid, mats: Object.values(mats) };
}

export async function createIntro(host) {
  // the printed lid uses the brand fonts: make sure they are ready before drawing it
  try { await Promise.all(['italic 800 120px "Plus Jakarta Sans"', '700 30px "Plus Jakarta Sans"', '700 74px Caveat'].map((f) => document.fonts.load(f))); } catch (e) { /* fall back to system fonts */ }
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 600 ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .92;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const sun = addLights(scene, renderer, BOX.floor - BOX.t / 2 - .005);
  // the open lid throws a long shadow: a wider shadow camera so it never ends in a hard edge
  Object.assign(sun.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8 });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.updateProjectionMatrix();
  const camera = new THREE.PerspectiveCamera(30, 1, .1, 200);
  const box = buildBox(boxTextures());
  scene.add(box.group);

  // exactly the hero's pizza: same slices, same toppings (same seed), same scale
  const pizza = new THREE.Group();
  pizza.scale.setScalar(SIZE_K);
  const disk = new THREE.Group();
  disk.rotation.x = -Math.PI / 2;
  pizza.add(disk);
  const slices = buildSlices(disk);
  scatter(42, (m, spot) => slices[Math.floor(spot.ang / SLICE_L) % SLICES].add(m));
  scene.add(pizza);

  // steam: soft sprites rising out of the box, as strong as the lid is open
  const steamTex = canvasTex(128, 128, (g, s) => blob(g, s / 2, s / 2, s / 2, 'rgba(255,255,255,.85)'));
  const r = rng(77), puffs = [];
  for (let i = 0; i < 16; i++) {
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: steamTex, transparent: true, depthWrite: false, toneMapped: false, opacity: 0 }));
    sp.userData = { x: (r() - .5) * 3, z: (r() - .3) * 2.6, ph: r(), sp: .22 + r() * .14 };
    scene.add(sp); puffs.push(sp);
  }

  const DEG = Math.PI / 180, AX = new THREE.Vector3(1, 0, 0), AY = new THREE.Vector3(0, 1, 0);
  const dir = new THREE.Vector3(), target = new THREE.Vector3();
  let W = 1, H = 1, dist0 = 18, baseOY = 0, end = { d: 18, ox: 0, oy: 0 };
  const ease = (x) => (x < .5 ? 2 * x * x : 1 - (-2 * x + 2) ** 2 / 2);

  function place({ tiltX = 0, tiltY = 0, fly = 0 } = {}) {
    const f = ease(Math.min(1, fly));
    const dist = dist0 + (end.d - dist0) * f;
    dir.copy(CAM_DIR).applyAxisAngle(AX, -tiltY * (1 - f) * DEG).applyAxisAngle(AY, tiltX * (1 - f) * DEG);
    target.set(0, BOX.floor * .4 * (1 - f), 0);
    camera.position.copy(target).addScaledVector(dir, dist);
    camera.lookAt(target);
    camera.updateMatrixWorld();
    camera.setViewOffset(W, H, end.ox * f, baseOY * (1 - f) + end.oy * f, W, H);
    camera.updateProjectionMatrix();
    return f;
  }
  function resize() {
    W = innerWidth; H = innerHeight;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    // the closed box is about as wide as min(80vw, 50vh); it sits a little low to leave room for the open lid
    const wpx = Math.min(W * .74, H * .42, 470);
    dist0 = (BOX.half + BOX.t) * H / (TAN15 * wpx);
    baseOY = -H * .16;
  }
  resize();

  return {
    // the closed box's rectangle on screen (for the accessible hit area and the words under it)
    boxRect() {
      place();
      const { half, h, floor, t } = BOX, pts = [];
      for (const x of [-half - t, half + t]) for (const y of [floor - t, floor + h + t]) for (const z of [-half - t, half + t]) pts.push(new THREE.Vector3(x, y, z).project(camera));
      const xs = pts.map((p) => (p.x + 1) / 2 * W), ys = pts.map((p) => (1 - p.y) / 2 * H);
      return { left: Math.min(...xs), top: Math.min(...ys), right: Math.max(...xs), bottom: Math.max(...ys) };
    },
    resize,
    // the hero canvas's rectangle: the last frame of the flight shows the pizza exactly where the hero draws it
    aim(rect) {
      end = {
        d: heroDistance(rect.width / rect.height) * H / rect.height,
        ox: W / 2 - (rect.left + rect.width / 2),
        oy: H / 2 - (rect.top + rect.height / 2),
      };
    },
    frame({ lid = 0, tiltX = 0, tiltY = 0, steam = 0, fly = 0 }, time) {
      const f = place({ tiltX, tiltY, fly });
      box.lid.rotation.x = -Math.min(lid, 1.04) * 1.8;     // about 103 degrees when open
      box.group.position.y = -5 * f * f;                         // the box drops away
      const op = Math.max(0, 1 - f * 2.4);
      box.mats.forEach((m) => (m.opacity = op));
      box.group.visible = op > 0;
      pizza.position.y = PIZZA_Y * (1 - f) + .9 * Math.sin(Math.PI * f);   // the pizza lifts out and settles
      pizza.rotation.y = -TAU * f;
      puffs.forEach((sp, i) => {
        const u = sp.userData, ph = (time * u.sp + u.ph) % 1;
        sp.position.set(u.x + Math.sin(ph * 3 + i) * .25, BOX.floor + BOX.h + ph * 3.4, u.z);
        sp.scale.setScalar(.9 + ph * 2);
        sp.material.opacity = steam * (1 - f) * Math.sin(Math.PI * ph) * .5;
      });
      renderer.render(scene, camera);
    },
    dispose() {
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    },
  };
}

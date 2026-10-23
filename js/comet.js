// Shared parts for CometClear: constants, real orbits, the ice-warming model, radiation pressure on
// dust, chart boards, and the 3D pieces (Sun, stars, a 67P-like nucleus, glowing particles).
//
// Reused on purpose so the boxes agree:
// - The orbit code (Kepler's equation, positions, vis-viva speed, ellipse points, ribbons, sector fans,
//   the HUD board layout) is copied from KeplerClear's js/kepler.js (https://glassbox.how/keplerclear/).
// - The equilibrium temperature of a dark grain in sunlight, T = [L (1 − A) / (16 π σ d²)]^¼, which gives
//   278 K at 1 AU and 170 K near 2.7 AU (the frost line, Hayashi 1981), is PlanetClear's eqTemp
//   (https://glassbox.how/planetclear/), with the same constants.
// Orbits lie in the x–z plane: +x right, +y up, +z towards the viewer.
import { THREE, M, sphere, arrow, clamp } from './kit.js';

// ---------------------------------------------------------------- constants
export const TAU = Math.PI * 2;
export const D2R = Math.PI / 180;
export const GN = 6.6743e-11;              // N m²/kg², CODATA 2018
export const GM_SUN = 1.32712440018e20;    // m³/s², IAU / JPL (same as KeplerClear)
export const AU = 1.495978707e11;          // m, IAU 2012 (same as KeplerClear and PlanetClear)
export const DAY = 86400;
export const YEAR = 365.256 * DAY;         // s, sidereal year (as KeplerClear)
export const L_SUN = 3.828e26;             // W, IAU 2015 nominal solar luminosity (as PlanetClear)
export const SIGMA = 5.670374419e-8;       // Stefan–Boltzmann constant, W m⁻² K⁻⁴
export const C_LIGHT = 299792458;          // m/s
export const KB = 1.380649e-23;            // J/K
export const AMU = 1.66053907e-27;         // kg
export const S0 = L_SUN / (4 * Math.PI * AU * AU);   // sunlight at 1 AU: 1,361 W/m²

// ---------------------------------------------------------------- real orbits
// Elements from JPL's Small-Body Database API (ssd-api.jpl.nasa.gov/sbdb.api, read 23 October 2026): a (AU),
// e, i (tilt to the Earth's orbit, degrees), om (longitude of the ascending node) and w (argument of
// perihelion), both in degrees. Halley: orbit solution 75, epoch 20 January 1968, a = 17.9286 AU,
// e = 0.96794, q = 0.5749 AU, i = 162.19° (it goes round backwards), period 75.9 years. KeplerClear used an
// older set (a = 17.834 AU, e = 0.96714); the two give perihelion speeds within 1% of each other. Halley's
// last perihelion was 9 February 1986 (NASA) and it returns in 2061. tp is that date as a decimal year.
// The rest are JPL's rounded default values. Comets' orbits change a little at every pass (planets' tugs
// and the push of their own jets), so these are snapshots.
export const COMETS = {
  halley: { id: 'halley', name: '1P/Halley', short: 'Halley', a: 17.9286, e: 0.96794, i: 162.19, om: 59.10, w: 112.24, tp: 1986.11 },
  encke: { id: 'encke', name: '2P/Encke', short: 'Encke', a: 2.22, e: 0.847, i: 11.3 },
  cg67p: { id: 'cg67p', name: '67P/Churyumov–Gerasimenko', short: '67P', a: 3.46, e: 0.641, i: 7.04 },
  swift: { id: 'swift', name: '109P/Swift–Tuttle', short: 'Swift–Tuttle', a: 26.1, e: 0.963, i: 113, om: 139, w: 153 },
  tempel: { id: 'tempel', name: '55P/Tempel–Tuttle', short: 'Tempel–Tuttle', a: 10.3, e: 0.906, i: 162, om: 235, w: 173 },
  halebopp: { id: 'halebopp', name: 'C/1995 O1 (Hale–Bopp)', short: 'Hale–Bopp', a: 177.43, e: 0.994981, i: 89.29 },
};
Object.values(COMETS).forEach((c) => { c.q = c.a * (1 - c.e); c.Q = c.a * (1 + c.e); c.T = Math.pow(c.a, 1.5) * yrPerAU15(); });
function yrPerAU15() { return (TAU * Math.sqrt(AU ** 3 / GM_SUN)) / YEAR; }
// Planets' mean distances (AU) and colours, from KeplerClear (JPL approximate elements).
export const PLANETS = [
  { id: 'mercury', name: 'Mercury', au: 0.387, col: 0xb8b0a6 },
  { id: 'venus', name: 'Venus', au: 0.723, col: 0xe8c98a },
  { id: 'earth', name: 'Earth', au: 1.0, col: 0x4f8dff },
  { id: 'mars', name: 'Mars', au: 1.524, col: 0xd2603a },
  { id: 'jupiter', name: 'Jupiter', au: 5.203, col: 0xd9a066 },
  { id: 'saturn', name: 'Saturn', au: 9.537, col: 0xe3cf9a },
  { id: 'uranus', name: 'Uranus', au: 19.19, col: 0x9fe3e6 },
  { id: 'neptune', name: 'Neptune', au: 30.07, col: 0x5b7bff },
];
export const planet = (id) => PLANETS.find((p) => p.id === id);

// ---------------------------------------------------------------- Kepler's laws as code (from KeplerClear)
export const period = (a, GM) => TAU * Math.sqrt((a * a * a) / GM);
export const yearsFor = (aAU) => Math.pow(aAU, 1.5) * yrPerAU15();         // law 3 in years
export const speedAt = (r, a, GM) => Math.sqrt(Math.max(0, GM * (2 / r - 1 / a)));
export const vAU = (rAU, aAU) => speedAt(rAU * AU, aAU * AU, GM_SUN);       // m/s round the Sun
export function solveE(Mn, e) {
  let m = Mn % TAU; if (m > Math.PI) m -= TAU; if (m < -Math.PI) m += TAU;
  let E = e < 0.8 ? m : Math.PI * Math.sign(m || 1);
  for (let i = 0; i < 40; i++) {
    const d = (E - e * Math.sin(E) - m) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-13) break;
  }
  return E;
}
export function posAt(a, e, Mn) {
  const E = solveE(Mn, e), c = Math.cos(E), s = Math.sin(E), b = a * Math.sqrt(1 - e * e);
  const x = a * (c - e), y = b * s;
  return { x, y, r: a * (1 - e * c), nu: Math.atan2(y, x), E };
}
export function meanAt(nu, e) {
  const E = 2 * Math.atan2(Math.sqrt(1 - e) * Math.sin(nu / 2), Math.sqrt(1 + e) * Math.cos(nu / 2));
  return E - e * Math.sin(E);
}
// Velocity (in the orbit's own x, y; units of a per unit of mean anomaly × n) from a step ahead.
export function velAt(a, e, Mn, GM = GM_SUN) {
  const p = posAt(a, e, Mn), h = 1e-6, q = posAt(a, e, Mn + h);
  const n = Math.sqrt(GM / Math.pow(a * AU, 3));              // rad/s
  return { x: ((q.x - p.x) / h) * n * AU, y: ((q.y - p.y) / h) * n * AU };   // m/s
}
export function ellipsePts(a, e, n = 240, from = 0, to = TAU) {
  const b = a * Math.sqrt(1 - e * e), pts = [];
  for (let i = 0; i <= n; i++) { const E = from + ((to - from) * i) / n; pts.push([a * (Math.cos(E) - e), b * Math.sin(E)]); }
  return pts;
}
// Fraction of a lap spent closer to the Sun than r (AU).
export function fracInside(c, r) {
  if (r >= c.Q) return 1; if (r <= c.q) return 0;
  const nu = Math.acos(clamp((c.a * (1 - c.e * c.e) / r - 1) / c.e, -1, 1));
  return meanAt(nu, c.e) / Math.PI;
}

// ---------------------------------------------------------------- warming up: when does the ice go?
// 1. PlanetClear's grain in sunlight (a black body, no albedo, glowing from all sides):
export const eqTemp = (dAU, A = 0) => Math.pow((L_SUN * (1 - A)) / (16 * Math.PI * SIGMA * (dAU * AU) ** 2), 0.25);
// 2. A patch of bare ice-and-dust facing the Sun: the classic comet energy balance (Cowan & A'Hearn 1979,
//    Moon and Planets 21, 155). Sunlight absorbed = heat radiated + heat used to turn ice into vapour:
//      S0 (1 − A) cos z ÷ r² = ε σ T⁴ + Z(T) L
//    Z is the sublimation rate in kg per m² per second, from the vapour pressure of ice P(T):
//      Z = P(T) √(m ÷ 2π k T), with P(T) = 3.56 × 10¹² Pa × e^(−6141.667 / T) (Fanale & Salvail 1984,
//      Icarus 60, 476), m = one water molecule (18 u), L = 2.83 MJ/kg (latent heat of sublimation of ice,
//      about 51 kJ/mol). Albedo A = 0.04 (Halley's nucleus, Giotto) and emissivity ε = 0.9.
//    Solved for T by bisection. It is a model of the sunniest spot, not of a whole real comet.
const A_NUC = 0.04, EPS = 0.9, L_SUB = 2.83e6, M_H2O = 18.015 * AMU;
export const vapour = (T) => 3.56e12 * Math.exp(-6141.667 / T);
export const zRate = (T) => vapour(T) * Math.sqrt(M_H2O / (TAU * KB * T));
export function iceBalance(rAU, cosz = 1) {
  const F = (S0 * (1 - A_NUC) * cosz) / (rAU * rAU);
  let lo = 10, hi = 420;
  for (let i = 0; i < 60; i++) { const T = (lo + hi) / 2; if (F - EPS * SIGMA * T ** 4 - zRate(T) * L_SUB > 0) lo = T; else hi = T; }
  const T = (lo + hi) / 2, Z = zRate(T);
  return { T, Z, F, share: (Z * L_SUB) / F, cmDay: (Z * DAY) / 917 * 100 };   // ice 917 kg/m³
}
// 0 (asleep) to 1 (as busy as at 0.6 AU): used to size the coma and tails in the pictures.
export const activity = (rAU) => clamp(Math.log10(iceBalance(rAU).Z / 1e-7) / Math.log10(1.3e-3 / 1e-7), 0, 1);

// ---------------------------------------------------------------- light pushes dust
// β = radiation-pressure force ÷ the Sun's gravity on a grain. Both fall as 1/r², so β is the same at any
// distance: β = 3 L Q ÷ (16 π G M c ρ s), with s the grain's radius and ρ its density (Burns, Lamy & Soter
// 1979, Icarus 40, 1: β ≈ 5.7 × 10⁻⁴ Q ÷ (ρ s) in SI units). Q = 1 assumes the grain is much bigger than
// the light's wavelength; real grains smaller than about 0.3 µm let light slip past, so their β stops rising.
export const BETA_K = (3 * L_SUN) / (16 * Math.PI * GM_SUN * C_LIGHT);   // 5.74 × 10⁻⁴ kg/m²
export function beta(sMicron, rho = 1000) {
  const s = sMicron * 1e-6, Q = sMicron >= 0.3 ? 1 : Math.pow(sMicron / 0.3, 1);   // small-grain fall-off (sketch)
  return (BETA_K * Q) / (rho * s);
}

// ---------------------------------------------------------------- formatting
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
export const sup = (n) => String(n).split('').map((c) => SUP[c] ?? c).join('');
export const num = (v, d = 0) => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
export function sci(v, d = 1) {
  if (v === 0) return '0';
  const e = Math.floor(Math.log10(Math.abs(v))), m = v / Math.pow(10, e);
  if (e >= -2 && e <= 4) return num(v, Math.max(0, d - e));
  return `${m.toFixed(d)} × 10${sup(e)}`;
}
export const kms = (v) => (v / 1000).toFixed(v < 9950 ? 1 : 1) + ' km/s';
export const yearDate = (y) => {
  const yr = Math.floor(y), f = y - yr, mo = Math.min(11, Math.floor(f * 12));
  return ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][mo] + ' ' + yr;
};

// ---------------------------------------------------------------- boards (from KeplerClear)
export function panelBg(g, w, h) { g.clearRect(0, 0, w, h); g.fillStyle = 'rgba(10,12,18,.9)'; g.fillRect(0, 0, w, h); }
export function board(root, draw, w = 4, h = 2.1, pxW = 800, pxH = 420) {
  const c = document.createElement('canvas'); c.width = pxW; c.height = pxH;
  const g = c.getContext('2d'), tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const redraw = () => { draw(g, pxW, pxH); tex.needsUpdate = true; };
  redraw();
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false, side: THREE.DoubleSide, depthTest: false, depthWrite: false }));
  m.renderOrder = 50; m.frustumCulled = false; root.add(m);
  return { tex, redraw, canvas: c, mesh: m };
}
export function title(g, s, sub = '') {
  g.fillStyle = '#e8eef8'; g.font = 'bold 34px sans-serif'; g.fillText(s, 22, 46);
  if (sub) { g.font = '23px sans-serif'; g.fillStyle = 'rgba(255,255,255,.65)'; g.fillText(sub, 22, 78); }
}
export function axes(g, w, h, { x0 = 118, x1 = w - 30, y0 = h - 74, y1 = 112, xMax, yMax, xMin = 0, yMin = 0, xTicks, yTicks, xFmt = String, yFmt = String, xLabel = '', yLabel = '', logX = false, logY = false }) {
  const X = logX ? (x) => x0 + ((Math.log10(x) - xMin) / (xMax - xMin)) * (x1 - x0) : (x) => x0 + ((x - xMin) / (xMax - xMin)) * (x1 - x0);
  const Y = logY ? (y) => y0 - ((Math.log10(y) - yMin) / (yMax - yMin)) * (y0 - y1) : (y) => y0 - ((y - yMin) / (yMax - yMin)) * (y0 - y1);
  g.strokeStyle = 'rgba(255,255,255,.12)'; g.lineWidth = 1; g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '24px sans-serif';
  for (const t of xTicks) { g.beginPath(); g.moveTo(X(t), y1); g.lineTo(X(t), y0); g.stroke(); const s = xFmt(t); g.fillText(s, X(t) - g.measureText(s).width / 2, y0 + 30); }
  for (const t of yTicks) { g.beginPath(); g.moveTo(x0, Y(t)); g.lineTo(x1, Y(t)); g.stroke(); const s = yFmt(t); g.fillText(s, x0 - 10 - g.measureText(s).width, Y(t) + 8); }
  g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x0, y1); g.lineTo(x0, y0); g.lineTo(x1, y0); g.stroke();
  g.fillStyle = 'rgba(255,255,255,.8)'; g.font = '23px sans-serif';
  if (xLabel) g.fillText(xLabel, x1 - g.measureText(xLabel).width, y0 + 62);
  if (yLabel) g.fillText(yLabel, x0 + 8, y1 - 10);
  return { X, Y, x0, x1, y0, y1 };
}
export function dot(g, x, y, col, r = 10) { g.fillStyle = col; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 2; g.stroke(); }
export function line(g, pts, X, Y, col, wdt = 5, dash = null) {
  if (pts.length < 2) return;
  g.strokeStyle = col; g.lineWidth = wdt; g.setLineDash(dash || []); g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(X(x), Y(y)) : g.moveTo(X(x), Y(y))));
  g.stroke(); g.setLineDash([]);
}
export function text(g, s, x, y, col = 'rgba(255,255,255,.8)', font = '23px sans-serif', align = 'left') {
  g.fillStyle = col; g.font = font; g.textAlign = align; g.fillText(s, x, y); g.textAlign = 'left';
}
export const COL = { sun: '#ffd36b', orbit: '#8ef0ff', ion: '#6fb4ff', dust: '#ffd98a', ice: '#bfe9ff', hot: '#ffb547', cool: '#8ef0ff', red: '#ff5a8a', green: '#7be08c', violet: '#c49bff', soft: 'rgba(255,255,255,.55)' };
export const HEX = { sun: 0xffd36b, orbit: 0x8ef0ff, ion: 0x6fb4ff, dust: 0xffd98a, ice: 0xbfe9ff, hot: 0xffb547, cool: 0x8ef0ff, red: 0xff5a8a, green: 0x7be08c, violet: 0xc49bff };

// ---------------------------------------------------------------- stage helpers (from KeplerClear)
export const inReel = () => document.body.classList.contains('gb-reel');
export function mode(stage) { return inReel() ? 'reel' : stage.host.clientWidth < 560 ? 'phone' : 'wide'; }
// Slide the 3D picture clear of the readout and pin the chart board to the screen like a head-up
// display. minor = labels to hide on a phone. All boards are 800 × 420.
export function layout(stage, b, minor = []) {
  const W = stage.host.clientWidth, H = stage.host.clientHeight, md = mode(stage), A = 420 / 800;
  minor.forEach((l) => { if (l) l.visible = md !== 'phone'; });
  let shift = [0, 0], r = null;
  if (md === 'wide') { const w = clamp(W - 364, 220, 470); shift = [0, -0.2]; r = [W - 14 - w / 2, 78 + (w * A) / 2, w]; }
  else if (md === 'phone') { const w = Math.round(W * 0.56); shift = [0, -0.06]; r = [10 + w / 2, H - 8 - (w * A) / 2, w]; }
  else if (W / H < 0.8) { const w = W * 0.94; shift = [0, -0.15]; r = [W / 2, 40 + (w * A) / 2, w]; }
  else if (W / H < 1.3) { const w = W * 0.5; shift = [0, -0.13]; r = [W - 16 - w / 2, 16 + (w * A) / 2, w]; }
  else { const w = W * 0.3; shift = [-0.1, 0.05]; r = [W - 50 - w / 2, 150 + (w * A) / 2, w]; }
  if (!b) shift = md === 'wide' ? [0, -0.14] : md === 'phone' ? [0, -0.1] : [0, 0];
  const zoom = md === 'reel' ? (W / H < 1.3 ? 1.3 : 0.95) : 1;
  if (stage.camera.zoom !== zoom) { stage.camera.zoom = zoom; stage.camera.updateProjectionMatrix(); }
  if (!stage.shift || stage.shift[0] !== shift[0] || stage.shift[1] !== shift[1]) stage.setShift(...shift);
  if (b) {
    const cam = stage.camera, [sx, sy] = shift, d = 4;
    const nx = ((r[0] - sx * W) / W) * 2 - 1, ny = 1 - ((r[1] + sy * H) / H) * 2;
    const Hv = (2 * d * Math.tan((cam.fov * D2R) / 2)) / cam.zoom, Wv = Hv * cam.aspect;
    b.mesh.position.set((nx * Wv) / 2, (ny * Hv) / 2, -d).applyQuaternion(cam.quaternion).add(cam.position);
    b.mesh.quaternion.copy(cam.quaternion);
    b.mesh.scale.setScalar(((r[2] / W) * Wv) / b.mesh.geometry.parameters.width);
  }
  return md;
}
// The video's tall 1080 × 1920 frame: the kit backs the camera off a lot there, so chapters can give a
// closer, re-aimed view under the same name plus 'P'.
export const portraitReel = (stage) => inReel() && stage.host.clientWidth / stage.host.clientHeight < 0.8;
export const pickView = (stage, views, key) => (portraitReel(stage) && views[key + 'P']) || views[key];
export function unlayout(stage) { stage.floor.visible = true; stage.lights.visible = true; stage.camera.zoom = 1; stage.camera.updateProjectionMatrix(); stage.setShift(0, 0); }
export const slim = (html) => `<div style="max-width:300px">${html}</div>`;
// Keep a range slider's thumb in step when the model moves the value itself (time running).
export function syncSlider(label, v, min, max) {
  const el = document.querySelector(`#panel input[aria-label="${label}"]`);
  if (!el) return;
  el.value = v; el.style.setProperty('--p', ((v - min) / (max - min)) * 100 + '%');
  const out = el.closest('.ctl')?.querySelector('output');
  return out;
}

// ---------------------------------------------------------------- arrows (from KeplerClear)
const UP = new THREE.Vector3(0, 1, 0), tmpV = new THREE.Vector3();
export function force(color, r = 0.035, head = 0.2) {
  const a = arrow(color, 1, head, r);
  a.renderOrder = 10;
  a.traverse((o) => { if (o.material) { o.material.depthTest = false; o.material.transparent = true; o.renderOrder = 10; } });
  a.aim = (from, dir, len) => {
    a.position.set(...from);
    tmpV.set(...dir); if (tmpV.lengthSq() < 1e-12) tmpV.set(1, 0, 0);
    a.quaternion.setFromUnitVectors(UP, tmpV.normalize());
    a.set(Math.max(0.001, len));
    if (len < 0.03) a.visible = false;
  };
  return a;
}

// ---------------------------------------------------------------- orbit drawing (from KeplerClear)
export function ribbon(n, color = 0xffffff, opacity = 0.8, y = 0) {
  const pos = new Float32Array(n * 2 * 3), idx = [];
  for (let i = 0; i < n - 1; i++) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setIndex(idx); g.setDrawRange(0, 0);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false, toneMapped: false }));
  m.frustumCulled = false;
  m.set = (pts, w = 0.03) => {
    const k = Math.min(n, pts.length);
    for (let i = 0; i < k; i++) {
      const p = pts[i], a = pts[Math.max(0, i - 1)], b = pts[Math.min(k - 1, i + 1)];
      let tx = b[0] - a[0], tz = b[1] - a[1]; const L = Math.hypot(tx, tz) || 1; tx /= L; tz /= L;
      const nx = (-tz * w) / 2, nz = (tx * w) / 2;
      pos[i * 6] = p[0] + nx; pos[i * 6 + 1] = y; pos[i * 6 + 2] = p[1] + nz;
      pos[i * 6 + 3] = p[0] - nx; pos[i * 6 + 4] = y; pos[i * 6 + 5] = p[1] - nz;
    }
    g.setDrawRange(0, Math.max(0, (k - 1) * 6)); g.attributes.position.needsUpdate = true;
  };
  return m;
}
export function ring(R, color, opacity = 0.4, w = 0.02, n = 129) {
  const r = ribbon(n, color, opacity);
  const pts = []; for (let i = 0; i < n; i++) { const a = (i / (n - 1)) * TAU; pts.push([R * Math.cos(a), R * Math.sin(a)]); }
  r.set(pts, w);
  return r;
}

// ---------------------------------------------------------------- bodies
export function rng(seed = 1) { let s = seed >>> 0 || 1; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
export function makeSun(R = 0.3) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(new THREE.SphereGeometry(R, 32, 16), M.glow(0xffe3a3)));
  for (const [k, o] of [[1.5, 0.22], [2.4, 0.08]]) g.add(new THREE.Mesh(new THREE.SphereGeometry(R * k, 24, 12), new THREE.MeshBasicMaterial({ color: 0xffb547, transparent: true, opacity: o, depthWrite: false, toneMapped: false })));
  return g;
}
export function ball(R, color, seg = 24) {
  const m = sphere(R, new THREE.MeshStandardMaterial({ color, roughness: 0.7, metalness: 0, emissive: color, emissiveIntensity: 0.35 }), seg);
  m.castShadow = false; m.receiveShadow = false;
  return m;
}
export function starfield(n = 700, R = 400, seed = 5) {
  const r = rng(seed), pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const u = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - u * u); pos[i * 3] = R * s * Math.cos(a); pos[i * 3 + 1] = R * u; pos[i * 3 + 2] = R * s * Math.sin(a); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0.7 }));
}

// A soft round dot texture, shared by every glowing particle system.
let dotTex = null;
export function softDot() {
  if (dotTex) return dotTex;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  dotTex = new THREE.CanvasTexture(c); dotTex.colorSpace = THREE.SRGBColorSpace;
  return dotTex;
}
// n glowing points with their own colours: set(i, x, y, z, r, g, b) then done(count).
// size is in scene units (they shrink with distance).
export function glowPoints(n, size = 0.1, opacity = 0.9) {
  const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3).setUsage(THREE.DynamicDrawUsage));
  g.setDrawRange(0, 0);
  const mat = new THREE.PointsMaterial({ size, map: softDot(), vertexColors: true, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, sizeAttenuation: true });
  const p = new THREE.Points(g, mat); p.frustumCulled = false;
  p.set = (i, x, y, z, r, gg, b) => { pos[i * 3] = x; pos[i * 3 + 1] = y; pos[i * 3 + 2] = z; col[i * 3] = r; col[i * 3 + 1] = gg; col[i * 3 + 2] = b; };
  p.done = (k) => { g.setDrawRange(0, k); g.attributes.position.needsUpdate = true; g.attributes.color.needsUpdate = true; };
  return p;
}
// A soft glowing ball (coma, hydrogen cloud) drawn as a camera-facing sprite.
export function haze(color, R, opacity = 0.5) {
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: softDot(), color, transparent: true, opacity, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
  s.scale.setScalar(R * 2); return s;
}

// ---------------------------------------------------------------- the nucleus
// A two-lobed nucleus in the shape of Rosetta's comet 67P, 1 unit = 1 km. Lobe ellipsoids 4.10 × 3.52 ×
// 1.63 km and 2.50 × 2.14 × 1.64 km (Jorda et al. 2016, Icarus, from Rosetta's OSIRIS images). The lumps are seeded noise, not a map.
function lumpy(geo, seed, amp) {
  const r = rng(seed), waves = Array.from({ length: 14 }, () => { const u = r() * 2 - 1, a = r() * TAU, s = Math.sqrt(1 - u * u); return { d: [s * Math.cos(a), u, s * Math.sin(a)], k: 2 + r() * 7, ph: r() * TAU, w: (0.4 + r()) / 14 }; });
  const p = geo.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i); const L = v.length() || 1, n = v.clone().divideScalar(L);
    let d = 0; for (const w of waves) d += w.w * Math.sin(w.k * (n.x * w.d[0] + n.y * w.d[1] + n.z * w.d[2]) + w.ph);
    v.multiplyScalar(1 + amp * d); p.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}
// Returns { group, lobes: [{ center, radii, geo }] }. Each lobe geometry is a unit-ish sphere scaled to
// its radii, so callers can build nested copies (crust, interior) of the same shape.
export function nucleusShape() {
  const lobes = [
    { center: new THREE.Vector3(-0.85, 0, 0), radii: [2.05, 0.82, 1.76], rot: [0, 0, 0.12], seed: 3 },
    { center: new THREE.Vector3(1.75, 0.55, 0.1), radii: [1.25, 0.82, 1.07], rot: [0.2, 0.5, -0.5], seed: 8 },
  ];
  lobes.forEach((L) => { L.geo = lumpy(new THREE.SphereGeometry(1, 72, 48), L.seed, 0.16); });
  return lobes;
}
// Mesh for a lobe at a given inward scale k (1 = the surface).
export function lobeMesh(L, mat, k = 1) {
  const m = new THREE.Mesh(L.geo, mat);
  m.position.copy(L.center); m.rotation.set(...L.rot); m.scale.set(L.radii[0] * k, L.radii[1] * k, L.radii[2] * k);
  return m;
}
// Where a comet's orbit crosses the Earth's (a node), in 3D, from its elements. Returns the distance from
// the Sun there, the comet's velocity and the speed at which its dust meets the Earth (the Earth taken on a
// circle at 29.8 km/s). asc = the ascending node (going north through the Earth's orbital plane).
export function nodeMeet(c, asc) {
  const nu = asc ? -c.w * D2R : Math.PI - c.w * D2R, p = c.a * (1 - c.e * c.e), r = p / (1 + c.e * Math.cos(nu));
  const h = Math.sqrt(GM_SUN * p * AU), O = c.om * D2R, I = c.i * D2R, W = c.w * D2R;
  const vx = (-GM_SUN / h) * Math.sin(nu), vy = (GM_SUN / h) * (c.e + Math.cos(nu));
  const cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(I), si = Math.sin(I), cw = Math.cos(W), sw = Math.sin(W);
  const rot = (x, y) => [(cO * cw - sO * sw * ci) * x + (-cO * sw - sO * cw * ci) * y, (sO * cw + cO * sw * ci) * x + (-sO * sw + cO * cw * ci) * y, sw * si * x + cw * si * y];
  const rv = rot(r * Math.cos(nu), r * Math.sin(nu)), vv = rot(vx, vy), lam = Math.atan2(rv[1], rv[0]);
  const vE = Math.sqrt(GM_SUN / AU), ve = [-vE * Math.sin(lam), vE * Math.cos(lam), 0];
  const vrel = Math.hypot(vv[0] - ve[0], vv[1] - ve[1], vv[2] - ve[2]);
  return { r, lam, vHel: Math.hypot(...vv), vE, vrel, vEntry: Math.sqrt(vrel * vrel + 11186 * 11186) };
}
export { clamp, THREE, M };

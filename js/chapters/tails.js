// Chapter 3: why two tails point away from the Sun. Halley's comet near perihelion (JPL elements), seen
// in a frame that follows the comet (1 AU = 6 units). Nothing is drawn by hand:
// - Dust: every day the comet is active it lets go of grains of eight sizes (1 µm to 1 mm, density
//   1,000 kg/m³ assumed; ejection speed ignored). Each grain then moves under the Sun's gravity reduced by
//   sunlight's push, GM (1 − β), integrated step by step (leapfrog, half-day steps). β, the ratio of
//   radiation force to gravity, is 5.7 × 10⁻⁴ ÷ (ρ s) in SI units for grains much bigger than the light's
//   wavelength (Burns, Lamy & Soter 1979). Small grains (big β) are pushed far out; big grains stay near
//   the orbit. Grains of one size released at different times make the curve astronomers call a syndyne.
// - Ions: gas ionised by sunlight is picked up by the solar wind's magnetic field and swept away at the
//   wind's speed (slow wind about 400 km/s, fast wind about 750 km/s: NASA, ESA). Seen from the moving
//   comet, the tail points along (wind velocity − comet velocity), a few degrees off the exact
//   anti-sunward line: the "aberration" angle, atan(v_sideways ÷ v_wind). Ludwig Biermann used this in
//   1951 to argue that the Sun blows out a steady wind.
// - Escape: a grain set free at distance r with the comet's speed v leaves the Solar System if
//   v² > 2 GM (1 − β) ÷ r, that is if β > 1 − v² r ÷ (2 GM).
// - Anti-tail: the dust lies in a thin sheet in the orbit's plane, big grains along the orbit behind the
//   comet. Seen nearly edge-on, part of that sheet appears to point towards the Sun (Arend–Roland 1957).
import { THREE, M, clamp, approach } from '../kit.js';
import {
  TAU, AU, DAY, GM_SUN, COMETS, posAt, vAU, beta, board, panelBg, title, axes, dot, line, text, COL, HEX, layout, unlayout, slim,
  makeSun, starfield, glowPoints, haze, force, ribbon, ellipsePts, activity, syncSlider, rng, pickView,
} from '../comet.js';

const H = COMETS.halley, S = 6;                                   // scene units per AU
const MU = GM_SUN * DAY * DAY / AU ** 3;                         // AU³/day²
const nDay = TAU / (H.T * 365.256);                              // mean motion, rad/day
const SIZES = Array.from({ length: 16 }, (_, i) => Math.pow(10, (3 * i) / 15));   // 1 µm to 1 mm
const RHO = 1000, HIST = 90, STEP = 0.5;
const SLIDER = 'Days from closest approach';
// The picture turns so the Sun is always up and to the left (direction SUNDIR) and the tails run down to the right.
const SUNDIR = [-0.8, -0.6];
const VIEWS = { top: { pos: [1.5, 6.6, 3.6], target: [1.3, 0, 0.6] }, edge: { pos: [-5.6, 0.26, 7.5], target: [-0.3, 0, -0.2] }, topP: { pos: [0.7, 3.0, 1.9], target: [0.5, 0, 0.5] } };
// position (AU) and velocity (AU/day) on Halley's orbit, t days from perihelion. Drawn going anticlockwise
// seen from above, as in chapter 2 (flip of the real retrograde orbit; it makes no difference here).
function state(t) {
  const Mn = nDay * t, p = posAt(H.a, H.e, Mn), q = posAt(H.a, H.e, Mn + 1e-5), dt = 1e-5 / nDay;
  return { x: p.x, y: p.y, vx: (q.x - p.x) / dt, vy: (q.y - p.y) / dt, r: p.r };
}
// one grain from (x, y, vx, vy) for T days under GM (1 − β)
function fly(st, b, T) {
  let { x, y, vx, vy } = st; const mu = MU * (1 - b);
  const n = Math.max(1, Math.ceil(T / STEP)), h = T / n;
  let r3 = Math.pow(x * x + y * y, 1.5);
  vx -= (0.5 * h * mu * x) / r3; vy -= (0.5 * h * mu * y) / r3;
  for (let i = 0; i < n; i++) {
    x += h * vx; y += h * vy; r3 = Math.pow(x * x + y * y, 1.5);
    const k = i === n - 1 ? 0.5 : 1; vx -= (k * h * mu * x) / r3; vy -= (k * h * mu * y) / r3;
  }
  return [x, y];
}

export default {
  id: 'tails',
  short: 'Two tails',
  title: 'Why the tails point away from the Sun',
  subtitle: 'Sunlight pushes the dust. The solar wind blows the gas. Neither tail trails behind like smoke from a train.',
  view: VIEWS.top,
  learn: `<p>A comet's tail does not stream out behind it like the smoke from a steam engine. In space there is no air to push it back. Both tails point roughly <b>away from the Sun</b>, wherever the comet is going, so when a comet heads back out into the dark its tails go <b>in front</b> of it.</p>
    <p>The <b>ion tail</b> is gas that sunlight has knocked electrons off, so it carries an electric charge. The Sun blows out a thin, fast stream of charged particles, the <b>solar wind</b>, at about <b>400 km/s</b> (up to about 750 km/s in the fast wind), carrying the Sun's magnetic field with it. The field grabs the charged gas and sweeps it straight out. So the ion tail is <b>straight</b>, points almost exactly away from the Sun, and glows <b>blue</b> from carbon monoxide ions. In 1951 Ludwig Biermann used ion tails to argue that such a wind must exist, years before spacecraft measured it.</p>
    <p>The <b>dust tail</b> is pushed by <b>sunlight itself</b>. Light carries momentum, so it presses on every grain. The push and the Sun's gravity both get weaker in the same way with distance, so for each grain their ratio, <b>β</b>, is fixed. It depends on size: a grain 1 micrometre across is pushed about half as hard as gravity pulls, a grain 1 mm across hardly at all. Each grain then follows its own orbit, as if the Sun were a little lighter, so the grains spread out into a broad, <b>curved</b> fan that lags behind the ion tail. Big grains stay close to the comet's path.</p>
    <p>Sometimes we see a spike pointing <b>towards</b> the Sun: an <b>anti-tail</b>. It is a trick of perspective. The big grains lie in a thin sheet along the orbit, and when the Earth passes through the plane of the orbit we see that sheet edge-on, sticking out on the Sun's side.</p>
    <p class="tip"><b>Try it:</b> run the comet past the Sun and watch the tails swing round to lead it out. Change the grain size and see where those grains go. Then press "See the anti-tail".</p>`,
  terms: [
    { t: 'Solar wind', d: 'A stream of charged particles blowing out from the Sun at about 400 to 750 km/s, carrying the Sun’s magnetic field.' },
    { t: 'Ion', d: 'An atom or molecule that has lost (or gained) electrons, so it carries an electric charge.' },
    { t: 'Radiation pressure', d: 'The gentle push of light on anything it hits, because light carries momentum.' },
    { t: 'β (beta)', d: 'For a dust grain: the push of sunlight divided by the pull of the Sun’s gravity. Small grains have bigger β.' },
    { t: 'Syndyne', d: 'The curve traced by grains of one size let go at different times. A dust tail is a fan of them.' },
    { t: 'Anti-tail', d: 'A thin spike that seems to point towards the Sun: the dust sheet along the orbit seen edge-on.' },
  ],
  defaults: { day: -40, run: true, size: 10, wind: 400, view: 'top' },
  controls: [
    { key: 'day', type: 'range', label: SLIDER, min: -120, max: 160, step: 1, ends: ['coming in', 'going out'], fmt: (v) => (v < 0 ? `${-v} days before` : v > 0 ? `${v} days after` : 'closest to the Sun') },
    { key: 'run', type: 'toggle', label: 'Let time run (6 days a second)' },
    { key: 'size', type: 'log', label: 'Grain size to follow', min: 1, max: 1000, ends: ['1 µm', '1 mm'], fmt: (v) => (v < 10 ? v.toFixed(1) : Math.round(v)) + ' µm' },
    { key: 'wind', type: 'range', label: 'Solar wind speed', min: 300, max: 800, step: 10, ends: ['300 km/s', '800 km/s'], fmt: (v) => v + ' km/s' },
    { key: 'go', type: 'buttons', label: 'Views', items: [
      { label: 'From above', act: (s) => { s.view = 'top'; } },
      { label: 'See the anti-tail', act: (s) => Object.assign(s, { view: 'edge', day: 70, run: false }) },
    ] },
  ],
  onChange(s, key) { if (key === 'day') s.run = false; },
  quiz: [
    { q: 'A comet is moving away from the Sun after its closest pass. Which way do its tails point?', options: ['Behind it, back towards the Sun', 'Away from the Sun, so roughly ahead of it', 'Straight up', 'Towards the Earth'], answer: 1, why: 'The tails are pushed by sunlight and the solar wind, not dragged by air. They point away from the Sun, so going out they lead the comet.' },
    { q: 'What pushes the dust tail away from the Sun?', options: ['The solar wind’s magnetic field', 'The pressure of sunlight', 'Air in space', 'The comet’s jets only'], answer: 1, why: 'Light carries momentum and pushes on dust grains. Small grains feel the biggest push compared with gravity (the largest β).' },
    { q: 'Why is the ion tail straighter than the dust tail?', options: ['Ions are heavier', 'The solar wind sweeps ions out at hundreds of km/s, far faster than the comet moves', 'It is made of light', 'It is closer to the Sun'], answer: 1, why: 'At about 400 km/s the wind is many times faster than the comet, so the ions shoot almost straight out. Dust drifts slowly and spreads along the orbit.' },
  ],
  reel: [
    { ms: 5800, caption: 'Sunlight pushes the dust and the solar wind blows the gas, so both tails point away from the Sun.', set: { run: true, size: 10, wind: 400, view: 'top', day: -30 }, spin: 0 },
    { ms: 5200, caption: 'Heading back out, a comet’s tails go in front of it: there is no air in space to drag them back.', set: { run: false, size: 3, wind: 450, view: 'top' }, anim: { day: [40, 110] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    stage.floor.visible = false;
    root.add(starfield(800, 300, 51));
    const world = new THREE.Group(); root.add(world);       // Sun-centred things, slid so the comet stays at 0
    const sun = makeSun(0.5); world.add(sun);
    const path = ribbon(301, HEX.orbit, 0.4, -0.002); path.set(ellipsePts(H.a, H.e, 300, -1.3, 1.3).map(([x, y]) => [x * S, -y * S]), 0.025); world.add(path);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.03, 12, 8), M.glow(0xffffff)); root.add(head);
    const coma = haze(0xd8f0ff, 0.3, 0.9); root.add(coma);
    const ND = SIZES.length * HIST, dust = glowPoints(ND, 0.1, 0.9); root.add(dust);
    // big grains shed on earlier passes and months lie spread along the orbit: a dust trail (sketch)
    const NTR = 160, trail = glowPoints(NTR, 0.1, 1.0); root.add(trail);
    const NF = HIST, follow = glowPoints(NF, 0.11, 1.0); root.add(follow);
    const NI = 500, ions = glowPoints(NI, 0.075, 0.95); root.add(ions);
    const ir = rng(12), IR = Array.from({ length: NI }, () => [ir(), ir(), ir()]);
    const aSun = force(HEX.sun, 0.02, 0.12), aV = force(0x5ce1a9, 0.02, 0.12); root.add(aSun, aV);
    const aG = force(HEX.violet, 0.022, 0.1), aL = force(HEX.dust, 0.022, 0.1); root.add(aG, aL);
    const grain = new THREE.Mesh(new THREE.SphereGeometry(0.05, 12, 8), M.glow(HEX.dust)); root.add(grain);
    const lab = (t, cls = '', c = null) => { const l = stage.label(t, [0, 0, 0], root, cls); if (c) l.element.style.setProperty('--c', c); return l; };
    const lSun = lab('to the Sun', 'hot', COL.sun), lV = lab('the comet’s motion'), lIon = lab('Ion tail', 'hot', COL.ion), lDust = lab('Dust tail', 'hot', COL.dust);
    const lG = lab('gravity'), lL = lab('sunlight’s push'), lF = lab('', 'hot', COL.dust), lAnti = lab('anti-tail: big grains along the orbit, seen edge-on', 'hot', COL.dust);

    const sim = { key: '', r: 1, v: 0, ab: 0, esc: 0, st: null, act: 0 };
    const sizes = []; for (let i = 0; i <= 80; i++) sizes.push(0.1 * Math.pow(1e5, i / 80));
    const bBoard = board(stage.root, (g, w, h) => {
      panelBg(g, w, h); title(g, 'β: light’s push ÷ gravity', 'grains of density 1,000 kg/m³ · both axes ×10 per step');
      const { X, Y, x0, x1 } = axes(g, w, h, { logX: true, logY: true, xMin: -1, xMax: 4, yMin: -4, yMax: 0.5, xTicks: [0.1, 1, 10, 100, 1000], yTicks: [1e-4, 1e-3, 0.01, 0.1, 1], xFmt: (v) => (v < 1000 ? v + ' µm' : v / 1000 + ' mm'), yFmt: (v) => String(v), xLabel: 'grain size →' });
      g.strokeStyle = 'rgba(255,90,138,.7)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(x0, Y(1)); g.lineTo(x1, Y(1)); g.stroke(); g.setLineDash([]);
      text(g, 'β = 1: light wins', x1 - 6, Y(1) - 8, COL.red, '20px sans-serif', 'right');
      const e = sim.esc; if (e > 1e-4) { g.strokeStyle = 'rgba(123,224,140,.7)'; g.setLineDash([4, 6]); g.beginPath(); g.moveTo(x0, Y(e)); g.lineTo(x1, Y(e)); g.stroke(); g.setLineDash([]); text(g, 'above this, grains leave the Solar System', x1 - 6, Y(e) - 8, COL.green, '19px sans-serif', 'right'); }
      line(g, sizes.map((s) => [s, beta(s, RHO)]).filter((p) => p[1] > 1e-4), X, Y, COL.dust, 5);
      text(g, 'below about 0.3 µm light slips past (sketch)', X(0.12), Y(0.0004), COL.soft, '19px sans-serif');
      dot(g, X(sim.size || 10), Y(beta(sim.size || 10, RHO)), COL.hot, 11);
    });

    let view = '', md = 'wide', tDraw = 0;
    const tmp = new THREE.Vector3();
    function recompute(s) {
      const now = s.day, c = state(now); sim.st = c; sim.r = c.r;
      const cx = c.x * S, cz = -c.y * S;
      world.position.set(-cx, 0, -cz);
      let n = 0;
      // dust released over the last HIST days, weighted by how active the comet was then
      for (let k = 0; k < HIST; k++) {
        const age = (k + 0.5) * (90 / HIST), t0 = now - age, s0 = state(t0), act = activity(s0.r);
        if (act < 0.05) continue;
        SIZES.forEach((sz, j) => {
          const [x, y] = fly(s0, beta(sz, RHO), age);
          const fade = clamp(act * (1 - age / 100), 0, 1) * (0.45 + 0.3 * (j / 15));
          const warm = j / 15;
          dust.set(n++, x * S - cx, 0, -y * S - cz, fade * (0.9 + 0.1 * warm), fade * (0.62 + 0.18 * warm), fade * (0.32 + 0.1 * warm));
        });
      }
      dust.done(n);
      let m = 0; const bF = beta(s.size, RHO);
      for (let k = 0; k < NF; k++) {
        const age = (k + 0.5) * (90 / NF), s0 = state(now - age); if (activity(s0.r) < 0.05) continue;
        const [x, y] = fly(s0, bF, age); follow.set(m++, x * S - cx, 0.01, -y * S - cz, 1, 0.75, 0.3);
      }
      follow.done(m);
      sim.followN = m;
      let q = 0;
      for (let k = 0; k < NTR; k++) { const tt = now - 100 + (k / NTR) * 112, p = state(tt), f = 0.75 * (1 - Math.abs(tt - now) / 115); trail.set(q++, p.x * S - cx, 0, -p.y * S - cz, f, f * 0.75, f * 0.4); }
      trail.done(q);
    }
    return {
      dispose() { unlayout(stage); },
      update(dt, s, time) {
        dt = Math.max(0, dt);
        stage.floor.visible = false;
        if (s.view !== view) {
          view = s.view;
          const vv = pickView(stage, VIEWS, view); stage.setView(vv.pos, vv.target, 1.0);
        }
        md = layout(stage, view === 'edge' ? null : bBoard, [lV, lG, lL]);
        bBoard.mesh.visible = view !== 'edge';
        if (s.run) {
          s.day += dt * 6; if (s.day > 160) s.day = -120;
          const out = syncSlider(SLIDER, Math.round(s.day), -120, 160); if (out) { const v = Math.round(s.day); out.textContent = v < 0 ? `${-v} days before` : v > 0 ? `${v} days after` : 'closest to the Sun'; }
        }
        sim.size = s.size;
        const key = s.day.toFixed(2) + '|' + s.size.toFixed(3);
        if (key !== sim.key) { sim.key = key; recompute(s); }
        const c = sim.st, cx = c.x * S, cz = -c.y * S;
        const ux = -cx / Math.hypot(cx, cz), uz = -cz / Math.hypot(cx, cz);         // towards the Sun
        root.rotation.y = Math.atan2(SUNDIR[0], SUNDIR[1]) - Math.atan2(ux, uz);
        const vx = c.vx, vz = -c.vy, vL = Math.hypot(vx, vz);
        const vKms = vAU(c.r, H.a) / 1000; sim.v = vKms;
        sim.esc = Math.max(0, 1 - ((vKms * 1000) ** 2 * c.r * AU) / (2 * GM_SUN));
        const act = activity(c.r); sim.act = act;
        coma.scale.setScalar(0.05 + 0.5 * act);
        // ion tail: along (wind − comet velocity)
        const vr = -(vx * ux + vz * uz) / vL * vKms, vt = vKms * Math.sqrt(Math.max(0, 1 - ((vx * ux + vz * uz) / vL) ** 2));
        const wx = -ux * s.wind - (vx / vL) * vKms, wz = -uz * s.wind - (vz / vL) * vKms, wL = Math.hypot(wx, wz);
        sim.ab = Math.atan2(vt, s.wind - vr) * 180 / Math.PI;
        let n = 0;
        if (act > 0.05) for (let i = 0; i < NI; i++) {
          const [a, b, cc] = IR[i], ph = (time * 0.4 + a) % 1, L = ph * 3.2 * act;
          const side = (b - 0.5) * 0.05 * (1 + L * 1.5), k = (1 - ph) * act;
          ions.set(n++, (wx / wL) * L - (wz / wL) * side, (cc - 0.5) * 0.03, (wz / wL) * L + (wx / wL) * side, 0.25 * k, 0.5 * k, 1.1 * k);
        }
        ions.done(n);
        // arrows: to the Sun, direction of motion, and the two forces on one grain
        aSun.aim([0, 0.02, 0], [ux, 0, uz], 0.7); aV.aim([0, 0.02, 0], [vx, 0, vz], 0.6);
        const bF = beta(s.size, RHO), gx = -uz * -1.2 + ux * 0.2, gz = ux * -1.2 + uz * 0.2;
        grain.position.set(gx, 0.02, gz);
        aG.aim([gx, 0.03, gz], [ux, 0, uz], 0.55); aL.aim([gx, 0.03, gz], [-ux, 0, -uz], 0.55 * clamp(bF, 0.02, 1));
        aG.visible = aL.visible = grain.visible = view !== 'edge'; aL.visible = aL.visible && bF > 0.03;
        lSun.position.set(ux * 0.95, 0.05, uz * 0.95); lV.position.set((vx / vL) * 0.8, 0.05, (vz / vL) * 0.8);
        lIon.position.set((wx / wL) * 2.2 * act + 0.15, 0.05, (wz / wL) * 2.2 * act); lIon.visible = act > 0.1;
        lG.position.set(gx + ux * 0.6, 0.05, gz + uz * 0.6); lL.position.set(gx - ux * 0.5, 0.05, gz - uz * 0.5 - 0.1);
        lG.visible = lL.visible = view !== 'edge' && md !== 'phone';
        // dust label at the middle of the dust fan; anti-tail label on the Sun side in the edge view
        lDust.position.set(-ux * 1.4 - (vx / vL) * 0.9, 0.05, -uz * 1.4 - (vz / vL) * 0.9); lDust.visible = act > 0.1;
        lAnti.visible = view === 'edge' && act > 0.05; lAnti.position.set(ux * 1.1, 0.3, uz * 1.1);
        if (view === 'edge') { lV.visible = lDust.visible = lG.visible = lL.visible = false; aV.visible = false; } else aV.visible = true;
        trail.visible = view === 'edge'; follow.visible = view !== 'edge'; aSun.visible = view !== 'edge';
        lF.element.textContent = `${s.size < 10 ? s.size.toFixed(1) : Math.round(s.size)} µm grains`; lF.visible = sim.followN > 3 && md !== 'phone' && view !== 'edge';
        if (sim.followN > 3) { const p = follow.geometry.attributes.position.array, i = (sim.followN - 1) * 3; lF.position.set(p[i], 0.2, p[i + 2]); }
        tmp.set(0, 0, 0);
        tDraw += dt; if (tDraw > 0.15) { tDraw = 0; bBoard.redraw(); }
      },
      readout: (s) => {
        const b = beta(s.size, RHO), d = Math.round(s.day);
        const big = `<div class="big">${s.size < 10 ? s.size.toFixed(1) : Math.round(s.size)} µm grain: β = ${b < 0.01 ? b.toExponential(1) : b.toFixed(b < 0.1 ? 3 : 2)}</div>`;
        const r1 = `<div class="row"><span>It feels gravity × (1 − β)</span><b>${((1 - b) * 100).toFixed(b < 0.001 ? 2 : 1)}%</b></div>`;
        const r2 = `<div class="row"><span>Ion tail off the anti-Sun line</span><b>${sim.ab.toFixed(1)}°</b></div>`;
        if (md === 'phone') return big + r1 + r2;
        return slim(`${big}${r1}
          <div class="row"><span>Where</span><b>${d < 0 ? -d + ' days before' : d > 0 ? d + ' days after' : 'at'} perihelion, ${sim.r.toFixed(2)} AU</b></div>
          <div class="row"><span>Comet speed</span><b>${sim.v.toFixed(1)} km/s</b></div>
          ${r2}
          <div class="row"><span>Released now, it…</span><b>${b > sim.esc ? '<span class="ok">leaves the Solar System</span>' : 'stays in orbit round the Sun'}</b></div>
          <small>β = 5.7 × 10⁻⁴ ÷ (ρ s), Burns, Lamy &amp; Soter 1979. Wind ${s.wind} km/s. Grains leave gently (model).</small>`);
      },
    };
  },
};

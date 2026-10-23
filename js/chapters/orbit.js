// Chapter 2: the orbit and the wake-up. Halley's comet on its real orbit (JPL SBDB: a = 17.9286 AU,
// e = 0.96794, so it swings from 0.575 AU, inside Venus's orbit, out to 35.3 AU, beyond Neptune's).
// Nothing is tweened:
// - The position at each date comes from Kepler's equation (KeplerClear's solver), counting from the
//   perihelion of 9 February 1986 with the period from law 3, T = a^1.5 = 75.9 years. Kepler alone puts
//   the next perihelion early in 2062; the planets' tugs bring the real one forward to mid-2061.
// - Speed is the vis-viva equation v² = GM (2/r − 1/a) (as KeplerClear).
// - "Grain temperature" is PlanetClear's equilibrium temperature of a dark grain in sunlight,
//   T = [L ÷ (16 π σ d²)]^¼: 278 K at 1 AU, 170 K (the frost line) near 2.7 AU.
// - "Sunlit ice" is the energy balance of a patch of ice and dust facing the Sun (Cowan & A'Hearn 1979),
//   which also gives how fast the ice turns to gas. Water ice wakes up inside about 3 AU and is asleep
//   beyond about 5 to 6 AU; farther out, only more volatile ices such as CO and CO₂ can drive activity
//   (Womack, Sarid & Wierzchos 2017, PASP). Coma and tail sizes in the picture follow that rate (a sketch).
// The picture can be drawn to true scale or "squeezed" (each distance r drawn at √r), which keeps the
// angles and the order of things but lets the inner Solar System show. The orbit is drawn flat; Halley's
// is really tilted 162°, so it goes round the other way from the planets, as drawn here.
import { THREE, M, clamp, approach } from '../kit.js';
import {
  TAU, AU, COMETS, PLANETS, posAt, ellipsePts, vAU, eqTemp, iceBalance, activity, fracInside, board, panelBg, title, axes, dot, line, text,
  COL, HEX, layout, unlayout, slim, ribbon, makeSun, starfield, glowPoints, haze, syncSlider, yearDate, rng,
} from '../comet.js';

const H = COMETS.halley, T0 = 1986.11, Y0 = 1986, Y1 = 2062;
const VIEW = { pos: [-1.9, 9.6, 6.4], target: [-2.4, 0, 0.6] };
const SLIDER = 'Date on the orbit';
const mapR = (r, k) => (1 - k) * r * (5.9 / H.Q) + k * Math.sqrt(r);       // k = 1: squeezed, 0: true scale
const at = (yr) => posAt(H.a, H.e, (TAU * (yr - T0)) / H.T);
const zoneTxt = (r) => (r < 3 ? '<span class="ok">awake: water ice is turning to gas</span>' : r < 5.5 ? 'stirring: only the sunniest ice' : '<span class="no">asleep: frozen solid</span>');

export default {
  id: 'orbit',
  short: 'The orbit and the wake-up',
  title: 'The orbit and the wake-up',
  subtitle: 'For most of its 76-year lap Halley’s comet is a frozen lump in the dark. Near the Sun it wakes up.',
  view: VIEW,
  learn: `<p>A comet travels on a long, thin <b>ellipse</b>. Halley's comet goes from inside Venus's orbit (0.58 AU from the Sun) out beyond Neptune's (35 AU), once every <b>76 years</b>. Kepler's second law (see <a href="https://glassbox.how/keplerclear/" target="_blank" rel="noopener">KeplerClear</a>) says the line to the Sun sweeps equal areas in equal times, so the comet <b>races</b> past the Sun at over 50 km/s and <b>crawls</b> at under 1 km/s at the far end. The dots on the orbit are one year apart: see how they bunch up far away.</p>
    <p>Far out it is about 50 K (−220 °C), frozen solid and invisible. As it falls inwards, sunlight warms it. The readout uses the same sum as <a href="https://glassbox.how/planetclear/" target="_blank" rel="noopener">PlanetClear</a>'s frost line: a dark grain at 1 AU settles at about 278 K. Inside about <b>3 AU</b> the sunlit ice gets warm enough to <b>sublimate</b>, turning straight into gas. The gas streams off, carrying dust, and the coma and tails grow. The ice cannot warm much past about 200 K, because nearly all the extra sunlight goes into turning ice into gas, like a pot of water that stays at 100 °C while it boils.</p>
    <p>Comets are the leftovers of the <b>planetesimals</b> that built the planets (PlanetClear tells that story): bits that formed beyond the frost line, so they are full of ice. After the closest pass the comet heads out again, cools, and falls asleep for decades.</p>
    <p class="tip"><b>Try it:</b> slide the date from 1986 to 2061 and watch the distance, speed and temperature. Find where the ice wakes up and where it goes back to sleep. Switch to true scale to see how small the busy part of the orbit really is.</p>`,
  terms: [
    { t: 'Perihelion', d: 'The point of an orbit nearest the Sun. Halley’s was 9 February 1986, at 0.58 AU.' },
    { t: 'Aphelion', d: 'The point farthest from the Sun. Halley passed it in late 2023, about 35 AU out.' },
    { t: 'Equilibrium temperature', d: 'The temperature at which a body gives off as much heat as it soaks up from sunlight.' },
    { t: 'Sublimation', d: 'Ice turning straight into gas. In space there is too little pressure for liquid water.' },
    { t: 'Planetesimal', d: 'A kilometre-sized building block of planets. Comets are icy ones that were never used.' },
    { t: 'Volatile', d: 'A substance that turns to gas easily, such as water ice, carbon dioxide ice or carbon monoxide ice.' },
  ],
  defaults: { year: 1985.6, run: true, pace: 'slow', squeeze: true, chart: 'temp' },
  controls: [
    { key: 'year', type: 'range', label: SLIDER, min: Y0, max: Y1, step: 0.01, ends: ['1986', '2062'], fmt: (v) => yearDate(v) },
    { key: 'run', type: 'toggle', label: 'Let time run' },
    { key: 'pace', type: 'seg', label: 'Time', options: [{ v: 'slow', label: '1 month a second' }, { v: 'fast', label: '3 years a second' }] },
    { key: 'go', type: 'buttons', label: 'Jump to', items: [
      { label: '1985: coming in', act: (s) => Object.assign(s, { year: 1985.1, pace: 'slow', run: true }) },
      { label: 'Feb 1986: closest', act: (s) => Object.assign(s, { year: T0, pace: 'slow' }) },
      { label: '2023: farthest', act: (s) => Object.assign(s, { year: 2023.9, pace: 'fast' }) },
      { label: '2060: back again', act: (s) => Object.assign(s, { year: 2059.6, pace: 'slow', run: true }) },
    ] },
    { key: 'squeeze', type: 'toggle', label: 'Squeeze distances so the middle shows (√ scale)' },
    { key: 'chart', type: 'seg', label: 'Chart', options: [{ v: 'temp', label: 'Temperature' }, { v: 'ice', label: 'Ice lost' }, { v: 'time', label: 'Distance by year' }] },
  ],
  onChange(s, key) {
    if (key === 'year') s.run = false;
  },
  quiz: [
    { q: 'Where on its orbit does a comet move fastest?', options: ['Farthest from the Sun', 'Closest to the Sun', 'It always moves at the same speed', 'Halfway out'], answer: 1, why: 'Kepler’s second law: the line to the Sun sweeps equal areas in equal times, so close in the comet must race. Halley passes the Sun at about 55 km/s.' },
    { q: 'Roughly where does water ice on a comet start turning into gas?', options: ['Beyond Neptune', 'Inside about 3 AU from the Sun', 'Only when it touches the Sun', 'At the Kuiper belt'], answer: 1, why: 'Inside about 3 AU the sunlit ice warms to nearly 190 K and sublimates fast. Farther out it is too cold.' },
    { q: 'Why does the sunlit ice stay near 200 K even very close to the Sun?', options: ['The Sun is not very hot', 'Most of the extra sunlight is used up turning ice into gas', 'The coma is a mirror', 'Ice cannot get warm'], answer: 1, why: 'Sublimation soaks up energy, like boiling water that stays at 100 °C. The dark dusty crust can get much hotter.' },
  ],
  reel: [
    { ms: 5600, caption: 'A comet rides a long ellipse: Halley’s goes from inside Venus’s orbit to beyond Neptune’s every 76 years.', set: { run: true, pace: 'fast', squeeze: true, chart: 'time', year: 1995 }, view: { pos: [-1.9, 8.8, 5.6], target: [-2.5, 0, 0.4] }, spin: 0 },
    { ms: 5800, caption: 'Inside about 3 AU the sunlight turns its ice to gas, and the comet wakes up and grows its tails.', set: { run: false, squeeze: true, chart: 'temp' }, anim: { year: [2060.2, 2061.75] }, view: { pos: [0.4, 4.4, 3.2], target: [-0.3, 0, 0.1] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    stage.floor.visible = false;
    root.add(starfield(800, 300, 31));
    root.add(makeSun(0.09));
    const path = ribbon(361, HEX.orbit, 0.8, 0); root.add(path);
    const rings = ['earth', 'jupiter', 'saturn', 'uranus', 'neptune'].map((id) => {
      const p = PLANETS.find((q) => q.id === id), r = ribbon(129, p.col, 0.45, -0.002); root.add(r);
      return { p, r, l: stage.label(p.name, [0, 0, 0], root) };
    });
    const wake = ribbon(129, HEX.hot, 0.5, -0.003); root.add(wake);
    const lWake = stage.label('3 AU: water ice wakes up', [0, 0, 0], root, 'hot'); lWake.element.style.setProperty('--c', COL.hot);
    const ticks = glowPoints(80, 0.16, 0.95); root.add(ticks);
    const lTicks = stage.label('dots: one year apart', [0, 0, 0], root);
    // the comet
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.035, 12, 8), M.glow(0xffffff)); root.add(head);
    const coma = haze(0xd8f0ff, 0.2, 0.9); root.add(coma);
    const NT = 700, tails = glowPoints(NT, 0.07, 0.85); root.add(tails);
    const tr = rng(4), TR = Array.from({ length: NT }, () => [tr(), tr(), tr()]);
    const lCom = stage.label('', [0, 0, 0], root, 'hot'); lCom.element.style.setProperty('--c', COL.cool);
    const lNote = stage.label('drawn flat; distances squeezed', [0, 0, 0], root);

    const sim = { k: 1, key: '', r: 1, v: 0, ice: null, act: 0 };
    const temps = []; for (let i = 0; i <= 120; i++) { const r = 0.3 * Math.pow(40 / 0.3, i / 120); temps.push([r, eqTemp(r), iceBalance(r).T, iceBalance(r).cmDay]); }
    const tBoard = board(root, (g, w, h) => {
      panelBg(g, w, h); title(g, 'How warm the comet gets', 'models · each grid step on the distance axis is ×10');
      const { X, Y, x0, x1, y0, y1 } = axes(g, w, h, { logX: true, xMin: Math.log10(0.3), xMax: Math.log10(40), yMax: 560, xTicks: [1, 10], yTicks: [0, 100, 200, 300, 400, 500], xFmt: (v) => v + ' AU', yFmt: (v) => v + ' K', xLabel: 'distance from the Sun →' });
      g.fillStyle = 'rgba(255,181,71,.1)'; g.fillRect(x0, y1, X(3) - x0, y0 - y1);
      g.strokeStyle = 'rgba(142,240,255,.6)'; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(x0, Y(170)); g.lineTo(x1, Y(170)); g.stroke(); g.setLineDash([]);
      text(g, '170 K: frost line', x1 - 4, Y(170) - 8, COL.cool, '20px sans-serif', 'right');
      line(g, temps.map((t) => [t[0], t[1]]), X, Y, COL.hot, 4);
      line(g, temps.map((t) => [t[0], t[2]]), X, Y, COL.ice, 4);
      text(g, 'dark grain (PlanetClear)', X(0.32), Y(520), COL.hot, '21px sans-serif');
      text(g, 'sunlit ice: stuck near 200 K while it turns to gas', X(0.32), Y(232), COL.ice, '20px sans-serif');
      text(g, 'awake', X(0.9), y0 - 10, COL.hot, '20px sans-serif');
      const r = clamp(sim.r, 0.3, 40);
      dot(g, X(r), Y(eqTemp(r)), COL.hot, 9); dot(g, X(r), Y(iceBalance(r).T), COL.ice, 9);
    });
    const iBoard = board(root, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Ice turned to gas, per day', 'sunniest spot, model · both axes ×10 per step');
      const { X, Y, x0, y0, y1 } = axes(g, w, h, { logX: true, logY: true, xMin: Math.log10(0.3), xMax: Math.log10(40), yMin: -4, yMax: 2, xTicks: [1, 10], yTicks: [1e-4, 1e-2, 1, 100], xFmt: (v) => v + ' AU', yFmt: (v) => (v >= 1 ? v + ' cm' : v < 0.01 ? '1 µm' : '0.1 mm'), xLabel: 'distance from the Sun →' });
      g.fillStyle = 'rgba(255,181,71,.1)'; g.fillRect(x0, y1, X(3) - x0, y0 - y1);
      line(g, temps.filter((t) => t[3] > 1e-4).map((t) => [t[0], t[3]]), X, Y, COL.ice, 5);
      const r = clamp(sim.r, 0.3, 40), c = iceBalance(r).cmDay;
      if (c > 1e-4) dot(g, X(r), Y(c), COL.hot, 10); else text(g, 'off the chart: frozen', X(r), Y(2e-4), COL.hot, '20px sans-serif', 'center');
      text(g, 'a layer of ice this thick, each day', X(1.2), Y(30), COL.soft, '20px sans-serif');
    });
    const curve = []; for (let i = 0; i <= 300; i++) { const y = T0 + (i / 300) * H.T; curve.push([y, at(y).r]); }
    const yBoard = board(root, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Halley’s distance from the Sun', 'one lap by Kepler’s laws · shaded: awake (inside 3 AU)');
      const { X, Y, x0, x1 } = axes(g, w, h, { xMin: 1986, xMax: 2062, yMax: 40, xTicks: [1986, 2000, 2020, 2040, 2061], yTicks: [0, 10, 20, 30, 40], yFmt: (v) => v + ' AU' });
      for (const id of ['jupiter', 'saturn', 'uranus', 'neptune']) { const p = PLANETS.find((q) => q.id === id); g.strokeStyle = 'rgba(255,255,255,.3)'; g.setLineDash([6, 6]); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, Y(p.au)); g.lineTo(x1, Y(p.au)); g.stroke(); g.setLineDash([]); text(g, p.name, x1 - 6, Y(p.au) - 6, 'rgba(255,255,255,.6)', '19px sans-serif', 'right'); }
      g.fillStyle = 'rgba(255,181,71,.35)'; g.fillRect(x0, Y(3), x1 - x0, Y(0) - Y(3));
      line(g, curve, X, Y, COL.cool, 5);
      const yr = ((sim.yr - T0) % H.T + H.T) % H.T + T0;
      dot(g, X(clamp(yr, 1986, 2062)), Y(sim.r), COL.hot, 11);
    });

    let md = 'wide', tDraw = 0, out = null;
    const tmp = new THREE.Vector3();
    return {
      dispose() { unlayout(stage); },
      update(dt, s) {
        dt = Math.max(0, dt);
        stage.floor.visible = false;
        const B = s.chart === 'ice' ? iBoard : s.chart === 'time' ? yBoard : tBoard;
        [tBoard, iBoard, yBoard].forEach((b) => { b.mesh.visible = b === B; });
        md = layout(stage, B, [lTicks, lNote, ...rings.slice(1).map((r) => r.l)]);
        if (s.run) {
          s.year += dt * (s.pace === 'fast' ? 3 : 1 / 12);
          if (s.year > Y1) s.year = Y0;
          out = syncSlider(SLIDER, s.year, Y0, Y1); if (out) out.textContent = yearDate(s.year);
        }
        sim.k = approach(sim.k, s.squeeze ? 1 : 0, 4, dt);
        const k = sim.k, key = k.toFixed(4);
        if (key !== sim.key) {
          sim.key = key;
          const pts = ellipsePts(H.a, H.e, 360).map(([ex, ey]) => { const rr = Math.hypot(ex, ey), R = mapR(rr, k); return [(R * ex) / rr, (R * ey) / rr]; });
          path.set(pts, 0.035);
          rings.forEach(({ p, r, l }) => { const R = mapR(p.au, k), c = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * TAU; c.push([R * Math.cos(a), R * Math.sin(a)]); } r.set(c, 0.016); l.position.set(R * 0.42, 0, R * 0.91); });
          const R3 = mapR(3, k), c3 = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * TAU; c3.push([R3 * Math.cos(a), R3 * Math.sin(a)]); }
          wake.set(c3, 0.02); lWake.position.set(R3 * 0.75, 0, -R3 * 0.66);
          for (let y = 0; y < 76; y++) { const q = at(T0 + y), R = mapR(q.r, k); ticks.set(y, R * Math.cos(q.nu), 0.005, R * Math.sin(q.nu), 1, 1, 1); }
          ticks.done(76);
          const qA = at(T0 + 37), RA = mapR(qA.r, k); lTicks.position.set(RA * Math.cos(qA.nu) + 0.35, 0, RA * Math.sin(qA.nu) + 0.5);
          lNote.position.set(-mapR(35, k) * 0.2, 0, mapR(35, k) * 0.55);
        }
        sim.yr = s.year;
        const q = at(s.year), R = mapR(q.r, k);
        sim.r = q.r; sim.v = vAU(q.r, H.a);
        const x = R * Math.cos(q.nu), z = R * Math.sin(q.nu);
        head.position.set(x, 0, z);
        const act = activity(q.r); sim.act = act;
        coma.scale.setScalar(0.04 + 0.5 * act); coma.position.copy(head.position);
        // tails: ion straight away from the Sun, dust bent back against the motion
        const d = Math.hypot(x, z) || 1, ux = x / d, uz = z / d;
        const q2 = at(s.year + 0.01), R2 = mapR(q2.r, k), mx = R2 * Math.cos(q2.nu) - x, mz = R2 * Math.sin(q2.nu) - z, mL = Math.hypot(mx, mz) || 1;
        const L = 1.6 * act;
        let n = 0;
        if (act > 0.02) {
          for (let i = 0; i < NT; i++) {
            const [a, b, c] = TR[i], f = Math.pow(a, 1.3), ion = i % 3 === 0;
            if (ion) { const l = f * L * 1.25, j = (b - 0.5) * 0.04 * (1 + l * 2); tails.set(n++, x + ux * l - uz * j, 0, z + uz * l + ux * j, 0.25 * (1 - f), 0.5 * (1 - f), 1.1 * (1 - f)); }
            else { const l = f * L, bend = f * f * L * 0.45, j = (b - 0.5) * 0.12 * f * L; tails.set(n++, x + ux * l - (mx / mL) * bend + uz * j * (c - 0.5), 0, z + uz * l - (mz / mL) * bend - ux * j, 1.0 * (1 - f * 0.8), 0.8 * (1 - f * 0.8), 0.45 * (1 - f * 0.8)); }
          }
        }
        tails.done(n);
        lCom.position.set(x, 0.32, z);
        lCom.element.innerHTML = `<b>${yearDate(s.year)}</b> · ${q.r.toFixed(q.r < 10 ? 2 : 1)} AU`;
        tDraw += dt; if (tDraw > 0.12) { tDraw = 0; B.redraw(); }
        void tmp;
      },
      readout: (s) => {
        const r = sim.r, ib = iceBalance(r), big = `<div class="big">${yearDate(s.year)}: ${r.toFixed(r < 10 ? 2 : 1)} AU</div>`;
        const r1 = `<div class="row"><span>Speed, v² = GM(2/r − 1/a)</span><b>${(sim.v / 1000).toFixed(sim.v < 9950 ? 2 : 1)} km/s</b></div>`;
        const r2 = `<div class="row"><span>State</span><b>${zoneTxt(r)}</b></div>`;
        if (md === 'phone') return big + r1 + r2;
        return slim(`${big}${r1}
          <div class="row"><span>Dark grain (PlanetClear)</span><b>${Math.round(eqTemp(r))} K</b></div>
          <div class="row"><span>Sunlit ice</span><b>${Math.round(ib.T)} K</b></div>
          <div class="row"><span>Ice lost at the sunniest spot</span><b>${ib.cmDay >= 0.01 ? ib.cmDay.toFixed(ib.cmDay < 1 ? 2 : 1) + ' cm/day' : 'almost none'}</b></div>
          ${r2}
          <div class="row"><span>Awake (inside 3 AU)</span><b>${(fracInside(H, 3) * H.T * 12).toFixed(0)} months of ${H.T.toFixed(1)} years</b></div>
          <small>Orbit: JPL (a = 17.93 AU, e = 0.968). Ice: energy-balance model (Cowan & A’Hearn 1979).</small>`);
      },
    };
  },
};

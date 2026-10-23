// Chapter 5: water, life and danger.
// 1. Heavy water as a fingerprint. Two samples of 6,400 water molecules each, one with the Earth's ocean
//    ratio of deuterium to hydrogen, one with a comet's. Each H₂O molecule is a blue dot; the heavy ones,
//    HDO, are gold. A molecule has two hydrogens, so HDO ÷ H₂O ≈ 2 × D/H; each sample shows the expected
//    number, rounded.
//    D/H values: Earth's ocean water 1.5576 × 10⁻⁴ (the VSMOW standard); 67P (5.3 ± 0.7) × 10⁻⁴ from Rosetta's
//    ROSINA (Altwegg et al. 2015, Science; ESA: "more than three times greater than for Earth's oceans");
//    103P/Hartley 2 (1.61 ± 0.24) × 10⁻⁴ from ESA's Herschel (Hartogh et al. 2011, Nature: "ocean-like");
//    46P/Wirtanen (1.61 ± 0.65) × 10⁻⁴ from SOFIA (Lis et al. 2019, A&A). A NASA-led reanalysis of Rosetta's
//    data (Mandt et al. 2024, Science Advances) found that dust in the coma had raised the measured value
//    and that 67P's water may be closer to Earth-like after all. The question is open.
// 2. DART: on 26 September 2022 NASA's DART spacecraft hit Dimorphos, the small moon of the asteroid
//    Didymos, and shortened its 11 h 55 min orbit by 32 minutes (NASA). For a small push along a circular
//    orbit, T ∝ a^1.5 and v ∝ a^−½ give ΔT ÷ T = 3 Δv ÷ v, so the computed change in Dimorphos's speed is
//    32 ÷ (3 × 715) ≈ 1.5%. Sizes and distances in the picture are a sketch. It was an asteroid, not a comet.
import { THREE, M, clamp, approach } from '../kit.js';
import {
  TAU, board, panelBg, title, axes, text, COL, HEX, layout, unlayout, slim, starfield, glowPoints, haze, ball, rng, nucleusShape, lobeMesh, ribbon, makeSun,
} from '../comet.js';

const DH = {
  earth: { name: 'Earth’s oceans', v: 1.5576, err: 0, col: '#4f8dff', src: 'VSMOW standard' },
  cg67p: { name: '67P (Rosetta, 2014)', v: 5.3, err: 0.7, col: '#ffb547', src: 'Altwegg et al. 2015' },
  hartley: { name: 'Hartley 2 (Herschel, 2011)', v: 1.61, err: 0.24, col: '#7be08c', src: 'Hartogh et al. 2011' },
  wirtanen: { name: '46P/Wirtanen (SOFIA, 2018–19)', v: 1.61, err: 0.65, col: '#8ef0ff', src: 'Lis et al. 2019' },
};
const NMOL = 6400, T_BEFORE = 11 * 60 + 55, T_AFTER = 11 * 60 + 23;
const VIEWS = { water: { pos: [0.4, 2.6, 11.5], target: [0.4, -0.3, 0] }, dart: { pos: [40.6, 2.8, 7.2], target: [40.2, -0.3, 0] } };

export default {
  id: 'water',
  short: 'Water, life and danger',
  title: 'Water, life and danger',
  subtitle: 'Did comets bring the Earth its oceans and some of life’s ingredients? And could one hit us?',
  view: VIEWS.water,
  learn: `<p>The young Earth was hot, and much of its water may have arrived later, carried by icy bodies from farther out. Were they comets? Scientists test this with a fingerprint: <b>heavy water</b>. A few water molecules have a <b>deuterium</b> atom (hydrogen with an extra neutron) in place of an ordinary hydrogen. The ratio of deuterium to hydrogen, <b>D/H</b>, depends on where and how cold the ice formed.</p>
    <p>In 2014 ESA's <b>Rosetta</b> measured comet 67P's water and found D/H <b>more than three times</b> that of Earth's oceans. ESA said this "fuels the debate" on where our oceans came from: its result suggested comets like 67P were not the main source. But comets Hartley 2 and 46P/Wirtanen have ocean-like water, and in 2024 a NASA-led team re-examined Rosetta's data and argued that dust had made 67P's value read high. The honest answer today: comets probably brought <b>some</b> of the Earth's water; many scientists think water-rich asteroids brought more. The debate goes on. Whatever its origin, that water now cycles through rain, rivers and the snow and glaciers of high ranges like the Himalaya (see <a href="https://glassbox.how/mountainclear/" target="_blank" rel="noopener">MountainClear</a>).</p>
    <p>Comets also carry <b>organic molecules</b>. NASA's <b>Stardust</b> brought dust from comet Wild 2 back to Earth in 2006, and scientists found the amino acid <b>glycine</b> in it. Rosetta found glycine and <b>phosphorus</b> round 67P (2016). These are building blocks, not life.</p>
    <p>Could a comet or an asteroid hit the Earth? Small bits hit every day as shooting stars. Big impacts are very rare. NASA's <b>Planetary Defense Coordination Office</b> tracks asteroids and comets that could be a hazard, and says that no known asteroid larger than 140 metres has a significant chance to hit Earth for the next 100 years. In 2022 NASA tested a defence: its <b>DART</b> spacecraft rammed <b>Dimorphos</b>, a small moon of the asteroid Didymos, and shortened its orbit by 32 minutes. It was an asteroid, not a comet, but it showed that a well-aimed push works.</p>
    <p class="tip"><b>Try it:</b> compare the two water samples and count the gold heavy-water molecules. Then switch to DART and watch the moon's orbit shrink.</p>`,
  terms: [
    { t: 'Deuterium', d: 'Heavy hydrogen: a hydrogen atom with a neutron as well as a proton in its centre.' },
    { t: 'D/H ratio', d: 'The number of deuterium atoms for every ordinary hydrogen atom. A fingerprint of where water formed.' },
    { t: 'Heavy water (HDO)', d: 'Water with one deuterium in place of a hydrogen. About 1 molecule in 3,200 in the oceans.' },
    { t: 'Glycine', d: 'The simplest amino acid, one of the building blocks of proteins. Found in comet dust.' },
    { t: 'Planetary defence', d: 'Finding and tracking asteroids and comets that could hit the Earth, and testing ways to push one aside.' },
    { t: 'DART', d: 'NASA’s Double Asteroid Redirection Test, which hit the asteroid moon Dimorphos on 26 September 2022.' },
  ],
  defaults: { show: 'water', comet: 'cg67p', dart: 0, run: true },
  controls: [
    { key: 'show', type: 'seg', label: 'Show', options: [{ v: 'water', label: 'Whose water?' }, { v: 'dart', label: 'DART: pushing an asteroid' }] },
    { key: 'comet', type: 'seg', label: 'Comet sample', options: [{ v: 'cg67p', label: '67P' }, { v: 'hartley', label: 'Hartley 2' }, { v: 'wirtanen', label: '46P/Wirtanen' }] },
    { key: 'dart', type: 'range', label: 'DART: time', min: 0, max: 1, step: 0.005, ends: ['before', 'after'], fmt: (v) => (v < 0.4 ? 'before the hit' : v < 0.5 ? '26 September 2022' : 'after: a shorter orbit') },
    { key: 'run', type: 'toggle', label: 'Let time run' },
  ],
  onChange(s, key) {
    if (key === 'comet') s.show = 'water';
    if (key === 'dart') { s.show = 'dart'; s.run = false; }
  },
  quiz: [
    { q: 'What did Rosetta find about the water of comet 67P?', options: ['It was exactly like Earth’s oceans', 'It had more than three times as much deuterium (heavy hydrogen) as Earth’s oceans', 'It had no hydrogen', 'It was liquid'], answer: 1, why: 'Rosetta measured D/H more than three times the ocean value, so comets like 67P are unlikely to be the main source of Earth’s water. A 2024 reanalysis suggests dust may have raised the reading.' },
    { q: 'Which life-related molecule has been found in comet dust?', options: ['DNA', 'Glycine, an amino acid', 'Chlorophyll', 'Sugar crystals'], answer: 1, why: 'NASA’s Stardust samples from comet Wild 2 and Rosetta’s measurements at 67P both found glycine, a building block of proteins.' },
    { q: 'What did NASA’s DART mission hit in 2022?', options: ['A comet’s nucleus', 'Dimorphos, a small moon of the asteroid Didymos', 'The Moon', 'Halley’s comet'], answer: 1, why: 'DART hit the asteroid moon Dimorphos and shortened its orbit by 32 minutes. It was a test on an asteroid, not a comet.' },
  ],
  reel: [
    { ms: 5600, caption: 'Rosetta found comet 67P’s water has over three times the heavy hydrogen of Earth’s oceans.', set: { show: 'water', comet: 'cg67p', run: true }, spin: 0.15 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    stage.floor.visible = false;
    root.add(starfield(800, 300, 71));
    const sim = { comet: 'cg67p', nE: 0, nC: 0 };

    // ================================================================ water samples
    const gW = new THREE.Group(); root.add(gW);
    const mk = (seed) => { const g = glowPoints(NMOL, 0.07, 0.75), r = rng(seed), P = []; for (let i = 0; i < NMOL; i++) { const u = r() * 2 - 1, a = r() * TAU, R = 1.3 * Math.cbrt(r()), sq = Math.sqrt(1 - u * u); P.push([R * sq * Math.cos(a), R * u, R * sq * Math.sin(a), r()]); } return { g, P }; };
    const sE = mk(3), sC = mk(9); sE.g.position.set(-2.2, 0, 0); sC.g.position.set(2.6, 0, 0); gW.add(sE.g, sC.g);
    const heavyE = glowPoints(40, 0.3, 1.0), heavyC = glowPoints(40, 0.3, 1.0); heavyE.position.copy(sE.g.position); heavyC.position.copy(sC.g.position); gW.add(heavyE, heavyC);
    const earth = ball(0.55, 0x2f6fd8); earth.position.set(-2.2, -2.35, 0); gW.add(earth);
    const nucl = new THREE.Group(); nucl.scale.setScalar(0.22); nucl.position.set(2.6, -2.3, 0); gW.add(nucl);
    const nMat = new THREE.MeshStandardMaterial({ color: 0x4a4440, roughness: 0.95 }); nucleusShape().forEach((L) => nucl.add(lobeMesh(L, nMat)));
    const lab = (t, p, parent = gW, cls = '', c = null) => { const l = stage.label(t, p, parent, cls); if (c) l.element.style.setProperty('--c', c); return l; };
    const lE = lab('', [-2.2, 1.75, 0], gW, 'hot', '#6f9dff'), lC = lab('', [2.6, 1.75, 0], gW, 'hot', COL.hot);
    const lKey = lab('blue: H₂O · gold: heavy water, HDO', [0.2, -1.45, 0]);
    let key = '';
    function fill(sample, heavy, dh, seed) {
      const p = (2 * dh * 1e-4), r = rng(seed); let h = 0;
      sample.P.forEach(([x, y, z, q], i) => { sample.g.set(i, x, y, z, 0.25, 0.5, 0.95); });
      sample.g.done(NMOL);
      const want = Math.round(NMOL * p);
      sample.P.forEach(([x, y, z]) => { if (h < want) heavy.set(h++, x, y, z, 1.0, 0.8, 0.25); });
      heavy.done(h); void r;
      return h;
    }
    const dBoard = board(stage.root, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Heavy hydrogen in water: D/H', 'deuterium atoms per 10,000 hydrogen atoms');
      const rows = ['earth', 'cg67p', 'hartley', 'wirtanen'], x0 = 330, x1 = w - 40, max = 7;
      const X = (v) => x0 + (v / max) * (x1 - x0);
      rows.forEach((k, i) => {
        const d = DH[k], y = 130 + i * 62, on = k === 'earth' || k === sim.comet;
        text(g, d.name, 22, y + 26, on ? '#e8eef8' : 'rgba(255,255,255,.6)', '21px sans-serif');
        g.fillStyle = d.col; g.globalAlpha = on ? 1 : 0.45; g.fillRect(x0, y + 6, X(d.v) - x0, 30); g.globalAlpha = 1;
        if (d.err) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(d.v - d.err), y + 21); g.lineTo(X(d.v + d.err), y + 21); g.stroke(); }
        text(g, d.v.toFixed(2), X(d.v + d.err) + 10, y + 30, '#e8eef8', 'bold 21px sans-serif');
      });
      g.strokeStyle = 'rgba(79,141,255,.7)'; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(X(1.5576), 118); g.lineTo(X(1.5576), h - 22); g.stroke(); g.setLineDash([]);
      text(g, 'a 2024 reanalysis says 67P’s value may be too high', 22, h - 18, COL.soft, '19px sans-serif');
    });

    // ================================================================ DART
    const gD = new THREE.Group(); gD.position.x = 40; root.add(gD);
    const sunD = makeSun(0.6); sunD.position.set(-30, 6, -40); gD.add(sunD);
    const lightD = new THREE.DirectionalLight(0xffffff, 2.5); lightD.position.set(-30, 6, -40); gD.add(lightD);
    const rock = (R, seed) => { const geo = new THREE.IcosahedronGeometry(R, 4), p = geo.attributes.position, rr = rng(seed), v = new THREE.Vector3(); const bumps = Array.from({ length: 8 }, () => [rr() * 2 - 1, rr() * 2 - 1, rr() * 2 - 1, rr() * 0.12]); for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).normalize(); let d = 1; bumps.forEach(([a, b, c, k]) => { d += k * Math.max(0, v.x * a + v.y * b + v.z * c); }); v.multiplyScalar(R * d); p.setXYZ(i, v.x, v.y, v.z); } geo.computeVertexNormals(); return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: 0x6d6258, roughness: 0.95 })); };
    const didy = rock(0.78, 4); gD.add(didy);
    const dimo = rock(0.16, 6); gD.add(dimo);
    const dOrbit = ribbon(129, 0xffffff, 0.35, 0), dOrbit2 = ribbon(129, HEX.hot, 0.8, 0); gD.add(dOrbit, dOrbit2);
    const ringPts = (R) => { const p = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * TAU; p.push([R * Math.cos(a), R * Math.sin(a)]); } return p; };
    const R0 = 2.4, R1 = R0 * Math.pow(T_AFTER / T_BEFORE, 2 / 3);
    dOrbit.set(ringPts(R0), 0.025); dOrbit2.set(ringPts(R1), 0.03);
    const craft = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.06), M.glow(0xffffff)); gD.add(craft);
    const NP = 400, plume = glowPoints(NP, 0.06, 0.9); gD.add(plume);
    const pr = rng(8), PR = Array.from({ length: NP }, () => [pr() - 0.5, pr() - 0.5, pr() - 0.5, pr()]);
    const lDi = lab('Didymos (asteroid)', [0, 1.05, 0], gD), lDm = lab('Dimorphos, its moon', [0, 0, 0], gD, 'hot', COL.hot);
    const lO1 = lab('before: 11 h 55 min a lap', [-R0 * 0.75, 0, R0 * 0.75], gD), lO2 = lab('after: 11 h 23 min', [R1 * 0.5, 0, R1 * 0.95], gD, 'hot', COL.hot);
    const lNote = lab('not to scale: the change is exaggerated', [0, -1.2, 2.6], gD);

    let show = '', md = 'wide', ang = 0;
    return {
      dispose() { unlayout(stage); },
      update(dt, s, time) {
        dt = Math.max(0, dt);
        stage.floor.visible = false;
        if (s.show !== show) { show = s.show; gW.visible = show === 'water'; gD.visible = show === 'dart'; stage.setView(VIEWS[show].pos, VIEWS[show].target, 1.0); }
        dBoard.mesh.visible = show === 'water';
        md = layout(stage, show === 'water' ? dBoard : null, [lKey, lNote, lO1]);
        sim.comet = s.comet;
        if (show === 'water') {
          if (key !== s.comet) { key = s.comet; sim.nE = fill(sE, heavyE, DH.earth.v, 1); sim.nC = fill(sC, heavyC, DH[s.comet].v, 2); dBoard.redraw(); }
          if (s.run) { sE.g.rotation.y += dt * 0.15; sC.g.rotation.y += dt * 0.15; }
          heavyE.rotation.y = sE.g.rotation.y; heavyC.rotation.y = sC.g.rotation.y;
          earth.rotation.y += dt * 0.2; nucl.rotation.y += dt * 0.3;
          const ph = md === 'phone';
          lE.element.textContent = ph ? `Earth: ${sim.nE} heavy` : `Earth’s oceans: ${sim.nE} heavy in ${NMOL.toLocaleString('en')}`;
          lC.element.textContent = ph ? `${DH[s.comet].name.split(' (')[0]}: ${sim.nC} heavy` : `${DH[s.comet].name.split(' (')[0]}: ${sim.nC} heavy in ${NMOL.toLocaleString('en')}`;
        }
        if (show === 'dart') {
          if (s.run) { s.dart += dt / 16; if (s.dart > 1) s.dart = 0; }
          const k = s.dart, hit = 0.45;
          const T = k < hit ? T_BEFORE : T_AFTER, R = k < hit ? R0 : R1;
          ang += dt * (TAU / (T / 60)) * 0.9;           // shown about 800 times faster than real
          if (Math.abs(k - hit) < 0.06) ang = Math.PI * 0.5 + (k - hit) * 3;   // line up for the hit
          dimo.position.set(R * Math.cos(ang), 0, -R * Math.sin(ang));
          dOrbit2.visible = lO2.visible = k >= hit;
          // the craft flies in from the right before the hit
          const f = clamp(k / hit, 0, 1);
          craft.visible = k < hit;
          const tx = dimo.position.x, tz = dimo.position.z;
          craft.position.set(tx + (1 - f) * 5, 0.05 + (1 - f) * 0.6, tz + (1 - f) * 3);
          let n = 0;
          if (k >= hit && k < hit + 0.35) { const g2 = (k - hit) / 0.35; for (let i = 0; i < NP; i++) { const [a, b, c, d] = PR[i], L = g2 * (0.5 + d * 1.6); plume.set(n++, tx + 0.3 * L + a * L * 0.7, b * L * 0.6, tz + 0.2 * L + c * L * 0.6, 0.9 * (1 - g2), 0.85 * (1 - g2), 0.75 * (1 - g2)); } }
          plume.done(n);
          lDm.position.set(dimo.position.x, 0.35, dimo.position.z);
          didy.rotation.y += dt * 0.5;
        }
      },
      readout: (s) => {
        if (s.show === 'dart') {
          const dvv = (T_BEFORE - T_AFTER) / (3 * T_BEFORE);
          const big = '<div class="big">DART: 32 minutes shorter</div>';
          const r1 = '<div class="row"><span>Dimorphos’s lap, before → after</span><b>11 h 55 min → 11 h 23 min</b></div>';
          const r2 = `<div class="row"><span>Speed change, ΔT ÷ 3T</span><b>${(dvv * 100).toFixed(1)}% of its speed</b></div>`;
          if (md === 'phone') return big + r1 + r2;
          return slim(`${big}${r1}${r2}
            <div class="row"><span>Hit</span><b>26 September 2022 (NASA)</b></div>
            <div class="row"><span>Target</span><b>an asteroid moon, not a comet</b></div>
            <small>NASA: “no known asteroid larger than 140 meters in size has a significant chance to hit Earth for the next 100 years.” ESA’s Hera is on its way to study the crater.</small>`);
        }
        const c = DH[s.comet], ratio = c.v / DH.earth.v;
        const big = `<div class="big">${c.name.split(' (')[0]}: ${ratio.toFixed(1)} × Earth’s D/H</div>`;
        const r1 = `<div class="row"><span>D per 10,000 H, Earth</span><b>${DH.earth.v.toFixed(2)}</b></div>`;
        const r2 = `<div class="row"><span>D per 10,000 H, comet</span><b>${c.v.toFixed(2)} ± ${c.err.toFixed(2)}</b></div>`;
        if (md === 'phone') return big + r1 + r2;
        return slim(`${big}${r1}${r2}
          <div class="row"><span>Heavy water in the oceans</span><b>1 molecule in ${Math.round(1 / (2 * DH.earth.v * 1e-4)).toLocaleString('en')}</b></div>
          <div class="row"><span>Measured by</span><b>${c.src}</b></div>
          <small>Each sample of ${NMOL.toLocaleString('en')} molecules shows the expected number of HDO, 2 × D/H × ${NMOL.toLocaleString('en')}, rounded.</small>`);
      },
    };
  },
};

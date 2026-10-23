// Chapter 6: seeing a comet, and naming one.
// - Magnitude: each step of 1 is a brightness ratio of 100^(1/5) = 2.512 (Pogson's rule, 1856), so 5 steps
//   are exactly ×100. Smaller numbers are brighter. Reference values: Sun −26.7, full Moon −12.7, Venus at
//   its brightest about −4.6; comet peaks: McNaught (2007) −5.5, Tsuchinshan–ATLAS (October 2024) −4.9 when
//   sunlight scattered forward towards us, Hale–Bopp (1997) about −1 to −1.8, NEOWISE (2020) about +0.5 to
//   +1, Lemmon (C/2025 A6, October 2025) about +3.5.
// - Faintest star you can see ("limiting magnitude"), roughly, by sky (Bortle's dark-sky scale, Sky &
//   Telescope): about 7 or more at the darkest sites, about 6.5 in the countryside, about 5.5 in a
//   suburb, about 4 or brighter in a city. Hanle in Ladakh has been India's first Dark Sky Reserve since
//   December 2022.
// - Binoculars: 50 mm lenses collect (50 ÷ 7)² ≈ 51 times the light of a 7 mm dark-adapted pupil, about
//   2.5 log₁₀ 51 = 4.3 magnitudes. A comet is a fuzzy patch, not a point, so it needs about a magnitude
//   more than a star to be seen. This sky is a model.
// - Names (IAU / Minor Planet Center): P/ periodic (under 200 years, or seen at more than one perihelion),
//   C/ not periodic, D/ gone or broken up, X/ no reliable orbit, A/ turned out to be an asteroid, I/
//   interstellar (new in 2017 for 'Oumuamua). Then the year, a letter for the half-month it was found
//   (A = 1–15 January, B = 16–31 January … Y = 16–31 December, skipping I) and a number for the order.
import { THREE, M, clamp, approach } from '../kit.js';
import { TAU, board, panelBg, title, text, COL, HEX, layout, unlayout, slim, glowPoints, softDot, rng, haze } from '../comet.js';

const SKIES = {
  dark: { label: 'Very dark (Hanle)', lim: 7.0, glow: 0.0 },
  rural: { label: 'Village', lim: 6.5, glow: 0.12 },
  suburb: { label: 'Suburb', lim: 5.5, glow: 0.35 },
  city: { label: 'City', lim: 4.0, glow: 0.7 },
};
const NAMES = {
  halebopp: { d: 'C/1995 O1', name: 'Hale–Bopp', note: 'found 23 July 1995 by Alan Hale and Thomas Bopp' },
  halley: { d: '1P/Halley', name: 'Halley', note: 'the first periodic comet to be recognised, so it is number 1' },
  neowise: { d: 'C/2020 F3', name: 'NEOWISE', note: 'found on 27 March 2020 by NASA’s NEOWISE space telescope' },
  tsa: { d: 'C/2023 A3', name: 'Tsuchinshan–ATLAS', note: 'seen with the naked eye from India in October 2024' },
  sl9: { d: 'D/1993 F2', name: 'Shoemaker–Levy 9', note: 'D/ because it no longer exists: it hit Jupiter in 1994' },
  atlas3i: { d: '3I/ATLAS', name: 'ATLAS', note: 'the third known interstellar object, found 1 July 2025 from Chile' },
};
const PREFIX = { P: 'P/: periodic, back within 200 years', C: 'C/: not periodic (a long-period comet)', D: 'D/: defunct, broken up or lost', I: 'I/: interstellar, from another star', X: 'X/: no reliable orbit', A: 'A/: really an asteroid' };
const HALF = 'ABCDEFGHJKLMNOPQRSTUVWXY';
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function decode(d) {
  if (/^\d+P\//.test(d)) { const n = d.match(/^(\d+)P/)[1]; return [PREFIX.P, `the ${n === '1' ? '1st' : n + 'th'} periodic comet to be numbered`]; }
  if (/^\d+I\//.test(d)) { const n = +d.match(/^(\d+)I/)[1]; return [PREFIX.I, `the ${['', '1st', '2nd', '3rd'][n] || n + 'th'} interstellar object found`]; }
  const m = d.match(/^([CDPXA])\/(\d{4}) ([A-Z])(\d+)/); if (!m) return ['', ''];
  const k = HALF.indexOf(m[3]), mo = MONTHS[Math.floor(k / 2)], half = k % 2 ? `16–${[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Math.floor(k / 2)] === 28 ? '28/29' : [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][Math.floor(k / 2)]} ${mo}` : `1–15 ${mo}`;
  return [PREFIX[m[1]], `${m[2]}, letter ${m[3]} = ${half}, number ${m[4]} = the ${['', '1st', '2nd', '3rd'][+m[4]] || m[4] + 'th'} found then`];
}
const REF = [
  { m: -12.7, t: 'full Moon', row: 0 }, { m: -5.5, t: 'McNaught 2007', row: 0 }, { m: -4.6, t: 'Venus', row: 2 }, { m: -1.4, t: 'Sirius', row: 0 },
  { m: -1, t: 'Hale–Bopp 1997', row: 1 }, { m: 1, t: 'NEOWISE 2020', row: 2 }, { m: 3.5, t: 'Lemmon 2025', row: 0 },
];
const VIEW = { pos: [0, 1.6, 9], target: [0, 4.2, -20] };

export default {
  id: 'seeing',
  short: 'Seeing and naming',
  title: 'Seeing a comet, and naming one',
  subtitle: 'How bright is bright? Why a dark sky and a pair of binoculars matter, and what C/1995 O1 means.',
  view: VIEW,
  learn: `<p>A bright comet hangs low in the twilight, its tail pointing up and away from the Sun that has just set. Most comets are much fainter. Astronomers measure brightness in <b>magnitudes</b>: the smaller the number, the brighter, and every 5 steps is <b>100 times</b> brighter. The faintest stars a sharp eye can see under a truly dark sky are about magnitude 6 to 7. City lights brighten the sky until only magnitude 3 or 4 shows (see <a href="https://glassbox.how/galaxyclear/" target="_blank" rel="noopener">GalaxyClear</a> for light pollution and the Milky Way). India's first <b>Dark Sky Reserve</b> is at Hanle in Ladakh.</p>
    <p>A comet is a soft, fuzzy patch, so it is harder to spot than a star of the same total brightness. <b>Binoculars</b> help a lot: their big lenses collect about 50 times more light than your eye, about 4 magnitudes. A naked-eye comet comes along every year or two; a really bright "great comet" perhaps once a decade, and nobody can predict them far ahead. Recent ones were NEOWISE (2020), Tsuchinshan–ATLAS (2024), seen widely from India, and Lemmon (2025).</p>
    <p>For thousands of years comets were seen as <b>omens</b>, in Chinese, Indian, Babylonian and European records. The Sanskrit word <b>dhūmaketu</b> means a smoky banner, and Varāhamihira's <i>Bṛhat Saṃhitā</i> (6th century) has a whole chapter on them. The Mughal emperor Jahangir described two comets in November 1618 in his memoirs. Those careful records still help astronomers trace old orbits.</p>
    <p>Today the IAU names a comet after its discoverers (up to three) and gives it a code: <b>C/1995 O1</b> means a non-periodic comet, the first found in the second half of July 1995. That is Hale–Bopp.</p>
    <p class="tip"><b>Try it:</b> make the comet fainter and the sky brighter until it vanishes, then pick up the binoculars. Decode the names.</p>`,
  terms: [
    { t: 'Magnitude', d: 'A brightness scale where smaller is brighter; 5 steps is a factor of 100.' },
    { t: 'Limiting magnitude', d: 'The faintest star you can see from a place. Dark skies reach about 7, cities about 4 or less.' },
    { t: 'Light pollution', d: 'Light from streets and buildings scattered by the air, which brightens the night sky and hides faint things.' },
    { t: 'Great comet', d: 'An unusually bright comet that many people notice without trying. Roughly once a decade.' },
    { t: 'Designation', d: 'A comet’s official code, such as C/1995 O1: type, year, half-month letter and number.' },
    { t: 'Dhūmaketu', d: 'Sanskrit for comet: a “smoke banner”.' },
  ],
  defaults: { mag: 1, sky: 'rural', bino: false, name: 'halebopp' },
  controls: [
    { key: 'mag', type: 'range', label: 'Comet’s brightness (magnitude)', min: -5, max: 10, step: 0.1, ends: ['−5: a great comet', '10: faint'], fmt: (v) => v.toFixed(1) },
    { key: 'sky', type: 'seg', label: 'Sky', options: Object.entries(SKIES).map(([v, o]) => ({ v, label: o.label })) },
    { key: 'bino', type: 'toggle', label: 'Use 10 × 50 binoculars' },
    { key: 'go', type: 'buttons', label: 'Try these', items: [
      { label: 'Hale–Bopp 1997 (−1)', act: (s) => Object.assign(s, { mag: -1, name: 'halebopp' }) },
      { label: 'NEOWISE 2020 (+1)', act: (s) => Object.assign(s, { mag: 1, name: 'neowise' }) },
      { label: 'A typical comet (+8)', act: (s) => Object.assign(s, { mag: 8 }) },
    ] },
    { key: 'name', type: 'seg', label: 'Decode a name', options: Object.entries(NAMES).map(([v, o]) => ({ v, label: o.d })) },
  ],
  quiz: [
    { q: 'A comet is magnitude 1 and a star is magnitude 6. Which is brighter, and by how much?', options: ['The star, 5 times', 'The comet, 100 times', 'The comet, 5 times', 'They are the same'], answer: 1, why: 'Smaller magnitude is brighter, and 5 steps is exactly a factor of 100.' },
    { q: 'Why do binoculars show comets you cannot see by eye?', options: ['They magnify the tail only', 'Their big lenses collect much more light, about 4 magnitudes’ worth', 'They block the Moon', 'They warm the comet'], answer: 1, why: 'A 50 mm lens collects about (50 ÷ 7)² ≈ 51 times the light of your pupil: about 4.3 magnitudes.' },
    { q: 'What does the C/ in C/1995 O1 mean?', options: ['Comet number C', 'A non-periodic comet', 'It was found in China', 'Crashed'], answer: 1, why: 'C/ marks a comet that will not return within 200 years. P/ is periodic, D/ is defunct and I/ is interstellar.' },
  ],
  reel: [
    { ms: 5200, caption: 'A bright comet hangs in the twilight, tail pointing away from the set Sun. City lights can hide it.', set: { mag: 0, sky: 'rural', bino: false }, anim: { mag: [-1, 3] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    stage.floor.visible = false; stage.lights.visible = false;
    // sky dome with a twilight glow low in the west (−z, where we look)
    const skyC = document.createElement('canvas'); skyC.width = 16; skyC.height = 256;
    const skyT = new THREE.CanvasTexture(skyC); skyT.colorSpace = THREE.SRGBColorSpace;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(60, 48, 24), new THREE.MeshBasicMaterial({ map: skyT, side: THREE.BackSide, depthWrite: false, toneMapped: false })); root.add(dome);
    const paintSky = (glow) => {
      const g = skyC.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 256);
      const mix = (a, b) => a.map((v, i) => Math.round(v + (b[i] - v) * glow));
      const top = mix([6, 8, 18], [40, 34, 40]), mid = mix([14, 22, 48], [96, 70, 56]), hor = mix([60, 52, 80], [170, 120, 80]);
      gr.addColorStop(0, `rgb(${top})`); gr.addColorStop(0.42, `rgb(${mid})`); gr.addColorStop(0.5, `rgb(${hor})`); gr.addColorStop(1, `rgb(${top})`);
      g.fillStyle = gr; g.fillRect(0, 0, 16, 256); skyT.needsUpdate = true;
    };
    // stars with a realistic spread of magnitudes: the number brighter than m grows about ×3 per magnitude
    const r = rng(5), NS = 5000, stars = glowPoints(NS, 0.32, 1.0); root.add(stars);
    const SM = Array.from({ length: NS }, () => { const m = -1 + Math.log(1 + r() * 60000) / Math.log(3.1) * 1.0, az = (r() - 0.5) * 2.4, alt = 0.04 + Math.acos(1 - r()) * 0.95; return [m, az, alt]; });
    // ground: dark hills
    const hills = new THREE.Mesh(new THREE.CylinderGeometry(50, 50, 6, 96, 1, true), new THREE.MeshBasicMaterial({ color: 0x05060a, side: THREE.BackSide }));
    const hp = hills.geometry.attributes.position; for (let i = 0; i < hp.count; i++) { const y = hp.getY(i); if (y > 0) { const a = Math.atan2(hp.getZ(i), hp.getX(i)); hp.setY(i, 3 + 1.2 * Math.sin(a * 7) + 0.8 * Math.sin(a * 17 + 1)); } }
    hills.position.y = -3.6; root.add(hills);
    const floor = new THREE.Mesh(new THREE.CircleGeometry(50, 64), new THREE.MeshBasicMaterial({ color: 0x040509 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.6; root.add(floor);
    // the comet: head and a curved tail, pointing up and a little to the left, away from the set Sun
    const cg = new THREE.Group(); cg.position.set(4, 5.5, -38); root.add(cg);
    const head = haze(0xe8f6ff, 0.7, 1); cg.add(head);
    const tailC = document.createElement('canvas'); tailC.width = 64; tailC.height = 256;
    { const g = tailC.getContext('2d'), gr = g.createLinearGradient(0, 256, 0, 0); gr.addColorStop(0, 'rgba(255,240,210,1)'); gr.addColorStop(1, 'rgba(255,220,170,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(26, 256); g.quadraticCurveTo(0, 120, 4, 0); g.lineTo(60, 0); g.quadraticCurveTo(48, 120, 38, 256); g.fill(); }
    const tailT = new THREE.CanvasTexture(tailC); tailT.colorSpace = THREE.SRGBColorSpace;
    const tail = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 12), new THREE.MeshBasicMaterial({ map: tailT, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    tail.position.set(-1.1, 5.9, 0); tail.rotation.z = 0.25; cg.add(tail);
    const ionT = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 13), new THREE.MeshBasicMaterial({ color: 0x6fb4ff, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }));
    ionT.position.set(-0.5, 6.4, 0.1); ionT.rotation.z = 0.08; cg.add(ionT);
    const ring = new THREE.Mesh(new THREE.RingGeometry(4.6, 4.75, 64), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); ring.position.set(-0.6, 2.4, 0.2); cg.add(ring);
    const lCom = stage.label('', [3, 0.2, 0], cg, 'hot'); lCom.element.style.setProperty('--c', COL.dust);
    const lSun = stage.label('the Sun has just set here', [-10, 0.6, -40], root);
    const lRing = stage.label('binocular view, about 5° wide', [-0.6, 7.6, 0], cg);

    const sim = { mag: 1 };
    const mBoard = board(stage.root, (g, w, h) => {
      panelBg(g, w, h); title(g, 'The magnitude scale', 'smaller is brighter · 5 steps = 100 times');
      const x0 = 40, x1 = w - 40, m0 = -13, m1 = 11, X = (m) => x0 + ((m - m0) / (m1 - m0)) * (x1 - x0), y = 250;
      const gr = g.createLinearGradient(x0, 0, x1, 0); gr.addColorStop(0, '#fff8e0'); gr.addColorStop(1, '#10131c'); g.fillStyle = gr; g.fillRect(x0, y - 14, x1 - x0, 28);
      for (let m = -12; m <= 10; m += 2) text(g, String(m), X(m), y + 46, 'rgba(255,255,255,.7)', '19px sans-serif', 'center');
      REF.forEach((o) => { const yy = y - 40 - o.row * 28; g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(X(o.m), y - 16); g.lineTo(X(o.m), yy); g.stroke(); text(g, o.t, X(o.m) - 4, yy - 4, 'rgba(255,255,255,.85)', '18px sans-serif', 'left'); });
      const lim = SKIES[sim.sky || 'rural'].lim, limB = lim + 4.3;
      for (const [m, c, t] of [[lim, COL.green, 'eye limit'], [limB, COL.cool, 'binoculars']]) { if (m > m1) continue; g.fillStyle = c; g.fillRect(X(m) - 2, y - 18, 4, 36); text(g, t, X(m), y + 76, c, '18px sans-serif', 'center'); }
      g.fillStyle = COL.hot; g.beginPath(); g.moveTo(X(sim.mag), y + 18); g.lineTo(X(sim.mag) - 10, y + 36); g.lineTo(X(sim.mag) + 10, y + 36); g.fill();
      text(g, 'your comet', X(sim.mag), y + 100, COL.hot, 'bold 19px sans-serif', 'center');
    });

    let skyKey = '', md = 'wide', vis = 0, tDraw = 0;
    return {
      dispose() { unlayout(stage); stage.lights.visible = true; },
      update(dt, s) {
        dt = Math.max(0, dt);
        stage.floor.visible = false; stage.lights.visible = false;
        md = layout(stage, mBoard, [lSun, lRing]);
        sim.mag = s.mag; sim.sky = s.sky;
        const sk = SKIES[s.sky];
        if (skyKey !== s.sky) { skyKey = s.sky; paintSky(sk.glow); }
        const lim = sk.lim + (s.bino ? 4.3 : 0);
        let n = 0;
        SM.forEach(([m, az, alt]) => {
          if (m > lim) return;
          const b = clamp(Math.pow(2.512, (lim - m) - 1.5), 0.12, 1);
          const x = 55 * Math.cos(alt) * Math.sin(az), y = 55 * Math.sin(alt) - 1, z = -55 * Math.cos(alt) * Math.cos(az);
          stars.set(n++, x, y, z, b, b, b * 1.05);
        });
        stars.done(n);
        // a fuzzy comet needs about one magnitude more than a star (model)
        const margin = (lim - 1) - s.mag;
        vis = approach(vis, clamp(margin / 3, 0, 1), 6, dt);
        head.material.opacity = 0.1 + 0.9 * vis; head.scale.setScalar(0.6 + 0.8 * vis);
        tail.material.opacity = clamp((margin - 1) / 4, 0, 1); ionT.material.opacity = 0.4 * clamp((margin - 2) / 4, 0, 1);
        tail.visible = tail.material.opacity > 0.01; ionT.visible = ionT.material.opacity > 0.01; head.visible = margin > -0.3;
        ring.visible = s.bino; lRing.visible = s.bino && md !== 'phone';
        lCom.element.textContent = margin > 0 ? (margin > 3 ? 'easy to see' : 'faint: look carefully') : 'too faint to see';
        tDraw += dt; if (tDraw > 0.15) { tDraw = 0; mBoard.redraw(); }
      },
      readout: (s) => {
        const sk = SKIES[s.sky], lim = sk.lim + (s.bino ? 4.3 : 0), margin = (lim - 1) - s.mag, nm = NAMES[s.name], [pre, rest] = decode(nm.d);
        const big = `<div class="big">${margin > 0 ? 'You can see it' : 'Too faint to see'} ${s.bino ? 'in binoculars' : 'by eye'}</div>`;
        const r1 = `<div class="row"><span>Faintest star here</span><b>magnitude ${lim.toFixed(1)}</b></div>`;
        const r2 = `<div class="row"><span>${nm.d}</span><b>${nm.name}</b></div>`;
        if (md === 'phone') return big + r1 + r2;
        return slim(`${big}
          <div class="row"><span>Comet vs a magnitude 6 star</span><b>${Math.pow(100, (6 - s.mag) / 5) >= 1 ? Math.pow(100, (6 - s.mag) / 5).toFixed(Math.pow(100, (6 - s.mag) / 5) < 10 ? 1 : 0) + ' × brighter' : (1 / Math.pow(100, (6 - s.mag) / 5)).toFixed(1) + ' × fainter'}</b></div>
          ${r1}
          <div class="row"><span>Binoculars add</span><b>2.5 log₁₀ (50 ÷ 7)² = 4.3 mag</b></div>
          ${r2}
          <div class="row"><span>${pre.split(':')[0]}</span><b>${pre.split(': ')[1] || ''}</b></div>
          <small>${rest}; ${nm.note}. Sky limits are rough (Bortle scale).</small>`);
      },
    };
  },
};

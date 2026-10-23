// Chapter 4: where comets come from, and how they end.
// 1. Homes (log map, each ring ×10 in distance): the Kuiper belt about 30–50 AU and the scattered disc out
//    to nearly 1,000 AU (NASA Kuiper Belt facts); the Oort cloud from an inner edge of 2,000–5,000 AU to an
//    outer edge of 10,000–100,000 AU (NASA Oort Cloud facts). Its shape is a model (no one has seen it).
//    Real orbits from JPL's SBDB (see comet.js). Each dot moves by Kepler's equation at 1 year per second,
//    so Encke laps in 3.3 s and Hale–Bopp hardly moves. Periods come from law 3, T = a^1.5 (years, AU).
//    Families as astronomers use them: Jupiter-family (period under about 20 years), Halley-type
//    (20–200 years), long-period (over 200 years; P/ against C/ in the IAU names). The star's nudge is an
//    illustration.
// 2. Breaking up: Shoemaker–Levy 9 passed about 21,000 km above Jupiter's clouds on 7–8 July 1992 and was
//    torn into some 21 pieces that hit Jupiter on 16–22 July 1994 at about 60 km/s (NASA). The Roche
//    limit for a loose rubble pile is d ≈ 2.44 R (ρ_planet ÷ ρ_comet)^⅓ (Roche's fluid result), with
//    Jupiter's mean density 1,326 kg/m³ (NASA fact sheet) and an assumed 500 kg/m³ for the comet.
// 3. Meteor showers: dust shed along a comet's orbit; when the Earth crosses it, grains burn up. The
//    crossing point, its date and the meeting speed are computed in 3D from JPL elements (nodeMeet in
//    comet.js): 59 km/s for the Perseids (NASA: 59 km/s) and 71 km/s for the Leonids (NASA: 71 km/s).
import { THREE, M, clamp, approach } from '../kit.js';
import {
  TAU, D2R, AU, COMETS, PLANETS, posAt, ellipsePts, yearsFor, vAU, nodeMeet, board, panelBg, title, axes, dot, line, text, COL, HEX,
  layout, unlayout, slim, ribbon, makeSun, starfield, glowPoints, haze, ball, rng, num,
} from '../comet.js';

const LR = (au) => (au <= 0.3 ? au * 0.4 / 0.3 * 0.5 : 0.8 + 1.4 * Math.log10(au));   // log map for the homes view
const OORT = { id: 'oort', name: 'A newcomer from the Oort cloud (illustration)', short: 'Oort newcomer', a: 20000, e: 0.99995 };
OORT.q = OORT.a * (1 - OORT.e); OORT.Q = OORT.a * (1 + OORT.e); OORT.T = yearsFor(OORT.a);
const PICKS = [COMETS.encke, COMETS.cg67p, COMETS.halley, COMETS.swift, COMETS.halebopp, OORT];
const ROT = { encke: 0.4, cg67p: 2.1, halley: -2.6, swift: 1.2, halebopp: -0.9, oort: 2.7 };
const TILT = { encke: 0.2, cg67p: 0.12, halley: 0.3, swift: 1.1, halebopp: 1.5, oort: 0.7 };
const family = (c) => (c.T < 20 ? 'Jupiter-family (under 20 years)' : c.T < 200 ? 'Halley-type (20 to 200 years)' : 'long-period (over 200 years)');
const R_J = 71492, RHO_J = 1326, RHO_C = 500;   // km (equatorial), kg/m³ (NASA), kg/m³ (assumed)
const ROCHE = 2.44 * Math.cbrt(RHO_J / RHO_C);
const SHOWERS = {
  perseids: { name: 'Perseids', parent: COMETS.swift, asc: false, nasa: 59, peak: '12–13 August', rate: 'up to about 100 an hour' },
  leonids: { name: 'Leonids', parent: COMETS.tempel, asc: false, nasa: 71, peak: '16–17 November', rate: 'storms in 1833 and 1966' },
};
// The date on which the Earth reaches heliocentric longitude lam (radians): the Sun is then at lam + 180°,
// and the Sun's mean longitude is 280.46° + 0.98565° per day from 1 January (a standard almanac formula).
function dateFor(lam) {
  const Ls = (((lam / D2R + 180) % 360) + 360) % 360, d = (((Ls - 280.46) / 0.9856474) % 365.25 + 365.25) % 365.25;
  const dt = new Date(Date.UTC(2001, 0, 1) + d * 86400000);
  return dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}
const VIEWS = {
  homes: { pos: [1.2, 7.4, 8.4], target: [0.2, -0.6, 0.9] },
  sl9: { pos: [61.2, -0.7, 6.4], target: [59.4, -0.1, 0] },
  meteors: { pos: [-56, 3.6, 5.2], target: [-60, -0.2, 0.3] },
};

export default {
  id: 'families',
  short: 'Homes and endings',
  title: 'Where comets come from, and how they end',
  subtitle: 'Two deep freezes at the edge of the Solar System, a nudge, a plunge, and then a slow fade, a break-up, or a shower of shooting stars.',
  view: VIEWS.homes,
  learn: `<p>Comets are <b>leftover building blocks</b> of the planets, icy planetesimals that formed beyond the frost line 4.6 billion years ago (see <a href="https://glassbox.how/planetclear/" target="_blank" rel="noopener">PlanetClear</a>). The giant planets flung most of them away. They now wait in two deep freezes.</p>
    <p>The <b>Kuiper belt</b> is a flat ring beyond Neptune, about 30 to 50 AU out, with the <b>scattered disc</b> stretching to nearly 1,000 AU. Comets from here have short, low orbits close to the plane of the planets: the <b>Jupiter-family</b> comets, such as 67P, with periods under about 20 years. Jupiter's gravity keeps reshaping their paths.</p>
    <p>The <b>Oort cloud</b> is a vast, round swarm thousands to perhaps 100,000 AU away, a good part of the way to the nearest star. Nobody has seen it: Jan Oort worked out in 1950 that it must be there, because so many comets arrive from that far, from every direction. A passing star or the pull of the Milky Way can nudge one inwards. It arrives as a <b>long-period</b> comet, like Hale–Bopp, which takes over 2,000 years per lap. <b>Halley-type</b> comets, with periods of 20 to 200 years, are thought to be Oort cloud comets that planets have pulled into shorter orbits.</p>
    <p>No comet lasts for ever. Each pass near the Sun strips a layer of ice. Some <b>fade</b> into dark, dead lumps. Some <b>break up</b>: in July 1992 Jupiter's gravity tore comet <b>Shoemaker–Levy 9</b> into about 21 pieces, which crashed into Jupiter in July 1994 and left dark scars bigger than the Earth. Some dive into the Sun: the <b>sungrazers</b>, thousands of which have been found by the SOHO spacecraft. And the dust they shed spreads along their orbits. When the Earth runs through it we get a <b>meteor shower</b>: the Perseids in August from comet Swift–Tuttle, the Leonids in November from Tempel–Tuttle, and the Orionids in October and Eta Aquariids in May from Halley's comet.</p>
    <p class="tip"><b>Try it:</b> pick a comet and compare its period with the law 3 line. Press "A star passes by". Then watch Shoemaker–Levy 9 break up, and fly the Earth through the Perseid stream to see the meeting speed computed from the comet's orbit.</p>`,
  terms: [
    { t: 'Kuiper belt', d: 'A flat ring of icy bodies beyond Neptune, about 30 to 50 AU from the Sun. Pluto lives here.' },
    { t: 'Oort cloud', d: 'A huge, round swarm of comets thousands to perhaps 100,000 AU away. Predicted by Jan Oort in 1950; never seen directly.' },
    { t: 'Short-period comet', d: 'One that returns in under 200 years. Its IAU name starts with P/, like 1P/Halley.' },
    { t: 'Long-period comet', d: 'One that takes more than 200 years per lap, often thousands. Its name starts with C/.' },
    { t: 'Roche limit', d: 'The distance inside which a planet’s pull on the near side of a loose body, minus the pull on its far side, tears it apart.' },
    { t: 'Meteor shower', d: 'Many shooting stars from one point in the sky, as the Earth runs through a comet’s old dust.' },
    { t: 'Sungrazer', d: 'A comet that passes extremely close to the Sun. Many break up or vanish.' },
  ],
  defaults: { show: 'homes', pick: 'halley', nudge: 0, phase: 0, run: true, shower: 'perseids' },
  controls: [
    { key: 'show', type: 'seg', label: 'Show', options: [{ v: 'homes', label: 'Homes and families' }, { v: 'sl9', label: 'Breaking up' }, { v: 'meteors', label: 'Meteor showers' }] },
    { key: 'pick', type: 'seg', label: 'Homes: comet', options: PICKS.map((c) => ({ v: c.id, label: c.short })) },
    { key: 'go', type: 'buttons', label: 'Homes', items: [{ label: 'A star passes by', act: (s) => Object.assign(s, { show: 'homes', pick: 'oort', nudge: 0.001 }) }] },
    { key: 'phase', type: 'range', label: 'Shoemaker–Levy 9: time', min: 0, max: 1, step: 0.005, ends: ['1992', '1994'], fmt: (v) => (v < 0.35 ? 'July 1992: the close pass' : v < 0.75 ? '1992–1994: a string of pieces' : 'July 1994: the impacts') },
    { key: 'shower', type: 'seg', label: 'Meteors: stream', options: [{ v: 'perseids', label: 'Perseids (Swift–Tuttle)' }, { v: 'leonids', label: 'Leonids (Tempel–Tuttle)' }] },
    { key: 'run', type: 'toggle', label: 'Let time run' },
  ],
  onChange(s, key) {
    if (key === 'pick') s.show = 'homes';
    if (key === 'phase') { s.show = 'sl9'; s.run = false; }
    if (key === 'shower') s.show = 'meteors';
  },
  quiz: [
    { q: 'Where do most long-period comets come from?', options: ['The asteroid belt', 'The Oort cloud, far beyond the planets', 'Jupiter’s moons', 'Other galaxies'], answer: 1, why: 'They fall in from the Oort cloud, thousands of AU away, when a passing star or the Milky Way’s pull nudges them.' },
    { q: 'Why did comet Shoemaker–Levy 9 break into pieces in 1992?', options: ['It hit an asteroid', 'It passed inside Jupiter’s Roche limit, where tides pulled the loose comet apart', 'The Sun melted it', 'It exploded'], answer: 1, why: 'Jupiter pulled harder on the near side than the far side. A loose rubble pile cannot resist that so close in, so it came apart.' },
    { q: 'What makes the Perseid meteor shower every August?', options: ['Bits of the Moon', 'Dust left along the orbit of comet Swift–Tuttle', 'Satellites falling', 'Dust from Mars'], answer: 1, why: 'Each August the Earth crosses Swift–Tuttle’s dust stream. Grains hit the air at about 59 km/s and burn up as shooting stars.' },
  ],
  reel: [
    { ms: 5600, caption: 'Comets wait in two deep freezes: the Kuiper belt past Neptune and the far, round Oort cloud.', set: { show: 'homes', pick: 'halebopp', run: true, nudge: 0 }, view: { pos: [3.2, 11.5, 12.8], target: [0.6, 0, 0.8] }, spin: 0.25 },
    { ms: 5200, caption: 'In 1992 Jupiter tore comet Shoemaker–Levy 9 apart; in 1994 its pieces hit the planet.', set: { show: 'sl9', run: false }, anim: { phase: [0.05, 0.95] }, spin: 0 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    stage.floor.visible = false;
    root.add(starfield(900, 400, 61));
    const r = rng(77);
    const sim = { pick: 'halley', meet: null };

    // ================================================================ homes
    const gH = new THREE.Group(); root.add(gH);
    gH.add(makeSun(0.12));
    const rings = PLANETS.filter((p) => p.au > 0.9).map((p) => { const rb = ribbon(129, p.col, 0.4, 0); const R = LR(p.au), pts = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * TAU; pts.push([R * Math.cos(a), R * Math.sin(a)]); } rb.set(pts, 0.014); gH.add(rb); return rb; });
    const NK = 900, kb = glowPoints(NK, 0.09, 0.7); gH.add(kb);
    for (let i = 0; i < NK; i++) {
      const sc = i > 620, au = sc ? 30 * Math.pow(1000 / 30, Math.pow(r(), 1.6)) : 30 + 20 * r(), a = r() * TAU, R = LR(au), y = (r() - 0.5) * (sc ? 0.5 : 0.12);
      kb.set(i, R * Math.cos(a), y, R * Math.sin(a), sc ? 0.45 : 0.55, sc ? 0.6 : 0.75, sc ? 0.8 : 0.95);
    }
    kb.done(NK);
    const NO = 2400, oc = glowPoints(NO, 0.16, 0.6); gH.add(oc);
    for (let i = 0; i < NO; i++) {
      const au = 2000 * Math.pow(50, Math.pow(r(), 0.8)), R = LR(au), u = r() * 2 - 1, a = r() * TAU, inner = au < 15000, fl = inner ? 0.55 : 1;
      const sq = Math.sqrt(1 - u * u); oc.set(i, R * sq * Math.cos(a), R * u * fl, R * sq * Math.sin(a), 0.5, 0.62, 0.85);
    }
    oc.done(NO);
    const lab = (t, p, parent = gH, cls = '', c = null) => { const l = stage.label(t, p, parent, cls); if (c) l.element.style.setProperty('--c', c); return l; };
    const lK = lab('Kuiper belt, 30–50 AU', [LR(40) * 0.72, 0.2, LR(40) * 0.72], gH, 'hot', COL.cool);
    const lS = lab('scattered disc, to ~1,000 AU', [-LR(300), 0.3, 0.3]);
    const lO = lab('Oort cloud, ~2,000 to 100,000 AU (never seen)', [LR(40000) * 0.55, -1.2, LR(40000) * 0.62], gH, 'hot', COL.violet);
    const lScale = lab('log scale: each ring of 10× farther out', [LR(5.2) * 0.4, 0, LR(5.2) * 1.05]);
    const lNep = lab('Neptune', [LR(30.07) * -0.72, 0, LR(30.07) * 0.72]), lJup = lab('Jupiter', [LR(5.2) * -0.72, 0, LR(5.2) * -0.72]);
    // comets' orbits, each in its own tilted plane
    const orbits = PICKS.map((c) => {
      const g = new THREE.Group(); g.rotation.set(TILT[c.id], ROT[c.id], 0); gH.add(g);
      const rb = ribbon(401, 0xffffff, 0.5, 0);
      const pts = ellipsePts(c.a, c.e, 400).map(([x, y]) => { const d = Math.hypot(x, y), R = LR(d); return [(R * x) / d, (R * y) / d]; });
      rb.set(pts, 0.03); g.add(rb);
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), M.glow(0xffffff)); g.add(b);
      const l = lab(c.short, [0, 0, 0], g, 'hot', COL.cool);
      return { c, g, rb, b, l };
    });
    // the nudge: a star sweeps past and the newcomer's orbit appears
    const star = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 10), M.glow(0xffd0a0)); gH.add(star);
    const lStar = lab('a passing star', [0, 0, 0], star);
    const fBoard = board(stage.root, (g, w, h) => {
      panelBg(g, w, h); title(g, 'Period against orbit size', 'law 3: T = a^1.5 · each grid step ×10 · JPL orbits');
      const { X, Y, x0, x1 } = axes(g, w, h, { logX: true, logY: true, xMin: 0, xMax: 4.5, yMin: 0, yMax: 6.8, xTicks: [1, 10, 100, 1000, 10000], yTicks: [1, 100, 10000, 1e6], xFmt: (v) => num(v) + ' AU', yFmt: (v) => (v >= 1e6 ? '1 Myr' : num(v) + ' yr'), xLabel: 'average distance a →' });
      for (const [T, c, l] of [[20, '#7be08c', 'Jupiter-family'], [200, '#ffb547', 'Halley-type']]) { g.strokeStyle = c; g.globalAlpha = 0.6; g.setLineDash([6, 6]); g.lineWidth = 2; g.beginPath(); g.moveTo(x0, Y(T)); g.lineTo(x1, Y(T)); g.stroke(); g.setLineDash([]); g.globalAlpha = 1; text(g, 'below: ' + l, x1 - 6, Y(T) + 24, c, '19px sans-serif', 'right'); }
      text(g, 'long-period', x1 - 6, Y(3000), COL.violet, '19px sans-serif', 'right');
      line(g, [[1, 1], [31623, Math.pow(31623, 1.5)]], X, Y, 'rgba(196,155,255,.8)', 3);
      PICKS.forEach((c) => { const on = c.id === sim.pick; dot(g, X(c.a), Y(c.T), on ? COL.hot : '#fff', on ? 11 : 7); text(g, c.short, X(c.a) + 12, Y(c.T) + 8, on ? COL.hot : 'rgba(255,255,255,.8)', '20px sans-serif'); });
    });

    // ================================================================ Shoemaker–Levy 9
    const gS = new THREE.Group(); gS.position.x = 60; root.add(gS);
    const jtex = (() => { const c = document.createElement('canvas'); c.width = 512; c.height = 256; const g = c.getContext('2d'); for (let y = 0; y < 256; y += 8) { const k = Math.sin(y * 0.09) * 0.5 + 0.5; g.fillStyle = `rgb(${200 + k * 40},${150 + k * 50},${100 + k * 60})`; g.fillRect(0, y, 512, 8); } g.fillStyle = '#c1552f'; g.beginPath(); g.ellipse(300, 160, 26, 13, 0, 0, TAU); g.fill(); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return { t, c, g }; })();
    const jup = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), new THREE.MeshStandardMaterial({ map: jtex.t, roughness: 0.8 })); gS.add(jup);
    const rocheRing = ribbon(129, HEX.red, 0.5, 0); { const pts = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * TAU; pts.push([ROCHE * Math.cos(a), ROCHE * Math.sin(a)]); } rocheRing.set(pts, 0.03); } gS.add(rocheRing);
    const sl9Path = ribbon(121, HEX.orbit, 0.5, 0); gS.add(sl9Path);
    const frags = Array.from({ length: 21 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (i % 4) * 0.012, 10, 8), M.glow(0xe8f4ff)); gS.add(m); return m; });
    const fTails = glowPoints(21 * 12, 0.09, 0.8); gS.add(fTails);
    const scars = Array.from({ length: 21 }, (_, i) => { const m = new THREE.Mesh(new THREE.CircleGeometry(0.05 + (i % 3) * 0.03, 16), new THREE.MeshBasicMaterial({ color: 0x2a1408, transparent: true, opacity: 0, side: THREE.DoubleSide })); gS.add(m); return m; });
    const lRoche = lab(`Roche limit ≈ ${ROCHE.toFixed(1)} Jupiter radii`, [ROCHE * 0.72, 0.15, ROCHE * 0.72], gS, 'hot', COL.red);
    const lPass = lab('1992: 1.3 Jupiter radii from the centre', [0, 0, 0], gS);
    const lJ = lab('Jupiter', [-0.6, 1.15, 0], gS);
    // path: a hyperbola-like swing past Jupiter at 1.3 R_J (sketch of the real 1992 geometry)
    const sPts = []; for (let i = 0; i <= 120; i++) { const f = i / 120, a = -2.2 + f * 2.6, rr = 1.3 * 1.8 / (1 + 0.8 * Math.cos(a)); sPts.push([rr * Math.cos(a) , rr * Math.sin(a)]); }
    sl9Path.set(sPts, 0.025);

    // ================================================================ meteor showers (true 3D geometry)
    const gM = new THREE.Group(); gM.position.x = -60; root.add(gM);
    gM.add(makeSun(0.12));
    const eRing = ribbon(129, 0x4f8dff, 0.55, 0); { const pts = []; for (let i = 0; i <= 128; i++) { const a = (i / 128) * TAU; pts.push([2 * Math.cos(a), 2 * Math.sin(a)]); } eRing.set(pts, 0.025); } gM.add(eRing);
    const earth = ball(0.11, 0x4f8dff); gM.add(earth);
    const lE = lab('Earth', [0, 0, 0], gM);
    const NS = 900, stream = glowPoints(NS, 0.07, 0.8); gM.add(stream);
    const NM = 60, streaks = glowPoints(NM, 0.05, 1.0); gM.add(streaks);
    const lStream = lab('', [0, 0, 0], gM, 'hot', COL.dust), lNode = lab('', [0, 0, 0], gM, 'hot', COL.hot);
    const MS = 2;   // 1 AU = 2 units
    const streamCache = {};
    function streamPts(sh) {
      if (streamCache[sh]) return streamCache[sh];
      const c = SHOWERS[sh].parent, O = c.om * D2R, I = c.i * D2R, W = c.w * D2R, rs = rng(sh.length * 7), out = [];
      const cO = Math.cos(O), sO = Math.sin(O), ci = Math.cos(I), si = Math.sin(I), cw = Math.cos(W), sw = Math.sin(W);
      for (let k = 0; k < NS; k++) {
        // the part of the orbit within about 2.5 AU of the Sun, spread a little (the stream is wide)
        const nu = (rs() - 0.5) * 2 * 2.3, p = c.a * (1 - c.e * c.e), rr = p / (1 + c.e * Math.cos(nu));
        if (rr > 3) { k--; continue; }
        const x = rr * Math.cos(nu) * (1 + (rs() - 0.5) * 0.06), y = rr * Math.sin(nu) * (1 + (rs() - 0.5) * 0.06);
        const X = (cO * cw - sO * sw * ci) * x + (-cO * sw - sO * cw * ci) * y, Y = (sO * cw + cO * sw * ci) * x + (-sO * sw + cO * cw * ci) * y, Z = sw * si * x + cw * si * y;
        out.push([X * MS, Z * MS + (rs() - 0.5) * 0.03, -Y * MS]);   // ecliptic x, y → scene x, −z; north → +y
      }
      return (streamCache[sh] = out);
    }

    let show = '', md = 'wide', tDraw = 0, tH = 0, tM = 0, shower = '';
    return {
      dispose() { unlayout(stage); },
      update(dt, s, time) {
        dt = Math.max(0, dt);
        stage.floor.visible = false;
        if (s.show !== show) { show = s.show; gH.visible = show === 'homes'; gS.visible = show === 'sl9'; gM.visible = show === 'meteors'; stage.setView(VIEWS[show].pos, VIEWS[show].target, 1.0); }
        fBoard.mesh.visible = show === 'homes';
        md = layout(stage, show === 'homes' ? fBoard : null, [lS, lScale, lNep, lJup, lPass, lO]);
        sim.pick = s.pick;
        if (show === 'homes') {
          if (s.run) tH += dt;
          orbits.forEach((o) => {
            const on = o.c.id === s.pick, q = posAt(o.c.a, o.c.e, (TAU * tH) / o.c.T + ROT[o.c.id]), d = Math.hypot(q.x, q.y), R = LR(d);
            o.b.position.set((R * q.x) / d, 0, (R * -q.y) / d);
            o.rb.material.opacity = on ? 0.95 : 0.28; o.rb.material.color.setHex(on ? HEX.hot : 0xffffff);
            o.l.position.copy(o.b.position).add(new THREE.Vector3(0, 0.3, 0)); o.l.visible = on || md !== 'phone';
          });
          // the nudge
          const no = orbits[5];
          if (s.nudge > 0) { s.nudge = Math.min(1, s.nudge + dt / 6); }
          const k = s.nudge;
          star.visible = k > 0 && k < 1; lStar.visible = star.visible && md !== 'phone';
          const sa = 2.7 + 0.15, Rst = LR(45000);
          star.position.set(Rst * Math.cos(sa) + (k - 0.5) * 6, 0.8 - k * 1.6, -Rst * Math.sin(sa));
          no.rb.visible = no.b.visible = no.l.visible = k === 0 || k > 0.5;
          tDraw += dt; if (tDraw > 0.2) { tDraw = 0; fBoard.redraw(); }
        }
        if (show === 'sl9') {
          if (s.run) { s.phase += dt / 12; if (s.phase > 1) s.phase = 0; }
          const ph = s.phase;
          // 0–0.35: one comet swings past and splits; 0.35–0.75: a string of pieces; 0.75–1: impacts
          let n = 0;
          frags.forEach((m, i) => {
            const spread = (i - 10) / 10;
            let x, z, y = 0;
            if (ph < 0.75) {
              const f = clamp(ph / 0.75, 0, 1), a = -2.2 + f * 2.6, rr = (1.3 * 1.8) / (1 + 0.8 * Math.cos(a));
              const sep = Math.max(0, f - 0.3) * spread * 0.9;
              x = rr * Math.cos(a - sep * 0.3); z = rr * Math.sin(a - sep * 0.3);
              m.visible = true;
            } else {
              // the pieces fall one after another onto the southern hemisphere (the real impacts were near 44° S)
              const f = (ph - 0.75) / 0.25, hit = (i + 0.5) / 21, g2 = clamp((f - hit * 0.8) / 0.2, 0, 1);
              const lat = -0.77, lon = -0.2 + spread * 0.7, P = [Math.sin(lon) * Math.cos(lat), Math.sin(lat), Math.cos(lon) * Math.cos(lat)];
              const h2 = 1 + 1.6 * (1 - g2);
              x = P[0] * h2 + (1 - g2) * 0.9; y = P[1] * h2; z = P[2] * h2;
              m.visible = g2 < 1;
              scars[i].material.opacity = g2 >= 1 ? 0.85 : 0;
              scars[i].position.set(P[0] * 1.004, P[1] * 1.004, P[2] * 1.004); scars[i].lookAt(P[0] * 2, P[1] * 2, P[2] * 2);
            }
            if (ph < 0.75) scars[i].material.opacity = 0;
            m.position.set(x, y, z);
            if (m.visible) for (let k2 = 1; k2 <= 12; k2++) { const f = k2 / 12, d = Math.hypot(x, z) || 1; fTails.set(n++, x + (x / d) * f * 0.5, y, z + (z / d) * f * 0.5, 0.5 * (1 - f), 0.6 * (1 - f), 0.8 * (1 - f)); }
          });
          fTails.done(n);
          if (ph < 0.75) jup.rotation.y += dt * 0.2;
          lPass.position.set(0.3, 0.2, 1.45); lPass.visible = ph < 0.4 && md !== 'phone';
        }
        if (show === 'meteors') {
          if (s.shower !== shower) {
            shower = s.shower; const pts = streamPts(shower);
            pts.forEach((p, i) => { const f = 0.5 + 0.5 * Math.sin(i * 1.7); stream.set(i, p[0], p[1], p[2], 0.9 * f + 0.1, 0.75 * f + 0.1, 0.4 * f + 0.1); });
            stream.done(pts.length);
            sim.meet = nodeMeet(SHOWERS[shower].parent, SHOWERS[shower].asc);
            const lam = sim.meet.lam;
            lNode.position.set(Math.cos(lam) * sim.meet.r * MS * 1.15, -0.4, -Math.sin(lam) * sim.meet.r * MS * 1.15);
            lNode.element.textContent = `Earth meets the stream about ${dateFor(lam)}`;
            lStream.element.textContent = `dust along ${SHOWERS[shower].parent.short}’s orbit`;
            const p0 = pts[Math.floor(pts.length * 0.15)]; lStream.position.set(p0[0], p0[1] + 0.3, p0[2]);
            tM = 0;
            stage.setView([Math.cos(lam) * 6.5 - 60 - Math.sin(lam) * 2.5, 4.6, -Math.sin(lam) * 6.5 - Math.cos(lam) * 2.5], [Math.cos(lam) * 0.9 - 60, -0.5, -Math.sin(lam) * 0.9], 1.0);
          }
          if (s.run) tM += dt;
          // Earth goes round at one lap per 20 s, starting 30° before the crossing
          const lam = sim.meet.lam, aE = lam - (30 * D2R) + ((tM / 20) * TAU) % TAU;
          earth.position.set(2 * Math.cos(aE), 0, -2 * Math.sin(aE));
          lE.position.copy(earth.position).add(new THREE.Vector3(0, 0.3, 0));
          const near = Math.abs(((aE - lam + Math.PI) % TAU + TAU) % TAU - Math.PI) < 0.1;
          let n = 0;
          if (near) for (let i = 0; i < NM; i++) { const ph = (time * 2 + i * 0.37) % 1, a = i * 2.4; streaks.set(n++, earth.position.x + Math.cos(a) * (0.13 + ph * 0.12), earth.position.y + Math.sin(a * 1.3) * 0.12, earth.position.z + Math.sin(a) * (0.13 + ph * 0.12), 1, 0.9 * (1 - ph), 0.6 * (1 - ph)); }
          streaks.done(n);
          sim.near = near;
        }
      },
      readout: (s) => {
        if (s.show === 'sl9') {
          const big = '<div class="big">Shoemaker–Levy 9: torn apart, then a crash</div>';
          const r1 = `<div class="row"><span>Roche limit, 2.44 R (ρ_J ÷ ρ_c)^⅓</span><b>${ROCHE.toFixed(1)} R_J</b></div>`;
          const r2 = '<div class="row"><span>Closest pass, 7–8 July 1992</span><b>about 1.3 R_J from the centre</b></div>';
          if (md === 'phone') return big + r1 + r2;
          return slim(`${big}${r1}${r2}
            <div class="row"><span>Pieces</span><b>about 21</b></div>
            <div class="row"><span>Impacts</span><b>16–22 July 1994, about 60 km/s</b></div>
            <small>Jupiter 1,326 kg/m³ (NASA); comet 500 kg/m³ assumed. Roche’s rule for a loose body with no strength. Path drawn as a sketch.</small>`);
        }
        if (s.show === 'meteors') {
          const S = SHOWERS[s.shower], m = sim.meet || nodeMeet(S.parent, S.asc);
          const big = `<div class="big">${S.name}: ${(m.vrel / 1000).toFixed(0)} km/s</div>`;
          const r1 = `<div class="row"><span>Parent comet</span><b>${S.parent.name}</b></div>`;
          const r2 = `<div class="row"><span>Meeting speed, computed</span><b>${(m.vrel / 1000).toFixed(1)} km/s (NASA: ${S.nasa})</b></div>`;
          if (md === 'phone') return big + r1 + r2;
          return slim(`${big}${r1}
            <div class="row"><span>Orbit crosses ours at</span><b>${m.r.toFixed(2)} AU from the Sun</b></div>
            <div class="row"><span>Comet’s speed there</span><b>${(m.vHel / 1000).toFixed(1)} km/s</b></div>
            ${r2}
            <div class="row"><span>Peak (NASA)</span><b>${S.peak}, ${S.rate}</b></div>
            <small>3D orbit from JPL elements; the crossing date is computed from where the orbits meet. Grains are mostly sand to pea sized (NASA).</small>`);
        }
        const c = PICKS.find((p) => p.id === s.pick) || COMETS.halley;
        const big = `<div class="big">${c.short}: ${c.T < 1000 ? c.T.toFixed(c.T < 10 ? 2 : 1) + ' years' : num(c.T, 0) + ' years'} a lap</div>`;
        const r1 = `<div class="row"><span>Family</span><b>${family(c)}</b></div>`;
        const r2 = `<div class="row"><span>Nearest, farthest</span><b>${c.q.toFixed(2)}, ${num(c.Q, c.Q < 100 ? 1 : 0)} AU</b></div>`;
        if (md === 'phone') return big + r1 + r2;
        return slim(`${big}${r1}${r2}
          <div class="row"><span>a, e</span><b>${num(c.a, c.a < 100 ? 2 : 0)} AU, ${c.e.toFixed(c.e > 0.99 ? 4 : 3)}</b></div>
          <div class="row"><span>Speed at nearest</span><b>${(vAU(c.q, c.a) / 1000).toFixed(1)} km/s</b></div>
          <small>${c.id === 'oort' ? 'An illustration: a = 20,000 AU gives about 2.8 million years a lap.' : 'Orbit from JPL’s Small-Body Database. Period from law 3.'}</small>`);
      },
    };
  },
};

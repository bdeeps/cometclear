// Chapter 1: a comet cut open.
// Two scales in one chapter:
// - "The nucleus": a two-lobed lump in the shape of Rosetta's comet 67P/Churyumov–Gerasimenko, drawn to
//   scale (1 unit = 1 km). ESA's Rosetta team: about 4.1 km for the big lobe and 2.5 km for the small one
//   (refined lobe ellipsoids 4.10 × 3.52 × 1.63 km and 2.50 × 2.14 × 1.64 km, Jorda et al. 2016, Icarus),
//   mass 1.0 × 10¹³ kg (ESA), density 533 kg/m³ (JPL SBDB; about half that of water ice, so it is very
//   porous), one turn every 12.4 hours (ESA). Its surface reflects only about 6% of the light that falls on it (as dark as charcoal).
//   The slice shows the layers as a sketch: a dark dusty crust (in reality centimetres to metres thick,
//   drawn much thicker), a porous mix of dust and ice beneath, pockets of cleaner ice and grains of
//   carbon-rich "organic" material. Gravity and escape speed are computed from ESA's mass with
//   g = G M ÷ r² and v = √(2 G M ÷ r) at r = 2 km.
// - "The whole comet": coma, two tails and the hydrogen cloud. These span from kilometres to hundreds of
//   millions of kilometres, so this picture is squeezed and labelled with real sizes (NASA, ESA).
import { THREE, M, clamp, approach } from '../kit.js';
import {
  TAU, GN, COL, HEX, layout, pickView, portraitReel, unlayout, slim, starfield, makeSun, glowPoints, haze, nucleusShape, lobeMesh, rng, num,
} from '../comet.js';

const M67P = 1.0e13, RHO = 533, R_REF = 2000;   // kg, kg/m³ (ESA), m
const VIEWS = {
  nucleus: { pos: [0.6, 3.0, 8.2], target: [-0.9, 0.9, 0] },
  comet: { pos: [50, 56, 60], target: [50, -8, 8] },
  nucleusP: { pos: [1.9, 2.2, 6.6], target: [0.5, 0.25, 0] },
  cometP: { pos: [40, 36, 24], target: [40, -2, 14] },
};
const CX = 40;   // the whole-comet picture sits off to one side

export default {
  id: 'anatomy',
  short: 'A comet cut open',
  title: 'A comet cut open',
  subtitle: 'A dark, crumbly lump of ice and dust a few kilometres across, and the huge glowing cloud and tails it grows near the Sun.',
  view: VIEWS.nucleus,
  learn: `<p>The solid heart of a comet, its <b>nucleus</b>, is small: usually a few kilometres across. It is a loose mix of <b>ice</b> (mostly frozen water, with frozen carbon dioxide and carbon monoxide), <b>dust</b> and rock grains, and dark carbon-rich <b>organic</b> material. Fred Whipple called it a <b>"dirty snowball"</b> in 1950. Spacecraft showed it is more like a dusty iceball with a <b>dark crust</b>: it reflects only a few per cent of the sunlight that hits it, so it is <b>as dark as charcoal</b>.</p>
    <p>The best-studied nucleus is <b>67P/Churyumov–Gerasimenko</b>, which ESA's Rosetta orbited from 2014 to 2016. It has two lobes joined by a neck, like a rubber duck: about 4.1 km and 2.5 km long. It is so <b>porous</b> that it is only about half as dense as ice, and its gravity is so weak that you could jump off it (compare the sums in <a href="https://glassbox.how/gravityclear/" target="_blank" rel="noopener">GravityClear</a>). The gas jets from its sunlit side push it gently, like a weak rocket engine (see <a href="https://glassbox.how/rocketclear/" target="_blank" rel="noopener">RocketClear</a>), which is why some comets arrive a little early or late.</p>
    <p>Far from the Sun the nucleus is all there is. Close in, sunlight turns its ice straight into gas (<b>sublimation</b>), and the gas carries dust off with it. That makes a glowing cloud round the nucleus, the <b>coma</b>, which can grow bigger than a planet. Two <b>tails</b> stream away from the Sun: a curved, yellowish-white <b>dust tail</b> that shines by reflected sunlight, and a straight, blue <b>ion tail</b> of charged gas. Round it all is a vast, invisible cloud of <b>hydrogen</b>, seen only in ultraviolet light.</p>
    <p class="tip"><b>Try it:</b> slice the nucleus open to see the layers, then switch to the whole comet and compare the sizes on the labels.</p>`,
  terms: [
    { t: 'Nucleus', d: 'The solid part of a comet: a few kilometres of ice, dust and organic material.' },
    { t: 'Sublimation', d: 'A solid turning straight into a gas without melting first, as ice does in the near-vacuum of space.' },
    { t: 'Coma', d: 'The cloud of gas and dust round a nucleus that is warming up. It can be hundreds of thousands of kilometres wide.' },
    { t: 'Dust tail', d: 'Dust pushed gently away by sunlight. It curves and shines yellowish-white by reflected light.' },
    { t: 'Ion tail', d: 'Gas made electrically charged by sunlight and blown straight away from the Sun by the solar wind. It glows blue.' },
    { t: 'Organics', d: 'Carbon-rich molecules. Not life, but some of the chemical building blocks that life uses.' },
    { t: 'Albedo', d: 'The fraction of light a surface reflects. Fresh snow is about 0.9; a comet nucleus is about 0.04 to 0.06.' },
  ],
  defaults: { look: 'nucleus', cut: 0.7, sun: true, spin: true },
  controls: [
    { key: 'look', type: 'seg', label: 'Look at', options: [{ v: 'nucleus', label: 'The nucleus' }, { v: 'comet', label: 'The whole comet' }] },
    { key: 'cut', type: 'range', label: 'Slice the nucleus open', min: 0, max: 1, step: 0.01, ends: ['whole', 'cut in half'], fmt: (v) => Math.round(v * 100) + '%' },
    { key: 'sun', type: 'toggle', label: 'Near the Sun: switch on the jets' },
    { key: 'spin', type: 'toggle', label: 'Let it turn (one turn in 12.4 hours, sped up)' },
  ],
  onChange(s, key) {
    if (key === 'cut') s.look = 'nucleus';
  },
  quiz: [
    { q: 'What is a comet’s nucleus mostly made of?', options: ['Molten rock', 'Ice, dust and dark organic material', 'Iron and nickel', 'Glowing gas'], answer: 1, why: 'It is a loose mix of ices (mostly water), dust and carbon-rich material: a dusty iceball with a dark crust.' },
    { q: 'Why does a comet nucleus look so dark?', options: ['It is in shadow', 'Its dusty, carbon-rich crust reflects only a few per cent of the light', 'It absorbs all sound', 'Ice is black in space'], answer: 1, why: 'The crust of dust and organics reflects only about 4 to 6% of sunlight, about as little as charcoal.' },
    { q: 'Which tail is straight and blue?', options: ['The dust tail', 'The ion tail', 'Both', 'Neither'], answer: 1, why: 'The ion tail is charged gas blown straight away from the Sun by the solar wind. Its blue glow comes from carbon monoxide ions.' },
  ],
  reel: [
    { ms: 5400, caption: 'A comet’s heart is a dark lump of ice and dust a few kilometres across, as dark as charcoal.', set: { look: 'nucleus', sun: true, spin: true }, anim: { cut: [0, 0.85] }, view: { pos: [3.4, 3.4, 9.6], target: [0.4, 0.1, 0] }, spin: 0.4 },
    { ms: 5200, caption: 'Near the Sun its ice turns to gas, making a glowing coma and two tails, millions of kilometres long.', set: { look: 'comet', sun: true }, view: { pos: [52, 50, 52], target: [54, -6, 6] }, spin: 0.2 },
  ],

  build({ stage }) {
    const root = new THREE.Group(); stage.root.add(root);
    stage.floor.visible = false;
    root.add(starfield(800, 400, 17));
    stage.renderer.localClippingEnabled = true;

    // ================================================================ the nucleus, to scale in km
    const gN = new THREE.Group(); root.add(gN);
    const spinner = new THREE.Group(); spinner.rotation.x = 0.35; gN.add(spinner);
    const plane = new THREE.Plane(new THREE.Vector3(0, 0, -1), 10);
    const clip = [plane];
    const crust = new THREE.MeshStandardMaterial({ color: 0x35302c, roughness: 0.95, metalness: 0, clippingPlanes: clip, side: THREE.FrontSide });
    const crustIn = new THREE.MeshBasicMaterial({ color: 0x2a2420, clippingPlanes: clip, side: THREE.BackSide });
    const mixIn = new THREE.MeshBasicMaterial({ color: 0x7d8794, clippingPlanes: clip, side: THREE.BackSide });
    const lobes = nucleusShape();
    lobes.forEach((L) => {
      spinner.add(lobeMesh(L, crust, 1));
      spinner.add(lobeMesh(L, crustIn, 1));
      spinner.add(lobeMesh(L, mixIn, 0.9));
    });
    // ice pockets and organic grains inside (they show where the slice passes through them)
    const r = rng(21), iceMat = new THREE.MeshBasicMaterial({ color: 0xdff4ff, clippingPlanes: clip }), orgMat = new THREE.MeshBasicMaterial({ color: 0x8a4b2a, clippingPlanes: clip });
    lobes.forEach((L, li) => {
      for (let k = 0; k < (li ? 9 : 16); k++) {
        const u = new THREE.Vector3(r() * 2 - 1, r() * 2 - 1, r() * 2 - 1).multiplyScalar(0.62);
        const p = new THREE.Vector3(u.x * L.radii[0], u.y * L.radii[1], u.z * L.radii[2]).applyEuler(new THREE.Euler(...L.rot)).add(L.center);
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.1 + r() * 0.2, 14, 10), k % 3 ? iceMat : orgMat); m.position.copy(p); spinner.add(m);
      }
    });
    // jets of gas and dust from the sunlit side; the Sun is off to the left (−x)
    const NJ = 900, jets = glowPoints(NJ, 0.16, 0.8); gN.add(jets);
    const jr = rng(5), JD = Array.from({ length: NJ }, () => [jr() - 0.5, jr() - 0.5, jr() - 0.5, 0.6 + jr() * 0.8, jr()]);
    const vents = [[-2.4, 0.4, 0.6], [-1.6, 0.8, -0.9], [-2.6, -0.3, -0.2], [0.2, 0.95, 0.5], [1.0, 1.2, -0.4], [-0.9, -0.85, 0.9]].map((v) => new THREE.Vector3(...v));
    const coma = haze(0xcfe6ff, 9, 0.0); gN.add(coma);
    const sunN = makeSun(0.9); sunN.position.set(-60, 8, -30); gN.add(sunN);
    const lightN = new THREE.DirectionalLight(0xfff1d6, 3.2); lightN.position.set(-60, 8, -30); gN.add(lightN);
    const L = (t, p, parent = gN, cls = '') => stage.label(t, p, parent, cls);
    const lCrust = L('Dark crust of dust and organics', [-1.4, 1.9, 0.4], gN, 'hot'); lCrust.element.style.setProperty('--c', COL.hot);
    const lMix = L('Porous mix of ice and dust', [0.6, -1.6, 1.0]);
    const lIce = L('Pockets of cleaner ice', [-2.4, -1.3, 0.8]);
    const lOrg = L('Organic grains (brown)', [2.6, -0.9, 0.6]);
    const lJet = L('Jets: gas carrying dust', [-4.2, -1.2, 1.0]);
    const lSize = L('4.1 km', [-0.9, -1.7, -1.0]), lSize2 = L('2.5 km', [2.0, 1.75, 0]);
    const lSunN = L('Sunlight from this side', [-5.4, 0.8, -1.5]);

    // ================================================================ the whole comet (squeezed)
    const gC = new THREE.Group(); gC.position.x = CX; gC.scale.setScalar(0.55); root.add(gC);
    const dr = rng(9), DR = Array.from({ length: 2600 }, () => [dr(), dr(), dr(), dr()]), IR = Array.from({ length: 1500 }, () => [dr(), dr(), dr()]);
    const sunC = makeSun(2.2); sunC.position.set(-34, 0, 0); gC.add(sunC);
    const hCloud = haze(0x9c8bff, 30, 0.3); gC.add(hCloud);
    const comaC = haze(0xd8f0ff, 5.5, 0.85); gC.add(comaC);
    const comaC2 = haze(0xa8f0d0, 2.6, 0.7); gC.add(comaC2);          // the inner coma glows green (C₂ gas)
    const nucDot = new THREE.Mesh(new THREE.SphereGeometry(0.35, 12, 8), M.glow(0xffffff)); gC.add(nucDot);
    const ND = 2600, dust = glowPoints(ND, 1.3, 0.6); gC.add(dust);
    const NI = 1500, ions = glowPoints(NI, 1.4, 0.95); gC.add(ions);
    const LC = (t, p, cls = '') => stage.label(t, p, gC, cls);
    const lc = [
      LC('Nucleus: a few km', [0, -2.2, 0]),
      LC('Coma: hundreds of thousands of km', [-3, 6.5, 0]),
      LC('Hydrogen cloud: up to 100 million km, seen in ultraviolet', [-16, -21, 0]),
      LC('Ion tail: straight, blue, away from the Sun', [52, 6, 0]),
      LC('Dust tail: curved, yellowish', [44, -2, 30]),
      LC('to the Sun', [-30, 4, 0]),
      LC('squeezed: not to scale', [60, -8, -26]),
    ];
    lc[3].element.style.setProperty('--c', COL.ion); lc[3].element.classList.add('hot');
    lc[4].element.style.setProperty('--c', COL.dust); lc[4].element.classList.add('hot');

    let look = '', ang = 0, md = 'wide', jetK = 0;
    const tmp = new THREE.Vector3();
    return {
      dispose() { stage.renderer.localClippingEnabled = false; unlayout(stage); },
      update(dt, s, time) {
        dt = Math.max(0, dt);
        stage.floor.visible = false;
        if (s.look !== look) { look = s.look; gN.visible = look === 'nucleus'; gC.visible = look === 'comet'; const v = pickView(stage, VIEWS, look); stage.setView(v.pos, v.target, 1.0); }
        gC.rotation.y = portraitReel(stage) ? -Math.PI / 2 : 0;
        md = layout(stage, null, [lOrg, lSize, lSize2, lSunN, lc[5], lc[6], lc[2]]);
        // the slice: the plane slides from in front of the comet (nothing cut) to its middle
        plane.constant = 3.2 * (1 - s.cut) + 0.0001;
        const inside = s.cut > 0.25;
        lMix.visible = lIce.visible = inside; if (md !== 'phone') lOrg.visible = inside;
        if (s.spin) ang += dt * 0.25;
        spinner.rotation.y = ang;
        // jets: each particle leaves a vent and drifts outwards, then sunlight pushes the dust back
        jetK = approach(jetK, s.sun ? 1 : 0, 2.5, dt);
        lJet.visible = jetK > 0.5 && md !== 'phone';
        let n = 0;
        if (jetK > 0.02) {
          for (let i = 0; i < NJ; i++) {
            const v = vents[i % vents.length], J = JD[i], age = ((time * 0.3 * J[3] + J[4]) % 1), d = age * 4.5 * J[3];
            tmp.set(v.x + J[0] * 0.9, v.y + J[1] * 0.9, v.z + J[2] * 0.9).normalize();
            const x = v.x + tmp.x * d + age * age * 2.5, y = v.y + tmp.y * d, z = v.z + tmp.z * d;
            const fade = (1 - age) * jetK;
            jets.set(n++, x, y, z, 0.75 * fade, 0.85 * fade, 0.95 * fade);
          }
        }
        jets.done(n);
        coma.material.opacity = 0.12 * jetK; coma.position.set(-1, 0, 0);

        // whole comet: dust curves back along the orbit; ions shoot straight out, with knots
        let nd = 0;
        for (let i = 0; i < ND; i++) {
          const [f, sz, wa, wb] = DR[i], age = Math.pow(f, 0.8);
          const len = age * 70, bend = age * age * (14 + 30 * (1 - sz));
          const w = (wa - 0.5) * (2 + age * 14);
          const x = len * (0.55 + 0.45 * sz), z = bend + w * 0.6, y = (wb - 0.5) * (1.5 + age * 8);
          const k = (1 - age * 0.85) * 0.75;
          dust.set(nd++, x, y, z, 1.0 * k, 0.8 * k, 0.45 * k);
        }
        dust.done(nd);
        let ni = 0;
        for (let i = 0; i < NI; i++) {
          const ray = i % 9, ph = ((time * 0.25 + IR[i][0]) % 1), x = ph * 95;
          const fan = (ray - 4 + (IR[i][1] - 0.5) * 0.8) * 0.03 * (1 + x * 0.02);
          const knot = 1 + 0.5 * Math.sin(x * 0.12 - time * 3 + ray);
          const y = x * fan + Math.sin(x * 0.08 + ray) * 0.6, z = x * fan * 0.4 + (IR[i][2] - 0.5) * 0.8;
          const k = (1 - ph) * 0.9 * knot;
          ions.set(ni++, x + 1, y, z, 0.15 * k, 0.4 * k, 1.0 * k);
        }
        ions.done(ni);
      },
      readout: (s) => {
        if (s.look === 'comet') {
          const big = '<div class="big">From kilometres to millions of km</div>';
          const rows = `<div class="row"><span>Nucleus</span><b>usually a few km</b></div>
            <div class="row"><span>Coma</span><b>hundreds of thousands of km</b></div>
            <div class="row"><span>Tails</span><b>millions of km; record 550 million km</b></div>`;
          if (md === 'phone') return big + rows;
          return slim(`${big}${rows}
            <div class="row"><span>Hydrogen cloud</span><b>up to 100 million km</b></div>
            <small>Picture squeezed. Record tail: Hyakutake’s, crossed by Ulysses in 1996 (ESA).</small>`);
        }
        const g = (GN * M67P) / (R_REF * R_REF), v = Math.sqrt((2 * GN * M67P) / R_REF), w50 = (50 * g) / 9.81 * 1000;
        const big = `<div class="big">Comet 67P: 4.1 km long</div>`;
        const r1 = `<div class="row"><span>Mass (ESA)</span><b>1.0 × 10¹³ kg</b></div>`;
        const r2 = `<div class="row"><span>Escape speed, √(2GM ÷ r)</span><b>${(v).toFixed(1)} m/s</b></div>`;
        if (md === 'phone') return big + r1 + r2;
        return slim(`${big}${r1}
          <div class="row"><span>Density (ESA)</span><b>${RHO} kg/m³, half of ice</b></div>
          <div class="row"><span>Gravity, GM ÷ r²</span><b>${(g * 1e4).toFixed(1)} × 10⁻⁴ m/s²</b></div>
          <div class="row"><span>A 50 kg student weighs</span><b>as much as ${w50.toFixed(1)} g on Earth</b></div>
          ${r2}
          <div class="row"><span>Reflects</span><b>about 4 to 6% of sunlight</b></div>
          <small>Layers in the slice are a sketch: the real crust is centimetres to metres thick. Gravity at 2 km from the centre.</small>`);
      },
    };
  },
};

// Named, ready-to-shoot versions of the hero objects.
import * as THREE from 'three';
import { materials, canvasTexture } from './stage.js';
import { makeGlobe, makeText, makeCursor } from './objects.js';
import { loadFont } from './fonts.js';

export const OBJECTS = {
  // chrome wire globe, wedge floating free
  globe: async () => makeGlobe(),
  // the hero: a blue mirror ball in a chrome lattice, the cut faces lettered like a sale sign
  'globe-core': async () => makeGlobe({ core: materials.tinted(0.03, 0.12, 1.0, 0.14), cut: await cutFace(), tubeRadius: 0.03, sliceOut: 0.95, sliceLift: 0.12 }),
  thirty: async () => makeText('30%', await loadFont('black'), { size: 1.0, depth: 0.42, bevel: 0.045, front: materials.chrome() }),
  'thirty-red': async () => makeText('30%', await loadFont('black'), { size: 1.0, depth: 0.42, bevel: 0.05, front: materials.gloss(0xff1414), side: materials.gloss(0x0a0a0a) }),
  percent: async () => makeText('%', await loadFont('black'), { size: 1.5, depth: 0.5, bevel: 0.06 }),
  dollar: async () => makeText('$', await loadFont('black'), { size: 1.5, depth: 0.45, bevel: 0.06, front: materials.gold() }),
  cursor: async () => { const g = makeCursor({ front: materials.chrome() }); g.rotation.z = 0.25; return g; },
};

// The two faces of the cut, as one texture: the left half is the face you see on the left when
// you look into the gap. Two colours so the faces read as two planes, a blue rim so the ball
// reads as a shell that has been cut through, and a darker crease where the faces meet.
async function cutFace() {
  await document.fonts.load('400 100px "Archivo Black"');
  const map = canvasTexture(1024, (g, n) => {
    const half = (x0, fill) => { g.fillStyle = fill; g.fillRect(x0, 0, n / 2, n); };
    half(0, '#ffd800');
    half(n / 2, '#ff1616');
    // shell: everything outside 88% of the radius is the ball's own blue
    g.save();
    g.beginPath(); g.rect(0, 0, n, n); g.arc(n / 2, n / 2, n * 0.5 * 0.9, 0, Math.PI * 2, true); g.closePath();
    g.fillStyle = '#0a1fd8'; g.fill('evenodd');
    g.restore();
    g.lineWidth = 9; g.strokeStyle = '#000';
    g.beginPath(); g.arc(n / 2, n / 2, n * 0.5 * 0.9, 0, Math.PI * 2); g.stroke();
    // crease
    const crease = g.createLinearGradient(n * 0.36, 0, n * 0.64, 0);
    crease.addColorStop(0, 'rgba(0,0,0,0)'); crease.addColorStop(0.5, 'rgba(0,0,0,0.42)'); crease.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = crease; g.fillRect(n * 0.36, 0, n * 0.28, n);
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineJoin = 'round';
    for (const [text, x, fill] of [['30%', 0.268, '#ff1616'], ['OFF', 0.722, '#ffe800']]) {
      g.font = '400 176px "Archivo Black"';
      g.lineWidth = 30; g.strokeStyle = '#000';
      g.strokeText(text, n * x, n * 0.5);
      g.fillStyle = fill;
      g.fillText(text, n * x, n * 0.5);
    }
  });
  return new THREE.MeshPhysicalMaterial({ map, metalness: 0, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.2, envMapIntensity: 0.45, side: THREE.DoubleSide });
}

export async function buildObject(name, params = {}) {
  const make = OBJECTS[name];
  if (!make) throw new Error(`unknown object "${name}" (have: ${Object.keys(OBJECTS).join(', ')})`);
  const object = await make(params);
  object.name = name;
  return object;
}
export { THREE };

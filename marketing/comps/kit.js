// One object on its own: for transparent stills, turntables, contact sheets and GLB export.
//   kit.html?object=globe&w=1200&h=1200&plinth=1&bg=blue
import * as THREE from 'three';
import { createStage, makePlinth, castShadows } from '../lib/stage.js';
import { buildObject } from '../lib/catalog.js';

const q = new URLSearchParams(location.search);
const W = Number(q.get('w') || 1200), H = Number(q.get('h') || 1200);
const canvas = document.getElementById('gl');
canvas.style.width = W + 'px';
canvas.style.height = H + 'px';
if (q.get('bg') === 'blue') document.body.classList.add('blue');

const { renderer, scene, camera, key } = createStage({ canvas, width: W, height: H, pixelRatio: Number(q.get('pr') || 1) });
const pivot = new THREE.Group();
scene.add(pivot);
const object = await buildObject(q.get('object') || 'globe', Object.fromEntries(q));
pivot.add(castShadows(object));
if (object.userData.slice) object.userData.slice.visible = q.get('slice') === '1'; // the removed wedge is opt-in

let plinth = null;
if (q.get('plinth') === '1') {
  plinth = makePlinth();
  plinth.position.y = -1.55;
  scene.add(plinth);
}

const dist = Number(q.get('dist') || 7.2);
function place(elevDeg = 8, lookY = plinth ? -0.35 : 0) {
  const e = (elevDeg * Math.PI) / 180;
  camera.position.set(0, lookY + Math.sin(e) * dist, Math.cos(e) * dist);
  camera.lookAt(0, lookY, 0);
}
place(Number(q.get('elev') || 8));

window.kit = {
  THREE, scene, camera, renderer, pivot, object, key,
  render(yawDeg = 0, elev) {
    if (elev !== undefined) place(elev);
    pivot.rotation.y = (yawDeg * Math.PI) / 180;
    object.userData.animate?.(yawDeg / 360);
    renderer.render(scene, camera);
  },
  png(yawDeg, elev) { this.render(yawDeg, elev); return canvas.toDataURL('image/png'); },
};
window.kit.render(Number(q.get('yaw') || 0));
window.ready = true;

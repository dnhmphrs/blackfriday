// The hero objects. Each builder returns a THREE.Group about one unit in radius, centred on
// the origin, Y up, facing +Z.
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { materials } from './stage.js';

const rad = (deg) => (deg * Math.PI) / 180;

// A point on a sphere. Longitude 0 faces the camera (+Z) and grows towards +X.
const onSphere = (R, latDeg, lonDeg) => {
  const lat = rad(latDeg), lon = rad(lonDeg);
  return new THREE.Vector3(R * Math.cos(lat) * Math.sin(lon), R * Math.sin(lat), R * Math.cos(lat) * Math.cos(lon));
};

class FnCurve extends THREE.Curve {
  constructor(fn) { super(); this.fn = fn; }
  getPoint(t, target = new THREE.Vector3()) { return target.copy(this.fn(t)); }
}
const tube = (fn, radius, material, segments = 120) => new THREE.Mesh(new THREE.TubeGeometry(new FnCurve(fn), segments, radius, 20, false), material);

// "The Internet, 30% off": the globe-with-meridians symbol as chrome tubing, with a 108 degree
// wedge (30% of the way round) cut out and floating free.
//   wedge      degrees of longitude removed, starting at longitude 0
//   step       degrees between meridians (the wedge should be a whole number of steps)
//   core       null, or a material for a solid inner sphere (cut the same way)
//   sliceOut   how far the removed wedge is pushed out; 0 hides it
export function makeGlobe({ R = 1, tubeRadius = 0.036, wedge = 108, step = 36, latitudes = [-60, -30, 0, 30, 60],
  material = materials.chrome(), core = null, cut = null, sliceOut = 0.42, sliceLift = 0, sliceMaterial = null } = {}) {
  const group = new THREE.Group();
  const body = new THREE.Group();
  const slice = new THREE.Group();
  group.add(body, slice);
  group.userData = { body, slice };

  const grid = (target, lonFrom, lonTo, mat) => {
    for (let lon = lonFrom; lon <= lonTo + 1e-6; lon += step) {
      target.add(tube((t) => onSphere(R, -90 + 180 * t, lon), tubeRadius, mat, 96));
    }
    for (const lat of latitudes) {
      target.add(tube((t) => onSphere(R, lat, lonFrom + (lonTo - lonFrom) * t), tubeRadius, mat, Math.max(24, Math.round((lonTo - lonFrom) / 2.5))));
    }
    for (const y of [-1, 1]) {
      const pole = new THREE.Mesh(new THREE.SphereGeometry(tubeRadius * 1.9, 24, 16), mat);
      pole.position.y = y * R;
      target.add(pole);
    }
  };
  grid(body, wedge, 360, material);
  if (sliceOut > 0) grid(slice, 0, wedge, sliceMaterial || material);

  // The two flat faces of a cut are half discs. Each is built so that its FRONT faces out of
  // the solid it belongs to, which keeps lettering on the cut the right way round:
  // the face where a solid starts shows the right half of the texture, the face where it ends
  // shows the left half, so looking into the gap you read left half, then right half.
  const solid = (target, lonFrom, lonTo, mat) => {
    const r = R * 0.9;
    target.add(new THREE.Mesh(new THREE.SphereGeometry(r, 96, 64, rad(lonFrom + 90), rad(lonTo - lonFrom)), mat));
    const start = new THREE.Mesh(new THREE.CircleGeometry(r, 64, -Math.PI / 2, Math.PI), cut || mat);
    start.rotation.y = rad(lonFrom) - Math.PI / 2;
    const end = new THREE.Mesh(new THREE.CircleGeometry(r, 64, Math.PI / 2, Math.PI), cut || mat);
    end.rotation.y = rad(lonTo) + Math.PI / 2;
    target.add(start, end);
  };
  if (core) {
    solid(body, wedge, 360, core);
    if (sliceOut > 0) solid(slice, 0, wedge, core);
  }

  // Push the wedge straight out along its own centre line.
  const mid = wedge / 2;
  slice.position.copy(onSphere(sliceOut, 0, mid));
  slice.position.y = sliceLift;
  // Turn the whole thing so the gap faces the camera at yaw 0.
  group.rotation.y = rad(-mid);
  group.userData.setSlice = (out, lift = sliceLift) => { slice.position.copy(onSphere(out, 0, mid)); slice.position.y = lift; };
  return group;
}

// Extruded lettering. `font` is a three.js Font (see fonts.js).
export function makeText(text, font, { size = 1, depth = 0.34, bevel = 0.035, front = materials.chrome(), side = null,
  curveSegments = 10, slant = 0 } = {}) {
  const geometry = new TextGeometry(text, {
    font, size, depth, curveSegments,
    bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel * 0.9, bevelSegments: 5,
  });
  if (slant) geometry.applyMatrix4(new THREE.Matrix4().makeShear(0, 0, slant, 0, 0, 0));
  geometry.computeBoundingBox();
  const bb = geometry.boundingBox;
  geometry.translate(-(bb.min.x + bb.max.x) / 2, -(bb.min.y + bb.max.y) / 2, -(bb.min.z + bb.max.z) / 2);
  const mesh = new THREE.Mesh(geometry, side ? [front, side] : front);
  const group = new THREE.Group();
  group.add(mesh);
  group.userData.size = new THREE.Vector3().subVectors(bb.max, bb.min);
  return group;
}

// Any flat outline, extruded and bevelled.
export function extrudeShape(shape, { depth = 0.2, bevel = 0.03, front = materials.chrome(), side = null, curveSegments = 24 } = {}) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, curveSegments, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 5 });
  geometry.center();
  return new THREE.Mesh(geometry, side ? [front, side] : front);
}

// The classic mouse pointer.
export function makeCursor(opts = {}) {
  const s = new THREE.Shape();
  const pts = [[0, 0], [0, -1.62], [0.38, -1.27], [0.66, -1.9], [0.93, -1.78], [0.65, -1.16], [1.15, -1.16]];
  s.moveTo(...pts[0]);
  for (const p of pts.slice(1)) s.lineTo(...p);
  s.closePath();
  const mesh = extrudeShape(s, { depth: 0.16, bevel: 0.05, ...opts });
  const group = new THREE.Group();
  group.add(mesh);
  return group;
}

export { rad, onSphere, tube };

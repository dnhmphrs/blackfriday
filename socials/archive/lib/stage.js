// Renderer, studio lighting and materials shared by every render page.
import * as THREE from 'three';

export function createStage({ canvas, width, height, pixelRatio = 1, fov = 28 }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(pixelRatio);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.VSMShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 200);

  scene.environment = buildStudioEnvironment(renderer);
  scene.environmentIntensity = 1.0;

  // Key light: the only shadow caster. Everything else comes from the environment.
  const key = new THREE.DirectionalLight(0xffffff, 3.1);
  key.position.set(-5.5, 6.5, 4.5);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.radius = 9;
  key.shadow.blurSamples = 20;
  key.shadow.bias = -0.0004;
  const sc = key.shadow.camera;
  sc.left = -3.2; sc.right = 3.2; sc.top = 3.2; sc.bottom = -3.2; sc.near = 0.5; sc.far = 24;
  scene.add(key, key.target);

  return { renderer, scene, camera, key };
}

// A photo studio painted in the brand's blue: a gradient cyclorama, three softboxes, a strip
// light and a few black flags. Chrome has no colour of its own, so this IS the chrome's look.
// Rendered once into a 1024px cube so mirror reflections stay sharp at poster size.
export function buildStudioEnvironment(renderer, size = 1024) {
  const env = new THREE.Scene();

  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(60, 64, 32),
    new THREE.ShaderMaterial({
      side: THREE.BackSide,
      depthWrite: false,
      vertexShader: /* glsl */ `
        varying vec3 vDir;
        void main() { vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
      fragmentShader: /* glsl */ `
        varying vec3 vDir;
        void main() {
          vec3 d = normalize(vDir);
          vec3 zenith = vec3(0.0, 0.002, 0.035);
          vec3 band   = vec3(0.006, 0.035, 0.52);
          vec3 glow   = vec3(0.05, 0.42, 1.25);
          vec3 floorC = vec3(0.0, 0.003, 0.05);
          float up = d.y;
          vec3 c = mix(band, zenith, smoothstep(0.05, 0.85, up));
          c = mix(c, floorC, smoothstep(0.0, -0.55, up));
          // a soft cyan bloom low on the wall behind the subject, like a lit backdrop
          float behind = smoothstep(0.2, 1.0, -d.z) * (1.0 - smoothstep(0.0, 0.6, abs(up - 0.05)));
          c += glow * behind * 0.9;
          gl_FragColor = vec4(c, 1.0);
        }`,
    })
  );
  env.add(sky);

  const card = (w, h, pos, intensity, tint = [1, 1, 1]) => {
    const m = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ color: new THREE.Color(tint[0] * intensity, tint[1] * intensity, tint[2] * intensity), side: THREE.DoubleSide })
    );
    m.position.set(...pos);
    m.lookAt(0, 0, 0);
    env.add(m);
    return m;
  };
  card(9, 9, [-8, 9, 7], 14);                      // key softbox, up-left of camera
  card(1.6, 14, [10, 3, 3], 16);                   // tall strip, camera right
  card(5, 10, [-9, 2, -8], 5, [0.75, 0.9, 1]);     // cool rim, back left
  card(12, 12, [0, 14, 0], 3.5);                   // overhead
  card(14, 4, [0, -1.5, 14], 1.2);                 // low front fill behind camera
  card(3, 3, [6, 8, -9], 9, [1, 0.96, 0.8]);       // small warm kicker, back right
  card(5, 2.2, [-2, 5.5, 11], 0);                  // black flag: breaks up the front reflection
  card(2.2, 7, [5.5, 0.5, 9.5], 0);                // black flag
  // the white plinth the subject floats over, seen from below
  const plinth = new THREE.Mesh(new THREE.CircleGeometry(3.2, 64), new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.2, 2.3) }));
  plinth.rotation.x = -Math.PI / 2;
  plinth.position.y = -2.2;
  env.add(plinth);

  const pmrem = new THREE.PMREMGenerator(renderer);
  const target = pmrem.fromScene(env, 0, 0.1, 200, { size });
  pmrem.dispose();
  return target.texture;
}

// A square texture drawn with the 2D canvas API (for lettering on flat faces).
export function canvasTexture(size, draw) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export const materials = {
  chrome: () => new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.045 }),
  // a mirror-finish coloured metal, like a tree ornament
  tinted: (r, g, b, roughness = 0.1) => new THREE.MeshStandardMaterial({ color: new THREE.Color(r, g, b), metalness: 1, roughness }),
  gold: () => new THREE.MeshStandardMaterial({ color: new THREE.Color(1.0, 0.78, 0.18), metalness: 1, roughness: 0.1 }),
  gloss: (color, extra = {}) => new THREE.MeshPhysicalMaterial({ color, metalness: 0, roughness: 0.32, clearcoat: 1, clearcoatRoughness: 0.06, ...extra }),
  matte: (color, extra = {}) => new THREE.MeshStandardMaterial({ color, metalness: 0, roughness: 0.82, ...extra }),
};

// The white cylinder everything is displayed on, with a soft blob of shadow on its top.
export function makePlinth({ radius = 1.5, height = 6, shadowRadius = 1.0, shadowStrength = 0.55 } = {}) {
  const group = new THREE.Group();
  const bevel = 0.07;
  const profile = [new THREE.Vector2(0, 0)];
  for (let i = 0; i <= 8; i++) {
    const a = (i / 8) * (Math.PI / 2);
    profile.push(new THREE.Vector2(radius - bevel + Math.sin(a) * bevel, -bevel + Math.cos(a) * bevel));
  }
  profile.push(new THREE.Vector2(radius, -height));
  const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 128), materials.matte(0xffffff, { roughness: 0.62, envMapIntensity: 0.3 }));
  body.receiveShadow = true;
  group.add(body);

  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grad.addColorStop(0, `rgba(10,16,60,${shadowStrength})`);
  grad.addColorStop(0.55, `rgba(10,16,60,${shadowStrength * 0.35})`);
  grad.addColorStop(1, 'rgba(10,16,60,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 256, 256);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  const blob = new THREE.Mesh(new THREE.CircleGeometry(shadowRadius, 48), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }));
  blob.rotation.x = -Math.PI / 2;
  blob.position.y = 0.002;
  group.add(blob);
  group.userData.blob = blob;
  return group;
}

// Every mesh under `root` casts (and optionally receives) the key light's shadow.
export function castShadows(root, receive = false) {
  root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = receive; } });
  return root;
}

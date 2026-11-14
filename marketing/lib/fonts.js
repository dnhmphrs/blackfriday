// Open-licence fonts (from the @fontsource npm packages) for extruded 3D lettering.
import { TTFLoader } from 'three/addons/loaders/TTFLoader.js';
import { Font } from 'three/addons/loaders/FontLoader.js';

const FILES = {
  black: '/node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff',
  bold: '/node_modules/@fontsource/arimo/files/arimo-latin-700-normal.woff',
  boldItalic: '/node_modules/@fontsource/arimo/files/arimo-latin-700-italic.woff',
  blackItalic: '/node_modules/@fontsource/archivo/files/archivo-latin-900-italic.woff',
};
const cache = new Map();

export function loadFont(name) {
  if (!cache.has(name)) cache.set(name, new TTFLoader().loadAsync(FILES[name]).then((json) => new Font(json)));
  return cache.get(name);
}

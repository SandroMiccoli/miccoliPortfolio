import * as THREE from '../vendor/three.module.min.js';

/**
 * One row of white glyphs on a transparent canvas. The shader tints them.
 * @param {string[]} glyphs
 * @param {{ family: string, weight: number }} font
 */
export function createGlyphAtlas(glyphs, font) {
  const cell = 64;
  const canvas = document.createElement('canvas');
  canvas.width = cell * glyphs.length;
  canvas.height = cell;
  const context = canvas.getContext('2d', { alpha: true });
  if (!context) throw new Error('Could not create the glyph atlas.');

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = '#ffffff';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.font = `${font.weight} ${Math.floor(cell * 0.62)}px ${font.family}`;
  glyphs.forEach((glyph, index) => {
    context.fillText(glyph, cell * index + cell / 2, cell / 2 + cell * 0.04);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
}

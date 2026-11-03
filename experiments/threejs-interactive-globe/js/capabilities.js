/**
 * Reasons to leave the poster up and skip Three.js.
 * The demo checks this before it downloads the globe module.
 */

export function prefersPoster() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
  if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return true;
  if (navigator.connection?.saveData) return true;
  if (!webglAvailable()) return true;
  return false;
}

export function labelPoster(root) {
  if (!root.hasAttribute('aria-label')) {
    root.setAttribute('aria-label', 'Globe of images.');
  }
}

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

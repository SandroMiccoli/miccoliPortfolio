/**
 * Visual defaults for the ASCII 404.
 * Sliders, colors, and the glyph set live here.
 */

export const FONT_FAMILY = 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace';

export const SYMBOLS = [
  '0', '1', '.', '*', '+', ':', ';', '/', '\\', '<', '>', '{', '}', '[', ']', '#', '=', '_', '|',
];

/** @type {Readonly<Record<string, number | string | boolean>>} */
export const DEFAULTS = {
  "elementDensity": 1.05,
  "elementSize": 5,
  "symbolVariety": 19,
  "glyphCycle": false,
  "contourWidth": 0.024,
  "fillDensity": 0.05,
  "logoScale": 1.05,
  "contrast": 1,
  "motionAmount": 1.5,
  "pointerFollow": 1,
  "pointerRadius": 0.22,
  "hoverLift": 40,
  "pointerFalloff": 1.75,
  "pointerSwell": 0.5,
  "backgroundDensity": 1.5,
  "backgroundOpacity": 0.8,
  "ink": "#0a0c0b",
  "accent": "#55d99b"
};

/**
 * @typedef {Object} SliderControl
 * @property {string} key
 * @property {string} name
 * @property {number} min
 * @property {number} max
 * @property {number} step
 * @property {number} digits
 */

/** @type {SliderControl[]} */
export const SLIDERS = [
  { key: 'elementDensity', name: 'Element count', min: 0.3, max: 1.7, step: 0.05, digits: 2 },
  { key: 'elementSize', name: 'Element size', min: 5, max: 18, step: 1, digits: 0 },
  { key: 'symbolVariety', name: 'Symbol variety', min: 2, max: SYMBOLS.length, step: 1, digits: 0 },
  { key: 'contourWidth', name: 'Contour width', min: 0.006, max: 0.05, step: 0.002, digits: 3 },
  { key: 'fillDensity', name: 'Inner fill', min: 0.05, max: 1, step: 0.05, digits: 2 },
  { key: 'logoScale', name: '404 scale', min: 0.55, max: 1.35, step: 0.05, digits: 2 },
  { key: 'contrast', name: 'Contrast', min: 0.25, max: 1, step: 0.05, digits: 2 },
  { key: 'motionAmount', name: 'Idle motion', min: 0, max: 1.5, step: 0.05, digits: 2 },
  { key: 'backgroundDensity', name: 'Background count', min: 0, max: 1.5, step: 0.05, digits: 2 },
  { key: 'backgroundOpacity', name: 'Background opacity', min: 0, max: 0.8, step: 0.05, digits: 2 },
];

/** Pointer reaction. `hoverLift` is the push, in pixels. */
export const POINTER_SLIDERS = [
  { key: 'pointerFollow', name: 'Follow', min: 0.05, max: 1, step: 0.01, digits: 2 },
  { key: 'pointerRadius', name: 'Radius', min: 0.05, max: 0.8, step: 0.01, digits: 2 },
  { key: 'hoverLift', name: 'Force', min: 0, max: 160, step: 2, digits: 0 },
  { key: 'pointerFalloff', name: 'Falloff', min: 0.4, max: 3, step: 0.05, digits: 2 },
  { key: 'pointerSwell', name: 'Swell', min: 0, max: 1.5, step: 0.05, digits: 2 },
];

const SYMBOL_CACHE = SYMBOLS.map((_, index) => SYMBOLS.slice(0, index + 1));

const STORAGE_KEY = 'paragon-404-settings';

/**
 * @param {number} variety
 * @returns {string[]}
 */
export function symbolsFor(variety) {
  const count = Math.max(2, Math.min(SYMBOLS.length, Math.round(variety)));
  return SYMBOL_CACHE[count - 1];
}

/**
 * @param {unknown} input
 * @returns {Record<string, number | string | boolean>}
 */
export function sanitizeSettings(input) {
  const next = { ...DEFAULTS };
  if (!input || typeof input !== 'object') return next;
  const source = /** @type {Record<string, unknown>} */ (input);

  for (const control of SLIDERS.concat(POINTER_SLIDERS)) {
    const value = source[control.key];
    if (typeof value !== 'number' || !Number.isFinite(value)) continue;
    const clamped = Math.min(control.max, Math.max(control.min, value));
    next[control.key] = control.digits === 0 ? Math.round(clamped) : clamped;
  }

  if (typeof source.glyphCycle === 'boolean') next.glyphCycle = source.glyphCycle;

  for (const key of ['ink', 'accent']) {
    const value = source[key];
    if (typeof value === 'string' && /^#[0-9a-fA-F]{6}$/.test(value)) {
      next[key] = value.toLowerCase();
    }
  }

  return next;
}

/**
 * @returns {Record<string, number | string | boolean>}
 */
export function loadSettings() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    return sanitizeSettings(JSON.parse(raw));
  } catch {
    return { ...DEFAULTS };
  }
}

/**
 * @param {Record<string, number | string | boolean>} settings
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizeSettings(settings)));
  } catch {
    // Private mode or a full disk should not stop the artwork.
  }
}

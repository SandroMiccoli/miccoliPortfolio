/**
 * Everything visual and editorial lives here.
 * Devs: edit `layers` for the hover cards, and `density` for how tight the glyph grid is.
 */

/**
 * @typedef {Object} AsciiLayer
 * @property {number} id
 * @property {string} label
 * @property {'json' | 'text' | 'image'} type
 * @property {Record<string, string | number | boolean>} [json]
 * @property {string} [title]
 * @property {string} [body]
 * @property {string} [src] Image URL. Relative paths resolve from the experiment folder. Absolute and remote URLs are used as given.
 * @property {string} [alt]
 * @property {string} [caption]
 */

/**
 * @typedef {Object} AsciiStackConfig
 * @property {string[]} glyphs
 * @property {number} columns
 * @property {number} rowSpan
 * @property {number} density Multiplier for the grid. 1 is the base. Higher is tighter.
 * @property {number} lateralSteps
 * @property {number} side
 * @property {number} thickness
 * @property {number} cornerRadius
 * @property {number} baseLayerSpacing
 * @property {number} spacingPullPx
 * @property {number} yaw
 * @property {number} pitch
 * @property {number} dprCap
 * @property {{ widthDiv: number, heightDiv: number, centerShift: number, centerShiftMax: number }} frame
 * @property {{ linear: number, perimeter: number }} flow
 * @property {number} glyphCycleMs
 * @property {number} glyphFadeStart
 * @property {number} glyphFadeWidth
 * @property {{ ink: string, hover: string, paper: string }} colors
 * @property {{ ease: number, offsets: Record<number, number[]> }} hover
 * @property {{ horizontal: { tone: number, scale: number }, lateral: { tone: number, scale: number } }} surface
 * @property {{ family: string, weight: number, min: number, max: number, factor: number }} font
 * @property {AsciiLayer[]} layers
 */

/** @type {AsciiStackConfig} */
export const defaultConfig = {
  glyphs: ['>', '<', '*', '0', ':', '[', ']', '{', '}', '\\', '/', '#', ';'],
  columns: 36,
  rowSpan: 12,
  density: 1.3,
  lateralSteps: 2,
  side: 4.15,
  thickness: 0.64,
  cornerRadius: 0.34,
  baseLayerSpacing: 1.85,
  spacingPullPx: 30,
  yaw: -0.78,
  pitch: -0.38,
  dprCap: 1.5,
  frame: {
    widthDiv: 8.5,
    heightDiv: 7.4,
    centerShift: 0.035,
    centerShiftMax: 26,
  },
  flow: {
    linear: 0.00016,
    perimeter: 0.00018,
  },
  glyphCycleMs: 4300,
  glyphFadeStart: 0.58,
  glyphFadeWidth: 0.42,
  colors: {
    ink: '#141311',
    hover: '#55D99B',
    paper: '#f2f0eb',
  },
  hover: {
    ease: 0.82,
    offsets: {
      0: [22, 0, 0],
      1: [13, 0, -13],
      2: [0, 0, -22],
    },
  },
  surface: {
    horizontal: { tone: 0.24, scale: 0.92 },
    lateral: { tone: 0.98, scale: 1.1 },
  },
  font: {
    family: '"Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace',
    weight: 500,
    min: 6.5,
    max: 20.5,
    factor: 0.1,
  },
  layers: [
    {
      id: 0,
      label: 'LAYER / 01',
      type: 'json',
      json: {
        position: 'upper',
        geometry: 'rounded-square',
        flow: 'alternating',
        state: 'hovered',
      },
    },
    {
      id: 1,
      label: 'LAYER / 02',
      type: 'text',
      title: 'Middle plate',
      body: 'Replace this with a short line about the layer. The card stays anchored to the stack.',
    },
    {
      id: 2,
      label: 'LAYER / 03',
      type: 'image',
      src: 'assets/placeholder.svg',
      alt: 'Placeholder thumbnail for the lower layer',
      caption: 'Swap this for a product image.',
    },
  ],
};

/**
 * @param {Partial<AsciiStackConfig>} [overrides]
 * @returns {AsciiStackConfig}
 */
export function resolveConfig(overrides = {}) {
  return merge(defaultConfig, overrides);
}

/**
 * @param {Record<string, any>} base
 * @param {Record<string, any>} extra
 */
function merge(base, extra) {
  const out = Array.isArray(base) ? base.slice() : { ...base };
  for (const key of Object.keys(extra)) {
    const value = extra[key];
    const current = base[key];
    if (
      value &&
      typeof value === 'object' &&
      !Array.isArray(value) &&
      current &&
      typeof current === 'object' &&
      !Array.isArray(current)
    ) {
      out[key] = merge(current, value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

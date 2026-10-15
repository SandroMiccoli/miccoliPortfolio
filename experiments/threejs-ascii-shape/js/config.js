/**
 * Everything visual and editorial lives here.
 * Devs: edit `layers` for the hover cards, and `density` for how tight the glyph grid is.
 */

/**
 * @typedef {Object} AsciiLayer
 * @property {number} id
 * @property {string} label
 * @property {'agent' | 'tools' | 'permissions' | 'json' | 'text' | 'image'} [kind]
 * @property {'json' | 'text' | 'image'} [type]
 * @property {string} [message]
 * @property {string[]} [references]
 * @property {string} [call]
 * @property {string} [meta]
 * @property {string} [action]
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
 * @property {number} spin Yaw added per 60fps frame. Automatic only — the stack cannot be dragged.
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
  spin: 0.0017,
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
      kind: 'agent',
      label: '01 / AGENT',
      message: 'I found two open decisions and one security dependency.',
      references: ['↗ launch-notes.md', '↗ decision-log'],
    },
    {
      id: 1,
      kind: 'tools',
      label: '02 / CONTEXT',
      call: 'search_context()',
      meta: '04 SOURCES · CONNECTED',
    },
    {
      id: 2,
      kind: 'permissions',
      label: '03 / PERMISSIONS',
      title: 'Scoped access.',
      action: 'ASK BEFORE ACTING ↗',
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

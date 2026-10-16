/**
 * Edit this file to recolor the globe, change the spin, or retune the cards.
 * `mountGlobe(element, { ... })` overrides any of these per embed.
 */

/** Card fills. The list repeats around the sphere. Four or five reads best. */
export const cardColors = [
  '#C7DBFF',
  '#6A9CF8',
  '#A7E6E4',
  '#DEEB91',
  '#E7F3C4',
];

export const defaultConfig = {
  colors: cardColors,
  /** Back faces mix toward this color. 0 is the same as the front, 1 is flat wash. */
  backMix: 0.58,
  backWash: '#F7FBFF',
  /** Extra wash on the silhouette of front faces, so the limb of the sphere softens. */
  rimMix: 0.2,
  /** Page color behind the gaps. Use 'transparent' to inherit the host page. */
  background: '#F8FAFF',

  /** Sphere radius in world units. The camera frames this, so it does not change the on-screen size. */
  radius: 1.4,
  bands: 4,
  /** How far the cards reach toward each pole, in degrees. The caps past this are the holes. */
  latLimit: 68,
  /** Empty share of each cell. Higher opens the white gaps. */
  gap: 0.15,
  /** Card width / height. 1.12 is a little taller than a wide 4:3 card. */
  aspect: 0.85,
  /** 0 is a perfect grid. Keep this under 0.6 so neighbors do not collide. */
  jitter: 0.28,
  /** Uniform size variation, as a fraction. 0.04 is plus or minus 4%. */
  scaleJitter: 0.035,
  /** Random in-plane tilt, in degrees. */
  roll: 3,
  /** Corner radius as a fraction of the card's short side. */
  cornerRadius: 0.12,
  /** Colored frame around each photo, as a fraction of the card's short side. */
  imageInset: 0.11,
  /** Inner photo corner, as a fraction of the photo's short side. */
  imageRadius: 0.12,

  segmentsX: 8,
  segmentsY: 12,

  /** Radians per second around the pole axis. 0.15 is a full turn in about 42 seconds. */
  spinSpeed: 0.15,
  /**
   * Where the holes point while the globe is at rest.
   * x is right, y is up, z is toward the camera. Keep z small so a hole
   * stays off to the side instead of facing the viewer. x and y together
   * set the diagonal.
   */
  poleAxis: { x: 0.5, y: 0.92, z: 0.0 },
  /** Seconds of coast after a release. Larger lingers longer. */
  inertia: 0.48,
  /** Fastest flick, in radians per second. */
  inertiaMax: 5.6,
  /** Seconds to ease the holes back onto poleAxis after a release. */
  returnSeconds: 2.1,
  /** 1 keeps a point under the finger. Lower it if the drag feels too fast. */
  drag: 1,
  /** Radians applied per arrow-key repeat. */
  keyStep: 0.045,

  cameraFov: 30,
  /** Frame padding. 1 is flush with the viewport. */
  cameraMargin: 1.16,

  pixelRatioMax: 2,
  pixelBudget: 8000000,
  atlasMaxSize: 2048,
  atlasCellHeight: 192,
  /** Longest side of a decoded photo, before it is painted into the atlas. */
  decodeWidth: 512,
};

export function resolveConfig(overrides = {}) {
  const colors = overrides.colors?.length ? overrides.colors : defaultConfig.colors;
  return {
    ...defaultConfig,
    ...overrides,
    colors: colors.slice(),
    poleAxis: { ...defaultConfig.poleAxis, ...overrides.poleAxis },
    bands: Math.max(1, Math.round(overrides.bands ?? defaultConfig.bands)),
    gap: clamp(overrides.gap ?? defaultConfig.gap, 0.04, 0.45),
    cornerRadius: clamp(overrides.cornerRadius ?? defaultConfig.cornerRadius, 0.02, 0.45),
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

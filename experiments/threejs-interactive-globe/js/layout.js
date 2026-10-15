/**
 * Bands of rounded cards on a sphere.
 * Width and height stay at the configured aspect, so atlas photos are not stretched.
 * @param {import('./config.js').defaultConfig} config
 */
export function layoutCards(config) {
  const radius = config.radius;
  const bands = config.bands;
  const latLimit = (config.latLimit * Math.PI) / 180;
  const latStep = (latLimit * 2) / bands;
  const gap = config.gap;
  const aspect = config.aspect;
  const rollMax = (config.roll * Math.PI) / 180;
  const cards = [];

  for (let band = 0; band < bands; band += 1) {
    const lat = -latLimit + (band + 0.5) * latStep;
    const cosLat = Math.max(0.12, Math.cos(lat));
    const parallel = Math.PI * 2 * radius * cosLat;
    const bandHeight = latStep * radius * (1 - gap);
    const targetWidth = bandHeight * aspect;
    let count = Math.round(parallel / (targetWidth / (1 - gap)));
    count = Math.max(3, count);

    const lonStep = (Math.PI * 2) / count;
    const slotWidth = lonStep * radius * cosLat * (1 - gap);
    const width = Math.min(slotWidth, targetWidth);
    const height = width / aspect;
    const shift = (band % 2) * 0.5;

    for (let i = 0; i < count; i += 1) {
      const index = cards.length;
      const scale = 1 + (hash(index + 4.7) - 0.5) * 2 * config.scaleJitter;
      const safeScale = Math.min(scale, slotWidth / Math.max(width, 1e-4));
      cards.push({
        lat: lat + (hash(index + 8.3) - 0.5) * latStep * gap * config.jitter * 0.55,
        lon: (shift + i + 0.5) * lonStep + (hash(index + 1.1) - 0.5) * lonStep * gap * config.jitter,
        width: width * safeScale,
        height: height * safeScale,
        roll: (hash(index + 2.2) - 0.5) * 2 * rollMax,
        band,
      });
    }
  }

  return cards;
}

function hash(n) {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return x - Math.floor(x);
}

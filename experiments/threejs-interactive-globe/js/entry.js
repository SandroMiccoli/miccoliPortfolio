/**
 * Entry for the IIFE build (`npm run build` in this folder).
 * The bundle assigns these named exports to the global `InteractiveGlobe`.
 * The lab demo imports `js/globe.js` and does not load this file.
 */
export { initGlobe, mountGlobe } from './globe.js';

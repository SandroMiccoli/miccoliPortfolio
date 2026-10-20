import { gsap } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/+esm';
import { ScrollTrigger } from 'https://cdn.jsdelivr.net/npm/gsap@3.13.0/ScrollTrigger.js/+esm';
import { mountEyebrowMarks } from './js/eyebrow-mark.js';

// The demo imports GSAP from a CDN so it runs without a build.
// On the production site, import gsap from the app's own dependency and pass it in.
mountEyebrowMarks({ gsap, ScrollTrigger });

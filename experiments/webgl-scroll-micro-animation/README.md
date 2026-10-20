# WebGL Scroll Micro-Animation

A small metaball mark drawn with WebGL2. Scroll position drives the shader clock (`uTime`). While the page is still, the mark holds the current frame. Scroll down and it plays forward. Scroll up and it plays backward.

The canvas is transparent. The page background shows through the gaps around the lobes.

## Run the demo

From the repository root:

```bash
npx --yes serve -p 4173
```

Open `http://localhost:4173/experiments/webgl-scroll-micro-animation/`.

In the lab, the same page is injected into `.lab-experiment-demo`, which is the element that actually scrolls. The script looks for that shell, then for any other overflow ancestor, and otherwise uses the window.

## What moves, and what does not

The original TouchDesigner shader has two modes:

- `uProgress < 0` plays `animatedMorph(uTime)`: hold as one circle, split into two lobes, hold, merge back.
- `uProgress` from 0 to 1 scrubs a single split, with the same ease.

This demo keeps the cycle (`uProgress = -1`) and replaces the clock. Scroll position is turned into `uTime`:

```text
cycles = scrollTop / pixelsPerCycle + phase
uTime  = cycles / uAnimSpeed
```

`pixelsPerCycle` defaults to 900. One full split-and-return takes 900 pixels of scroll. `phase` is a 0 to 1 offset into that cycle. `0` starts as a single circle at the top of the page. `0.5` starts on the two-lobe hold.

Nothing is animated on `requestAnimationFrame`. GSAP ScrollTrigger only redraws when the scroll position changes, so a resting page is a resting mark.

`prefers-reduced-motion: reduce` disables that link and draws the two-lobe pose (`uProgress = 1`).

## Transparent background

The TouchDesigner version mixed a solid `uBackground` into the RGB and stored coverage in alpha. The web port keeps the coverage and writes premultiplied color:

```glsl
fragColor = vec4(uColor * coverage, coverage);
```

The context is created with `alpha: true` and `premultipliedAlpha: true`, and the blend mode is `ONE, ONE_MINUS_SRC_ALPHA`. No background uniform is required. Put the canvas on whatever surface the layout already has.

`uEdgeSoft` is set from the canvas height (about 1.5 CSS pixels) so the rim stays smooth when the mark is small. The TouchDesigner value of `0.001` assumed a large TOP.

## Embed it on the production site

Copy `js/eyebrow-mark.js`. The shader lives in that file. You do not need `index.html`, `style.css`, or `main.js`. Those are the demo page.

The production bundle should use the site's own GSAP. Do not load a second copy from the CDN.

```javascript
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { mountEyebrowMarks } from './eyebrow-mark.js';

mountEyebrowMarks({ gsap, ScrollTrigger });
```

If the site already loads GSAP and ScrollTrigger as globals, call `mountEyebrowMarks()` with no arguments.

### 1. Place a canvas

The script finds every `canvas[data-eyebrow]`. Size it with CSS. The lobes are sized from the canvas height, and the shape is about 2.3 times as wide as it is tall, so keep the aspect ratio near `2.45 / 1` or the sides will clip.

```html
<canvas class="eyebrow" data-eyebrow aria-hidden="true"></canvas>
```

```css
.eyebrow {
  display: block;
  width: 6rem;
  aspect-ratio: 2.45 / 1;
  background: transparent;
  pointer-events: none;
}
```

`pointer-events: none` lets clicks fall through to a parent link if the mark sits inside one. `aria-hidden` fits a decorative mark. If a placement is the actual logo, drop `aria-hidden` and set `role="img"` plus `aria-label`.

Three placements used in the demo:

- Corner: grid or flex item aligned to the end of a row (`justify-self: end`).
- Between sections: a zero-height wrapper, canvas centered with `transform: translate(-50%, -50%)`, and a z-index above the two bands so their backgrounds do not cover the lower half.
- Center: a normal-flow canvas with `margin-inline: auto`, or a flex column with `align-items: center`.

Call `mountEyebrowMarks` once, after the canvases are in the document. It returns a destroy function for route changes:

```javascript
const destroy = mountEyebrowMarks({ gsap, ScrollTrigger });
// later
destroy();
```

### 2. Scroll parent

ScrollTrigger has to listen to the element that actually scrolls.

- Window scroll: detected automatically.
- A div with `overflow: auto` or `overflow: scroll`: the nearest ancestor that already overflows is used.
- This lab: `.lab-experiment-demo` is preferred when the page is injected into it.

If the mark never moves, the wrong element was chosen. Pass it yourself:

```javascript
mountEyebrowMarks({
  gsap,
  ScrollTrigger,
  scroller: document.querySelector('.site-scroll'),
});
```

Use `scroller: window` to force the viewport.

### 3. Tune the motion

```javascript
mountEyebrowMarks({
  gsap,
  ScrollTrigger,
  pixelsPerCycle: 900,
  phase: 0,
  color: [0.965, 0.447, 0.125], // #F67220
  frameScale: 3.3,
});
```

| Option | Default | Effect |
| --- | --- | --- |
| `pixelsPerCycle` | `900` | Scroll distance for one full cycle. Larger is slower. |
| `phase` | `0` | Where in the cycle the top of the page sits. |
| `color` | orange `#F67220` | Linear RGB, 0 to 1. |
| `frameScale` | `3.3` | Zooms the TouchDesigner radii so the mark fills a tight canvas. |
| `selector` | `[data-eyebrow]` | Which canvases to mount. |
| `root` | `document` | Where to query for those canvases. |
| `scroller` | auto | Element or `window`. |

Every mounted canvas shares one clock, so every mark on the page shows the same pose. That is what you want when the mark is repeated.

`frameScale` multiplies `uRadius`, `uSpread`, `uCenterRadius`, and `uMergeK` together. Change those four as a set if you edit `EYEBROW_DEFAULTS` in the file. Changing only the radius detaches the neck from the lobes.

### 4. Own the clock

`EyebrowMark` is exported for a placement that should not follow the page clock. `progress` below 0 plays `time`. `progress` from 0 to 1 is a single split.

```javascript
import { EyebrowMark } from './eyebrow-mark.js';

const mark = new EyebrowMark(canvas);
mark.resize();
mark.draw(0, -1);

// One split as this canvas crosses the viewport:
ScrollTrigger.create({
  trigger: canvas,
  start: 'top bottom',
  end: 'center center',
  scrub: true,
  onUpdate: (self) => {
    mark.resize();
    mark.draw(0, self.progress);
  },
});
```

Still no wall-clock animation. Pass the value in from ScrollTrigger, or from any other control, and stop passing it when you want the frame to hold.

## Files

| File | Role |
| --- | --- |
| `js/eyebrow-mark.js` | Shader, WebGL draw, scroll clock. This is the piece to copy. |
| `main.js` | Demo-only CDN import of GSAP. |
| `index.html`, `style.css` | Fictional page that shows corner, divider, and center placements. |

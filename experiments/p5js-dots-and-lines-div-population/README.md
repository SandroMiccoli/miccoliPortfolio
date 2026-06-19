# p5.js — Dots and Lines · Div Population

A drop-in, **scroll-driven** spin-off of the original
[`p5js-dots-and-lines`](../p5js-dots-and-lines/) hero animation.

Instead of one full-screen sketch, this version scans your page for marked
containers and grows an independent `<canvas>` inside each one. Every module
renders a small grid of dots plus a **single tracer** whose motion blends a
gentle idle drift with page scroll:

- **idle** → the tracer drifts slowly forward so the animation is always visibly alive
- **scroll down** → tracer speeds up, drawing forward through the grid
- **scroll up** → tracer reverses; if the idle speed is exceeded it traces backward
- **stop scrolling** → velocity eases to idle speed (no hard stop)

It's monochrome by default (`#F6F6F6` resting dots, `#E4E4E4` lit dots and
lines) and lightly mouse-interactive (dots near the cursor swell).

---

## Running the demo

No build step required.

### Option A — just open the file

Double-click `index.html` in your file manager.  
Works in Chrome, Edge, and Safari. Firefox may block local-file canvas due to
CORS policy; use one of the server options below in that case.

### Option B — Python built-in server (no install)

```bash
# Python 3
cd experiments/p5js-dots-and-lines-div-population
python -m http.server 8080
```

Open <http://localhost:8080> in your browser.

### Option C — VS Code Live Server

If you have the **Live Server** extension installed, right-click `index.html`
and choose *Open with Live Server*. It reloads automatically on save.

### Option D — any static file server

```bash
# npx serve (no global install needed)
npx serve experiments/p5js-dots-and-lines-div-population

# npx http-server
npx http-server experiments/p5js-dots-and-lines-div-population -p 8080
```

---

## Quick start

Add the two scripts once, then drop a marked `<div>` anywhere you want a
module. That's the whole integration.

```html
<!-- 1. A container. Size it however you like with your own CSS. -->
<div class="my-accent" data-dots-lines></div>

<!-- 2. The dependencies (p5 required, GSAP optional) -->
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js"></script>

<!-- 3. The library — auto-scans the page on load -->
<script src="dots-lines.js"></script>
```

```css
.my-accent {
	width: 100%;
	height: 200px; /* the canvas always fills its container */
}
```

Any element matching `[data-dots-lines]` is upgraded automatically once the
DOM is ready. The injected `<canvas>` fills its container — **a module is only
ever as big as the `<div>` you give it.** Resize the container and the grid
rebuilds itself.

> GSAP is optional. When present the shared scroll ticker rides on
> `gsap.ticker`; without it the library uses its own `requestAnimationFrame`
> loop. The scroll feel is identical either way.

---

## Placing modules in section corners

The typical pattern from the demo: make the section `position: relative;
overflow: hidden`, then place the module div **outside** the `.wrap` content
container so it bleeds to the edge.

```html
<section class="my-section">
  <!-- module sits behind content, absolute in the corner -->
  <div class="dl dl--corner-tr" data-dots-lines></div>

  <div class="wrap">
    <!-- your content here, needs position:relative; z-index:1 to sit above -->
  </div>
</section>
```

```css
.my-section {
	position: relative;
	overflow: hidden;
}

/* corner module: copy and adjust as needed */
.dl--corner-tr {
	position: absolute;
	top: 0;
	right: 0;
	width: 260px;
	height: 340px;
	pointer-events: none; /* content stays clickable */
	z-index: 0;
}

.my-section .wrap {
	position: relative;
	z-index: 1;
}
```

---

## Configuration

Every option can be overridden per element with a `data-dl-*` attribute
(camelCase → kebab-case, e.g. `idleSpeed` → `data-dl-idle-speed`).

| Option            | Attribute                   | Default         | What it does                                            |
| ----------------- | --------------------------- | --------------- | ------------------------------------------------------- |
| `spacing`         | `data-dl-spacing`           | `26`            | px between grid points (smaller = denser)               |
| `dotSize`         | `data-dl-dot-size`          | `0.34`          | dot diameter as a fraction of `spacing`                 |
| `density`         | `data-dl-density`           | `0.6`           | `0–1`, share of the grid that carries a dot             |
| `noiseScale`      | `data-dl-noise-scale`       | `0.14`          | size of the organic blank patches                       |
| `speed`           | `data-dl-speed`             | `1`             | multiplier on scroll velocity → tracer motion           |
| `idleSpeed`       | `data-dl-idle-speed`        | `2`             | cells/sec the tracer drifts when not scrolling (`0` = halt) |
| `maxStep`         | `data-dl-max-step`          | `1.4`           | hard clamp on cells advanced per frame                  |
| `trailCells`      | `data-dl-trail-cells`       | `7`             | length of the glowing trail behind the head             |
| `lineWeight`      | `data-dl-line-weight`       | `2`             | tracer stroke weight (px)                               |
| `turnChance`      | `data-dl-turn-chance`       | `0.08`          | probability the tracer turns at a node                  |
| `bg`              | `data-dl-bg`                | `transparent`   | canvas background (`transparent` clears each frame)     |
| `inactive`        | `data-dl-inactive`          | `#F6F6F6`       | resting dot colour                                      |
| `active`          | `data-dl-active`            | `#E4E4E4`       | lit dots + tracer line colour                           |
| `hoverRadius`     | `data-dl-hover-radius`      | `80`            | px radius of the mouse influence                        |
| `hoverBoost`      | `data-dl-hover-boost`       | `0.9`           | extra scale on dots under the cursor                    |
| `breathe`         | `data-dl-breathe`           | `0.16`          | amplitude of the idle dot pulsing (`0` = off)           |
| `pixelDensityCap` | `data-dl-pixel-density-cap` | `2`             | upper bound on devicePixelRatio                         |
| `seed`            | `data-dl-seed`              | `null`          | fixed layout seed (omit for a random layout per module) |

### Examples

Subtle accent in a section corner:

```html
<div data-dots-lines data-dl-spacing="22" data-dl-idle-speed="1.5"
     data-dl-inactive="#E8E8E8" data-dl-active="#C8C8C8"></div>
```

Faster, denser strip that reacts hard to scrolling:

```html
<div data-dots-lines data-dl-spacing="16" data-dl-speed="1.8"
     data-dl-idle-speed="3" data-dl-trail-cells="5"></div>
```

---

## JavaScript API

```js
// Re-scan with a custom selector and/or default overrides for this batch:
DotsAndLines.init('[data-dots-lines]', { idleSpeed: 3, trailCells: 9 });

// Upgrade a single element created dynamically:
const el = document.querySelector('#late-module');
DotsAndLines.create(el, { spacing: 20 });

// Inspect everything that's running:
DotsAndLines.instances; // → array of p5 instances
```

### Opting out of auto-init

Add `data-dl-manual` to `<body>`, then call `DotsAndLines.init()` yourself
(e.g. after your router finishes painting a route).

```html
<body data-dl-manual>
  ...
  <script>
    DotsAndLines.init();
  </script>
</body>
```

---

## Scroll input sources

The library listens on three input sources so animation works in every context:

| Source      | Covers                                               |
| ----------- | ---------------------------------------------------- |
| `wheel`     | Mouse wheel, trackpad, within iframes / custom containers |
| `scroll`    | Keyboard navigation (arrow keys, Page Down, spacebar) |
| `touchmove` | Mobile swipe                                         |

---

## Performance notes

- **One shared scroll driver.** Velocity is computed once per frame and read by every module, so adding modules adds no scroll overhead.
- **Off-screen modules pause.** Each canvas is watched with an `IntersectionObserver`; when it scrolls out of view its p5 draw loop stops (`noLoop`) and resumes on re-entry. Idle modules cost ~0.
- **Bounded work per module.** Each module owns a small grid and exactly one tracer. The tracer's stored path is capped (`maxPath`) and the trail length is fixed, so memory and per-frame cost stay flat no matter how far you scroll.
- **Capped pixel density.** Retina sharpness up to `pixelDensityCap` (default 2) to avoid 3×/4× overdraw on very dense displays.

### If you need many more modules (100+)

The current design uses one p5 instance per div. For extreme counts you'd want
a single renderer driving many canvases from one `rAF` loop (shared grid math,
batched draws), or an `OffscreenCanvas` + worker approach. The module/grid/tracer
logic is written so it could be lifted into such a manager without changing
the visual behaviour — but for typical landing pages (a handful to a couple
dozen modules), the instance-per-div approach with viewport pausing is the
simpler, plenty-fast choice.

---

## Files

| File            | Purpose                                                           |
| --------------- | ----------------------------------------------------------------- |
| `dots-lines.js` | The reusable library — scroll driver, sketch factory, public API. |
| `index.html`    | A fictional landing page demoing modules across 10 sections.      |
| `style.css`     | Styling for the **demo page only** (the library ships no CSS).    |

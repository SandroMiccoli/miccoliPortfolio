# Vanilla JS — Dots and Trails

A full-viewport canvas animation where cursor movement **orchestrates** colored
geometric dots on a grid. Nearby circles connect with alignment-aware lines;
intensity eases in and out for a soft trailing effect. A gray-dot resting
texture sits on top and fades away during interaction.

On **mobile** (≤768px by default) the live canvas is replaced by a **static
blended image** — resting dots plus pre-drawn trail strokes — so touch devices
get the look without running the animation loop.

No build step. No dependencies. Plain Canvas API.

---

## Running the demo

```bash
cd experiments/vanilla-js-dots-and-trails
python -m http.server 8080
```

Open <http://localhost:8080>.

---

## How it works

```
┌─────────────────────────────────────────┐
│  .app                                   │
│  ┌───────────────────────────────────┐  │
│  │  <canvas id="c">                  │  │  ← desktop: live animation
│  │  (hidden on mobile)               │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  #staticDots (background-image)   │  │  ← resting gray dots;
│  │                                   │  │    fades on cursor move (desktop)
│  └───────────────────────────────────┘  │    OR full static preview (mobile)
│  ┌───────────────────────────────────┐  │
│  │  #heroStage (optional overlay)    │  │  ← landing-page mockup; hidden
│  └───────────────────────────────────┘  │    unless you add .is-visible
└─────────────────────────────────────────┘
```

| Layer | Desktop | Mobile |
| ----- | ------- | ------ |
| Canvas | Interactive trail | Hidden |
| `#staticDots` | Gray resting texture; hides while cursor moves | Blended static image (resting + trail strokes) |
| `#heroStage` | Optional content overlay | Same |

**`grid-trail.js`** — the reusable animation module (`GridTrail` global).  
**`main.js`** — demo boot logic: picks mobile vs desktop, reads `STATIC_LAYOUT`.  
**`style.css`** — layout, cursor, hero mockup, mobile/desktop classes.

---

## Quick start — embed on another page

### 1. Copy the files you need

| File | Required? | Notes |
| ---- | --------- | ----- |
| `grid-trail.js` | Yes | The animation library |
| `main.js` | Optional | Demo boot; copy or adapt |
| `style.css` | Partial | At minimum: `.app`, `canvas`, `#staticDots`, `.is-mobile` rules |

### 2. Add the HTML shell

```html
<!-- Full-viewport background behind your content -->
<div class="app">
  <canvas id="c" aria-hidden="true"></canvas>
  <div id="staticDots" aria-hidden="true"></div>

  <!-- Your page content sits above the animation -->
  <main class="your-content" style="position:relative; z-index:2;">
    ...
  </main>
</div>

<script src="/path/to/grid-trail.js"></script>
<script src="/path/to/main.js"></script>
```

For a **section-sized** module instead of full viewport, wrap the canvas in a
sized container and pass explicit `width` / `height` to
`GridTrail.renderStaticPreview()` (see API below). The live `create()` path
currently sizes to `window` — adapt `resize()` in `grid-trail.js` if you need
a bounded interactive canvas.

### 3. Include the CSS

Link `style.css`, or copy the rules for `.app`, `canvas`, `#staticDots`, and
the `.app.is-mobile` block. Set `pointer-events: none` on the animation layers
so clicks reach your content.

### 4. Boot without `main.js` (minimal)

```html
<script src="grid-trail.js"></script>
<script>
  const canvas = document.getElementById('c');
  const staticDots = document.getElementById('staticDots');

  // Desktop — live animation
  const trail = GridTrail.create({ canvas, staticDots });

  // Mobile only — static blended image instead
  if (window.matchMedia('(max-width: 768px)').matches) {
    trail.destroy();
    GridTrail.renderStaticPreview({
      staticDots,
      layout: 'grid',   // 'grid' | 'gesture' | 'random'
      blended: true,
    });
  }
</script>
```

---

## Configuration — what to change

### `main.js`

| Constant | Default | What it does |
| -------- | ------- | ------------ |
| **`STATIC_LAYOUT`** | `'random'` | Mobile static background style. Options: `'grid'`, `'gesture'`, `'random'`. |
| **`MOBILE_QUERY`** | `'(max-width: 768px)'` | Breakpoint where live canvas is swapped for the static image. |

```js
// main.js — change these two lines to tune the demo
const MOBILE_QUERY = '(max-width: 768px)';
const STATIC_LAYOUT = 'grid';   // 'grid' | 'gesture' | 'random'
```

**Static layout modes**

| Value | Look |
| ----- | ---- |
| `grid` | Nine short strokes spread across the canvas (3×3-style distribution) |
| `gesture` | One large diagonal bezier crossing the full screen |
| `random` | 8–13 small strokes at random positions; **new layout on every reload** |

### `grid-trail.js` — brand & motion

| Location | What to change |
| -------- | -------------- |
| **`COLORS`** (top of file) | Brand palette: `main`, `coral`, `periwinkle`, `teal`, `gray`, `bg` |
| **`GRAY_PROBABILITY`** | How often dots spawn as gray vs color (default `0.45`) |
| **`TRAIL_PATHS_GRID`** | Control points for the `grid` static layout (`p0`–`p3` as `0–1` fractions of width/height) |
| **`TRAIL_PATHS_GESTURE`** | Single crossing stroke for `gesture` layout |
| **`buildRandomTrailPaths()`** | Stroke count, span, and strength for `random` layout |
| **`RISE_EASE` / `FALL_EASE` / `TARGET_DECAY`** | How quickly dots brighten and fade during interaction |

### `style.css` — presentation

| Location | What to change |
| -------- | -------------- |
| **`:root` variables** | `--bg`, `--main`, `--ink`, custom cursor (`--cursor`) |
| **`.hero-stage`** | Hero mockup overlay; add class `is-visible` to show it |
| **`.app.is-mobile`** | Rules that hide the canvas and lock the static image on small screens |

### Hero mockup overlay

The demo includes a landing-page hero in `#heroStage`. It is **hidden by default**.
To show it on load:

```html
<div id="heroStage" class="hero-stage is-visible" aria-hidden="false">
```

Or toggle in JS: `heroStage.classList.add('is-visible')`.

---

## JavaScript API

All methods live on the global `GridTrail` object (from `grid-trail.js`).

### `GridTrail.create({ canvas, staticDots })`

Starts the interactive animation on desktop. Returns `{ resize, destroy }`.

- **`canvas`** — `<canvas>` element (required)
- **`staticDots`** — overlay `<div>` for the resting gray-dot texture (optional but recommended)

Call **`destroy()`** before removing the canvas or switching to static mode.

### `GridTrail.renderStaticPreview(options)`

Renders a non-interactive background into `staticDots` via `background-image`.

| Option | Default | Description |
| ------ | ------- | ----------- |
| `staticDots` | — | Target `<div>` (required) |
| `width` | `window.innerWidth` | Render width in px |
| `height` | `window.innerHeight` | Render height in px |
| `layout` | `'grid'` | `'grid'` \| `'gesture'` \| `'random'` |
| `blended` | `true` | `true` = resting dots + trail strokes; `false` = resting dots only |

```js
GridTrail.renderStaticPreview({
  staticDots: document.getElementById('staticDots'),
  layout: 'gesture',
  width: 390,
  height: 844,
});
```

### `GridTrail.generateStaticPreviewTexture(width, height, layout)`

Returns a `data:` URL string — useful if you want to save or assign the
texture yourself instead of using `renderStaticPreview`.

### `GridTrail.STATIC_LAYOUTS`

`['grid', 'gesture', 'random']` — valid `layout` values.

---

## Files

| File | Purpose |
| ---- | ------- |
| `grid-trail.js` | Reusable animation module — drawing, interaction, static preview generation |
| `main.js` | Demo boot — mobile/desktop switch, `STATIC_LAYOUT` |
| `index.html` | Demo page structure |
| `style.css` | Demo layout, cursor, hero mockup, responsive rules |

---

## Performance notes

- DPR is capped at 2 for retina displays.
- Connection drawing uses row/column bucketing to avoid O(n²) pairwise checks.
- On mobile the animation loop never starts — only a single offscreen canvas
  render is used for the static background.
- Resize on mobile regenerates the static image (and re-randomizes `random` layout).

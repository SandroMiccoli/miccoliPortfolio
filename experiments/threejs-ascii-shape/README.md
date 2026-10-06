# ASCII Stack Hero

Static hero widget: three plates of ASCII glyphs, a fixed camera, and a hover card. No Node, no npm, no bundler.

The original prototype lives in `Refs/ASCII-Stack-V4-shareable-2026-10-05`. This folder is the handoff.

## Run the demo

ES modules do not work on `file://`. From this folder:

```bash
npx serve .
```

Open the URL `serve` prints. The same page is what the lab gallery loads.

## Embed it

The element needs a width and a height. The canvas fills its parent.

```html
<link rel="stylesheet" href="./css/ascii-stack.css" />
<link href="https://fonts.googleapis.com/css2?family=Geist+Mono:wght@500&display=swap" rel="stylesheet" />

<div id="ascii-stack" class="ascii-stack"></div>

<script type="module">
  import { mountAsciiStack } from './js/ascii-stack.js';

  const app = mountAsciiStack(document.querySelector('#ascii-stack'), {
    // optional — replaces the cards
    layers: [
      { id: 0, label: 'LAYER / 01', type: 'json', json: { name: 'upper' } },
      { id: 1, label: 'LAYER / 02', type: 'text', title: 'Title', body: 'Short text.' },
      { id: 2, label: 'LAYER / 03', type: 'image', src: 'assets/photo.webp', alt: '', caption: '' },
    ],
  });

  // app.destroy() when leaving the page
</script>
```

Keep this relative layout: `js/ascii-stack.js` and `js/atlas.js` import `../vendor/three.module.min.js` directly, so the path stays correct when the lab embeds the page at `/:slug/` instead of `/experiments/:slug/`. Relative image paths (`src`) resolve from the experiment folder. Absolute and remote URLs are used as given.

Three.js ships in the folder (`vendor/three.module.min.js`, r170, ~676 KB uncompressed). Serve it with gzip or brotli.

## What to edit

| File | What |
|---|---|
| `js/config.js` | Glyphs, `density` (1 = base, higher = a tighter grid), camera (`yaw`, `pitch`), hover color, card text and images |
| `css/ascii-stack.css` | Card, paper, font (`--ascii-font`) |
| `js/geometry.js` | Plate shape. Leave it alone when only the content changes |
| `js/ascii-stack.js` | Renderer, hover, pause. Only if the interaction changes |

`density` multiplies `columns` and `rowSpan`. The default `1.2` is a little tighter than the base. Pushing it much higher raises the CPU cost of the flow. Drawing stays at 3 draw calls.

## Behavior

- Fixed camera at the prototype angle (`yaw -0.78`, `pitch -0.38`). No drag, zoom, or auto-rotation.
- Hover (fine pointer) opens the layer, and the card follows the cursor, flipping to the other side at the edge.
- Click or tap pins the layer. A tap outside closes it. Touch has no hover.
- Arrow keys change the layer while the widget is focused. Escape closes it.
- The loop pauses offscreen, while the tab is hidden, and under `prefers-reduced-motion` (one frozen frame; the card still works).

## Cards

Each `layers` item uses a `type`:

- `json` — a shallow object, drawn as the numbered block
- `text` — `title` + `body`
- `image` — `src`, `alt`, `caption`. A relative `src` is loaded from this folder (`assets/placeholder.svg`).

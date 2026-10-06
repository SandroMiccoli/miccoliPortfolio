# Paragon ASCII 404

Static 404: a field of programming symbols, idle drift, and a hover that lifts the glyphs under the pointer. No Node, no npm, no bundler.

The original page is `Refs/404/paragon-404.html`. This folder is the handoff.

## Run

ES modules do not work on `file://`. From this folder:

```bash
npx serve .
```

Open the URL `serve` prints. The same page is what the lab gallery loads.

## What to edit

| File | What |
|---|---|
| `js/config.js` | Defaults, glyph set, slider ranges |
| `css/paragon-404.css` | Page and the lil-gui theme |
| `js/glyph.js` | 404 mask. Leave it alone when only the tuning changes |
| `js/renderer.js` | Frame loop, hover, cached background |

lil-gui is vendored at `vendor/lil-gui.esm.min.js` (0.20.0, MIT). `js/gui.js` imports that file directly, so the panel still loads when the lab page embeds this experiment.

## Behavior

- The mark, the connector rows, the background dust, the drift, and the hover lift match the original page.
- Sliders write into one settings object. The canvas reads it on the next frame.
- **Reset** restores the defaults. **Save settings** downloads JSON. **Load settings** reads that file. The last values also stay in `localStorage`.
- The title bar collapses the panel.
- The loop pauses while the tab is hidden. `prefers-reduced-motion` freezes the drift and the symbol cycle. Hover still responds.
- The 404 mask is built once per layout change. Background and connectors are painted into a cached layer. A frame only transforms the mark and blits that layer.

The original file also contained an unused Paragon-mark path. This page is the 404 only, so that path is gone.

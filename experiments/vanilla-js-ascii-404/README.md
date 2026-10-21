# ASCII 404

A field of programming symbols that forms a 404. The mark drifts, and the glyphs under the pointer lift and shift toward the accent color. Built to drop into a page. No build step.

The mark itself is a 404. It is not a text field.

## Run the demo

ES modules do not open on `file://`. From this folder:

```bash
npx serve .
```

Open the URL `serve` prints. The lab home loads the same page.

The demo adds a tuning panel and a frame readout in the corner. Neither is part of the embed. On a narrow screen the panel starts collapsed. The title bar opens and closes it. The panel writes into the live `settings` object. **Reset** restores the defaults. **Save settings** downloads JSON. **Load settings** reads that file. The last values also stay in `localStorage` under `ascii-404-settings`.

## Embed

The element needs a real width and height. The canvas fills its parent. The paper color is the element's own background (`--ascii-404-bg`).

```html
<link rel="stylesheet" href="/experiments/vanilla-js-ascii-404/css/ascii-404.css">

<div id="ascii-404" style="height: 100dvh;"></div>

<script type="module">
  import { mountAscii404 } from '/experiments/vanilla-js-ascii-404/js/ascii-404.js';

  const field = mountAscii404(document.querySelector('#ascii-404'), {
    ink: '#0a0c0b',
    accent: '#55d99b',
    background: '#ffffff',
    motionAmount: 1.5,
  });

  // when the page removes the element
  // field.destroy();
</script>
```

Keep this folder layout. `js/ascii-404.js` imports `./config.js`, `./field.js`, and `./glyph.js` directly, so the path stays correct when the lab opens the experiment at `/:slug/` instead of `/experiments/:slug/`.

Files the embed uses:

| File | Role |
|---|---|
| `js/ascii-404.js` | Field, hover, pause, `mountAscii404` |
| `js/config.js` | Defaults, glyph set, slider ranges |
| `js/glyph.js` | 404 mask |
| `js/field.js` | Cells, dust, connector rows |
| `css/ascii-404.css` | The element fills its parent |

`index.html`, `js/main.js`, `js/gui.js`, `css/demo.css`, and `vendor/lil-gui.esm.min.js` are the demo only. lil-gui is 0.20.0, MIT.

### Options

In `js/config.js`, edit `DEFAULTS` and `SYMBOLS`. Any key in `DEFAULTS` can be passed to `mountAscii404` and overrides that embed. Colors are 6-digit hex.

`ink` is the symbol color. `accent` is the hover color. `background` is the paper, painted into the canvas and onto `--ascii-404-bg`. `motionAmount` is the idle drift (`0` holds still). `hoverLift` is the push, in pixels.

The returned `settings` object is read every frame. Assign a key to retune it without remounting:

```js
field.settings.hoverLift = 80;
```

`onPaint` is optional. About twice a second it receives `{ fps, ms }`, where `fps` counts painted frames and `ms` is the average paint cost. The demo uses it for the corner readout.

To change the typeface, set `--ascii-404-font` on the element. It falls back to the monospace stack in `css/ascii-404.css`.

### Behavior

- The mark, the connector rows, the background dust, the drift, and the hover lift match the tuned demo.
- The loop pauses offscreen and while the tab is hidden. A hidden tab still draws a frame, so the field is not blank when you come back to it.
- `prefers-reduced-motion` freezes the drift and the symbol cycle. Hover still responds.
- The 404 mask is built once per layout change. Background and connectors are painted into a cached layer. A frame only transforms the mark and blits that layer.
- `destroy()` cancels the frame and removes the listeners and the canvas.

The element sets `touch-action: none`, so a touch on the field moves the glyphs instead of scrolling the page. On a scrolling page, override it:

```css
.ascii-404 {
  touch-action: pan-y;
}
```

## On the lab home

The home card comes from `_experiments/vanilla-js-ascii-404.md` (`show_on_home: true`). The thumbnail is `thumb.webm` in this folder.

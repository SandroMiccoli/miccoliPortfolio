# Circuit Mind

The Circuit Mind mark, and a 404 in the same stroke language. Open traces, a light traveling each path, and a burst when the pointer crosses a line. Built to drop into a page. No build step.

`mountCircuitMindLogo` and `mountCircuitMind404` are the same drawing with different artwork. Use one in a header and the other on the error page. They do not share a stage.

## Run the demo

ES modules do not open from `file://`. From the repo root:

```bash
npx serve .
```

Open `/experiments/vanilla-js-circuit-mind-logo/`.

The page is the study. **Logo** and **404** switch the artwork. The panel in the corner is the demo only: reference overlay, stroke, motion, and an MP4 of the scene on screen. It writes into `localStorage` under `vanilla-js-circuit-mind-logo-v6`. **Reset** restores the defaults.

`prefers-reduced-motion: reduce` holds the lights still. Checking **Animate** travels them anyway. The traces stay either way. Crossing a trace still sends a burst.

## Embed the logo

Keep this folder together. `js/circuit-mind.js` has no imports, so the URL resolves the same way wherever the page lives. Copy the folder into the site, or point at it where it already sits. Serve it over HTTP.

Link the embed stylesheet. `style.css` only makes the demo fill the viewport.

```html
<link rel="stylesheet" href="/experiments/vanilla-js-circuit-mind-logo/css/circuit-mind.css">
```

### 1. Give the mark a width

The height follows the artwork (`327 / 310`). A hero that already has a height can stretch the box; the drawing stays centered inside it.

```html
<a class="brand" href="/">
  <span id="brand-mark" style="width: 7.5rem"></span>
  <span class="brand__name">Circuit Mind</span>
</a>
```

```css
.brand {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

#brand-mark {
  display: block;
  width: 7.5rem;
}
```

`#020B16` is the plate behind the traces. It is painted on the element, so the rest of the page keeps its own background.

### 2. Mount it

```html
<script type="module">
  import { mountCircuitMindLogo } from '/experiments/vanilla-js-circuit-mind-logo/js/circuit-mind.js';

  const mark = mountCircuitMindLogo(document.querySelector('#brand-mark'));

  // when the page removes the element
  // mark.destroy();
</script>
```

The call draws the mark before it returns, then keeps painting while the element is on screen.

## Embed the 404

Same stylesheet, same module, a wider frame (`2442 / 1014`).

```html
<link rel="stylesheet" href="/experiments/vanilla-js-circuit-mind-logo/css/circuit-mind.css">

<main class="missing">
  <div id="missing-mark"></div>
  <p>That page is not on this board.</p>
  <a href="/">Back home</a>
</main>

<script type="module">
  import { mountCircuitMind404 } from '/experiments/vanilla-js-circuit-mind-logo/js/circuit-mind.js';

  const missing = mountCircuitMind404(document.querySelector('#missing-mark'), {
    background: '#020B16',
  });
</script>
```

```css
.missing {
  min-height: 100dvh;
  display: grid;
  align-content: center;
  justify-items: center;
  gap: 1.5rem;
  background: #020b16;
  color: #e7eef6;
}

#missing-mark {
  width: min(92vw, 960px);
}
```

The link sits outside the drawing, so it stays clickable. Both mounts can be on the same page. Each one pauses while it is off screen and while the tab is hidden.

## Options

Any key of `DEFAULTS` in `js/circuit-mind.js` can be passed to either function. Colors are 6-digit hex. Sizes are screen pixels, so a header mark and a full-page 404 keep the same stroke.

| Option | Default | What it does |
|---|---|---|
| `traceColor` | `#F2F8FE` | Trace color |
| `mint` | `#1FC283` | One traveling light |
| `cyan` | `#2D8AE8` | The other light |
| `background` | `#020B16` | Plate. `'transparent'` shows the page |
| `trace` | `1.25` | Trace thickness, in px |
| `node` | `5.6` | 404 pad size, in px. The logo pads stay with the mark |
| `glow` | `3.3` | Blur behind the lights, in px |
| `packet` | `40` | Length of each light, in px |
| `speed` | `154` | Travel, in px per second |
| `playing` | `true` | Travel the lights |
| `showTraces` | `true` | Draw the paths |
| `showNodes` | `true` | Draw the pads |
| `showComets` | `true` | Draw the lights |
| `showTop` | `true` | Logo only. The upper chevron |
| `showBot` | `true` | Logo only. The lower chevron |
| `showTrace` | `true` | Logo only. The cyan path |
| `forceMotion` | `false` | Travel even when the user prefers reduced motion |
| `interactive` | `true` | Burst when the pointer crosses a trace. `false` lets clicks pass through |
| `label` | `Circuit Mind` or `404` | Accessible name, used when the element has no `aria-label` |
| `pointerRoot` | the mount element | Element that receives the pointer |

The returned `settings` object is read every frame. Assign a key to retune it without remounting:

```js
mark.settings.speed = 90;
mark.settings.background = 'transparent';
```

`showTop`, `showBot`, and `showTrace` affect the logo only.

The glow draws a few pixels outside the box. Leave room around a tight header, or clip a parent.

## Remove it

`destroy()` stops the loop, removes the listeners, and removes the SVG. Mounting again into the same element destroys the previous drawing first.

```js
const mark = mountCircuitMindLogo(element);
mark.destroy();
```

In React, mount from an effect and destroy in the cleanup:

```jsx
import { useEffect, useRef } from 'react';
import { mountCircuitMindLogo } from './js/circuit-mind.js';

export function BrandMark() {
  const visual = useRef(null);

  useEffect(() => {
    const mark = mountCircuitMindLogo(visual.current, { background: 'transparent' });
    return () => mark.destroy();
  }, []);

  return <div ref={visual} style={{ width: '7.5rem' }} />;
}
```

The 404 is the same, with `mountCircuitMind404`.

## Scroll, pointer, and reduced motion

The stylesheet sets `touch-action: pan-y`, so a finger can scroll the page across the drawing. The lights still burst when the pointer crosses a trace.

`interactive: false` turns the bursts off and sets `pointer-events: none`, for a mark that sits behind a link.

The loop pauses while the element is off screen and while the tab is hidden.

`prefers-reduced-motion: reduce` holds the lights. Traces, pads, and bursts stay. `forceMotion: true` travels the lights anyway.

## What loads

| File | Role |
|---|---|
| `js/circuit-mind.js` | `mountCircuitMindLogo`, `mountCircuitMind404` |
| `css/circuit-mind.css` | The element sizes to its box |

Nothing else. No GSAP, no canvas library, no CDN.

`index.html`, `style.css`, `js/main.js`, `js/gui.js`, `js/export.js`, and `vendor/lil-gui.esm.min.js` are the lab demo. A header or an error page does not need them. lil-gui is 0.20, MIT. The loop export in the demo pulls `mp4-muxer` from a CDN when someone asks for the file.

## On the lab home

The card comes from `_experiments/vanilla-js-circuit-mind-logo.md`. The thumbnail is `thumb.png` in this folder.

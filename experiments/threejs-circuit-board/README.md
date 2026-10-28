# Circuit board

A PCB study in three layers: the physical board, an intelligence plane, and a technology hologram. **PCB 01** is the reference board and opens with the satellite. **PCB 02** is the NXP EVK and opens with the plane. **PCB 03** is the AMD Versal VEK385 and opens with the data center. The industrial arm is a fourth hologram. All three boards are drawn the same way: unlit solids, energy-colored edges, and a canvas silkscreen of traces and reference designators.

Mount it into an element on the page. The canvas fills that element. The rest of the page stays in charge of layout and scrolling.

## Run the demo

ES modules do not open from `file://`. From the repo root:

```bash
npx serve .
```

Open `/experiments/threejs-circuit-board/`.

The page is the study alone. The pointer tilts the board a little around its rest angle, and it eases back when the pointer leaves. Scroll zooms. `R` returns to 1×. The boards advance on their own.

`prefers-reduced-motion: reduce` holds the rest angle and snaps board changes instead of tweening them.

The four holograms take the bloom. The PCB and the faint grid do not.

Geometry matches the reference studies. Triangles below are the visible study, counted once. Draw calls include the UnrealBloomPass.

| Study | Triangles | Lines | Draw calls |
|---|---:|---:|---:|
| 3D Robotic Arm | 64,602 | 48,392 | 33 |
| 3D Plane | 55,276 | 55,285 | 42 |
| 3D Satellite | 56,282 | 45,705 | 40 |
| 3D Data Center | 61,906 | 51,713 | 49 |

`index.html`, `style.css`, and `js/main.js` are this demo only.

## Embed it in a hero

Keep this folder together. `js/circuit-board.js` imports the boards, the holograms, and `vendor/` by relative URL, so the module resolves the same way wherever the page lives. Copy the folder into the site, or point at it where it already sits. Serve it over HTTP. A bundler can import the module and follow those relative files. Do not add a second copy of Three.js.

Link the embed stylesheet. `style.css` only makes the demo fill the viewport.

```html
<link rel="stylesheet" href="/experiments/threejs-circuit-board/css/circuit-board.css">
```

### 1. Give the visual a box

The element needs a real width and height. The canvas fills it. Put the headline outside that element, in a sibling stacked above it.

```html
<section class="hero">
  <div id="circuit" class="circuit-board"></div>
  <div class="hero__copy">
    <h1>Board design study</h1>
    <a href="#work">View the work</a>
  </div>
</section>
```

```css
.hero {
  position: relative;
  height: 100dvh;
  background: #06090c;
}

#circuit {
  position: absolute;
  inset: 0;
}

.hero__copy {
  position: relative;
  z-index: 1;
  padding: 12vh 8vw;
}
```

`#06090c` is the scene background, so the hero stays dark before the first frame. Position the element yourself (`absolute` with `inset: 0`, or any box with a height). When the computed position is still `static` at mount, the module sets `position: relative` so the canvas stays inside the element.

### 2. Mount it

```html
<script type="module">
  import { mountCircuitBoard } from '/experiments/threejs-circuit-board/js/circuit-board.js';

  const hero = document.querySelector('.hero');
  const study = mountCircuitBoard(document.querySelector('#circuit'), {
    pointerRoot: hero,
    cycle: true,
  });
</script>
```

`pointerRoot` is the element whose pointer events tilt the board. Pointer events on the headline bubble to the hero, so the tilt still follows the pointer while the copy sits on top of the canvas. Links in the copy stay clickable.

The call builds every board before it returns, then draws while the element is on screen. Put it in a load handler or a framework effect so it does not compete with the first paint.

| Option | Default | What it does |
|---|---|---|
| `pcb` | `'reference'` | `'reference'`, `'nxp'`, or `'versal'` |
| `mode` | paired hologram | `'arm'`, `'plane'`, `'satellite'`, or `'datacenter'` |
| `cycle` | `true` | Advances the three boards |
| `cycleDwell` | `4` | Seconds each board stays |
| `tilt` | `true` | Pointer tilt and the part highlight |
| `zoom` | `false` | Wheel zoom. Leave this off in a scrolling page |
| `background` | `'#06090c'` | A CSS color. `'transparent'` clears the empty pixels |
| `pixelRatio` | `'device'` | A number, or `'device'` capped at 2 |
| `label` | a short description | Accessible name, used when the element has no `aria-label` |
| `pointerRoot` | the mount element | Element that receives the pointer |

Each board has a paired hologram: reference opens the satellite, NXP opens the plane, Versal opens the data center. `mode` chooses the hologram on screen until the next board change. `cycle: false` holds one picture:

```javascript
mountCircuitBoard(element, {
  pcb: 'nxp',
  mode: 'plane',
  cycle: false,
});
```

The arm is not paired with a board. Pin it the same way with `mode: 'arm'` and `cycle: false`.

### 3. Drive it from the page

```javascript
study.setPcb('versal');
study.setMode('datacenter');
study.resetView();
study.setPixelRatio(1);

study.bloom.strength = 0.2;
study.bloom.radius = 0;
study.bloom.threshold = 0.06;
```

`setPcb` accepts `'reference'`, `'nxp'`, and `'versal'`. `setMode` accepts `'arm'`, `'plane'`, `'satellite'`, and `'datacenter'`. `resetView()` returns the zoom to 1×. `study.pcb` and `study.mode` are the current ids.

`onChange` runs when the board or the hologram changes, including the automatic cycle:

```javascript
mountCircuitBoard(element, {
  onChange({ pcb, mode, pcbLabel, modeLabel, layer }) {
    // pcbLabel is "NXP EVK board", modeLabel is "3D PLANE"
  },
});
```

Unknown ids are ignored.

### 4. Remove it

`destroy()` stops the loop, kills this study’s tweens, releases the geometries, and loses the WebGL context. Browsers cap how many contexts a page can hold. Call it when the hero leaves the page.

```javascript
const study = mountCircuitBoard(element);
// route change, or a framework unmount
study.destroy();
```

Mounting again into the same element destroys the previous study first. One hero per page is the right budget: every board and every hologram is built at mount, and the hidden ones stay in memory so a switch does not hitch.

In React, mount from an effect and destroy in the cleanup:

```jsx
import { useEffect, useRef } from 'react';
import { mountCircuitBoard } from './js/circuit-board.js';

export function Hero() {
  const visual = useRef(null);

  useEffect(() => {
    const study = mountCircuitBoard(visual.current, {
      pointerRoot: visual.current.parentElement,
      cycle: true,
    });
    return () => study.destroy();
  }, []);

  return (
    <section className="hero">
      <div ref={visual} className="circuit-board" />
      <div className="hero__copy">
        <h1>Board design study</h1>
      </div>
    </section>
  );
}
```

### Scroll, touch, and reduced motion

Wheel zoom is off unless `zoom: true`. With it off, the page scrolls across the hero. The stylesheet sets `touch-action: pan-y` for the same reason. `zoom: true` captures the wheel while the pointer is over the canvas and sets `touch-action: none`. Use that on a page that is only this study.

The loop pauses while the element is off screen and while the tab is hidden. The cycle clock pauses with it.

`prefers-reduced-motion: reduce` holds the rest angle. Board and hologram changes snap. The cycle still advances.

### What loads

| File | Role |
|---|---|
| `js/circuit-board.js` | `mountCircuitBoard` |
| `js/*.js` | Boards, holograms, bloom, traces |
| `css/circuit-board.css` | The element fills its box |
| `vendor/three.module.min.js` | Three.js r180, MIT. It loads `vendor/three.core.min.js` beside it |
| `vendor/addons/` | The line and bloom modules this study imports |
| `vendor/gsap-core.js` | GSAP 3.12.7, used on plain objects |

`index.html`, `style.css`, and `js/main.js` are the lab demo. A hero does not need them.

Three.js and GSAP are vendored so the hero does not depend on an import map or a CDN. Together those files are about 1 MB uncompressed. Serve them with gzip or brotli. Leave the license headers in place.

## How it is built

Each board is one indexed mesh plus a few line batches, not a mesh per part. All three boards and the four studies are built once and toggled. The hologram is drawn sharp. `UnrealBloomPass` then blurs that layer alone, and the glow is added back. The board never enters that pass.

Edge color is the part's energy color: blue, violet, gold, or green, by material. Lights are not in the scene. The faces are unlit; the lines carry the color.

The counts above are the polygon count for the visible study. The hidden study is not drawn.

## On the lab home

The card comes from `_experiments/threejs-circuit-board.md`. The thumbnail is `thumb.webm` in this folder.

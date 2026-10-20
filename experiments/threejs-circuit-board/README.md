# Circuit board

A PCB study in three layers: the physical board, an intelligence plane, and a technology hologram. Four studies share the same board. **3D Robotic Arm** is the industrial arm. **3D Plane** is the volumetric airframe. **3D Satellite** is the communications spacecraft. **3D Data Center** is the six-rack compute cluster.

The reference files in `tmp/` are not loaded.

## Run

ES modules do not open on `file://`. From the repo root:

```bash
npx serve .
```

Open `/experiments/threejs-circuit-board/`.

The pointer tilts the board a little around its rest angle, and it eases back when the pointer leaves. Scroll zooms. `R` or Reset zoom returns to 1×. The performance panels stay on screen: FPS, frame time, memory, triangles, line segments, draw calls, and the UnrealBloomPass controls.

The four holograms take the bloom. The PCB and the faint grid do not. On the arm, the plinth stays faint and the gripper stays solid.

Geometry matches the reference studies. Triangles below are the visible study, counted once. Draw calls include the UnrealBloomPass.

| Study | Triangles | Lines | Draw calls | Reference draw calls |
|---|---:|---:|---:|---:|
| 3D Robotic Arm | 64,602 | 48,392 | 33 | 348 |
| 3D Plane | 55,276 | 55,285 | 42 | — |
| 3D Satellite | 56,282 | 45,705 | 40 | — |
| 3D Data Center | 61,906 | 51,713 | 49 | — |

FPS depends on the machine. The panel is there to watch it.

## How it is built

The board is one indexed mesh plus a few line batches, not a mesh per part. The studies are built once and toggled, so switching does not rebuild the PCB. The hologram is drawn sharp. `UnrealBloomPass` then blurs that layer alone, and the glow is added back. The board never enters that pass.

Edge color is the part's energy color: blue, violet, gold, or green, by material. Lights are not in the scene. The faces are unlit; the lines carry the color.

Triangles in the panel are the polygon count for the current study. The hidden study is not drawn.

## Embed it as a hero

This folder is a full page, not a component. `.circuit-board` is `position: fixed` and fills the viewport, and the wheel listener on `#stage` calls `preventDefault()`. Pasting `index.html` into another layout covers the site and traps scroll. Host this page and put it in an iframe.

### 1. Host the folder

Copy `index.html`, `style.css`, `main.js`, and `js/`. Leave `tmp/` out. It is reference only and is not loaded.

Serve that folder over HTTPS. `index.html` loads Three.js r180 from jsDelivr through an import map. If the host blocks that script, the canvas stays blank. ES modules do not run from `file://`.

### 2. Place the iframe

The framed page fills whatever box you give the iframe. Size the hero. The study does not inherit CSS from the parent page.

```html
<section class="hero">
  <iframe
    src="https://example.com/circuit-board/index.html"
    title="Circuit board study. Move the pointer to tilt."
    loading="eager"
  ></iframe>
</section>
```

```css
.hero {
  position: relative;
  height: 100vh;
  height: 100dvh;
  background: #070c14;
}

.hero iframe {
  display: block;
  width: 100%;
  height: 100%;
  border: 0;
}
```

`#070c14` matches the page background, so the hero does not flash white while the frame loads.

Inside the frame, the pointer tilts the board and the wheel zooms it. `prefers-reduced-motion: reduce` holds the rest angle. The parent page does not scroll while the pointer is over the hero, because the stage consumes the wheel. Touch on the canvas is the same: `#stage` sets `touch-action: none`. If this hero should let the page scroll, remove the `wheel` listener on `#stage` in `main.js` before shipping.

### 3. Hide the lab chrome

The header, study buttons, layer list, footer, performance panel, and Stats meters are part of this page. A cross-origin parent cannot hide them. Hide them in this folder's `style.css`:

```css
.circuit-board header,
.circuit-board footer,
.circuit-board nav,
.circuit-board .layers,
.circuit-board .perf-gui,
.circuit-board .perf-stats {
  display: none;
}
```

`main.js` still builds the performance panel and still renders every frame. Hiding it does not stop the loop. The panel is how bloom, pixel ratio, and the counters are edited during development. Leave it visible until the hero looks right, then hide it.

### 4. Choose the opening study

The page opens on the arm. `window.boardStudy.setMode` accepts `arm`, `plane`, `satellite`, or `datacenter`. A same-origin parent can switch after load:

```javascript
const frame = document.querySelector('.hero iframe');
frame.addEventListener('load', () => {
  frame.contentWindow.boardStudy.setMode('plane');
});
```

A cross-origin frame cannot be scripted. Change the initial `mode` in `main.js`, and the `visible` flags and `aria-pressed` buttons that match it.

`resetView()` on that same object sets the zoom back to 1. `renderer`, `scene`, and `camera` are also on `window.boardStudy`.

### 5. If it has to live in the page

Skip the iframe only if you change the study first:

- `.circuit-board` is `position: fixed; inset: 0`, and `html, body` are set to `height: 100%`. For a hero, make the shell `position: absolute` inside a sized section and leave the document height alone.
- `pointermove` listens on `window` and divides by `window.innerWidth` and `window.innerHeight`. Point it at the hero and use that element's box, or the tilt follows the page instead of the hero.
- The wheel listener must not call `preventDefault()` if the page itself scrolls.
- `#stage`, `#error`, `#study-label`, `#reset`, `[data-mode]`, and `.circuit-board` are queried from the whole document. One instance per page.
- There is no destroy path. A route change has to cancel the animation loop, disconnect the `ResizeObserver`, remove the window listeners, and call `renderer.dispose()`.
- The canvas is opaque: `alpha: false`, a black clear color, and a scene background of `#06090c`. A transparent hero is a renderer change, not a CSS change.

## On the lab home

The card comes from `_experiments/threejs-circuit-board.md`. The thumbnail is `thumb.png` in this folder.

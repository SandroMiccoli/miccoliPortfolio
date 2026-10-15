# Interactive globe

A globe of lightly rounded image cards, built to drop into a page. Photos share one texture, with a short padding inside each card, and the whole scene is a single draw. The globe spins slowly around the polar holes. Those holes rest on a diagonal and do not point at the viewer. Pointer down stops the spin and the drag turns the globe any way. On release it coasts, then the holes ease back to that diagonal.

Colors, spin, and card shape live in `js/config.js`.

## Run the demo

ES modules do not open on `file://`. From this folder:

```bash
npx serve .
```

Open the URL `serve` prints. The lab home loads the same page.

## Embed

The element needs a real width and height. The canvas fills its parent. The color behind the gaps is the element's own background (`--ig-bg`).

```html
<link rel="stylesheet" href="/experiments/threejs-interactive-globe/css/globe.css">

<div id="globe" style="height: 100dvh;"></div>

<script type="module">
  import { mountGlobe } from '/experiments/threejs-interactive-globe/js/globe.js';

  const globe = mountGlobe(document.querySelector('#globe'), {
    // optional. transparent lets the page show through the gaps
    background: 'transparent',
    colors: ['#C7DBFF', '#6A9CF8', '#A7E6E4', '#DEEB91', '#E7F3C4'],
    spinSpeed: 0.15,
  });

  // when the page removes the element
  // globe.destroy();
</script>
```

Keep this folder layout. `js/globe.js` imports `../vendor/three.module.min.js` directly, and photos resolve from the module file, not from the page URL. The embed still works when the lab opens the experiment at `/:slug/` instead of `/experiments/:slug/`.

Files the embed uses:

| File | Role |
|---|---|
| `js/globe.js` | Scene, drag, pause, `mountGlobe` |
| `js/config.js` | Colors, spin, card size |
| `js/layout.js` | Card placement on the sphere |
| `js/atlas.js` | Texture assembly |
| `js/mesh.js` | Instanced geometry |
| `js/manifest.js` | Photo list |
| `vendor/three.module.min.js` | Three.js r170, MIT |
| `css/globe.css` | The element fills its parent |
| `assets/` | The photos |

`index.html` and `js/main.js` are the demo only.

Three.js ships in the folder (about 676 KB uncompressed). Serve it with gzip or brotli.

### Colors

In `js/config.js`, edit `cardColors`. The list repeats around the globe. Four or five colors read best.

`backMix` is how much a back face lightens (`0` matches the front, `1` is flat wash). `backWash` is the color of that mix.

Any field passed to `mountGlobe` overrides the config. `colors` replaces the whole list.

### Photos

1. Put the file in `assets/`.
2. Add the path, relative to this folder, to `imageManifest` in `js/manifest.js`.

Formats: png, jpg, webp, gif. Each photo is scaled down to the card. Large originals slow the first load. A `.docx` in the folder is ignored.

To use another list without editing the manifest:

```js
mountGlobe(element, {
  images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
});
```

Remote URLs need CORS. A relative path resolves from this folder. A path that starts with `/` or `http` is used as given.

If there are more cards than photos, photos repeat. If there are more photos than cards, the globe spreads a sample.

### Behavior

- The polar holes (the empty caps above and below the cards) rest along `poleAxis`. `x` is right, `y` is up, `z` is toward the camera. Keep `z` small so a hole does not face the viewer. `x` and `y` together set the diagonal.
- Idle spin is around that axis. `spinSpeed` is radians per second.
- Pointer down stops the spin immediately. Drag rotates in any direction.
- On release, the globe coasts (`inertia`, in seconds) and the holes ease back to `poleAxis` (`returnSeconds`).
- Arrow keys rotate while the element is focused. Releasing a key also returns the holes to the diagonal.
- The loop pauses offscreen, in a hidden tab, and under `prefers-reduced-motion` (no auto spin; drag still works, and on release the holes snap back).
- `destroy()` cancels the frame, in-flight fetches, and the WebGL context.

`aspect` is width divided by height. Smaller values make a card more vertical. `imageInset` is the padding between the photo and the card edge. `cornerRadius` is the corner roundness, as a fraction of the short side.

The element captures the drag (`touch-action: none`). On a scrolling page, a touch on the globe turns the globe instead of scrolling.

## On the lab home

The home card comes from `_experiments/threejs-interactive-globe.md` (`show_on_home: true`). The thumbnail is `thumb.jpg` in this folder.

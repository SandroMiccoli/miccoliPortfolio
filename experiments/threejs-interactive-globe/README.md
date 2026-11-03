# Interactive globe

A globe of lightly rounded image cards, built to drop into a page. Photos share one texture, with a short padding inside each card, and the whole scene is a single draw. The globe spins slowly around the polar holes. Those holes rest on a diagonal and do not point at the viewer. Pointer down stops the spin and the drag turns the globe any way. On release it coasts, then the holes ease back to that diagonal.

Colors, spin, and card shape live in `js/config.js`.

## Run the demo

ES modules do not open on `file://`. From this folder:

```bash
npx serve .
```

Open the URL `serve` prints. The lab home loads the same page. The demo is only the globe. It loads the source modules and does not need the build.

## Use it on another site

This section is the whole integration. The other site does not import these source modules. Host one built script, the stylesheet, the poster, and the photos. The page owns the container, the section list, and when the script downloads. The globe owns WebGL, pause, dispose, and the pixel cap.

From this folder:

```bash
npm install
npm run build
```

`npm install` is only for the build. It installs Vite here. `npm run build` reads `vite.config.js` and writes `dist/globe.js`. The global name is `InteractiveGlobe`. Copy these files onto the other host, keeping the folder shape:

```
/globe/globe.js
/globe/css/globe.css
/globe/assets/poster.webp
/globe/assets/Globe-01.webp
```

| File on the other host | Role |
|---|---|
| `globe.js` | One IIFE. Global `InteractiveGlobe`. Three.js is already inside it. Serve it with gzip or brotli |
| `css/globe.css` | The element fills its parent. The poster hides once a canvas exists |
| `assets/poster.webp` | Still of the globe at rest. It stays visible until WebGL starts, and comes back when the context is released |
| `assets/` | The built-in photos (`assets/Globe-01.webp` and the rest). Publish them with the script when you do not pass `images` |

The container needs a real width and height. The canvas fills it. The color behind the gaps is the element's own background (`--ig-bg`). With the folder shape above, do not pass `assetBase`. If `globe.js` does not sit next to `assets/`, pass `assetBase: '/globe/'`.

Put the poster in the HTML so it shows with no JavaScript. The script does not run on a phone, a coarse pointer, `prefers-reduced-motion`, save-data, or a browser without WebGL. Otherwise it waits until the globe is within 400px of the viewport, then injects `globe.js`. Textures load after that, inside `initGlobe`, not with the page.

`sections` is the list of ids the page will turn toward. An id without `azimuth` is spaced evenly around the pole axis. `azimuth` is radians, when that section should face a chosen direction. Replace `research`, `design`, and `launch` with the ids on the host page. Each control uses the same id in `data-section`. The hover listeners stay on the page. `globe.js` does not know about that markup.

```html
<link rel="stylesheet" href="/globe/css/globe.css">

<div id="globe" style="height: 100dvh;">
  <img class="interactive-globe__poster" src="/globe/assets/poster.webp" alt="">
</div>

<button type="button" data-section="research">Research</button>
<button type="button" data-section="design">Design</button>
<button type="button" data-section="launch">Launch</button>

<script>
(function () {
  var el = document.getElementById('globe');
  if (leavePoster()) return;

  var io = new IntersectionObserver(function (entries) {
    if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
    io.disconnect();
    var script = document.createElement('script');
    script.src = '/globe/globe.js';
    script.onload = function () {
      var globe = InteractiveGlobe.initGlobe(el, {
        sections: [
          { id: 'research' },
          { id: 'design', azimuth: 1.4 },
          { id: 'launch' }
        ]
      });
      window.globe = globe;

      document.querySelectorAll('[data-section]').forEach(function (item) {
        var id = item.getAttribute('data-section');
        item.addEventListener('pointerenter', function () {
          globe.rotateTo(id);
        });
        item.addEventListener('pointerleave', function () {
          globe.rotateTo(null);
        });
      });
    };
    document.head.appendChild(script);
  }, { rootMargin: '400px' });
  io.observe(el);

  function leavePoster() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    if (!matchMedia('(hover: hover) and (pointer: fine)').matches) return true;
    if (navigator.connection && navigator.connection.saveData) return true;
    try {
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      if (!gl) return true;
      var lose = gl.getExtension('WEBGL_lose_context');
      if (lose) lose.loseContext();
      return false;
    } catch (error) {
      return true;
    }
  }
})();
</script>
```

`rotateTo(id)` holds the idle spin and eases to that section in about 0.7s. `rotateTo(null)` lets the idle spin resume. An unknown id does nothing. A call made before WebGL exists, or while the context is released offscreen, is kept and applied on the next mount. Pass `drag: false` in the same options object when the list is the only control.

`initGlobe` repeats the poster checks. If the script was loaded anyway, it still will not create a context. `globe.ready` resolves when WebGL is up, or on the same turn when the poster stays. Call `globe.destroy()` when the page removes the element.

Omit `images` and the globe uses the photos baked in from `js/manifest.js`, resolved next to `globe.js`. Another section of the site passes its own list in the same `initGlobe` call. A path that starts with `/` or `http` is used as given. A relative path resolves from `assetBase`, or from the folder of `globe.js`. Remote URLs need CORS. If there are more cards than photos, photos repeat. If there are more photos than cards, the globe spreads a sample.

```js
InteractiveGlobe.initGlobe(el, {
  sections: [
    { id: 'research' },
    { id: 'design', azimuth: 1.4 },
    { id: 'launch' }
  ],
  images: ['/work/a.webp', '/work/b.webp']
});
```

The same mounted globe can swap photos later. This does not rebuild the scene:

```js
window.globe.setImages(['/about/a.webp', '/about/b.webp']);
```

You do not build the pause or the pixel cap. Once WebGL is running, the loop stops as soon as the globe leaves the viewport or the tab is hidden. About 800ms later the context is released and the poster shows again. Coming back rebuilds the scene. The pixel ratio is capped at 1.5. Pass `pixelRatioMax: 2` to raise that cap. A large canvas still shrinks under the pixel budget.

`initGlobe` is what the page calls. `mountGlobe` is the immediate mount it uses once the element is near the viewport.

Source, for this lab and for rebuilding. The other site does not need these files. `index.html` and `js/main.js` are the demo only.

| File | Role |
|---|---|
| `js/entry.js` | IIFE entry |
| `js/globe.js` | Scene, drag, pause, `initGlobe`, `mountGlobe` |
| `js/config.js` | Colors, spin, card size |
| `js/layout.js` | Card placement on the sphere |
| `js/atlas.js` | Texture assembly |
| `js/mesh.js` | Instanced geometry |
| `js/manifest.js` | Photo list baked into the build |
| `js/capabilities.js` | Poster-only checks used by this demo |
| `vendor/three.module.min.js` | Three.js r170, MIT |

### Colors

In `js/config.js`, edit `cardColors`. The list repeats around the globe. Four or five colors read best.

`backMix` is how much a back face lightens (`0` matches the front, `1` is flat wash). `backWash` is the color of that mix.

Any field passed to `initGlobe` overrides the config. `colors` replaces the whole list.

### Photos

1. Put the file in `assets/`.
2. Add the path, relative to this folder, to `imageManifest` in `js/manifest.js`.

Formats: png, jpg, webp, gif. Each photo is scaled down to the card. Large originals slow the first load. A `.docx` in the folder is ignored.

On another site, do not edit this manifest. Pass `images` or call `setImages`, as in "Use it on another site" above. Remote URLs need CORS.

If there are more cards than photos, photos repeat. If there are more photos than cards, the globe spreads a sample.

### Behavior

- The polar holes (the empty caps above and below the cards) rest along `poleAxis`. `x` is right, `y` is up, `z` is toward the camera. Keep `z` small so a hole does not face the viewer. `x` and `y` together set the diagonal.
- Idle spin is around that axis. `spinSpeed` is radians per second.
- Pointer down stops the spin immediately. Drag rotates in any direction.
- On release, the globe coasts (`inertia`, in seconds) and the holes ease back to `poleAxis` (`returnSeconds`).
- Arrow keys rotate while the element is focused. Releasing a key also returns the holes to the diagonal.
- `initGlobe` never starts WebGL for reduced motion, a coarse or non-hovering pointer, save-data, or missing WebGL. The poster stays.
- Once WebGL is up, the loop pauses offscreen and in a hidden tab. About 800ms later the context is released. If the motion preference changes after mount, auto spin stops and drag still works.
- `destroy()` cancels the frame, in-flight fetches, and the WebGL context.

`aspect` is width divided by height. Smaller values make a card more vertical. `imageInset` is the padding between the photo and the card edge. `cornerRadius` is the corner roundness, as a fraction of the short side.

The element captures the drag (`touch-action: none`). On a scrolling page, a touch on the globe turns the globe instead of scrolling.

## On the lab home

The home card comes from `_experiments/threejs-interactive-globe.md` (`show_on_home: true`). The thumbnail is `thumb.jpg` in this folder.

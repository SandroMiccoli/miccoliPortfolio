# Three.js Marching Cubes — Futuristic Metaball Cube

A volumetric cube built with marching cubes metaballs. The structure forms a single cohesive cube with dynamic, breathing motion and futuristic aesthetic.

Based on [three.js marching cubes example](https://threejs.org/examples/webgl_marchingcubes.html) and [greggman's blob](https://webglsamples.org/blob/blob.html). Original code by Henrik Rydgård.

## Features

- **Cube-shaped structure** — Metaballs arranged in a grid to form a unified cube with organic internal detail
- **Dynamic motion** — Gentle oscillation creates a breathing, living feel
- **Futuristic aesthetic** — Mint/teal palette, soft lighting, clean presentation
- **Configurable materials** — Shiny, matte, plastic, flat, and more
- **Live controls** — Adjust resolution, speed, blob count, isolation via lil-gui

## Controls (lil-gui)

### Materials
- **shiny** — Metallic, reflective (default)
- **matte** — Soft, diffuse
- **plastic** — Glossy plastic
- **flat** — Flat shading
- **chrome** — Mirror-like (requires env map)

### Simulation
- **Speed** — Animation speed
- **Resolution** — Voxel grid density (14–100)
- **Isolation** — Metaball threshold
- **Blob count** — Number of metaballs in cube grid
- **Floor / Walls** — Add planes for containment

## Technical Details

### Files
- `index.html` — Entry point with Three.js CDN
- `style.css` — Layout and futuristic styling
- `main.js` — Scene, MarchingCubes, materials, GUI

### Key Technologies
- **Three.js** — WebGL rendering
- **MarchingCubes** — Metaball isosurface extraction
- **lil-gui** — Control panel
- **OrbitControls** — Camera interaction

## Running

```bash
cd experiments/threejs-marching-cubes
npx serve .
# or
npx vite --port 5173
```

Open http://localhost:5173 (or 3000 for serve) in your browser.

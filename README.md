# ELO

**ELO (Effect Linked Operators)** is a modular visual instrument for generative and reactive visuals.

An **ELO** is an operator: a processing module that can generate, transform, filter, or manipulate a visual signal.

A sequence of connected ELOs is an **ELOS**. Each ELO receives a texture, performs its operation, and passes the result to the next.

```text
Generator → Effect → Filter → Color → Output
```

Order defines the result. `Lines → Warp` produces a different image from `Warp → Lines`. ELOs can be bypassed, reordered, duplicated, or replaced, and the sequence recomputes immediately.

The interaction stays immediate:

> **Create → modulate → combine → perform.**

The same instrument runs in a browser and on a Raspberry Pi. A phone on the local network controls the instrument over WebSocket, while thumbnails are generated from the actual render.

Product thinking, phases, and operator principles live in [ROADMAP.md](ROADMAP.md). Raspberry Pi setup is in [INSTALL.md](INSTALL.md).

## Current version

**Phase 1 and Phase 2 are complete. Phase 3 is ongoing.**

The live instrument already has:

* Linear ELOS you can create, duplicate, rename, and switch
* Parameter modulation from **Speed**, **BPM**, and **FFT**
* Operator **presets**
* Output **Corner Pin** and stackable **Rectangle / Circle** masks
* **DEBUG / SYSTEM** overlay with FPS, CPU, and runtime
* Phone control and Camera Input from a USB webcam or phone

Shipped ELOs:

| Category   | ELOs                                                      |
| ---------- | --------------------------------------------------------- |
| Generators | Lines, Noise, Shape, Gradient, Camera Input               |
| Effects    | Warp, Transform, Kaleidoscope, Displace, Feedback, Glitch, Pixelate, Mirror, Tile |
| Filters    | Bloom, Blur, Edge                                         |
| Color      | Color Lookup, Color Ramp, HSV, Levels, Contrast, Posterize, Invert |
| Output     | Screen                                                    |

## Next

The next ELOs are **Particles**, then **Video**, then **Blend**. The following stage expands the instrument from a single ELOS into multiple ELOS working together, leading toward multi-input processing and eventually a graph architecture.

```text
New operators
      ↓
Compositing
      ↓
Multi-input processing
      ↓
Graph architecture
```

## Run locally

Static preview:

```bash
bundle exec jekyll serve
```

Open `/` for the renderer and `/control.html` for the phone UI.

With the local Node server:

```bash
cd server && npm install && npm start
```

Then open `http://127.0.0.1:8080/` and `http://127.0.0.1:8080/control.html`.

To run automatically on a Raspberry Pi, follow [INSTALL.md](INSTALL.md).

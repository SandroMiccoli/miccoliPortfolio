# ELO

**ELO (Effect Linked Operators)** is a modular visual instrument for generative and reactive visuals.

You create visuals by connecting **operators**. Each operator generates, transforms, filters, or otherwise changes a visual signal.

A sequence of connected operators is a **chain** — the consolidated visual. Each operator receives a texture, performs its operation, and passes the result to the next.

```text
Generator → Effect → Filter → Color → Output
```

Order defines the result. `Lines → Warp` produces a different image from `Warp → Lines`. Operators can be bypassed, reordered, duplicated, or replaced, and the chain recomputes immediately.

The interaction stays immediate:

> **Create → modulate → combine → perform.**

The same instrument runs in a browser and on a Raspberry Pi. A phone on the local network controls the instrument over WebSocket, while thumbnails are generated from the actual render.

Product thinking, phases, and operator principles live in [ROADMAP.md](ROADMAP.md). Raspberry Pi setup is in [INSTALL.md](INSTALL.md).

## Current version

**Phase 1 and Phase 2 are complete. Phase 3 is ongoing.**

The live instrument already has:

* Linear chains you can create, duplicate, rename, and switch
* Parameter modulation from **Speed**, **BPM**, and **FFT**
* Operator **presets**
* Shareable chains: copy a link, download JSON, or keep templates as files
* Output **Corner Pin** and stackable **Rectangle / Circle** masks
* **DEBUG / SYSTEM** overlay with FPS, CPU, and runtime
* Phone control and Camera Input from a USB webcam or phone

Shipped operators:

| Category   | Operators                                                 |
| ---------- | --------------------------------------------------------- |
| Generators | Lines, Noise, Shape, Gradient, Camera Input               |
| Effects    | Warp, Transform, Kaleidoscope, Displace, Feedback, Glitch, Pixelate, Mirror, Tile |
| Filters    | Bloom, Blur, Edge                                         |
| Color      | Color Lookup, Color Ramp, HSV, Levels, Contrast, Posterize, Invert |
| Output     | Screen                                                    |

## Next

The next operators are **Particles**, then **Video**, then **Blend**. The following stage expands the instrument from a single chain into multiple chains working together, leading toward multi-input processing and eventually a graph architecture.

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

Jekyll is a **static preview only**. It has no WebSocket, so the phone cannot sync or show live output.

For the renderer + phone control, use the Node server:

```bash
cd server && npm install && npm start
```

Then on this machine open `http://127.0.0.1:8080/`, and on the phone open the printed `control` URL (same LAN IP, port 8080). Bind to a specific address with `HOST=192.168.0.6 npm start` if you need to.

Static preview (no phone sync):

```bash
bundle exec jekyll serve
```

## Share visuals

Default templates are JSON files in `library/templates/`. Edit those files in the repo to change the shipped set. Anything you **Save template** on an instance is written to `server/data/templates/` and shows up immediately for every client connected to that instance (desktop and phone).

The Share button copies a link with the full chain inside it. Open that link on this machine, the Pi, or another ELO instance to load the same operators and parameters. You can also download the JSON and drop it into `library/templates/` or import it from the Share panel.

To run automatically on a Raspberry Pi, follow [INSTALL.md](INSTALL.md) (network modes **AP ↔ Wi-Fi** with `elo-net`, Ethernet recovery, captive portal). If the HDMI kiosk is black after a hostname change (Sway running, Chromium not), delete the three Chromium `Singleton*` files and restart the kiosk — see **Troubleshooting** in that file.

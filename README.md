# Visual Synth

A fullscreen visual instrument built around **PIPEs**. A PIPE is a reusable visual processing chain: an ordered stack of operators that produces one picture.

The image is not a single shader with a pile of uniforms. Each operator receives a texture, transforms it, and hands the result to the next. You pick a PIPE in the grid, then edit its operators. The mental model is closer to a VJ effect stack (Resolume) than to a node graph (TouchDesigner).

```text
PIPE
│
├── Lines
├── Warp
├── Color Lookup
└── Bloom
        ↓
     Output
```

That sequence is the first PIPE, not the engine. The engine only knows how to run whatever operators the active PIPE contains:

```text
for operator in pipe.operators:
    output = operator.process(output)
```

`Lines → Warp` is a different image from `Warp → Lines`. Bypass, reorder, duplicate, or remove a stage and the chain recomputes without rewriting the renderer. Duplicate a PIPE and you get an independent copy of that whole configuration.

The same sketch runs in the lab and on a Raspberry Pi. On the Pi, a phone on the local network drives PIPEs over WebSocket. There is no video stream to the phone. Thumbnails are captured on the display from the actual render and synced as data URLs.

## Concept

A synthesizer is a chain of modules. Oscillator into filter into envelope into output. The cable order *is* the patch.

This project treats image the same way. A **generator** starts a signal (here, a field of lines). **Effects** distort that signal in space. **Color** remaps its values. **Filters** like bloom exaggerate what is already bright. **Output** puts the result on a screen.

Two ideas sit under that:

1. **Non-destructive.** An operator does not edit a shared canvas in place as a one-way bake. It reads an input texture and writes a new one. Bypass is therefore cheap: skip the stage, pass the previous texture through.
2. **Order is meaning.** Warp after Lines bends the lines. Lines after Warp draws a clean field on top of whatever Warp did to an empty buffer, which is a different picture. The stack is the composition.

The interface stays linear on purpose. A node graph can come later without throwing away the operators: they already speak input/output. The stack is a constrained graph (one in, one out, one path). Widening that constraint is an interface change, not a rewrite of the processing layer.

Operator colors follow TouchDesigner family coding, so a glance at the stack tells you what kind of module you are looking at:

| Category | Color | TD family analogue | MVP operators |
| --- | --- | --- | --- |
| Generators | `#B45CC8` purple | TOP | Lines |
| Effects / Filters | `#4AAE72` green, `#5B7FD4` blue | CHOP / SOP | Warp, Bloom |
| Color | `#D4A84B` gold | MAT | Color Lookup |
| Compositing | `#D4784A` orange | DAT | (placeholder) |
| Output | `#8E8E8E` gray | COMP | Screen |

Warp is green (transform). Bloom is blue (filter). They share a library category and stay visually distinct in the stack.

## Architecture

A PIPE is a composition of operators. An operator is a processing module. The PIPE does not contain special-cased effects.

```text
Application
    │
    ├── PIPE
    │    ├── Operator
    │    ├── Operator
    │    └── Operator
    │
    └── PIPE
         ├── Operator
         └── Operator
```

The UI mutates PIPE documents. The GPU only sees the active PIPE's operator list.

### PIPE

The user-facing document. Serializable. Duplicable. The grid shows one tile per PIPE, with a thumbnail taken from its actual output.

```text
PIPE
├── id
├── name
├── thumbnail
└── operators[]
      ├── type
      ├── parameters
      └── state
```

Create, duplicate, rename, delete, and activate PIPEs from the grid. Duplicating copies the entire operator configuration with new ids, so edits to the copy never touch the original.

### Operator

The processing unit. Independent of the panel. Standardized shape:

```text
Operator
├── id
├── type
├── name
├── parameters
├── input
└── output
```

An operator can be added, removed, reordered, duplicated, bypassed, and parameterized. Adding a future effect means registering a new operator module. The executor does not change.

### Operator list

An ordered, serializable list of operator instances inside a PIPE. Internally this is still a linear pipeline. Data, not code.

```text
operators
│
├── Lines
├── Warp
├── Color Lookup
├── Bloom
└── Screen
```

That JSON is what gets saved, loaded, duplicated, and sent to the phone. The default stack above is only the first PIPE.

### Operator Registry

A catalog the UI can list without the executor knowing each implementation. The library is grouped the same way the architecture is:

```text
Generators
    Lines          (MVP)
    Noise
    Gradient
    Particles
    Camera
    Video

Effects / Filters
    Warp           (MVP)
    Transform
    Bloom          (MVP)
    Kaleidoscope
    Edge
    Displace
    Blur
    Feedback

Color
    Lookup         (MVP)
    Hue/Saturation
    Levels
    Contrast

Compositing
    Blend
    Mask
    Add
    Multiply

Output
    Screen         (MVP)
    Texture
    Syphon/Spout
    NDI
```

Grey entries live under **Later** in each library category. They are registered placeholders. They are not implemented yet. They exist so the library already describes the instrument.

### Pipeline Executor

The thing that actually runs:

```text
Input
  ↓
Operator 0
  ↓
Operator 1
  ↓
Operator 2
  ↓
Operator 3
  ↓
Output
```

Ping-pong framebuffers carry the image. Each non-output operator writes the next texture. Screen copies the current texture to the default canvas. If Screen sits in the middle of the stack, you see that intermediate image; later stages still compute, but nothing displays them until another Screen (or the engine's fallback blit when no Screen is present).

**The UI defines what should happen. The executor defines how it is executed.**

There is no `renderLines(); thenWarp(); thenLookup(); thenBloom();` in the application. Those names live in the active PIPE's operator data.

Thumbnails are produced by the same executor at a smaller size, into a dedicated framebuffer, then encoded as JPEG. The UI does not assign artwork by hand. Any operator change that alters the picture (parameters, order, bypass, add/remove) refreshes the active PIPE's thumbnail.

## MVP operators

Five modules, one generic runner.

### 1. Lines (Generator)

Procedural line field. Two overlapping directions, so the pattern can moire before anything else touches it. Output is luminance: a standardized texture any later operator can consume.

Density, thickness, angle, spread, speed, mix, invert. After another operator, **Blending Mode** composites this field with the previous image (Normal, Add, Multiply, Screen, Difference, Overlay, Subtract, Lighten, Darken). A second Lines added below the first defaults to Difference.

### 2. Warp (Effect / Transform)

Does not draw its own picture. It distorts the incoming UVs and resamples the previous texture. Amount, frequency, speed, detail. **Tile** (Hold, Repeat, Mirror) fills the frame when those UVs leave the image.

### 3. Color Lookup (Color)

Reads luminance from the previous operator and replaces it with a color palette. Presets are visual swatches; A-D and BG are editable. Hue shift, saturation, and exposure grade the mapped color. The palette is a resource of this operator, not a global.

### 4. Bloom (Effect / Filter)

Extracts bright regions, blurs them at half resolution, and adds the glow back. Threshold, intensity, radius. Independent of Lookup: if you move Bloom before Lookup, it blooms the black-and-white lines instead of the colorized ones.

### 5. Screen (Output)

Presents the current texture on the application's default display. Gain only. No Syphon, Spout, NDI, or extra windows in this build.

## PIPE UI

The first-level view is a **grid of PIPEs**. Click a tile to activate it: that PIPE becomes the live output, and its operator stack appears underneath the grid. The grid stays visible.

```text
┌───────────────────────────────────────────────┐
│                   PIPE GRID                   │
│  [PIPE 01] [PIPE 02] [PIPE 03] [New PIPE]     │
└───────────────────────────────────────────────┘
│  [ TAP  120 BPM ]  [beat viz]  [SYNC]         │
└───────────────────────────────────────────────┘

                  ACTIVE PIPE
                       ↓

┌───────────────────────────────────────────────┐
│ Lines                                         │
├───────────────────────────────────────────────┤
│ Warp                                          │
├───────────────────────────────────────────────┤
│ Color Lookup                                  │
└───────────────────────────────────────────────┘
```

The bar under the grid is the **clock**. Tap the BPM pad in time to set tempo (4/4); that does not reset the bar. The square visualizer lights each beat clockwise. **SYNC** jumps back to beat 1 without changing the tempo.

Operators stay collapsed so the whole chain fits on a phone: name, color, and a chevron. Expanded rows show a heavier header, tools, and parameters.

Tap a parameter name (or the wave icon) to modulate it. The slider grows In/Out handles: the modulator always outputs 0..1 and remaps that into the handle range. Swap the handles to invert direction.

Sources:

- **Speed** (wall clock): cycle length in seconds. Loop, bounce (ping-pong), or random on each cycle.
- **BPM**: cycle length in beats, starting at 4. `/2` and `x2` jump 1, 2, 4, 8, 16, 32. Same play modes.
- **FFT**: phone microphone. Low / mid / high bands drive the parameter. Play modes do not apply.

The stored slider value stays as a fallback. Modulation is resolved at draw time, so the GPU never writes back into the PIPE document. FFT levels travel over WebSocket from the phone; they are not saved in state.

```text
        +
┌─────────────────────┐
│ WARP              ▼ │   collapsed
└─────────────────────┘
        +
┌─────────────────────┐
│ WARP              ▲ │   expanded
├─────────────────────┤
│ Amount  [──────]    │
└─────────────────────┘
```

Tap **+** between rows to open the Operator Library at that point. Tap a name to expand parameters. Drag the grip to reorder. Icon actions (bypass, up, down, duplicate, delete) show a name and description on hover. **?** in the header explains PIPE and operator types. **?** on a row explains that operator.

PIPE actions: New PIPE, duplicate, rename, delete. The last remaining PIPE cannot be deleted.

Open the panel with **U**, or click/tap the right edge. On a phone, `control.html` is the same grid and stack without a canvas.

## Run in the lab / on a desktop

Static page. No Node server for local preview:

- Lab: open `/p5js-visual-synth/` on the Jekyll site
- Folder: serve `experiments/p5js-visual-synth/` with any static server, e.g. `npx serve experiments/p5js-visual-synth`

The overlay UI talks to a WebSocket server when one exists. In the lab that connection is skipped, so everything stays local.

## Raspberry Pi

The Pi is the renderer, web server, and WebSocket server. Chromium runs `index.html` in kiosk mode on the HDMI/touchscreen. A phone opens `control.html` on the same network. These steps assume the Raspberry Pi OS user is **pi**, Debian 13 (Trixie) Lite (no desktop), and a Raspberry Pi 4.

### Hardware

- Raspberry Pi 4 (2 GB+) or Pi 5
- HDMI or official touchscreen
- Pi and phone on the same Wi-Fi (or Ethernet + phone on that LAN)

### 1. Copy the experiment

This experiment lives on the **lab** branch. Sparse checkout pulls only `experiments/p5js-visual-synth`:

```bash
cd /home/pi
sudo apt update
sudo apt install -y git
git clone --depth 1 --filter=blob:none --sparse -b lab https://github.com/SandroMiccoli/miccoliPortfolio.git
cd miccoliPortfolio
git sparse-checkout init --cone
git sparse-checkout set experiments/p5js-visual-synth
git checkout
cd experiments/p5js-visual-synth
```

If the repo is already cloned on another branch:

```bash
cd /home/pi/miccoliPortfolio
git fetch origin lab
git switch lab
git sparse-checkout init --cone
git sparse-checkout set experiments/p5js-visual-synth
git checkout
```

The on-disk path stays `/home/pi/miccoliPortfolio/experiments/p5js-visual-synth`, so the systemd unit below still matches.

### 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

### 3. Install and start the server

```bash
cd server
npm install
npm start
```

The server listens on **8080** by default (no root needed). It prints the local and LAN URLs on start. Override with `PORT=...` if you need another port.

Open the renderer at `http://127.0.0.1:8080/` and the phone UI at `http://127.0.0.1:8080/control.html`.

p5.js and the QR library load from a CDN, so the Pi needs internet the first time Chromium loads the page (after that the browser cache is enough). To run fully offline, download `p5.min.js` and `qrcode.min.js` into this folder and point the `<script src>` tags in `index.html` at those files.

### 4. Hostname: `http://visual-synth.local`

```bash
sudo hostnamectl set-hostname visual-synth
sudo apt install -y avahi-daemon
sudo reboot
sudo systemctl enable --now avahi-daemon
```

After a reboot, mDNS should answer at `http://visual-synth.local:8080`.

Windows does not always resolve `.local` without iTunes/Bonjour. Use the printed LAN IP, or scan the QR code (it encodes the IP control URL, which is more reliable on Android).

### 5. systemd service

`/etc/systemd/system/visual-synth.service`:

```ini
[Unit]
Description=Visual Synth
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/miccoliPortfolio/experiments/p5js-visual-synth/server
ExecStart=/usr/bin/node index.js
Environment=PORT=8080
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now visual-synth
sudo systemctl status visual-synth
```

To use port 80 instead, set `Environment=PORT=80` and add:

```ini
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
```

### 6. Chromium kiosk (Lite, no desktop)

Lite has no desktop session, so `~/.config/autostart/*.desktop` will not run. Start a minimal X server on **tty1** (the HDMI console) with `xinit`, then launch Chromium. You can configure this over SSH, but **do not** run `~/.xinitrc` or `chromium` directly: `$DISPLAY` will be empty and you will get `Missing X server`.

#### Packages and groups

```bash
sudo apt update
sudo apt install -y --no-install-recommends chromium xserver-xorg xinit x11-xserver-utils
sudo usermod -aG video,render,input,tty pi
which chromium   # expect /usr/bin/chromium
```

Log out of SSH (or reboot) so the new groups apply.

Allow `pi` to start X:

```bash
echo -e "allowed_users=anybody\nneeds_root_rights=yes" | sudo tee /etc/X11/Xwrapper.config
```

#### `/home/pi/.xinitrc`

```sh
#!/bin/sh
export DISPLAY=:0
xset s off
xset -dpms
xset s noblank
exec chromium --kiosk --app=http://127.0.0.1:8080/ \
  --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --enable-media-stream \
  --disable-features=WebRtcPipeWireCamera \
  --ignore-gpu-blocklist --use-gl=egl \
  --ozone-platform=x11
```

```bash
chmod +x /home/pi/.xinitrc
```

#### systemd unit

`/etc/systemd/system/visual-synth-kiosk.service`:

```ini
[Unit]
Description=Visual Synth Chromium kiosk
After=network-online.target visual-synth.service
Wants=network-online.target
Requires=visual-synth.service

[Service]
User=pi
Group=pi
TTYPath=/dev/tty1
TTYReset=yes
TTYVHangup=yes
StandardInput=tty
StandardOutput=journal
Environment=HOME=/home/pi
ExecStart=/usr/bin/xinit /home/pi/.xinitrc -- :0 vt1
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

The console login on tty1 must get out of the way so X can own the HDMI output:

```bash
sudo systemctl disable getty@tty1
sudo systemctl daemon-reload
sudo systemctl enable --now visual-synth.service visual-synth-kiosk.service
```

On boot the Node server starts on 8080, then Chromium opens fullscreen on the attached display. The QR overlay shows for 10 seconds and fades out. There is no side tab; press **U** or click the right edge to toggle the control panel. The QR button and cursor appear only while the pointer is moving. Do not pass `-nocursor` to `xinit`, or the pointer can never reappear.

#### One-shot test from SSH

```bash
sudo systemd-run --unit=visual-synth-kiosk-test \
  --uid=pi --gid=pi \
  --property=TTYPath=/dev/tty1 \
  --property=StandardInput=tty \
  --setenv=HOME=/home/pi \
  /usr/bin/xinit /home/pi/.xinitrc -- :0 vt1
```

Watch the Pi screen, not the SSH session. Stop with `sudo systemctl stop visual-synth-kiosk-test`. Logs: `journalctl -u visual-synth-kiosk -e`.

#### Wayland kiosk (cage)

If the HDMI session is **cage** instead of xinit, put the same Chromium flags on `ExecStart` in `visual-synth-kiosk.service`, including `--disable-features=WebRtcPipeWireCamera`. Example:

```ini
ExecStart=/usr/bin/cage -- /usr/bin/chromium --kiosk --app=http://127.0.0.1:8080/ \
  --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --enable-media-stream \
  --disable-features=WebRtcPipeWireCamera \
  --ozone-platform=wayland
```

Give the unit a user session so Chromium can talk to the bus (`XDG_RUNTIME_DIR=/run/user/1000`, and typically `DBUS_SESSION_BUS_ADDRESS` / `PIPEWIRE_RUNTIME_DIR` for that same user). Restart with `sudo systemctl daemon-reload && sudo systemctl restart visual-synth-kiosk`.

### 7. Phone control

1. Join the same Wi-Fi as the Pi
2. Scan the boot QR, or open `http://<pi-ip>:8080/control.html`
3. Change PIPEs and operators: activate, add, bypass, reorder, tweak parameters. The Pi display updates immediately
4. On the Pi, press **U** or tap the right edge for the same panel

The phone never receives the rendered video. It only sends PIPE patches over WebSocket, plus optional FFT and phone-camera frames. Thumbnails are generated on the display and come back in state.

### Camera (USB on the Pi, or the phone)

Camera Input has a **Source** control: **Display** (webcam on the Raspberry Pi) or **Phone** (the control phone). The picture is always composited on the Pi. The phone never shows the camera in its own UI.

**Display / USB webcam**

1. Plug the webcam in and confirm the Pi sees it:

```bash
sudo apt install -y v4l-utils
v4l2-ctl --list-devices
groups   # pi must include video
```

If `video` is missing: `sudo usermod -aG video pi` then reboot.

2. Chromium in kiosk must auto-accept the camera prompt. Without this flag, adding Camera Input from the phone does nothing because the permission dialog never appears on the HDMI screen. Keep:

```
--use-fake-ui-for-media-stream --enable-media-stream
```

3. Raspberry Pi OS Chromium enables **PipeWire camera** by default. In a Lite kiosk (xinit or cage) that path often never opens the USB device: `getUserMedia` times out, the webcam LED stays off, `ffmpeg -f v4l2 -i /dev/video0` still works, and `wpctl status` shows the camera while Chromium never appears as a **video** client (audio only).

Force V4L2 — the same path ffmpeg uses. Add this Chromium flag (if `--disable-features` already exists, append `WebRtcPipeWireCamera` with a comma, do not add a second flag):

```
--disable-features=WebRtcPipeWireCamera
```

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl restart visual-synth-kiosk
```

Do **not** add `--use-fake-device-for-media-stream` except as a drawing test; that replaces the real camera with Chromium’s green test pattern.

4. Add **Camera Input**, leave Source on **Display**, and tap **Reconnect** if the status card is in error.

**Phone camera**

Modern browsers block `getUserMedia` on plain HTTP. The server also listens on HTTPS (port 8443) with a self-signed certificate. Open the printed `https   .../control.html` URL, accept the certificate warning, then set Source to **Phone**. HTTP control still works for everything except the phone camera.

Phone frames are encoded as **9:16** (270×480) before they leave the phone: the landscape sensor buffer is rotated when the phone is upright, then cover-cropped. Cover / Contain on Camera Input then see a portrait texture against the landscape HDMI frame.

## Troubleshooting

| Symptom | What to try |
| --- | --- |
| Black screen / no animation | Confirm WebGL in `chrome://gpu`. Keep `--ignore-gpu-blocklist --use-gl=egl`. |
| Missing X server / `$DISPLAY` empty | Do not run `.xinitrc` or Chromium from SSH. Start `visual-synth-kiosk.service` (or the `systemd-run` test). Disable `getty@tty1`. |
| `visual-synth.local` does not open | Use `http://visual-synth.local:8080` or the LAN IP. On Windows, install Bonjour or skip mDNS. Android often needs the IP. |
| Port already in use | Another process is on 8080. Stop it, or start with `PORT=8081 npm start` and update the kiosk URL. |
| Phone UI does not connect | Same network, no guest-Wi-Fi client isolation, and the printed `control` URL. |
| Camera Input stays black (Display) | LED on but no picture is usually Chromium failing to upload the `<video>` to WebGL. Reload after the blit fix. If the LED never turns on: USB webcam, `v4l2-ctl --list-devices`, `pi` in the `video` group, Chromium flags `--use-fake-ui-for-media-stream --enable-media-stream`, then restart the kiosk. |
| USB camera times out / LED never on, `ffmpeg` works | Chromium is using PipeWire for the camera. Add `--disable-features=WebRtcPipeWireCamera` to the kiosk Chromium args, `daemon-reload`, restart `visual-synth-kiosk`. |
| Phone camera does nothing | Open the printed **https** control URL (port 8443) and accept the certificate. HTTP blocks the phone camera. |
| CDN scripts fail offline | Vendor `p5.min.js` / `qrcode.min.js` next to `index.html`. |

## Files

| File | Role |
| --- | --- |
| `icons.js` | Phosphor icon paths for stack actions |
| `index.html` | Renderer: fullscreen canvas, overlay UI, boot QR |
| `control.html` | Phone UI only (no canvas) |
| `core/registry.js` | Operator catalog |
| `core/pipeline.js` | Ordered operator-list helpers |
| `core/pipes.js` | PIPE create / duplicate / rename / active |
| `core/clock.js` | TAP BPM, 4/4 phase, SYNC |
| `core/modulate.js` | Timeline / BPM / FFT parameter modulator |
| `core/fft.js` | Microphone analyser and remote FFT bus |
| `core/executor.js` | Generic `for op in operators` runner + framebuffers |
| `operators/*.js` | Operator modules (MVP + placeholders) |
| `shaders.js` / `engine.js` | GLSL sources, compile, blit, thumbnail capture |
| `state.js` | Shared serializable PIPE state |
| `ui.js` | PIPE grid + operator stack on display and phone |
| `notify.js` | Success / warning / error toasts |
| `sync.js` | WebSocket client (no-op in the lab) |
| `server/index.js` | Static HTTP + WebSocket + `/api/info` |
| `camera.js` | Display USB capture, phone frame sender, device list |

## What this build is not

It is not a complete VJ application. It is proof that operators can be implemented, instantiated, configured, reordered, and executed through one processing architecture.

Future stacks should not require a new engine:

```text
Lines → Warp → Bloom → Screen
Noise → Displace → Color Lookup → Bloom → Screen
Camera → Kaleidoscope → Color Adjust → Bloom → Screen
```

The next work is more operators, then (if needed) branching. The linear stack is allowed to grow into a graph because the processing layer already thinks in inputs and outputs.

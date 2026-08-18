# Visual Synth

Fullscreen p5.js visual instrument with three GPU generators (waves, noise, psychedelic shader), optional webcam blend, and a touch-ready control panel. The same sketch runs in the lab and on a Raspberry Pi. On the Pi, a phone on the local network drives the renderer over WebSocket — there is no video stream to the phone.

```
Generator → Camera Blend → Output
```

## Run in the lab / on a desktop

The experiment is a static page. No Node server is required for local preview:

- Lab: open `/p5js-visual-synth/` on the Jekyll site
- Folder: serve `experiments/p5js-visual-synth/` with any static server, e.g. `npx serve experiments/p5js-visual-synth`

Open the controls with the **CTRL** handle on the right edge, or swipe from the right. Camera access is requested only when you turn Camera **ON**.

The overlay UI talks to a WebSocket server when one exists. In the lab that connection is skipped, so everything stays local.

## Raspberry Pi

The Pi is the renderer, web server, and WebSocket server. Chromium runs `index.html` in kiosk mode. A phone opens `control.html` on the same network. These steps assume the Raspberry Pi OS user is **pi**.

### Hardware

- Raspberry Pi 4 (2 GB+) or Pi 5
- HDMI or official touchscreen
- Optional USB webcam (Pi Camera via `libcamera`/v4l2 also works if it appears as a video device in Chromium)
- Pi and phone on the same Wi-Fi (or Ethernet + phone on that LAN)

### 1. Copy the experiment

Sparse checkout pulls only `experiments/p5js-visual-synth` (the rest of the repo stays omitted):

```bash
cd /home/pi
sudo apt update
sudo apt install -y git
git clone --depth 1 --filter=blob:none --sparse https://github.com/SandroMiccoli/miccoliPortfolio.git
cd miccoliPortfolio
git sparse-checkout set experiments/p5js-visual-synth
cd experiments/p5js-visual-synth
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

The process tries port **80**, then falls back to **8080** if it cannot bind (common without extra capabilities). On success it prints the local and LAN URLs.

```bash
PORT=8080 npm start
```

Open the renderer at `http://127.0.0.1/` (or `:8080`) and the phone UI at `/control.html`.

p5.js and the QR library load from a CDN, so the Pi needs internet the first time Chromium loads the page (after that the browser cache is enough). To run fully offline, download `p5.min.js` and `qrcode.min.js` into this folder and point the `<script src>` tags in `index.html` at those files.

### 4. Hostname: `http://visual.local`

```bash
sudo hostnamectl set-hostname visual
sudo apt install -y avahi-daemon
sudo systemctl enable --now avahi-daemon
```

After a reboot, mDNS should answer at `http://visual.local` (add `:8080` if the server is not on port 80).

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

To bind port 80 without root, keep `Environment=PORT=80` and add:

```ini
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
```

### 6. Chromium kiosk

On Raspberry Pi OS Bookworm the binary is usually `chromium`. Create `/home/pi/.config/autostart/visual-synth.desktop`:

```ini
[Desktop Entry]
Type=Application
Name=Visual Synth
Exec=chromium --kiosk --app=http://127.0.0.1:8080/ --noerrdialogs --disable-infobars --check-for-update-interval=31536000 --autoplay-policy=no-user-gesture-required --ignore-gpu-blocklist --enable-gpu-rasterization --use-gl=egl --use-fake-ui-for-media-stream
X-GNOME-Autostart-enabled=true
```

Drop `:8080` if the server is on port 80. `--use-fake-ui-for-media-stream` auto-accepts the webcam prompt (kiosk has no one to click Allow). Remove it if you prefer the permission dialog.

Log in to the `pi` desktop session automatically so the autostart file runs on boot.

### 7. Camera

```bash
ls /dev/video*
```

Add `pi` to the `video` group if needed:

```bash
sudo usermod -aG video pi
```

Then reboot. In the UI: Camera **ON**, then raise Blend opacity. Blend modes: Normal, Add, Multiply, Screen.

### 8. Phone control

1. Join the same Wi-Fi as the Pi
2. Scan the boot QR, or open `http://<pi-ip>:8080/control.html`
3. Change generator / parameters — the Pi display updates immediately
4. On the Pi touchscreen, swipe from the right edge or tap **CTRL** for the same panel

The phone never receives video. It only sends parameter patches over WebSocket.

## Troubleshooting


| Symptom                      | What to try                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Black screen / no animation  | Confirm WebGL in `chrome://gpu`. Keep `--ignore-gpu-blocklist --use-gl=egl`.                                              |
| `visual.local` does not open | Use the LAN IP. On Windows, install Bonjour or skip mDNS. Android often needs the IP.                                     |
| Port 80 fails                | `PORT=8080 npm start` and put `:8080` in the kiosk URL.                                                                   |
| Camera stays black           | Check `/dev/video0`, `video` group, and that Chromium is allowed to use the camera. Try `--use-fake-ui-for-media-stream`. |
| Phone UI does not connect    | Same network, no guest-Wi-Fi client isolation, and the printed `control` URL.                                             |
| CDN scripts fail offline     | Vendor `p5.min.js` / `qrcode.min.js` next to `index.html`.                                                                |


## Files


| File                       | Role                                             |
| -------------------------- | ------------------------------------------------ |
| `index.html`               | Renderer: fullscreen canvas, overlay UI, boot QR |
| `control.html`             | Phone UI only (no canvas)                        |
| `state.js`                 | Shared serializable state                        |
| `shaders.js` / `engine.js` | WEBGL generators + camera blend                  |
| `ui.js`                    | Same control panel on display and phone          |
| `sync.js`                  | WebSocket client (no-op in the lab)              |
| `server/index.js`          | Static HTTP + WebSocket + `/api/info`            |



# Visual Synth

Fullscreen p5.js visual instrument with three GPU generators (waves, noise, psychedelic shader), optional webcam blend, and a touch-ready control panel. The same sketch runs in the lab and on a Raspberry Pi. On the Pi, a phone on the local network drives the renderer over WebSocket — there is no video stream to the phone.

```
Generator → Camera Blend → Output
```

## Run in the lab / on a desktop

The experiment is a static page. No Node server is required for local preview:

- Lab: open `/p5js-visual-synth/` on the Jekyll site
- Folder: serve `experiments/p5js-visual-synth/` with any static server, e.g. `npx serve experiments/p5js-visual-synth`

Open the controls with **U**, or click/tap the right edge of the screen. Camera access is requested only when you turn Camera **ON**.

The overlay UI talks to a WebSocket server when one exists. In the lab that connection is skipped, so everything stays local.

## Raspberry Pi

The Pi is the renderer, web server, and WebSocket server. Chromium runs `index.html` in kiosk mode on the HDMI/touchscreen. A phone opens `control.html` on the same network. These steps assume the Raspberry Pi OS user is **pi**, Debian 13 (Trixie) Lite (no desktop), and a Raspberry Pi 4.

### Hardware

- Raspberry Pi 4 (2 GB+) or Pi 5
- HDMI or official touchscreen
- Optional USB webcam (Pi Camera via `libcamera`/v4l2 also works if it appears as a video device in Chromium)
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

Lite has no desktop session, so `~/.config/autostart/*.desktop` will not run. Start a minimal X server on **tty1** (the HDMI console) with `xinit`, then launch Chromium. You can configure this over SSH, but **do not** run `~/.xinitrc` or `chromium` directly — `$DISPLAY` will be empty and you will get `Missing X server`.

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
  --ignore-gpu-blocklist --use-gl=egl \
  --use-fake-ui-for-media-stream \
  --ozone-platform=x11
```

```bash
chmod +x /home/pi/.xinitrc
```

`--use-fake-ui-for-media-stream` auto-accepts the webcam prompt (kiosk has no one to click Allow). Remove it if you prefer the permission dialog.

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
4. On the Pi, press **U** or tap the right edge for the same panel

The phone never receives video. It only sends parameter patches over WebSocket.

## Troubleshooting


| Symptom                            | What to try                                                                                                               |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Black screen / no animation         | Confirm WebGL in `chrome://gpu`. Keep `--ignore-gpu-blocklist --use-gl=egl`. |
| Missing X server / `$DISPLAY` empty | Do not run `.xinitrc` or Chromium from SSH. Start `visual-synth-kiosk.service` (or the `systemd-run` test). Disable `getty@tty1`. |
| `visual-synth.local` does not open  | Use `http://visual-synth.local:8080` or the LAN IP. On Windows, install Bonjour or skip mDNS. Android often needs the IP. |
| Port already in use                | Another process is on 8080. Stop it, or start with `PORT=8081 npm start` and update the kiosk URL.                        |
| Camera stays black                 | Check `/dev/video0`, `video` group, and that Chromium is allowed to use the camera. Try `--use-fake-ui-for-media-stream`. |
| Phone UI does not connect          | Same network, no guest-Wi-Fi client isolation, and the printed `control` URL.                                             |
| CDN scripts fail offline           | Vendor `p5.min.js` / `qrcode.min.js` next to `index.html`.                                                                |


## Files


| File                       | Role                                             |
| -------------------------- | ------------------------------------------------ |
| `index.html`               | Renderer: fullscreen canvas, overlay UI, boot QR |
| `control.html`             | Phone UI only (no canvas)                        |
| `state.js`                 | Shared serializable state                        |
| `shaders.js` / `engine.js` | WEBGL generators + camera blend                  |
| `ui.js`                    | Same control panel on display and phone          |
| `notify.js`                | Success / warning / error toasts                 |
| `sync.js`                  | WebSocket client (no-op in the lab)              |
| `server/index.js`          | Static HTTP + WebSocket + `/api/info`            |



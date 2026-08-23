# Install ELO on a Raspberry Pi

The Pi is the renderer, web server, and WebSocket server. Chromium runs `index.html` in kiosk mode on the HDMI display. A phone on the same network opens `control.html` and drives ELOS over WebSocket. There is no video stream to the phone.

These steps assume Raspberry Pi OS **Debian 13 (Trixie) Lite** (no desktop), user **pi**, and a Raspberry Pi 4 or 5.

On boot the Node server should start on port 8080, then Chromium should open fullscreen on the attached display.

## Hardware

- Raspberry Pi 4 (2 GB+) or Pi 5
- HDMI or official touchscreen
- Pi and phone on the same Wi-Fi (or Ethernet + phone on that LAN)

## 1. Clone the project

ELO lives on the **elo** branch. The project is the repo root:

```bash
cd /home/pi
sudo apt update
sudo apt install -y git
git clone --depth 1 -b elo https://github.com/SandroMiccoli/miccoliPortfolio.git elo
cd elo
```

If the repo is already cloned:

```bash
cd /home/pi/elo
git fetch origin elo
git switch elo
git pull
```

## 2. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
```

## 3. Install and start the server

```bash
cd /home/pi/elo/server
npm install
npm start
```

The server listens on **8080** by default (no root needed). It prints the local and LAN URLs on start. Override with `PORT=...` if you need another port.

Open the renderer at `http://127.0.0.1:8080/` and the phone UI at `http://127.0.0.1:8080/control.html`.

GSAP and the QR library load from a CDN, so the Pi needs internet the first time Chromium loads the page (after that the browser cache is enough). To run fully offline, download those scripts next to `index.html` and point the `<script src>` tags at the local files.

## 4. Hostname: `http://elo.local`

```bash
sudo hostnamectl set-hostname elo
sudo apt install -y avahi-daemon
sudo reboot
sudo systemctl enable --now avahi-daemon
```

After a reboot, mDNS should answer at `http://elo.local:8080`.

Windows does not always resolve `.local` without iTunes/Bonjour. Use the printed LAN IP, or scan the QR code (it encodes the IP control URL, which is more reliable on Android).

## 5. systemd service

`/etc/systemd/system/elo.service`:

```ini
[Unit]
Description=ELO
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/elo/server
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
sudo systemctl enable --now elo
sudo systemctl status elo
```

To use port 80 instead, set `Environment=PORT=80` and add:

```ini
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
```

## 6. Chromium kiosk (Lite, no desktop)

Lite has no desktop session, so `~/.config/autostart/*.desktop` will not run. Start a minimal X server on **tty1** (the HDMI console) with `xinit`, then launch Chromium. You can configure this over SSH, but **do not** run `~/.xinitrc` or `chromium` directly: `$DISPLAY` will be empty and you will get `Missing X server`.

### Packages and groups

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

### `/home/pi/.xinitrc`

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

### systemd unit

`/etc/systemd/system/elo-kiosk.service`:

```ini
[Unit]
Description=ELO Chromium kiosk
After=network-online.target elo.service
Wants=network-online.target
Requires=elo.service

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
sudo systemctl enable --now elo.service elo-kiosk.service
```

On boot the Node server starts on 8080, then Chromium opens fullscreen on the attached display. The QR overlay shows for 10 seconds and fades out. There is no side tab; press **U** or click the right edge to toggle the control panel. The QR button and cursor appear only while the pointer is moving. Do not pass `-nocursor` to `xinit`, or the pointer can never reappear.

### One-shot test from SSH

```bash
sudo systemd-run --unit=elo-kiosk-test \
  --uid=pi --gid=pi \
  --property=TTYPath=/dev/tty1 \
  --property=StandardInput=tty \
  --setenv=HOME=/home/pi \
  /usr/bin/xinit /home/pi/.xinitrc -- :0 vt1
```

Watch the Pi screen, not the SSH session. Stop with `sudo systemctl stop elo-kiosk-test`. Logs: `journalctl -u elo-kiosk -e`.

### Wayland kiosk (cage)

If the HDMI session is **cage** instead of xinit, put the same Chromium flags on `ExecStart` in `elo-kiosk.service`, including `--disable-features=WebRtcPipeWireCamera`. Example:

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

Give the unit a user session so Chromium can talk to the bus (`XDG_RUNTIME_DIR=/run/user/1000`, and typically `DBUS_SESSION_BUS_ADDRESS` / `PIPEWIRE_RUNTIME_DIR` for that same user). Restart with `sudo systemctl daemon-reload && sudo systemctl restart elo-kiosk`.

## 7. Phone control

1. Join the same Wi-Fi as the Pi
2. Scan the boot QR, or open `http://<pi-ip>:8080/control.html`
3. Change ELOS and operators: activate, add, bypass, reorder, tweak parameters. The Pi display updates immediately
4. On the Pi, press **U** or tap the right edge for the same panel

The phone never receives the rendered video. It only sends patches over WebSocket, plus optional FFT and phone-camera frames. Thumbnails are generated on the display and come back in state.

## 8. Camera (USB on the Pi, or the phone)

Camera Input has a **Source** control: **Display** (webcam on the Raspberry Pi) or **Phone** (the control phone). The picture is always composited on the Pi. The phone never shows the camera in its own UI.

### Display / USB webcam

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
sudo systemctl restart elo-kiosk
```

Do **not** add `--use-fake-device-for-media-stream` except as a drawing test; that replaces the real camera with Chromium’s green test pattern.

4. Add **Camera Input**, leave Source on **Display**, and tap **Reconnect** if the status card is in error.

### Phone camera

Modern browsers block `getUserMedia` on plain HTTP. The server also listens on HTTPS (port 8443) with a self-signed certificate. Open the printed `https   .../control.html` URL, accept the certificate warning, then set Source to **Phone**. HTTP control still works for everything except the phone camera.

Phone frames are encoded as **9:16** (270×480) before they leave the phone: the landscape sensor buffer is rotated when the phone is upright, then cover-cropped. Cover / Contain on Camera Input then see a portrait texture against the landscape HDMI frame.

## Troubleshooting

| Symptom | What to try |
| --- | --- |
| Black screen / no animation | Confirm WebGL in `chrome://gpu`. Keep `--ignore-gpu-blocklist --use-gl=egl`. |
| Missing X server / `$DISPLAY` empty | Do not run `.xinitrc` or Chromium from SSH. Start `elo-kiosk.service` (or the `systemd-run` test). Disable `getty@tty1`. |
| `elo.local` does not open | Use `http://elo.local:8080` or the LAN IP. On Windows, install Bonjour or skip mDNS. Android often needs the IP. |
| Port already in use | Another process is on 8080. Stop it, or start with `PORT=8081 npm start` and update the kiosk URL. |
| Phone UI does not connect | Same network, no guest-Wi-Fi client isolation, and the printed `control` URL. |
| Camera Input stays black (Display) | LED on but no picture is usually Chromium failing to upload the `<video>` to WebGL. Reload after the blit fix. If the LED never turns on: USB webcam, `v4l2-ctl --list-devices`, `pi` in the `video` group, Chromium flags `--use-fake-ui-for-media-stream --enable-media-stream`, then restart the kiosk. |
| USB camera times out / LED never on, `ffmpeg` works | Chromium is using PipeWire for the camera. Add `--disable-features=WebRtcPipeWireCamera` to the kiosk Chromium args, `daemon-reload`, restart `elo-kiosk`. |
| Phone camera does nothing | Open the printed **https** control URL (port 8443) and accept the certificate. HTTP blocks the phone camera. |
| CDN scripts fail offline | Vendor GSAP / `qrcode.min.js` next to `index.html`. |

# Install ELO on a Raspberry Pi

The Pi is the renderer, web server, and WebSocket server. Chromium runs `index.html` in kiosk mode on the HDMI display. A phone on the same network opens `/control` and drives chains over WebSocket. Live preview on the phone is a JPEG stream of the current output.

These steps assume Raspberry Pi OS **Debian 13 (Trixie) Lite** (no desktop), user **pi**, and a Raspberry Pi 4 or 5.

On boot the Node server should start on port **80** (after `elo-net setup`), then Sway should open Chromium fullscreen on the attached display.

## Hardware

- Raspberry Pi 4 (2 GB+) or Pi 5
- HDMI or official touchscreen
- Pi and phone on the same Wi-Fi (or Ethernet + phone on that LAN)
- **Ethernet cable** for recovery SSH when Wi-Fi or the kiosk misbehaves (see **Network** below)

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

The server listens on **8080** by default on a dev machine (no root needed). On the Pi, use **port 80** (see **systemd service**). It prints the local and LAN URLs on start. Override with `PORT=...` if you need another port.

Open the renderer at `http://127.0.0.1:8080/` and the phone UI at `http://127.0.0.1:8080/control` (dev). On the Pi kiosk, Chromium uses `http://127.0.0.1/` and phones use `/control` on the LAN IP or `http://10.42.0.1/control` in AP mode.

GSAP and the QR library load from a CDN, so the Pi needs internet the first time Chromium loads the page (after that the browser cache is enough). To run fully offline, download those scripts next to `index.html` and point the `<script src>` tags at the local files.

## 4. Hostname: `http://elo.local`

```bash
sudo hostnamectl set-hostname elo
sudo apt install -y avahi-daemon
sudo reboot
sudo systemctl enable --now avahi-daemon
```

After a reboot, mDNS should answer at `http://elo.local/` (port 80 on the Pi).

Windows does not always resolve `.local` without iTunes/Bonjour. Use the printed LAN IP, or scan the QR code (it encodes the IP control URL, which is more reliable on Android).

## 5. Network (AP ↔ Wi-Fi)

The Pi can run in two explicit Wi-Fi modes on `wlan0` (never both at once). **Ethernet is never switched** — use it for SSH recovery even when the hotspot is active.

| Mode | When | Phone joins | Control URL |
| --- | --- | --- | --- |
| **Wi-Fi client** (`wifi`) | Development at home | Your home Wi-Fi | `http://<pi-ip>/control` |
| **Access point** (`ap`) | Installation / venue | Open network named like the hostname (`elo-001`) | Captive portal → `/control` at `http://10.42.0.1/control` |

The hotspot is **open** (no password). WPA2 needs at least 8 characters; a short password like `elo` is rejected by NetworkManager.

Set the WLAN country once (`sudo raspi-config` → Localisation → WLAN Country). Without it the AP often fails to start.

### One-time setup

From the repo on the Pi:

```bash
cd /home/pi/elo
chmod +x scripts/elo-net
sudo scripts/elo-net setup
```

This creates the `elo-ap` NetworkManager profile, installs dnsmasq captive-DNS snippets, adds recovery IP **`192.168.99.1/24`** on Ethernet (alongside DHCP), and enables `elo-network.service` on boot. Default saved mode is **`wifi`**.

Save your home Wi-Fi (first time only):

```bash
sudo scripts/elo-net wifi --ssid "YourNetwork" --password "your-wpa-password"
```

Optional symlink so `elo-net` works from anywhere:

```bash
sudo ln -sf /home/pi/elo/scripts/elo-net /usr/local/bin/elo-net
```

### Switch modes

```bash
sudo elo-net wifi    # development: join saved Wi-Fi
sudo elo-net ap      # installation: open hotspot, SSID = hostname -s
sudo elo-net status  # mode, addresses, active wlan profile
```

`ap` updates the SSID if you change the hostname (`elo-001`, `elo-002`, …). Reboot applies the last saved mode from `/etc/elo/mode`.

### Ethernet recovery

If Wi-Fi or the kiosk breaks, plug a laptop into the Pi with a cable (no router needed):

1. Laptop static IP **`192.168.99.2`**, netmask **`255.255.255.0`**, gateway empty
2. `ssh pi@192.168.99.1` (or `ssh pi@elo-001.local` if mDNS works)

The Pi keeps DHCP on Ethernet when a router is present; `192.168.99.1` is an extra address for direct cable access.

### Captive portal (AP mode only)

When `10.42.0.1` is on `wlan0`, the Node server serves `control.html` to phones (iOS/Android network login sheet). The HDMI kiosk still loads `http://127.0.0.1/` — localhost is never redirected.

**Important:** If Ethernet shares internet to phones on the AP, captive probes may succeed and the login sheet will **not** open. For a reliable portal at a venue, unplug Ethernet or use a network without upstream internet.

Requires the server on **port 80** (next section).

## 6. systemd service

`/etc/systemd/system/elo.service`:

```ini
[Unit]
Description=ELO
After=NetworkManager.service elo-network.service
Wants=NetworkManager.service elo-network.service

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/elo/server
ExecStart=/usr/bin/node index.js
Environment=PORT=80
AmbientCapabilities=CAP_NET_BIND_SERVICE
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
Restart=on-failure
RestartSec=2

[Install]
WantedBy=multi-user.target
```

Port **80** is required for the AP captive portal (phones probe HTTP without a port). The kiosk uses `http://127.0.0.1/` (no `:8080`). On a dev laptop, `npm start` still defaults to **8080**.

If you have not run `elo-net setup` yet, you can temporarily use `Environment=PORT=8080` without `AmbientCapabilities` until network setup is done.

Then:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now elo
sudo systemctl status elo
```

## 7. Chromium kiosk (Lite, no desktop)

Lite has no desktop session, so `~/.config/autostart/*.desktop` will not run. The HDMI session is **Sway** (Wayland) on **tty1**. Sway is the compositor; it launches Chromium. Configure this over SSH by writing the two files below, then restart the unit. **Do not** run `sway` or `chromium` from SSH: there is no seat, and you will get TTY / DRM permission errors.

This path is the one that hides the mouse cursor. `cursor: none` in CSS and p5 `noCursor()` do not apply on Chromium until a real `mousemove`. On a kiosk with no mouse, that event never comes, so the pointer stays. Chromium on Wayland also draws its **own** cursor buffer, so an invisible Xcursor theme and `cage` cannot hide it. Sway can: `seat * hide_cursor 1` hides the pointer after 1 ms with no movement, even if Chromium sends an arrow.

`~/.xinitrc` is **not** used here. That file is only for an X11 / `xinit` session. Do not put Chromium flags in `.xinitrc` and expect this kiosk to read them.

Two files matter. Chromium flags live in the Sway config, **not** in `ExecStart`.

| File | Role |
| --- | --- |
| `/home/pi/.config/sway/config` | Session: hide cursor, launch Chromium |
| `/etc/systemd/system/elo-kiosk.service` | Start Sway on tty1 after the Node server |

### Packages and groups

```bash
sudo apt update
sudo apt install -y chromium sway
sudo usermod -aG video,render,input,tty pi
which chromium   # expect /usr/bin/chromium
which sway       # expect /usr/bin/sway
```

Log out of SSH (or reboot) so the new groups apply.

On Lite, `apt install sway` often **does not** install recommends (`swaybg`, `swaybar`, fonts). Keep the Sway config minimal: no `bar { }`, no `font …`, no `output * bg …`. Those lines need extra packages and will show a Sway “errors in config” banner on boot.

### File 1 — `/home/pi/.config/sway/config`

Create the directory, then write this file. Keep it minimal. The only extra line this kiosk needs later is an optional HDMI `output … mode …` (see **HDMI output resolution** below).

```bash
mkdir -p /home/pi/.config/sway
```

`/home/pi/.config/sway/config`:

```
default_border none
seat * hide_cursor 1
exec /usr/bin/chromium --kiosk --app=http://127.0.0.1/ --noerrdialogs --disable-infobars --disable-session-crashed-bubble --check-for-update-interval=31536000 --autoplay-policy=no-user-gesture-required --ignore-gpu-blocklist --ozone-platform=wayland --use-fake-ui-for-media-stream --enable-media-stream --disable-features=WebRtcPipeWireCamera
```

```bash
chown pi:pi /home/pi/.config/sway /home/pi/.config/sway/config
```

What each line does:

- `default_border none` — no window chrome around Chromium
- `seat * hide_cursor 1` — hide the pointer after 1 ms idle (the cursor fix). If someone plugs a mouse and moves it, the pointer can flash, then hide again
- `exec /usr/bin/chromium …` — same kiosk / camera flags as before. `--ozone-platform=wayland` must stay. `--use-fake-ui-for-media-stream --enable-media-stream` auto-accepts the camera prompt. `--disable-features=WebRtcPipeWireCamera` forces V4L2 for USB webcams

Do **not** add:

- `output * bg #000000 solid_color` — in Sway, `#` starts a comment, so this line is a parse error. Quoted `'#000000'` still needs `swaybg`, which Lite often lacks. An `output HDMI-A-1 mode …` line is different and is allowed (see below)
- `bar { mode invisible }` — needs `swaybar`
- `font pango:monospace …` — needs a font package
- `titlebar_*` / `for_window` — unused on this kiosk; Chromium `--kiosk` is already fullscreen

Write the file as user `pi` when you can. `root:root` with mode `644` also works; `chown pi:pi` avoids confusion.

### File 2 — `/etc/systemd/system/elo-kiosk.service`

`ExecStart` is **only** Sway. Do not put `cage` or `chromium` on this line. Do not write `ExecStart=/usr/bin/sway -- /usr/bin/chromium …` — Sway is not cage.

`/etc/systemd/system/elo-kiosk.service`:

```ini
[Unit]
Description=ELO Chromium kiosk
After=NetworkManager.service elo-network.service elo.service
Wants=NetworkManager.service elo-network.service
Requires=elo.service

[Service]
User=pi
Group=pi
TTYPath=/dev/tty1
TTYReset=yes
TTYVHangup=yes
StandardInput=tty
StandardOutput=journal
PAMName=login
Environment=XDG_RUNTIME_DIR=/run/user/1000
Environment=XDG_SESSION_TYPE=wayland
Environment=DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus
Environment=PIPEWIRE_RUNTIME_DIR=/run/user/1000
Environment=XDG_CURRENT_DESKTOP=sway
ExecStart=/usr/bin/sway
Restart=on-failure
RestartSec=3

[Install]
WantedBy=multi-user.target
```

`PAMName=login` plus the `XDG_*` / PipeWire variables give Chromium a user session so the USB camera and bus work. `uid` **1000** is user `pi` on a stock image; if `id -u pi` is not `1000`, change every `/run/user/1000` to that uid.

The console login on tty1 must get out of the way so Sway can own the HDMI output:

```bash
sudo systemctl disable getty@tty1
sudo systemctl daemon-reload
sudo systemctl enable --now elo.service elo-kiosk.service
```

On boot the Node server starts on port 80, then Sway starts Chromium fullscreen on the attached display. The QR overlay shows for 10 seconds and fades out. The mouse cursor stays hidden. There is no side tab; press **U** or click the right edge to toggle the control panel. The QR button appears while the pointer is moving (if a mouse is plugged in).

After any edit to either file:

```bash
sudo systemctl daemon-reload
sudo systemctl restart elo-kiosk
```

Watch the Pi screen, not the SSH session. Logs: `journalctl -u elo-kiosk -e`.

Do not run `sway --validate` over SSH to debug the config. That command tries to open the HDMI seat and fails with TTY / DRM errors even when the file is valid. If Sway shows “errors in config” on the display, the file has a parse problem (usually `#` or a `bar` / `font` / `output * bg` line). Keep the three-line config above, plus an optional `output … mode …` line if you are capping HDMI.

### One-shot test from SSH

```bash
sudo systemd-run --unit=elo-kiosk-test \
  --uid=pi --gid=pi \
  --property=TTYPath=/dev/tty1 \
  --property=StandardInput=tty \
  --property=PAMName=login \
  --setenv=HOME=/home/pi \
  --setenv=XDG_RUNTIME_DIR=/run/user/1000 \
  --setenv=XDG_SESSION_TYPE=wayland \
  --setenv=DBUS_SESSION_BUS_ADDRESS=unix:path=/run/user/1000/bus \
  --setenv=PIPEWIRE_RUNTIME_DIR=/run/user/1000 \
  --setenv=XDG_CURRENT_DESKTOP=sway \
  /usr/bin/sway
```

Stop with `sudo systemctl stop elo-kiosk-test`.

### HDMI output resolution

The renderer canvas is the Chromium window size, and that window is the HDMI mode Sway picked from the display. There is no resolution control in the ELO UI. A projector that prefers **1920×1080** will run the chain at FHD; on a Pi that often drops to ~10 fps. Cap the HDMI mode so Chromium and WebGL see fewer pixels (1280×720 is about 2.25× fewer than 1080p). The projector then upscales.

On a Pi 4/5 with KMS, **do not** set `hdmi_mode` / `hdmi_group` in `/boot/firmware/config.txt`. Sway owns the mode.

**`swaymsg` from SSH**

`swaymsg -t get_outputs` from an SSH login fails with `Unable to retrieve socket path`. SSH is not the kiosk session, so `SWAYSOCK` is unset. Do **not** start a second `sway` over SSH to fix that — a second compositor on the same HDMI breaks the kiosk.

The running compositor is `elo-kiosk.service` on tty1. Point `swaymsg` at that socket (`uid` **1000** is user `pi` on a stock image; if `id -u pi` is not `1000`, use that uid in every `/run/user/1000` path):

```bash
systemctl is-active elo-kiosk
ls /run/user/1000/sway-ipc.*.sock
```

No socket means Sway is not running. Check `journalctl -u elo-kiosk -e` instead of starting Sway by hand.

```bash
export XDG_RUNTIME_DIR=/run/user/1000
export SWAYSOCK=$(ls /run/user/1000/sway-ipc.*.sock | head -n1)
swaymsg -t get_outputs
```

If SSH is not user `pi`:

```bash
sudo -u pi XDG_RUNTIME_DIR=/run/user/1000 \
  SWAYSOCK=$(ls /run/user/1000/sway-ipc.*.sock | head -n1) \
  swaymsg -t get_outputs
```

That prints the output name (`HDMI-A-1`, `HDMI-A-2`, …) and the modes the display advertised. Use only a mode from that list. A mode the projector did not advertise can black-screen or fail to sync.

**Modes without Sway** (read-only; does not change the signal):

```bash
for d in /sys/class/drm/card*-HDMI-A-*; do
  echo "== $d"
  cat "$d/status"
  cat "$d/modes"
done
```

**Force a mode for good**

Add one line to `/home/pi/.config/sway/config`, using the output name from `get_outputs`. Example:

```
output HDMI-A-1 mode 1280x720@60Hz
```

Put it with the other Sway lines (not on the Chromium `exec` line). Then:

```bash
sudo systemctl restart elo-kiosk
```

Watch the Pi screen, not SSH. A one-shot `swaymsg output HDMI-A-1 mode 1280x720@60Hz` (with `SWAYSOCK` set as above) changes the current session only; the config line is what survives a reboot.

The ELO **Out** meter on the phone should then show 1280×720, not 1920×1080.

### Other kiosk stacks (not recommended)

**cage** — single-app Wayland compositor. Same Chromium flags work, including camera. It cannot hide Chromium’s cursor (`XCURSOR_THEME`, `WLR_NO_HARDWARE_CURSORS`, and CSS `cursor: none` all fail until a mouse move). Only use this if you do not care about the pointer.

```ini
ExecStart=/usr/bin/cage -- /usr/bin/chromium --kiosk --app=http://127.0.0.1/ \
  --noerrdialogs --disable-infobars \
  --disable-session-crashed-bubble \
  --check-for-update-interval=31536000 \
  --autoplay-policy=no-user-gesture-required \
  --use-fake-ui-for-media-stream \
  --enable-media-stream \
  --disable-features=WebRtcPipeWireCamera \
  --ozone-platform=wayland
```

Keep the same `PAMName` / `XDG_*` / PipeWire environment as the Sway unit. There is no `~/.config/sway/config` on this path.

**xinit** — X11 session. `ExecStart=/usr/bin/xinit /home/pi/.xinitrc -- :0 vt1`. Chromium flags then live in `/home/pi/.xinitrc`, not in Sway. Cursor hide is `unclutter-xfixes` (X11 only). Do not mix this with the Sway unit: one compositor on tty1.

## 8. Phone control

1. Join the same Wi-Fi as the Pi (or the Pi’s open hotspot in AP mode)
2. Scan the boot QR, or open `http://<pi-ip>/control` (AP: `http://10.42.0.1/control`)
3. Change chains and operators: activate, add, bypass, reorder, tweak parameters. The Pi display updates immediately
4. On the Pi, press **U** or tap the right edge for the same panel

The phone never receives the rendered video. It only sends patches over WebSocket, plus optional FFT and phone-camera frames. Thumbnails are generated on the display and come back in state.

## 9. Camera (USB on the Pi, or the phone)

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

3. Raspberry Pi OS Chromium enables **PipeWire camera** by default. In a Lite kiosk (Sway, cage, or xinit) that path often never opens the USB device: `getUserMedia` times out, the webcam LED stays off, `ffmpeg -f v4l2 -i /dev/video0` still works, and `wpctl status` shows the camera while Chromium never appears as a **video** client (audio only).

Force V4L2 — the same path ffmpeg uses. Keep this Chromium flag on the `exec` line in `/home/pi/.config/sway/config` (if `--disable-features` already exists, append `WebRtcPipeWireCamera` with a comma, do not add a second flag):

```
--disable-features=WebRtcPipeWireCamera
```

Then restart the kiosk (no `daemon-reload` unless you also edited the unit):

```bash
sudo systemctl restart elo-kiosk
```

Do **not** add `--use-fake-device-for-media-stream` except as a drawing test; that replaces the real camera with Chromium’s green test pattern.

4. Add **Camera Input**, leave Source on **Display**, and tap **Reconnect** if the status card is in error.

### RealSense D435 infrared (optional)

Chromium only lists the D435 **Depth** and **RGB** nodes. Infrared GREY (`/dev/video2` on the Pi 4) is not a `getUserMedia` camera. ELO reads that GREY node with **ffmpeg** and adds **RealSense IR** to Device.

```bash
sudo apt install -y ffmpeg v4l-utils
```

Restart `elo.service` (not only the kiosk) so Node loads the IR helper. Plug the D435 into USB 3. **Default USB** / **UVC Camera** stay the C270. Pick **RealSense IR** for greyscale. Depth is hidden. RGB may still appear.

Confirm: `curl -s http://127.0.0.1/api/ir` should show `"available": true`. Then `curl -o /tmp/ir.jpg http://127.0.0.1/ir.jpg`.

### Phone camera

Modern browsers block `getUserMedia` on plain HTTP. The server also listens on HTTPS (port 8443) with a self-signed certificate. Open the printed `https   .../control` URL, accept the certificate warning, then set Source to **Phone**. HTTP control still works for everything except the phone camera.

Phone frames are encoded as **9:16** (270×480) before they leave the phone: the landscape sensor buffer is rotated when the phone is upright, then cover-cropped. Cover / Contain on Camera Input then see a portrait texture against the landscape HDMI frame.

## Troubleshooting

| Symptom | What to try |
| --- | --- |
| Black screen / no animation | Confirm WebGL in `chrome://gpu`. Keep `--ignore-gpu-blocklist --ozone-platform=wayland` on the Sway `exec` line. |
| HDMI black after hostname change, Sway up, Chromium not running | Chromium locked the profile to the **old** hostname (log: `in use by another Chromium process … on another computer (visual-synth)`). Delete only `~/.config/chromium/SingletonLock`, `SingletonSocket`, and `SingletonCookie` (do not wipe the whole profile). Then `sudo systemctl restart elo-kiosk` (or `visual-synth-kiosk` if the unit was never renamed). |
| Sway “errors in config” on boot | Use the three-line `/home/pi/.config/sway/config` above (plus an optional `output … mode …` line). Do not use `#000000` unquoted (`#` is a comment). Do not add `bar`, `font`, or `output * bg` on Lite. |
| Mouse cursor stays on screen | CSS / `noCursor()` will not hide it without a mouse move. Use Sway `seat * hide_cursor 1`. `cage`, `XCURSOR_THEME`, and `~/.xinitrc` do not apply to this kiosk. |
| HDMI never starts / TTY errors | Do not run `sway` or `chromium` from SSH. Start `elo-kiosk.service`. Disable `getty@tty1`. |
| `swaymsg`: Unable to retrieve socket path | SSH has no `SWAYSOCK`. Export the kiosk socket under `/run/user/1000/sway-ipc.*.sock` as in **HDMI output resolution**. Do not start a second Sway from SSH. |
| Low FPS / **Out** is 1920×1080 | The projector’s preferred HDMI mode is FHD. Cap it with `output HDMI-A-1 mode 1280x720@60Hz` in the Sway config, then `sudo systemctl restart elo-kiosk`. Use a mode from `swaymsg -t get_outputs`. |
| `elo.local` does not open | Use `http://elo.local/` or the LAN IP. On Windows, install Bonjour or skip mDNS. Android often needs the IP. |
| Port already in use | Another process is on 80 (Pi) or 8080 (dev). Stop it, or set `PORT=8081` and update the kiosk URL. |
| AP SSID does not appear | Set WLAN country in `raspi-config`. Run `sudo elo-net status`. Ensure `wlan0` is not stuck on a client profile (`sudo elo-net ap`). |
| Captive portal does not open | Ethernet may be sharing internet to phones — probes succeed and iOS/Android skip the login sheet. Unplug Ethernet or block upstream. Open `http://10.42.0.1/control` manually. |
| Cannot SSH over Wi-Fi | Use Ethernet recovery: laptop `192.168.99.2/24`, `ssh pi@192.168.99.1`. |
| Phone UI does not connect | Same network, no guest-Wi-Fi client isolation, and the printed `control` URL. |
| Camera Input stays black (Display) | LED on but no picture is usually Chromium failing to upload the `<video>` to WebGL. Reload after the blit fix. If the LED never turns on: USB webcam, `v4l2-ctl --list-devices`, `pi` in the `video` group, Chromium flags `--use-fake-ui-for-media-stream --enable-media-stream` on the Sway `exec` line, then restart the kiosk. |
| USB camera times out / LED never on, `ffmpeg` works | Chromium is using PipeWire for the camera. Keep `--disable-features=WebRtcPipeWireCamera` on the Sway `exec` line, then `systemctl restart elo-kiosk`. |
| RealSense is black-and-white noise | That was the Depth node; it is hidden now. Use **RealSense IR** (needs `ffmpeg` and `elo.service` restart). Check `curl -s http://127.0.0.1/api/ir`. |
| Phone camera does nothing | Open the printed **https** control URL (port 8443) and accept the certificate. HTTP blocks the phone camera. |
| CDN scripts fail offline | Vendor GSAP / `qrcode.min.js` next to `index.html`. |

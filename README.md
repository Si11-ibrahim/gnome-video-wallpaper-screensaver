# Video Wallpaper & Screensaver (GNOME Shell extension)

Play any local video file on loop as your desktop wallpaper and/or as a fullscreen screensaver after a period of inactivity.

## Features

- **Live wallpaper** — loops your chosen video behind your desktop icons, one instance per monitor.
- **Video screensaver** — after N seconds idle, plays the video fullscreen on every monitor; any input dismisses it instantly.
- Idle detection uses GNOME's native `Meta.IdleMonitor` — no polling, no extra background scripts.
- Preferences UI to pick the video file, toggle each feature, and set the idle timeout.

## Requirements

- GNOME Shell 45, 46, or 47.
- [`mpv`](https://mpv.io/) — used to play the video (screensaver and wallpaper).
- [`xwinwrap`](https://github.com/ujjwal96/xwinwrap) — used only for the live wallpaper. **The wallpaper feature requires an X11 session** (`xwinwrap` embeds a window into the desktop, which isn't possible under Wayland). The screensaver feature works on both X11 and Wayland.

Install the dependencies on Debian/Ubuntu:

```sh
sudo apt install mpv
```

`xwinwrap` isn't packaged on most distros — build it from source:

```sh
git clone https://github.com/ujjwal96/xwinwrap
cd xwinwrap
make
sudo install -m 755 xwinwrap /usr/local/bin/
```

## Installation

### From source

```sh
git clone https://github.com/Si11-ibrahim/gnome-video-wallpaper-screensaver
cd gnome-video-wallpaper-screensaver
gnome-extensions pack "video-wallpaper-screensaver@Si11-ibrahim.github.io" --force
gnome-extensions install --force video-wallpaper-screensaver@Si11-ibrahim.github.io.shell-extension.zip
```

Then **log out and back in** (on X11 you can instead soft-restart the shell with `Alt+F2` → `r` → `Enter`, though this can be unreliable on some setups — logging out is safer), and enable it:

```sh
gnome-extensions enable "video-wallpaper-screensaver@Si11-ibrahim.github.io"
```

### From extensions.gnome.org

Not yet published there — see [Publishing](#publishing-to-extensionsgnomeorg) below.

## Configuration

Open **Settings → Extensions → Video Wallpaper & Screensaver → Preferences**, or run:

```sh
gnome-extensions prefs "video-wallpaper-screensaver@Si11-ibrahim.github.io"
```

From there you can:
- Choose the video file.
- Toggle the live wallpaper on/off.
- Toggle the screensaver on/off.
- Set the idle timeout (in seconds) before the screensaver starts.

## Publishing to extensions.gnome.org

1. Update `metadata.json`'s `url` field to your repo if you fork this.
2. Zip it: `gnome-extensions pack "video-wallpaper-screensaver@Si11-ibrahim.github.io" --force`.
3. Upload the resulting `.zip` at [extensions.gnome.org/upload](https://extensions.gnome.org/upload/).
4. Extensions go through manual review, which can take anywhere from a few days to a few weeks.

Note that `extensions.gnome.org` review guidelines are cautious about extensions spawning external processes. This extension only spawns `mpv`/`xwinwrap` (never arbitrary user input, and only with a user-selected local file path), which should be reviewable, but be prepared to explain this if asked.

## Known limitations

- Live wallpaper does not work on Wayland sessions (screensaver still does).
- Requires `mpv` and `xwinwrap` to already be installed — this extension does not bundle or install them for you.
- No built-in video files are shipped; you must point it at your own video.

## License

MIT — see [LICENSE](LICENSE).

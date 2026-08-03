import Gio from 'gi://Gio';
import GLib from 'gi://GLib';
import Meta from 'gi://Meta';

import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';

function isWayland() {
    return Meta.is_wayland_compositor();
}

function monitorGeometries() {
    return Main.layoutManager.monitors.map((m, i) => ({
        index: i,
        x: m.x,
        y: m.y,
        width: m.width,
        height: m.height,
    }));
}

function spawnArgv(argv) {
    try {
        const proc = new Gio.Subprocess({
            argv,
            flags: Gio.SubprocessFlags.NONE,
        });
        proc.init(null);
        return proc;
    } catch (e) {
        logError(e, 'video-wallpaper: failed to spawn process');
        return null;
    }
}

function killProc(proc) {
    if (!proc)
        return;
    try {
        proc.force_exit();
    } catch (e) {
        // already dead
    }
}

export default class VideoWallpaperExtension extends Extension {
    enable() {
        this._settings = this.getSettings();
        this._wallpaperProcs = [];
        this._screensaverProcs = [];
        this._idleWatchId = null;
        this._activeWatchId = null;
        this._idleMonitor = global.backend.get_core_idle_monitor();

        this._settingsChangedId = this._settings.connect('changed', () => {
            this._restartWallpaper();
            this._restartIdleWatch();
        });

        this._restartWallpaper();
        this._restartIdleWatch();
    }

    disable() {
        if (this._settingsChangedId) {
            this._settings.disconnect(this._settingsChangedId);
            this._settingsChangedId = null;
        }
        this._clearIdleWatch();
        this._stopScreensaver();
        this._stopWallpaper();
        this._settings = null;
        this._idleMonitor = null;
    }

    _stopWallpaper() {
        this._wallpaperProcs.forEach(killProc);
        this._wallpaperProcs = [];
    }

    _restartWallpaper() {
        this._stopWallpaper();

        if (!this._settings.get_boolean('wallpaper-enabled'))
            return;

        if (isWayland()) {
            log('video-wallpaper: live wallpaper requires X11, skipping on Wayland session');
            return;
        }

        const video = this._settings.get_string('video-path');
        if (!video || !GLib.file_test(video, GLib.FileTest.EXISTS)) {
            log('video-wallpaper: no valid video-path set, skipping wallpaper');
            return;
        }

        if (!GLib.find_program_in_path('xwinwrap') || !GLib.find_program_in_path('mpv')) {
            log('video-wallpaper: xwinwrap and/or mpv not found in PATH');
            return;
        }

        for (const mon of monitorGeometries()) {
            const geom = `${mon.width}x${mon.height}+${mon.x}+${mon.y}`;
            const mpvCmd = `mpv --loop --no-audio --stop-screensaver=no --hwdec=auto --wid=$1 ${GLib.shell_quote(video)}`;
            const argv = [
                'xwinwrap', '-g', geom, '-ni', '-s', '-nf', '-b', '-un', '-fdt', '--',
                'sh', '-c', mpvCmd, 'sh', 'WID',
            ];
            const proc = spawnArgv(argv);
            if (proc)
                this._wallpaperProcs.push(proc);
        }
    }

    _clearIdleWatch() {
        if (this._idleWatchId !== null) {
            this._idleMonitor.remove_watch(this._idleWatchId);
            this._idleWatchId = null;
        }
        if (this._activeWatchId !== null) {
            this._idleMonitor.remove_watch(this._activeWatchId);
            this._activeWatchId = null;
        }
    }

    _restartIdleWatch() {
        this._clearIdleWatch();

        if (!this._settings.get_boolean('screensaver-enabled'))
            return;

        const idleMs = this._settings.get_int('idle-seconds') * 1000;
        this._idleWatchId = this._idleMonitor.add_idle_watch(idleMs, () => {
            this._startScreensaver();
        });
    }

    _startScreensaver() {
        if (this._screensaverProcs.length > 0)
            return;

        const video = this._settings.get_string('video-path');
        if (!video || !GLib.file_test(video, GLib.FileTest.EXISTS))
            return;

        if (!GLib.find_program_in_path('mpv'))
            return;

        for (const mon of monitorGeometries()) {
            const argv = [
                'mpv', `--fs-screen=${mon.index}`, '--fullscreen', '--loop-file=inf',
                '--no-audio', '--really-quiet', '--stop-screensaver=no',
                '--no-input-default-bindings', '--input-conf=/dev/null',
                '--no-osc', '--ontop', '--cursor-autohide=always', '--no-input-cursor',
                video,
            ];
            const proc = spawnArgv(argv);
            if (proc)
                this._screensaverProcs.push(proc);
        }

        if (this._activeWatchId === null) {
            this._activeWatchId = this._idleMonitor.add_user_active_watch(() => {
                this._activeWatchId = null;
                this._stopScreensaver();
                this._restartIdleWatch();
            });
        }
    }

    _stopScreensaver() {
        this._screensaverProcs.forEach(killProc);
        this._screensaverProcs = [];
    }
}

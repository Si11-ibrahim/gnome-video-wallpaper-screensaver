import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import { ExtensionPreferences } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class VideoWallpaperPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings();

        const page = new Adw.PreferencesPage();
        window.add(page);

        const group = new Adw.PreferencesGroup({ title: 'Video Wallpaper & Screensaver' });
        page.add(group);

        const videoRow = new Adw.ActionRow({
            title: 'Video file',
            subtitle: settings.get_string('video-path') || 'No file selected',
        });
        const chooseButton = new Gtk.Button({
            label: 'Choose…',
            valign: Gtk.Align.CENTER,
        });
        chooseButton.connect('clicked', () => {
            const dialog = new Gtk.FileChooserDialog({
                title: 'Select a video file',
                action: Gtk.FileChooserAction.OPEN,
                transient_for: window,
                modal: true,
            });
            dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
            dialog.add_button('Select', Gtk.ResponseType.ACCEPT);

            const filter = new Gtk.FileFilter();
            filter.add_mime_type('video/*');
            filter.set_name('Video files');
            dialog.add_filter(filter);

            dialog.connect('response', (dlg, response) => {
                if (response === Gtk.ResponseType.ACCEPT) {
                    const file = dlg.get_file();
                    const path = file.get_path();
                    settings.set_string('video-path', path);
                    videoRow.subtitle = path;
                }
                dlg.destroy();
            });
            dialog.present();
        });
        videoRow.add_suffix(chooseButton);
        group.add(videoRow);

        const wallpaperRow = new Adw.SwitchRow({
            title: 'Live wallpaper',
            subtitle: 'Play the video on loop as the desktop background (X11 only)',
        });
        settings.bind('wallpaper-enabled', wallpaperRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        group.add(wallpaperRow);

        const screensaverRow = new Adw.SwitchRow({
            title: 'Video screensaver',
            subtitle: 'Play the video fullscreen after the idle timeout',
        });
        settings.bind('screensaver-enabled', screensaverRow, 'active', Gio.SettingsBindFlags.DEFAULT);
        group.add(screensaverRow);

        const idleRow = new Adw.SpinRow({
            title: 'Idle timeout (seconds)',
            subtitle: 'How long to wait before the screensaver starts',
            adjustment: new Gtk.Adjustment({
                lower: 10,
                upper: 7200,
                step_increment: 10,
                value: settings.get_int('idle-seconds'),
            }),
        });
        settings.bind('idle-seconds', idleRow, 'value', Gio.SettingsBindFlags.DEFAULT);
        group.add(idleRow);
    }
}

import GUI from '../vendor/lil-gui.esm.min.js';
import { DEFAULTS, POINTER_SLIDERS, SLIDERS, sanitizeSettings, saveSettings } from './config.js';

/**
 * @param {import('lil-gui').default} gui
 */
function refresh(gui) {
  gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
}

/**
 * @param {Record<string, number | string | boolean>} settings
 */
export function mountGui(settings) {
  const gui = new GUI({ title: 'ASCII 404', width: 270 });
  gui.domElement.classList.add('paragon-gui');

  const persist = () => saveSettings(settings);
  gui.onFinishChange(persist);

  const addSlider = (folder, control) => {
    folder
      .add(settings, control.key, control.min, control.max, control.step)
      .name(control.name)
      .decimals(control.digits);
  };

  for (const control of SLIDERS) {
    addSlider(gui, control);
    if (control.key === 'symbolVariety') {
      gui.add(settings, 'glyphCycle').name('Glyph cycle');
    }
    if (control.key !== 'motionAmount') continue;
    const pointer = gui.addFolder('Pointer');
    for (const extra of POINTER_SLIDERS) addSlider(pointer, extra);
  }

  gui.addColor(settings, 'ink').name('Ink');
  gui.addColor(settings, 'accent').name('Hover accent');

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'application/json,.json';
  fileInput.hidden = true;
  document.body.appendChild(fileInput);

  const actions = {
    reset() {
      for (const key of Object.keys(DEFAULTS)) settings[key] = DEFAULTS[key];
      refresh(gui);
      saveSettings(settings);
    },
    save() {
      const blob = new Blob([JSON.stringify(sanitizeSettings(settings), null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'paragon-404-settings.json';
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    load() {
      fileInput.click();
    },
  };

  fileInput.addEventListener('change', () => {
    const file = fileInput.files && fileInput.files[0];
    fileInput.value = '';
    if (!file) return;
    file.text()
      .then((text) => {
        const next = sanitizeSettings(JSON.parse(text));
        for (const key of Object.keys(DEFAULTS)) settings[key] = next[key];
        refresh(gui);
        saveSettings(settings);
      })
      .catch(() => {});
  });

  gui.add(actions, 'reset').name('Reset');
  gui.add(actions, 'save').name('Save settings');
  gui.add(actions, 'load').name('Load settings');

  return {
    destroy() {
      gui.destroy();
      fileInput.remove();
    },
  };
}

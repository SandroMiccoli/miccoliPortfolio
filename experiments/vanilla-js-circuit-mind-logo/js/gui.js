import GUI from '../vendor/lil-gui.esm.min.js';
import { RANGES } from './circuit-mind.js';

/**
 * Demo tuning panel. Not part of the embed.
 *
 * @param {{
 *   settings: Record<string, unknown>,
 *   points: Record<string, { x: number, y: number }>,
 *   ref: { showRef: boolean, refOpacity: number, refScale: number, refX: number, refY: number },
 *   onEdit: () => void,
 *   onCommit: () => void,
 *   onPlay: () => void,
 *   onReset: () => void,
 *   onCopy: (rename: (label: string) => void) => void,
 *   onExport: () => void,
 * }} hooks
 */
export function mountPanel(hooks) {
  const { settings, points, ref } = hooks;
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  const gui = new GUI({ title: 'Circuit Mind', width: narrow ? 250 : 300 });
  gui.domElement.classList.add('cm-demo__gui');

  const bind = (controller) => controller.onChange(hooks.onEdit).onFinishChange(hooks.onCommit);

  const exportCtrl = gui.add({ exportLoop: () => hooks.onExport() }, 'exportLoop').name('Export loop');
  exportCtrl.domElement.title = 'Seamless MP4 of this scene, ready to loop.';

  const reference = gui.addFolder('Reference');
  bind(reference.add(ref, 'showRef').name('Show'));
  bind(reference.add(ref, 'refOpacity', 0, 1, 0.01).name('Opacity'));
  bind(reference.add(ref, 'refScale', 0.2, 1.8, 0.01).name('Scale'));
  bind(reference.add(ref, 'refX', -40, 40, 0.1).name('Offset X %'));
  bind(reference.add(ref, 'refY', -40, 40, 0.1).name('Offset Y %'));

  const stroke = gui.addFolder('Stroke');
  bind(stroke.add(settings, 'trace', RANGES.trace[0], RANGES.trace[1], RANGES.trace[2]).name('Trace px'));
  bind(stroke.add(settings, 'node', RANGES.node[0], RANGES.node[1], RANGES.node[2]).name('Node px'));
  bind(stroke.add(settings, 'glow', RANGES.glow[0], RANGES.glow[1], RANGES.glow[2]).name('Glow px'));
  bind(stroke.add(settings, 'packet', RANGES.packet[0], RANGES.packet[1], RANGES.packet[2]).name('Comet px'));

  const motion = gui.addFolder('Motion');
  bind(motion.add(settings, 'speed', RANGES.speed[0], RANGES.speed[1], RANGES.speed[2]).name('Speed'));
  motion.add(settings, 'playing').name('Animate').onChange(() => {
    hooks.onPlay();
    hooks.onEdit();
  }).onFinishChange(hooks.onCommit);

  const layers = gui.addFolder('Layers');
  bind(layers.add(settings, 'showTraces').name('Traces'));
  bind(layers.add(settings, 'showNodes').name('Nodes'));
  layers.add(settings, 'showComets').name('Comets').onChange(() => {
    hooks.onEdit();
  }).onFinishChange(hooks.onCommit);
  bind(layers.add(settings, 'showTop').name('Top trace'));
  bind(layers.add(settings, 'showBot').name('Bottom trace'));
  bind(layers.add(settings, 'showTrace').name('Color trace'));
  layers.close();

  const geometry = gui.addFolder('Geometry');
  const circles = geometry.addFolder('Circles');
  bindPoint(circles, points.nodeLeft, 'Left');
  bindPoint(circles, points.nodeRight, 'Right');
  const top = geometry.addFolder('Top');
  bindPoint(top, points.topA, 'Left');
  bindPoint(top, points.topPeak, 'Peak');
  bindPoint(top, points.topB, 'Right');
  const bottom = geometry.addFolder('Bottom');
  bindPoint(bottom, points.botA, 'Top');
  bindPoint(bottom, points.botB, 'Corner');
  bindPoint(bottom, points.botPeak, 'Peak');
  bindPoint(bottom, points.botC, 'Right');
  const trace = geometry.addFolder('Trace');
  bindPoint(trace, points.mA, 'Start');
  bindPoint(trace, points.mMid, 'Center');
  bindPoint(trace, points.mElbow, 'Elbow');
  bindPoint(trace, points.mB, 'End');
  geometry.close();

  const colors = gui.addFolder('Colors');
  bind(colors.addColor(settings, 'traceColor').name('Trace'));
  bind(colors.addColor(settings, 'mint').name('Mint'));
  bind(colors.addColor(settings, 'cyan').name('Cyan'));
  bind(colors.addColor(settings, 'background').name('Background'));
  colors.close();

  const actions = {
    reset() {
      hooks.onReset();
    },
    copyValues() {
      hooks.onCopy((label) => {
        copyCtrl.name(label);
      });
    },
  };
  gui.add(actions, 'reset').name('Reset');
  const copyCtrl = gui.add(actions, 'copyValues').name('Copy values');
  gui.close();

  /**
   * @param {import('lil-gui').GUI} folder
   * @param {{ x: number, y: number }} point
   * @param {string} label
   */
  function bindPoint(folder, point, label) {
    bind(folder.add(point, 'x', 0, 327, 0.5).name(`${label} X`));
    bind(folder.add(point, 'y', 0, 310, 0.5).name(`${label} Y`));
  }

  return {
    setExportLabel(label) {
      exportCtrl.name(label);
    },
    lock(locked) {
      gui.controllersRecursive().forEach((controller) => controller.disable(locked));
    },
    refresh() {
      gui.controllersRecursive().forEach((controller) => controller.updateDisplay());
    },
    destroy() {
      gui.destroy();
    },
  };
}

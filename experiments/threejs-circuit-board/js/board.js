import * as THREE from 'three';
import { createPcbBatch, mountBoard } from './batch.js';
import { attachTraces, createTraceCollector, fanOut } from './traces.js';

const BOARD_W = 12;
const BOARD_H = 10;

/**
 * Physical board. Placement order matches the reference studies: silkscreen
 * serial numbers (C1, U2, JP3…) are assigned as each part is drawn.
 * Circuit traces are line geometry. The board face and the brand mark live
 * on the shared base.
 */
export function createBoard(renderer) {
	const batch = createPcbBatch();
	const traces = createTraceCollector();

	function stroke(points, color = '#23483f') {
		traces.add(points, color);
	}

	function label() {}

	function outline() {}

	let serial = 1;

	function box(x, y, z, w, h, d, mat = 'black', rz = 0) {
		batch.box(x, y, z, w, h, d, mat, rz);
	}

	function cyl(x, y, z, radius, height, mat = 'silver') {
		batch.cylinder(x, y, z, radius, height, mat, Math.PI / 2, 0, 0, 20);
	}

	function ring(x, y, z, radius, tube, mat = 'gold') {
		batch.ring(x, y, z, radius, tube, mat);
	}

	function passive(x, y, rz = 0, large = false) {
		batch.begin(x, y);
		const w = large ? 0.22 : 0.13;
		const h = large ? 0.14 : 0.075;
		box(x, y, 0.075, w, h, 0.085, 'ceramic', rz);
		for (const t of [-1, 1]) {
			box(
				x + Math.cos(rz) * w * 0.48 * t,
				y + Math.sin(rz) * w * 0.48 * t,
				0.077,
				w * 0.25,
				h,
				0.09,
				'silver',
				rz,
			);
		}
		outline(x, y, w + 0.08, h + 0.09);
		label(x - 0.07, y + 0.14, 'C' + serial++, 0.06);
		batch.end();
	}

	function ic(x, y, w, h, pins = 8) {
		batch.begin(x, y);
		box(x, y, 0.11, w, h, 0.18, 'chip');
		for (let i = 0; i < pins; i++) {
			const yy = y + (i - (pins - 1) / 2) * ((h - 0.1) / pins);
			for (const s of [-1, 1]) box(x + s * (w / 2 + 0.04), yy, 0.055, 0.13, 0.035, 0.04, 'silver');
		}
		outline(x, y, w + 0.22, h + 0.14);
		label(x - w / 2, y + h / 2 + 0.12, 'U' + serial++, 0.07);
		batch.end();
	}

	function header(x, y, n = 3, rows = 2, rz = 0, jumper = false) {
		batch.begin(x, y);
		const pitch = 0.19;
		box(x, y, 0.15, n * pitch + 0.05, rows * pitch + 0.03, 0.25, 'black', rz);
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < rows; j++) {
				const a = (i - (n - 1) / 2) * pitch;
				const b = (j - (rows - 1) / 2) * pitch;
				const xx = x + a * Math.cos(rz) - b * Math.sin(rz);
				const yy = y + a * Math.sin(rz) + b * Math.cos(rz);
				box(xx, yy, 0.44, 0.045, 0.045, 0.62, 'gold', rz);
				box(xx, yy, 0.72, 0.035, 0.035, 0.06, 'silver', rz);
			}
		}
		if (jumper) {
			box(x, y, 0.48, 0.24, 0.34, 0.5, 'black', rz);
			box(x, y, 0.75, 0.15, 0.23, 0.025, 'grey', rz);
		}
		outline(x, y, n * pitch + 0.14, rows * pitch + 0.12);
		label(x - 0.2, y - 0.34, 'JP' + serial++, 0.085);
		batch.end();
	}

	function socket(x, y, length, rz = 0) {
		batch.begin(x, y);
		function local(a, b, z, w, h, d, mat) {
			box(
				x + a * Math.cos(rz) - b * Math.sin(rz),
				y + a * Math.sin(rz) + b * Math.cos(rz),
				z, w, h, d, mat, rz,
			);
		}
		local(0, 0, 0.13, length, 0.67, 0.2, 'black');
		for (const s of [-1, 1]) local(0, s * 0.32, 0.31, length, 0.1, 0.42, 'black');
		for (const s of [-1, 1]) local(s * (length / 2 - 0.04), 0, 0.31, 0.1, 0.64, 0.42, 'black');
		for (let i = 0; i < Math.floor(length / 0.095) - 2; i++) {
			for (let j = 0; j < 4; j++) {
				local(-length / 2 + 0.14 + i * 0.095, (j - 1.5) * 0.12, 0.255, 0.028, 0.045, 0.12, 'gold');
			}
		}
		outline(x, y, rz ? 0.85 : length + 0.25, rz ? length + 0.25 : 0.85);
		batch.end();
	}

	const holes = [[-5.65, 4.65], [5.65, 4.65], [-5.65, -4.65], [2.25, -4.35], [5.65, -4.65]];
	const shape = new THREE.Shape();
	shape.moveTo(-6, -5);
	shape.lineTo(6, -5);
	shape.lineTo(6, 5);
	shape.lineTo(-6, 5);
	shape.closePath();
	batch.fixed(true);
	for (const [x, y] of holes) {
		const path = new THREE.Path();
		path.absarc(x, y, 0.155, 0, Math.PI * 2, true);
		shape.holes.push(path);
		ring(x, y, 0.025, 0.205, 0.048);
		ring(x, y, -0.09, 0.18, 0.025);
	}
	batch.fixed(false);

	const slab = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false, curveSegments: 24 });
	slab.translate(0, 0, -0.12);
	batch.slab(slab);

	batch.begin(-0.15, 0.05);
	box(-0.15, 0.05, 0.1, 2.9, 2.9, 0.18, 'gold');
	box(-0.15, 0.05, 0.205, 2.85, 2.85, 0.18, 'substrate');
	box(-0.15, 0.05, 0.32, 0.95, 0.95, 0.075, 'die');
	outline(-0.15, 0.05, 3.12, 3.12);
	for (let i = 0; i < 8; i++) {
		for (const s of [-1, 1]) {
			box(-0.15 + s * 0.78, 0.05 + (i - 3.5) * 0.19, 0.31, 0.035, 0.055, 0.035, 'silver');
			box(-0.15 + (i - 3.5) * 0.19, 0.05 + s * 0.78, 0.31, 0.055, 0.035, 0.035, 'silver');
		}
	}
	batch.end();

	socket(-4.75, -0.6, 4.3, Math.PI / 2);
	socket(0.7, -4.18, 4.4);

	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 7; col++) {
			const x = -2.65 + col * 0.76;
			const y = 1.98 + row * 0.78;
			header(x, y, row === 0 ? 2 : 3, 2, Math.PI / 2, (col + row) % 3 === 0);
		}
	}
	header(-4.1, 2.52, 6, 2);
	header(-4.5, 2.05, 9, 2);
	header(-2.7, -2.0, 8, 2);
	header(2.1, -2.2, 5, 2, Math.PI / 2);
	header(2.8, -2.5, 5, 2, Math.PI / 2);

	for (const x of [0.9, 2.6]) {
		batch.begin(x, 4.6);
		box(x, 4.6, 0.35, 1.35, 0.56, 0.6);
		for (let i = 0; i < 9; i++) {
			box(x + (i - 4) * 0.13, 4.24, 0.22, 0.045, 0.25, 0.07, 'gold');
			box(x + (i - 4) * 0.13, 4.13, 0.12, 0.045, 0.06, 0.22, 'silver');
		}
		batch.end();
	}

	batch.begin(-0.8, 4.35);
	box(-0.8, 4.35, 0.26, 1.5, 0.57, 0.46, 'white');
	box(-0.8, 4.35, 0.51, 1.45, 0.54, 0.04, 'led');
	for (let digit = 0; digit < 3; digit++) {
		const x = -1.27 + digit * 0.47;
		for (const dy of [-0.18, 0, 0.18]) box(x, 4.35 + dy, 0.54, 0.23, 0.035, 0.012, 'white');
		for (const dx of [-0.13, 0.13]) {
			for (const dy of [-0.09, 0.09]) box(x + dx, 4.35 + dy, 0.54, 0.032, 0.12, 0.012, 'white');
		}
	}
	batch.end();

	for (let row = 0; row < 5; row++) {
		for (let col = 0; col < 2; col++) {
			const x = 3.65 + col * 0.9;
			const y = 3.95 - row * 0.7;
			box(x, y, 0.14, 0.34, 0.33, 0.23, 'grey');
			label(x - 0.1, y + 0.06, '2R2', 0.09, '#263139');
			for (let j = 0; j < 3; j++) passive(x - 0.3 + j * 0.27, y - 0.29, 0, j === 1);
		}
	}
	ic(2.15, 0.15, 0.67, 1.32, 15);
	ic(-4.35, 3.2, 0.65, 0.64, 8);

	batch.begin(5.28, -0.9);
	box(5.28, -0.9, 0.27, 0.85, 0.78, 0.5);
	batch.cylinder(5.61, -0.9, 0.3, 0.29, 0.5, 'black', 0, 0, Math.PI / 2, 24);
	batch.torus(5.87, -0.9, 0.3, 0.19, 0.035, 'silver', 0, Math.PI / 2, 0, 8, 24);
	batch.cylinder(5.9, -0.9, 0.3, 0.14, 0.015, 'black', 0, 0, Math.PI / 2, 20);
	batch.end();
	batch.begin(5.25, 0.15);
	box(5.25, 0.15, 0.38, 0.7, 0.9, 0.7);
	box(5.25, 0.15, 0.78, 0.56, 0.7, 0.15, 'grey');
	batch.end();
	batch.begin(4.35, -0.75);
	cyl(4.35, -0.75, 0.46, 0.3, 0.86);
	cyl(4.35, -0.75, 0.91, 0.29, 0.035, 'white');
	batch.end();
	box(3.65, -1.2, 0.2, 0.53, 0.49, 0.36, 'grey');
	box(4.65, -1.55, 0.07, 0.42, 0.25, 0.04, 'green');

	for (let row = 0; row < 2; row++) {
		for (let col = 0; col < 2; col++) {
			const x = -3.7 + col * 0.68;
			const y = -3.7 - row * 0.68;
			batch.begin(x, y);
			box(x, y, 0.11, 0.48, 0.48, 0.19, 'silver');
			cyl(x, y, 0.25, 0.14, 0.14, 'black');
			for (const dx of [-0.24, 0.24]) box(x + dx, y, 0.035, 0.09, 0.3, 0.04, 'silver');
			outline(x, y, 0.58, 0.58);
			label(x - 0.2, y - 0.35, 'SW' + (row * 2 + col + 1), 0.09);
			batch.end();
		}
	}

	batch.begin(-1.5, -2.65);
	box(-1.5, -2.65, 0.13, 0.96, 0.4, 0.22);
	for (let i = 0; i < 8; i++) box(-1.88 + i * 0.11, -2.65, 0.29, 0.06, 0.19, 0.1, 'amber');
	batch.end();
	header(-1.4, -3.25, 4, 2);
	header(-2.3, -4.5, 3, 2);

	for (const [x, y] of [[-3.4, -2.7], [-4.55, -3.35], [3.15, -3.35], [4.33, -3.1], [5.45, -2.7]]) {
		ic(x, y, 0.32, 0.5, 5);
		for (let i = 0; i < 4; i++) passive(x + 0.36, y + (i - 1.5) * 0.18);
		box(x - 0.52, y, 0.11, 0.24, 0.29, 0.16, 'grey');
	}

	batch.begin(-5.4, 3.55);
	box(-5.4, 3.55, 0.15, 0.65, 0.51, 0.28, 'silver');
	box(-5.71, 3.55, 0.16, 0.04, 0.35, 0.14, 'black');
	box(-5.36, 3.55, 0.3, 0.38, 0.2, 0.025, 'silver');
	batch.end();

	for (let i = 0; i < 16; i++) {
		for (let j = 0; j < 2; j++) ring(-5.3 + i * 0.18, 4.42 - j * 0.2, 0.02, 0.043, 0.014);
	}
	for (let i = 0; i < 3; i++) {
		for (let j = 0; j < 3; j++) ring(-5.58 + i * 0.15, -3.7 - j * 0.16, 0.023, 0.047, 0.015);
	}
	for (let i = 0; i < 4; i++) {
		for (let j = 0; j < 2; j++) ring(5.12 + i * 0.14, 1.23 + j * 0.14, 0.024, 0.035, 0.011);
	}
	for (let i = 0; i < 7; i++) {
		ring(2.75 + i * 0.16, 0.55, 0.025, 0.055, 0.016);
		label(2.7 + i * 0.16, 0.35, 'TP' + i, 0.065);
	}

	for (let i = 0; i < 16; i++) passive(1.5, -1.15 + i * 0.15, 0, true);
	for (let i = 0; i < 12; i++) {
		const x = 3.15 + (i % 4) * 0.3;
		const y = -0.35 - Math.floor(i / 4) * 0.25;
		if (Math.hypot(x - 4.35, y + 0.75) > 0.55) passive(x, y);
		passive(-3.65 + (i % 4) * 0.27, -0.3 - Math.floor(i / 4) * 0.28);
	}

	for (let row = 0; row < 8; row++) {
		for (let col = 0; col < 3; col++) {
			const x = 3.1 + col * 0.83;
			const y = 3.85 - row * 0.46;
			if ((x > 4 && y < 0.4) || (x < 3.4 && y < 1.4)) continue;
			if (x >= 3.25 && x <= 4.95 && y >= 0.85 && y <= 4.15) continue;
			passive(x, y, Math.PI / 2);
			label(x + 0.1, y + 0.04, 'R' + (220 + row * 3 + col), 0.055);
		}
	}
	for (let i = 0; i < 11; i++) {
		const x = 3.2 + i * 0.2;
		passive(x, -3.95, Math.PI / 2);
		label(x - 0.08, -4.18, 'R' + (310 + i), 0.06);
		passive(x, -4.5, 0);
	}
	for (let i = 0; i < 8; i++) {
		const y = -1.9 - i * 0.24;
		if (y > -3.15 && y < -2.25) continue;
		passive(5.65, y, Math.PI / 2);
		label(5.33, y + 0.05, 'C' + (410 + i), 0.06);
	}
	for (let row = 0; row < 3; row++) {
		for (let col = 0; col < 6; col++) {
			const x = -2.65 + col * 0.76;
			const y = 1.98 + row * 0.78;
			label(x - 0.28, y + 0.33, 'VCCIO' + (row * 6 + col), 0.072);
			label(x - 0.23, y - 0.46, 'GND ' + (row * 6 + col), 0.06);
		}
	}

	header(4.5, -2.25, 3, 2);
	header(5.35, -3.55, 2, 2);
	outline(3.55, -2.8, 0.63, 0.5);
	label(3.28, -2.7, 'EN  TP', 0.07);
	label(3.28, -2.86, 'GND 3V3', 0.065);

	const cpu = { x: -0.15, y: 0.05, hw: 1.45, hh: 1.45 };
	const northHeaders = [];
	for (let col = 0; col < 7; col++) {
		northHeaders.push({ x: -2.65 + col * 0.76, y: 1.98, hw: 0.2, hh: 0.22 });
	}
	fanOut(stroke, cpu, {
		n: northHeaders,
		e: [{ x: 1.5, y: -0.025, hw: 0.11, hh: 1.2 }],
		s: [
			{ x: -1.5, y: -2.65, hw: 0.48, hh: 0.2 },
			{ x: -1.4, y: -3.25, hw: 0.42, hh: 0.22 },
			{ x: 0.7, y: -4.18, hw: 2.2, hh: 0.34 },
		],
		w: [
			{ x: -3.245, y: -0.3, hw: 0.48, hh: 0.1 },
			{ x: -3.245, y: -0.58, hw: 0.48, hh: 0.1 },
			{ x: -3.245, y: -0.86, hw: 0.48, hh: 0.1 },
			{ x: -4.75, y: -0.6, hw: 0.34, hh: 2.15 },
		],
	});
	outline(-0.1, -2.3, 2.8, 1.05);
	const legend = [
		'P INITN   P JTAGEN  TCK',
		'P PROGRAMN  VCCIO  GND',
		'AN12TP AN13TP AN14TP',
		'GND   1V8   3V3   2V5',
		'VCC CORE    TP11 TP12',
		'12V    GND    0V8  1V2',
	];
	for (let row = 0; row < 6; row++) label(-1.4, -1.9 - row * 0.15, legend[row], 0.082);
	label(-3.95, 0.1, 'CIRCUIT MIND', 0.19);
	label(-3.95, -0.12, 'REFERENCE BOARD / 04', 0.085);
	label(-3.95, -0.3, 'ENGINEERING STUDY', 0.075);
	for (let i = 0; i < 23; i++) label(5.15, 4.25 - i * 0.135, 'V' + i + '  C' + (110 + i), 0.067);
	for (let i = 0; i < 18; i++) label(-5.1 + i * 0.54, -4.83, 'TP' + (20 + i), 0.065);

	return attachTraces(mountBoard('pcb', batch.build(), null, null), traces);
}

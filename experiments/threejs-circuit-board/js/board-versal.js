import * as THREE from 'three';
import { createPcbBatch, mountBoard } from './batch.js';
import { attachTraces, createTraceCollector, fanOut } from './traces.js';

const BOARD_W = 12;
const BOARD_H = 10;

/**
 * AMD Versal AI Edge VEK385. Same unlit solids and energy-colored edges
 * as the other boards. Layout follows the kit: Versal SoC, Kria SOM,
 * QSFP, FMC, PCIe fingers, HDMI, SFP, CAN. Traces are line geometry.
 */
export function createVersalBoard(renderer) {
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

	function at(u, v) {
		return [(u - 0.5) * BOARD_W, (0.5 - v) * BOARD_H];
	}

	function edgeX(depth, side) {
		return side * (BOARD_W / 2 - depth / 2 - 0.12);
	}

	function edgeY(depth, side) {
		return side * (BOARD_H / 2 - depth / 2 - 0.12);
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
		label(x - 0.07, y + 0.14, 'C' + serial++, 0.055);
		batch.end();
	}

	function ic(x, y, w, h, pins = 8) {
		batch.begin(x, y);
		box(x, y, 0.11, w, h, 0.18, 'chip');
		for (let i = 0; i < pins; i++) {
			const yy = y + (i - (pins - 1) / 2) * ((h - 0.1) / Math.max(pins, 1));
			for (const s of [-1, 1]) box(x + s * (w / 2 + 0.04), yy, 0.055, 0.13, 0.035, 0.04, 'silver');
		}
		outline(x, y, w + 0.22, h + 0.14);
		label(x - w / 2, y + h / 2 + 0.12, 'U' + serial++, 0.065);
		batch.end();
	}

	function cap(x, y, radius = 0.16) {
		batch.begin(x, y);
		cyl(x, y, radius * 1.15, radius, radius * 2.15, 'silver');
		cyl(x, y, radius * 2.2, radius * 0.9, radius * 0.12, 'black');
		ring(x, y, 0.03, radius * 1.02, 0.018, 'silver');
		outline(x, y, radius * 2.4, radius * 2.4);
		label(x - 0.12, y + radius + 0.18, 'C' + serial++, 0.06);
		batch.end();
	}

	function inductor(x, y, s = 0.32) {
		batch.begin(x, y);
		box(x, y, 0.13, s, s, 0.22, 'grey');
		box(x, y, 0.25, s * 0.62, s * 0.62, 0.04, 'black');
		outline(x, y, s + 0.12, s + 0.12);
		label(x - 0.12, y + s * 0.7, 'L' + serial++, 0.06);
		batch.end();
	}

	function pinHeader(x, y, n, rows, rz, plastic = 'black') {
		batch.begin(x, y);
		const pitch = 0.18;
		const bw = n * pitch + 0.05;
		const bh = rows * pitch + 0.04;
		box(x, y, 0.13, bw, bh, 0.22, plastic, rz);
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < rows; j++) {
				const a = (i - (n - 1) / 2) * pitch;
				const b = (j - (rows - 1) / 2) * pitch;
				const xx = x + a * Math.cos(rz) - b * Math.sin(rz);
				const yy = y + a * Math.sin(rz) + b * Math.cos(rz);
				box(xx, yy, 0.4, 0.038, 0.038, 0.54, 'gold', rz);
				box(xx, yy, 0.64, 0.028, 0.028, 0.05, 'silver', rz);
			}
		}
		outline(x, y, rz ? bh + 0.16 : bw + 0.16, rz ? bw + 0.16 : bh + 0.16);
		label(x - 0.2, y - (rz ? bw * 0.52 : bh * 0.9), 'JP' + serial++, 0.07);
		batch.end();
	}

	function dip(x, y, n = 4, rz = 0) {
		batch.begin(x, y);
		const pitch = 0.16;
		const bw = n * pitch + 0.1;
		box(x, y, 0.1, bw, 0.34, 0.16, 'black', rz);
		for (let i = 0; i < n; i++) {
			const a = (i - (n - 1) / 2) * pitch;
			const xx = x + a * Math.cos(rz);
			const yy = y + a * Math.sin(rz);
			box(xx, yy, 0.2, 0.08, 0.18, 0.06, 'white', rz);
		}
		outline(x, y, bw + 0.14, 0.48);
		label(x - 0.22, y - 0.34, 'SW' + serial++, 0.055);
		batch.end();
	}

	function rj45(x, y, rz = 0, tag = 'ENET') {
		batch.begin(x, y);
		const w = 1.15;
		const h = 1.28;
		box(x, y, 0.38, w, h, 0.72, 'silver', rz);
		box(x, y, 0.34, w * 0.68, h * 0.55, 0.5, 'black', rz);
		for (let i = 0; i < 8; i++) {
			box(x + (rz ? 0.28 : -0.38 + i * 0.11), y + (rz ? -0.38 + i * 0.11 : 0.28), 0.18, 0.04, 0.16, 0.04, 'gold', rz);
		}
		box(x - 0.38, y + 0.42, 0.58, 0.12, 0.12, 0.07, 'led');
		box(x + 0.38, y + 0.42, 0.58, 0.12, 0.12, 0.07, 'amber');
		outline(x, y, rz ? h + 0.2 : w + 0.2, rz ? w + 0.2 : h + 0.18);
		label(x - 0.38, y - 0.72, tag, 0.065);
		batch.end();
	}

	function usbA(x, y, rz = 0, tag = 'USB') {
		batch.begin(x, y);
		box(x, y, 0.3, 0.92, 0.62, 0.54, 'silver', rz);
		box(x, y, 0.24, 0.64, 0.36, 0.3, 'black', rz);
		box(x, y, 0.14, 0.56, 0.2, 0.05, 'white', rz);
		outline(x, y, 1.08, 0.8);
		label(x - 0.26, y - 0.48, tag, 0.055);
		batch.end();
	}

	function usbC(x, y, rz = 0, tag = 'USB-C') {
		batch.begin(x, y);
		box(x, y, 0.12, 0.7, 0.3, 0.18, 'silver', rz);
		box(x, y, 0.12, 0.54, 0.14, 0.08, 'black', rz);
		outline(x, y, 0.86, 0.46);
		label(x - 0.28, y - 0.3, tag, 0.05);
		batch.end();
	}

	function hdmi(x, y, tag) {
		batch.begin(x, y);
		box(x, y, 0.26, 0.58, 0.95, 0.46, 'amber');
		box(x, y, 0.24, 0.38, 0.7, 0.3, 'black');
		for (let i = 0; i < 5; i++) {
			box(x, y - 0.24 + i * 0.12, 0.14, 0.16, 0.04, 0.03, 'gold');
		}
		outline(x, y, 0.76, 1.12);
		label(x + 0.22, y + 0.18, tag, 0.055);
		batch.end();
	}

	function qsfp(x, y) {
		batch.begin(x, y);
		box(x, y, 0.48, 0.78, 1.55, 0.92, 'silver');
		box(x, y + 0.22, 0.42, 0.52, 0.95, 0.62, 'black');
		for (let row = 0; row < 6; row++) {
			for (let col = 0; col < 3; col++) {
				box(x - 0.22 + col * 0.22, y - 0.35 + row * 0.18, 0.95, 0.1, 0.1, 0.04, 'black');
			}
		}
		outline(x, y, 0.96, 1.72);
		label(x - 0.38, y - 0.92, 'QSFP28', 0.065);
		batch.end();
	}

	function sfp(x, y) {
		batch.begin(x, y);
		box(x, y, 0.32, 0.62, 1.15, 0.58, 'silver');
		box(x, y + 0.12, 0.28, 0.4, 0.72, 0.38, 'black');
		outline(x, y, 0.8, 1.32);
		label(x + 0.18, y, 'SFP28', 0.055);
		batch.end();
	}

	function fmc(x, y) {
		batch.begin(x, y);
		box(x, y, 0.22, 2.35, 0.62, 0.4, 'black');
		for (let i = 0; i < 18; i++) {
			for (let j = 0; j < 4; j++) {
				box(x - 1.05 + i * 0.12, y - 0.2 + j * 0.13, 0.38, 0.035, 0.035, 0.08, 'gold');
			}
		}
		outline(x, y, 2.52, 0.8);
		label(x - 0.55, y - 0.48, 'FMC / FMC+', 0.07);
		batch.end();
	}

	function can(x, y, tag) {
		batch.begin(x, y);
		box(x, y, 0.16, 0.42, 0.55, 0.28, 'green');
		for (let i = 0; i < 3; i++) {
			cyl(x, y - 0.16 + i * 0.16, 0.34, 0.06, 0.08, 'silver');
		}
		outline(x, y, 0.56, 0.7);
		label(x - 0.7, y + 0.04, tag, 0.055);
		batch.end();
	}

	function atx(x, y, n, tag) {
		batch.begin(x, y);
		const pitch = 0.16;
		const h = n * pitch + 0.12;
		box(x, y, 0.18, 0.55, h, 0.32, 'black');
		for (let i = 0; i < n; i++) {
			for (const s of [-1, 1]) {
				box(x + s * 0.14, y + (i - (n - 1) / 2) * pitch, 0.32, 0.05, 0.05, 0.12, 'gold');
			}
		}
		outline(x, y, 0.72, h + 0.16);
		label(x - 0.85, y, tag, 0.05);
		batch.end();
	}

	function sd(x, y) {
		batch.begin(x, y);
		box(x, y, 0.08, 0.38, 0.72, 0.1, 'silver');
		box(x, y, 0.12, 0.28, 0.55, 0.04, 'black');
		outline(x, y, 0.52, 0.88);
		label(x + 0.18, y, 'uSD', 0.05);
		batch.end();
	}

	const holes = [
		at(0.04, 0.05),
		at(0.96, 0.05),
		at(0.04, 0.95),
		at(0.96, 0.95),
		at(0.5, 0.05),
		at(0.5, 0.95),
	];
	const radius = 0.26;
	const hw = BOARD_W / 2;
	const hh = BOARD_H / 2;
	const shape = new THREE.Shape();
	shape.moveTo(-hw + radius, -hh);
	shape.lineTo(hw - radius, -hh);
	shape.quadraticCurveTo(hw, -hh, hw, -hh + radius);
	shape.lineTo(hw, hh - radius);
	shape.quadraticCurveTo(hw, hh, hw - radius, hh);
	shape.lineTo(-hw + radius, hh);
	shape.quadraticCurveTo(-hw, hh, -hw, hh - radius);
	shape.lineTo(-hw, -hh + radius);
	shape.quadraticCurveTo(-hw, -hh, -hw + radius, -hh);
	batch.fixed(true);
	for (const [x, y] of holes) {
		const path = new THREE.Path();
		path.absarc(x, y, 0.15, 0, Math.PI * 2, true);
		shape.holes.push(path);
		ring(x, y, 0.025, 0.2, 0.046);
		ring(x, y, -0.09, 0.175, 0.024);
	}
	batch.fixed(false);

	const slab = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false, curveSegments: 24 });
	slab.translate(0, 0, -0.12);
	batch.slab(slab);

	hdmi(edgeX(0.58, -1), at(0, 0.18)[1], 'HDMI TX');
	hdmi(edgeX(0.58, -1), at(0, 0.28)[1], 'HDMI RX');
	sd(edgeX(0.38, -1), at(0, 0.37)[1]);
	usbA(edgeX(0.62, -1), 0.28, Math.PI / 2, 'USB2');
	usbA(edgeX(0.62, -1), -0.78, Math.PI / 2, 'USB2');
	usbC(edgeX(0.3, -1), -1.7, Math.PI / 2, 'JTAG');
	rj45(edgeX(1.28, -1), -2.7, Math.PI / 2, 'PS ETH');
	sfp(-4.15, -3.55);
	usbC(-4.9, -4.5, Math.PI / 2, 'DP / USB3');

	pinHeader(at(0.16, 0.055)[0], edgeY(0.4, 1), 6, 2, 0, 'black');
	label(at(0.16, 0.055)[0] - 0.28, at(0.16, 0.12)[1], 'PMOD', 0.06);
	qsfp(at(0.27, 0.12)[0], edgeY(1.55, 1) - 0.15);
	fmc(at(0.48, 0.055)[0], edgeY(0.62, 1));
	pinHeader(1.5, edgeY(0.4, 1), 5, 2, 0);
	label(at(0.62, 0.12)[0] - 0.22, at(0.62, 0.13)[1], 'PC4', 0.05);
	dip(2.4, edgeY(0.34, 1), 4);
	rj45(3.48, edgeY(1.28, 1), 0, 'PL ETH');
	rj45(4.7, 3.15, 0, 'PL ETH');
	usbA(4.68, edgeY(0.62, 1), 0, 'USB3');

	can(edgeX(0.42, 1), at(1, 0.16)[1], 'CAN0');
	can(edgeX(0.42, 1), at(1, 0.25)[1], 'CAN1');
	can(edgeX(0.42, 1), at(1, 0.34)[1], 'CAN2');
	can(edgeX(0.42, 1), at(1, 0.43)[1], 'CAN3');

	let [x, y] = at(0.96, 0.54);
	x = edgeX(0.35, 1);
	batch.begin(x, y);
	box(x, y, 0.16, 0.28, 0.42, 0.28, 'amber');
	box(x, y, 0.34, 0.08, 0.28, 0.08, 'black');
	batch.end();
	outline(x, y, 0.44, 0.56);
	label(x - 0.85, y, 'PWR SW', 0.05);

	[x, y] = at(0.96, 0.6);
	x = edgeX(0.4, 1);
	batch.begin(x, y);
	box(x, y, 0.14, 0.38, 0.5, 0.24, 'white');
	for (let i = 0; i < 4; i++) box(x, y - 0.16 + i * 0.1, 0.28, 0.12, 0.05, 0.06, 'gold');
	batch.end();
	outline(x, y, 0.52, 0.66);
	label(x - 0.85, y, 'PWR', 0.05);

	atx(edgeX(0.55, 1), at(1, 0.7)[1], 4, 'ATX 4');
	atx(edgeX(0.55, 1), at(1, 0.82)[1], 8, 'ATX 8');
	dip(at(0.88, 0.9)[0], at(0.88, 0.9)[1], 6, Math.PI / 2);

	[x, y] = at(0.46, 0.56);
	batch.begin(x, y);
	box(x, y, 0.1, 2.05, 2.05, 0.16, 'black');
	box(x, y, 0.24, 1.95, 1.95, 0.2, 'chip');
	box(x, y, 0.38, 0.95, 0.95, 0.1, 'die');
	outline(x, y, 2.22, 2.22);
	label(x - 0.7, y + 1.2, 'U' + serial++ + ' VERSAL', 0.085);
	for (let i = 0; i < 12; i++) {
		for (const s of [-1, 1]) {
			box(x + s * 1.08, y + (i - 5.5) * 0.14, 0.28, 0.035, 0.05, 0.04, 'silver');
			box(x + (i - 5.5) * 0.14, y + s * 1.08, 0.28, 0.05, 0.035, 0.04, 'silver');
		}
	}
	batch.end();

	const dram = [
		[0.32, 0.48], [0.32, 0.64],
		[0.6, 0.48], [0.6, 0.64],
		[0.46, 0.4], [0.46, 0.72],
	];
	for (const [u, v] of dram) {
		const p = at(u, v);
		batch.begin(p[0], p[1]);
		box(p[0], p[1], 0.1, 0.62, 0.62, 0.14, 'black');
		box(p[0], p[1], 0.2, 0.55, 0.55, 0.12, 'chip');
		batch.end();
		outline(p[0], p[1], 0.74, 0.74);
		label(p[0] - 0.22, p[1] + 0.42, 'U' + serial++ + ' DDR', 0.05);
	}

	[x, y] = at(0.74, 0.3);
	batch.begin(x, y);
	box(x, y, 0.42, 2.15, 1.85, 0.8, 'black');
	box(x, y, 0.84, 1.95, 1.65, 0.08, 'grey');
	batch.end();
	outline(x, y, 2.32, 2.02);
	label(x - 0.72, y + 1.08, 'KRIA K24 SOM', 0.075);

	[x, y] = at(0.58, 0.78);
	batch.begin(x, y);
	box(x, y, 0.08, 1.55, 0.42, 0.1, 'black');
	box(x, y, 0.14, 1.4, 0.28, 0.04, 'gold');
	batch.end();
	outline(x, y, 1.72, 0.56);
	label(x - 0.42, y - 0.32, 'M.2 KEY M', 0.06);

	[x, y] = at(0.42, 0.88);
	batch.begin(x, y);
	box(x, y, 0.1, 0.72, 0.48, 0.14, 'chip');
	batch.end();
	outline(x, y, 0.88, 0.62);
	label(x - 0.22, y - 0.38, 'UFS 64G', 0.055);

	const fingerW = 0.07;
	for (let i = 0; i < 36; i++) {
		const fx = -2.4 + i * 0.13;
		box(fx, edgeY(0.28, -1), 0.04, fingerW, 0.28, 0.035, 'gold');
	}
	outline(0, -hh + 0.16, 4.9, 0.4);
	label(-0.55, -hh + 0.42, 'PCIE X8', 0.07);

	const caps = [
		[0.14, 0.22, 0.15], [0.2, 0.22, 0.13],
		[0.14, 0.72, 0.16], [0.2, 0.72, 0.14],
		[0.93, 0.58, 0.14], [0.86, 0.5, 0.15],
		[0.22, 0.5, 0.14], [0.68, 0.5, 0.13],
		[0.78, 0.72, 0.16],
	];
	for (const [u, v, r] of caps) {
		const p = at(u, v);
		cap(p[0], p[1], r);
	}

	const coils = [
		[0.18, 0.5, 0.34], [0.275, 0.5, 0.3],
		[0.82, 0.55, 0.32], [0.7, 0.18, 0.28],
	];
	for (const [u, v, s] of coils) {
		const p = at(u, v);
		inductor(p[0], p[1], s);
	}

	const chips = [
		[0.22, 0.32, 0.45, 0.4, 6],
		[0.3, 0.32, 0.38, 0.36, 5],
		[0.18, 0.62, 0.42, 0.38, 6],
		[0.64, 0.18, 0.5, 0.42, 8],
		[0.86, 0.38, 0.4, 0.36, 5],
		[0.7, 0.68, 0.42, 0.38, 6],
		[0.32, 0.82, 0.4, 0.36, 5],
		[0.78, 0.82, 0.38, 0.4, 6],
		[0.54, 0.18, 0.36, 0.32, 4],
	];
	for (const [u, v, w, h, pins] of chips) {
		const p = at(u, v);
		ic(p[0], p[1], w, h, pins);
	}

	const fpga = at(0.46, 0.56);
	const dieC = { x: fpga[0], y: fpga[1], hw: 1.025, hh: 1.025 };
	const dramAt = (u, v) => {
		const p = at(u, v);
		return { x: p[0], y: p[1], hw: 0.31, hh: 0.31 };
	};
	const westDram = [dramAt(0.32, 0.48), dramAt(0.32, 0.64)];
	const eastDram = [dramAt(0.6, 0.48), dramAt(0.6, 0.64)];
	const northDram = dramAt(0.46, 0.4);
	const southDram = dramAt(0.46, 0.72);
	const m2 = at(0.58, 0.78);
	const ufs = at(0.42, 0.88);
	const m2C = { x: m2[0], y: m2[1], hw: 0.78, hh: 0.21 };
	const ufsC = { x: ufs[0], y: ufs[1], hw: 0.36, hh: 0.24 };
	const fmcC = { x: at(0.48, 0.055)[0], y: edgeY(0.62, 1), hw: 1.17, hh: 0.31 };
	const usbA1 = { x: edgeX(0.62, -1), y: 0.28, hw: 0.31, hh: 0.46 };
	const usbA2 = { x: edgeX(0.62, -1), y: -0.78, hw: 0.31, hh: 0.46 };
	const pcieC = { x: 0, y: edgeY(0.28, -1), hw: 2.2, hh: 0.14 };

	fanOut(stroke, dieC, {
		n: [northDram, fmcC],
		e: eastDram,
		s: [southDram, ufsC, m2C],
		w: [...westDram, usbA1, usbA2],
	});
	fanOut(stroke, northDram, { n: [fmcC] });
	fanOut(stroke, westDram[0], { w: [usbA1] });
	fanOut(stroke, westDram[1], { w: [usbA2] });
	fanOut(stroke, m2C, { s: [pcieC] });
	fanOut(stroke, ufsC, { s: [pcieC] });

	outline(-0.15, -2.55, 2.7, 1.0);
	const legend = [
		'VERSAL XC2VE3858',
		'LPDDR5X  160-BIT',
		'QSFP28  SFP28  FMC+',
		'HDMI TX/RX  PCIE X8',
		'VCCINT  0V8  1V0',
		'VCCAUX  1V8  3V3',
	];
	for (let row = 0; row < 6; row++) label(-1.4, -2.18 - row * 0.13, legend[row], 0.07);
	label(-3.95, 1.05, 'CIRCUIT MIND', 0.18);
	label(-3.95, 0.82, 'VERSAL VEK / 06', 0.08);
	label(-3.95, 0.64, 'ENGINEERING STUDY', 0.07);
	for (let i = 0; i < 6; i++) label(4.95, 3.4 - i * 0.18, 'V' + i, 0.055);

	return attachTraces(mountBoard('pcb-versal', batch.build(), null, null), traces);
}

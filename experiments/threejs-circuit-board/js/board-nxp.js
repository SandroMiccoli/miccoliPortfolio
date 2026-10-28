import * as THREE from 'three';
import { createPcbBatch, mountBoard } from './batch.js';
import { attachTraces, createTraceCollector, fanOut } from './traces.js';

const BOARD_W = 12;
const BOARD_H = 9.42;

/**
 * NXP i.MX-class EVK. Same unlit solids and energy-colored edges as the
 * reference board. Layout follows the EVK: dual Ethernet, GPIO, Arduino
 * header, heatsink, HDMI. Traces are line geometry.
 */
export function createNxpBoard(renderer) {
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

	function edgeY(depth, side) {
		return side * (BOARD_H / 2 - depth / 2 - 0.1);
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

	function cap(x, y, radius = 0.17) {
		batch.begin(x, y);
		cyl(x, y, radius * 1.15, radius, radius * 2.15, 'silver');
		cyl(x, y, radius * 2.2, radius * 0.9, radius * 0.12, 'black');
		ring(x, y, 0.03, radius * 1.02, 0.018, 'silver');
		outline(x, y, radius * 2.4, radius * 2.4);
		label(x - 0.12, y + radius + 0.18, 'C' + serial++, 0.06);
		batch.end();
	}

	function inductor(x, y, s = 0.34) {
		batch.begin(x, y);
		box(x, y, 0.13, s, s, 0.22, 'grey');
		box(x, y, 0.25, s * 0.62, s * 0.62, 0.04, 'black');
		outline(x, y, s + 0.12, s + 0.12);
		label(x - 0.12, y + s * 0.7, 'L' + serial++, 0.065);
		batch.end();
	}

	function pinHeader(x, y, n, rows, rz, plastic) {
		batch.begin(x, y);
		const pitch = 0.2;
		const bw = n * pitch + 0.05;
		const bh = rows * pitch + 0.04;
		box(x, y, 0.13, bw, bh, 0.22, plastic, rz);
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < rows; j++) {
				const a = (i - (n - 1) / 2) * pitch;
				const b = (j - (rows - 1) / 2) * pitch;
				const xx = x + a * Math.cos(rz) - b * Math.sin(rz);
				const yy = y + a * Math.sin(rz) + b * Math.cos(rz);
				box(xx, yy, 0.42, 0.04, 0.04, 0.58, 'gold', rz);
				box(xx, yy, 0.68, 0.03, 0.03, 0.05, 'silver', rz);
			}
		}
		outline(x, y, rz ? bh + 0.16 : bw + 0.16, rz ? bw + 0.16 : bh + 0.16);
		label(x - 0.22, y - (rz ? bw * 0.52 : bh * 0.9), 'JP' + serial++, 0.075);
		batch.end();
	}

	function femaleHeader(x, y, n, rows, rz) {
		batch.begin(x, y);
		const pitch = 0.185;
		const bw = n * pitch + 0.06;
		const bh = rows * pitch + 0.05;
		box(x, y, 0.16, bw, bh, 0.28, 'white', rz);
		for (let i = 0; i < n; i++) {
			for (let j = 0; j < rows; j++) {
				const a = (i - (n - 1) / 2) * pitch;
				const b = (j - (rows - 1) / 2) * pitch;
				const xx = x + a * Math.cos(rz) - b * Math.sin(rz);
				const yy = y + a * Math.sin(rz) + b * Math.cos(rz);
				box(xx, yy, 0.2, 0.055, 0.055, 0.16, 'black', rz);
				box(xx, yy, 0.08, 0.03, 0.03, 0.08, 'gold', rz);
			}
		}
		outline(x, y, rz ? bh + 0.18 : bw + 0.18, rz ? bw + 0.18 : bh + 0.18);
		label(x - 0.28, y + (rz ? bw * 0.52 : bh * 0.7), 'J' + serial++, 0.07);
		batch.end();
	}

	function rj45(x, y, tag) {
		batch.begin(x, y);
		const w = 1.38;
		const h = 1.62;
		box(x, y, 0.42, w, h, 0.8, 'silver');
		box(x, y + h * 0.16, 0.38, w * 0.7, h * 0.52, 0.58, 'black');
		for (let i = 0; i < 8; i++) {
			box(x - 0.46 + i * 0.13, y + h * 0.28, 0.2, 0.045, 0.18, 0.04, 'gold');
		}
		for (let i = 0; i < 3; i++) {
			box(x, y - h * 0.32 + i * 0.1, 0.84, w * 0.86, 0.035, 0.03, 'silver');
		}
		box(x - 0.46, y + h * 0.36, 0.64, 0.14, 0.14, 0.08, 'led');
		box(x + 0.46, y + h * 0.36, 0.64, 0.14, 0.14, 0.08, 'amber');
		outline(x, y, w + 0.2, h + 0.18);
		label(x - 0.42, y - h * 0.58, tag, 0.08);
		batch.end();
	}

	function usbA(x, y, rz = 0, tag = 'USB') {
		batch.begin(x, y);
		box(x, y, 0.32, 0.95, 0.7, 0.58, 'silver', rz);
		box(x, y, 0.26, 0.68, 0.42, 0.32, 'black', rz);
		box(x, y, 0.16, 0.6, 0.22, 0.05, 'white', rz);
		outline(x, y, 1.12, 0.88);
		label(x - 0.28, y - 0.52, tag, 0.065);
		batch.end();
	}

	function usbC(x, y, rz = 0, tag = 'USB-C') {
		batch.begin(x, y);
		box(x, y, 0.12, 0.72, 0.32, 0.18, 'silver', rz);
		box(x, y, 0.12, 0.56, 0.14, 0.08, 'black', rz);
		outline(x, y, 0.88, 0.48);
		label(x - 0.28, y - 0.32, tag, 0.055);
		batch.end();
	}

	function usbMicro(x, y, rz = 0, tag = 'USB') {
		batch.begin(x, y);
		box(x, y, 0.11, 0.58, 0.28, 0.16, 'silver', rz);
		box(x, y, 0.11, 0.38, 0.12, 0.07, 'black', rz);
		outline(x, y, 0.72, 0.42);
		label(x - 0.22, y - 0.28, tag, 0.05);
		batch.end();
	}

	function hdmi(x, y) {
		batch.begin(x, y);
		box(x, y, 0.28, 1.15, 0.62, 0.48, 'silver');
		box(x, y + 0.06, 0.26, 0.84, 0.36, 0.32, 'black');
		for (let i = 0; i < 6; i++) {
			box(x - 0.3 + i * 0.12, y + 0.12, 0.15, 0.04, 0.16, 0.035, 'gold');
		}
		outline(x, y, 1.32, 0.82);
		label(x - 0.28, y - 0.48, 'HDMI', 0.07);
		batch.end();
	}

	function fpc(x, y, length = 1.35) {
		batch.begin(x, y);
		box(x, y, 0.11, length, 0.4, 0.16, 'white');
		box(x, y, 0.2, length * 0.9, 0.26, 0.04, 'grey');
		for (let i = 0; i < 10; i++) {
			box(x - length * 0.38 + i * (length * 0.085), y + 0.04, 0.14, 0.04, 0.14, 0.03, 'gold');
		}
		outline(x, y, length + 0.22, 0.58);
		label(x - 0.28, y - 0.36, 'MIPI DSI', 0.06);
		batch.end();
	}

	function heatsink(x, y, w, h, fins = 8) {
		batch.begin(x, y);
		box(x, y, 0.08, w, h, 0.1, 'black');
		const pitch = w / fins;
		const finW = pitch * 0.4;
		const zH = 0.95;
		for (let i = 0; i < fins; i++) {
			box(x - w / 2 + pitch * (i + 0.5), y, zH / 2 + 0.1, finW, h * 0.94, zH, 'black');
		}
		outline(x, y, w + 0.2, h + 0.2);
		label(x - 0.55, y + h * 0.58, 'U' + serial++ + ' IMX', 0.075);
		batch.end();
	}

	function tactile(x, y, tag) {
		batch.begin(x, y);
		box(x, y, 0.08, 0.28, 0.28, 0.1, 'black');
		cyl(x, y, 0.16, 0.08, 0.08, 'grey');
		outline(x, y, 0.4, 0.4);
		label(x - 0.16, y - 0.28, tag, 0.055);
		batch.end();
	}

	function crystal(x, y) {
		batch.begin(x, y);
		box(x, y, 0.09, 0.38, 0.26, 0.12, 'silver');
		box(x, y, 0.16, 0.28, 0.16, 0.04, 'grey');
		outline(x, y, 0.5, 0.38);
		label(x - 0.12, y + 0.24, 'Y' + serial++, 0.055);
		batch.end();
	}

	const holes = [
		at(0.043, 0.056),
		at(0.957, 0.056),
		at(0.043, 0.945),
		at(0.957, 0.945),
	];
	const radius = 0.28;
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
		path.absarc(x, y, 0.155, 0, Math.PI * 2, true);
		shape.holes.push(path);
		ring(x, y, 0.025, 0.205, 0.048);
		ring(x, y, -0.09, 0.18, 0.025);
	}
	batch.fixed(false);

	const slab = new THREE.ExtrudeGeometry(shape, { depth: 0.12, bevelEnabled: false, curveSegments: 24 });
	slab.translate(0, 0, -0.12);
	batch.slab(slab);

	let [x, y] = at(0.038, 0.58);
	pinHeader(x, y, 20, 2, Math.PI / 2, 'amber');
	const gpio = ['3V3', 'GND', 'GPIO1', 'GPIO2', 'I2C_SCL', 'I2C_SDA', 'SPI_CLK', 'SPI_MOSI', 'UART_TX', 'UART_RX'];
	for (let i = 0; i < gpio.length; i++) {
		label(x + 0.32, y + 1.7 - i * 0.36, gpio[i], 0.055);
	}

	[x, y] = at(0.968, 0.5);
	femaleHeader(x, y, 18, 2, Math.PI / 2);
	const arduino = ['IO14', 'IO15', 'IO16', 'IO17', 'IO18', 'IO19', 'IO20', 'IO21', '5V', 'GND'];
	for (let i = 0; i < arduino.length; i++) {
		label(x - 0.72, y + 1.55 - i * 0.32, arduino[i], 0.05);
	}

	usbMicro(at(0.118, 0)[0], edgeY(0.28, 1), 0, 'DBG');
	usbC(at(0.205, 0)[0], edgeY(0.32, 1), 0, 'OTG');
	usbMicro(at(0.285, 0)[0], edgeY(0.28, 1), 0, 'H1');
	rj45(at(0.385, 0)[0], edgeY(1.62, 1), 'ENET1');
	rj45(at(0.515, 0)[0], edgeY(1.62, 1), 'ENET2');
	usbA(at(0.645, 0)[0], edgeY(0.7, 1), 0, 'USB3');
	[x, y] = at(0.8, 0);
	y = edgeY(0.32, 1);
	batch.begin(x, y);
	box(x, y, 0.1, 0.55, 0.32, 0.16, 'white');
	for (let i = 0; i < 4; i++) box(x - 0.18 + i * 0.12, y, 0.2, 0.045, 0.12, 0.06, 'gold');
	batch.end();
	outline(x, y, 0.72, 0.48);
	label(x - 0.28, y - 0.32, 'UART', 0.055);

	tactile(at(0.9, 0.055)[0], at(0.9, 0.055)[1], 'RST');
	tactile(at(0.9, 0.12)[0], at(0.9, 0.12)[1], 'ON');

	[x, y] = at(0.528, 0.355);
	batch.begin(x, y);
	box(x, y, 0.09, 0.95, 0.95, 0.12, 'black');
	box(x, y, 0.18, 0.9, 0.9, 0.14, 'chip');
	box(x, y, 0.28, 0.42, 0.42, 0.08, 'die');
	outline(x, y, 1.12, 1.12);
	label(x - 0.42, y + 0.62, 'U' + serial++ + ' PMIC', 0.07);
	for (let i = 0; i < 8; i++) {
		for (const s of [-1, 1]) {
			box(x + s * 0.52, y + (i - 3.5) * 0.1, 0.2, 0.03, 0.045, 0.03, 'silver');
			box(x + (i - 3.5) * 0.1, y + s * 0.52, 0.2, 0.045, 0.03, 0.03, 'silver');
		}
	}
	batch.end();

	[x, y] = at(0.535, 0.6);
	heatsink(x, y, 2.15, 2.55, 8);

	[x, y] = at(0.705, 0.6);
	batch.begin(x, y);
	box(x, y, 0.09, 1.05, 1.05, 0.12, 'black');
	box(x, y, 0.2, 0.98, 0.98, 0.16, 'chip');
	outline(x, y, 1.22, 1.22);
	label(x - 0.38, y + 0.68, 'U' + serial++ + ' LPDDR', 0.065);
	batch.end();
	ic(x, y - 0.95, 0.55, 0.7, 8);

	usbC(at(0.175, 1)[0], edgeY(0.32, -1), Math.PI, 'H2');
	usbA(at(0.275, 1)[0], edgeY(0.7, -1), Math.PI, 'HOST');
	pinHeader(at(0.365, 1)[0], edgeY(0.44, -1), 4, 2, 0, 'black');
	usbC(at(0.455, 1)[0], edgeY(0.32, -1), Math.PI, 'H3');
	fpc(at(0.6, 1)[0], edgeY(0.4, -1), 1.45);
	hdmi(at(0.87, 1)[0], edgeY(0.62, -1));

	const caps = [
		[0.108, 0.335, 0.18],
		[0.108, 0.405, 0.18],
		[0.175, 0.34, 0.16],
		[0.175, 0.415, 0.16],
		[0.108, 0.48, 0.15],
		[0.9, 0.3, 0.2],
		[0.175, 0.55, 0.14],
		[0.82, 0.38, 0.15],
	];
	for (const [u, v, r] of caps) {
		const p = at(u, v);
		cap(p[0], p[1], r);
	}

	const coils = [
		[0.175, 0.48, 0.38],
		[0.24, 0.36, 0.32],
		[0.24, 0.44, 0.32],
		[0.82, 0.48, 0.3],
	];
	for (const [u, v, s] of coils) {
		const p = at(u, v);
		inductor(p[0], p[1], s);
	}

	const chips = [
		[0.385, 0.24, 0.42, 0.46, 6],
		[0.515, 0.24, 0.42, 0.46, 5],
		[0.25, 0.62, 0.48, 0.42, 6],
		[0.33, 0.7, 0.4, 0.36, 5],
		[0.42, 0.72, 0.36, 0.32, 4],
		[0.72, 0.28, 0.55, 0.5, 8],
		[0.82, 0.28, 0.4, 0.4, 6],
		[0.78, 0.42, 0.36, 0.32, 4],
		[0.82, 0.72, 0.42, 0.5, 6],
		[0.72, 0.78, 0.32, 0.36, 4],
		[0.62, 0.78, 0.36, 0.32, 5],
		[0.2, 0.72, 0.36, 0.4, 5],
	];
	for (const [u, v, w, h, pins] of chips) {
		const p = at(u, v);
		ic(p[0], p[1], w, h, pins);
	}

	crystal(at(0.3, 0.5)[0], at(0.3, 0.5)[1]);
	crystal(at(0.64, 0.34)[0], at(0.64, 0.34)[1]);

	[x, y] = at(0.08, 0.22);
	batch.begin(x, y);
	box(x, y, 0.14, 0.55, 0.42, 0.24, 'silver');
	box(x - 0.28, y, 0.15, 0.04, 0.28, 0.12, 'black');
	batch.end();
	outline(x, y, 0.7, 0.55);
	label(x - 0.22, y - 0.38, 'JTAG', 0.06);

	for (let i = 0; i < 4; i++) {
		[x, y] = at(0.48 + i * 0.035, 0.2);
		box(x, y, 0.08, 0.12, 0.22, 0.1, i % 2 ? 'led' : 'amber');
		outline(x, y, 0.2, 0.32);
		label(x - 0.08, y + 0.22, 'D' + (i + 1), 0.045);
	}

	const soc = at(0.535, 0.6);
	const pmic = at(0.528, 0.355);
	const ddr = at(0.705, 0.6);
	const phy1 = at(0.385, 0.24);
	const phy2 = at(0.515, 0.24);
	const gpioP = at(0.038, 0.58);
	const ard = at(0.968, 0.5);
	const sinkC = { x: soc[0], y: soc[1], hw: 1.075, hh: 1.275 };
	const pmicC = { x: pmic[0], y: pmic[1], hw: 0.54, hh: 0.54 };
	const ddrC = { x: ddr[0], y: ddr[1], hw: 0.52, hh: 0.52 };
	const phy1C = { x: phy1[0], y: phy1[1], hw: 0.21, hh: 0.23 };
	const phy2C = { x: phy2[0], y: phy2[1], hw: 0.21, hh: 0.23 };
	const enet1C = { x: at(0.385, 0)[0], y: edgeY(1.62, 1), hw: 0.69, hh: 0.81 };
	const enet2C = { x: at(0.515, 0)[0], y: edgeY(1.62, 1), hw: 0.69, hh: 0.81 };
	const usb3C = { x: at(0.645, 0)[0], y: edgeY(0.7, 1), hw: 0.48, hh: 0.35 };
	const hostC = { x: at(0.275, 1)[0], y: edgeY(0.7, -1), hw: 0.48, hh: 0.35 };
	const h3C = { x: at(0.455, 1)[0], y: edgeY(0.32, -1), hw: 0.36, hh: 0.16 };
	const fpcC = { x: at(0.6, 1)[0], y: edgeY(0.4, -1), hw: 0.72, hh: 0.2 };
	const hdmiC = { x: at(0.87, 1)[0], y: edgeY(0.62, -1), hw: 0.58, hh: 0.31 };

	const ledNorth = [0, 3].map((i) => {
		const p = at(0.48 + i * 0.035, 0.2);
		return { x: p[0], y: p[1], hw: 0.08, hh: 0.12 };
	});
	fanOut(stroke, sinkC, {
		n: [
			pmicC,
			phy1C,
			{ x: at(0.64, 0.34)[0], y: at(0.64, 0.34)[1], hw: 0.19, hh: 0.13 },
			...ledNorth,
			enet2C,
			{ x: usb3C.x, y: usb3C.y, hw: 0.56, hh: usb3C.hh },
		],
		e: [
			{ x: ddr[0], y: ddr[1], hw: 0.52, hh: 0.59 },
			{ x: ddr[0], y: ddr[1] - 0.95, hw: 0.28, hh: 0.4 },
			{ x: ard[0], y: 0.35, hw: 0.21, hh: 0.7 },
		],
		s: [
			hostC,
			{ x: at(0.365, 1)[0], y: edgeY(0.44, -1), hw: 0.43, hh: 0.22 },
			h3C,
			fpcC,
		],
		w: [
			{ x: gpioP[0], y: gpioP[1], hw: 0.22, hh: 2.02 },
			{ x: at(0.3, 0.5)[0], y: at(0.3, 0.5)[1], hw: 0.19, hh: 0.13 },
			{ x: at(0.25, 0.62)[0], y: at(0.25, 0.62)[1], hw: 0.24, hh: 0.21 },
		],
	});
	fanOut(stroke, pmicC, { n: [phy2C] });
	fanOut(stroke, phy1C, { n: [enet1C] });
	fanOut(stroke, phy2C, { n: [enet2C, usb3C] });
	const ddrBuddy = { x: ddr[0], y: ddr[1] - 0.95, hw: 0.28, hh: 0.35 };
	fanOut(stroke, ddrC, { e: [{ x: ard[0], y: ard[1], hw: 0.21, hh: 1.7 }] });
	fanOut(stroke, ddrBuddy, { s: [hdmiC] });

	outline(-0.35, -2.45, 2.6, 0.95);
	const legend = [
		'ENET1  RGMII   MDIO',
		'ENET2  RGMII   MDC',
		'USB OTG  USB3  HS',
		'HDMI TX  MIPI DSI',
		'VDD_SOC  1V0  1V8',
		'VDD_ARM  3V3  5V0',
	];
	for (let row = 0; row < 6; row++) label(-1.5, -2.1 - row * 0.13, legend[row], 0.072);
	label(-3.85, 0.22, 'CIRCUIT MIND', 0.18);
	label(-3.85, 0.0, 'NXP EVK / 05', 0.08);
	label(-3.85, -0.18, 'ENGINEERING STUDY', 0.07);
	for (let i = 0; i < 8; i++) label(4.85, 3.55 - i * 0.16, 'V' + i, 0.055);

	return attachTraces(mountBoard('pcb-nxp', batch.build(), null, null), traces);
}

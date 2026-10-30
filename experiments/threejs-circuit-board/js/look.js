/**
 * Colors and bloom for the study.
 * The lab panel writes this object to circuit-board-look.json.
 * Replace DEFAULT_LOOK with that file to change the shipped default.
 * Keys here are the only ones the scene paints. A material opts in with userData.look.
 */

export const BLOOM_LIMITS = {
	strength: { min: 0, max: 2, step: 0.01 },
	radius: { min: 0, max: 1, step: 0.01 },
	threshold: { min: 0, max: 1, step: 0.01 },
};

export const DEFAULT_LOOK = {
	bloom: {
		strength: 0.2,
		radius: 0,
		threshold: 0.06,
	},
	system: {
		background: '#06090c',
		grid: '#49a9ed',
		route: '#1fc283',
		packet: '#74e6b4',
	},
	pcb: {
		face: '#091f38',
		wall: '#102844',
		copper: '#1f7863',
		body: '#080f18',
		rim: '#1fc283',
		blue: '#49a9ed',
		chip: '#a99dfc',
		violet: '#b79ae6',
		green: '#1fc283',
		cyan: '#62c9ff',
	},
	models: {
		wire: '#62c9ff',
		blue: '#49a9ed',
		violet: '#b79ae6',
		green: '#1fc283',
		gold: '#e4cc74',
		glass: '#237ca5',
		hull: '#071522',
		facet: '#081421',
		node: '#122636',
	},
};

export const LOOK_SECTIONS = [
	{
		id: 'bloom',
		title: 'Bloom',
		hint: 'Intensity sets the glow, spread widens it, and cutoff leaves dim lines dark.',
		sliders: [
			{ key: 'strength', label: 'Intensity' },
			{ key: 'radius', label: 'Spread' },
			{ key: 'threshold', label: 'Cutoff' },
		],
	},
	{
		id: 'system',
		title: 'System',
		hint: 'Grid, routes, and packets float above the board.',
		colors: [
			{ key: 'background', label: 'Background' },
			{ key: 'grid', label: 'Grid' },
			{ key: 'route', label: 'Routes' },
			{ key: 'packet', label: 'Packets' },
		],
	},
	{
		id: 'pcb',
		title: 'PCB',
		hint: 'Face and wall are the board. The other rows are the part inks and the copper.',
		colors: [
			{ key: 'face', label: 'Face' },
			{ key: 'wall', label: 'Wall' },
			{ key: 'copper', label: 'Copper' },
			{ key: 'body', label: 'Body' },
			{ key: 'rim', label: 'Rim' },
			{ key: 'blue', label: 'Blue' },
			{ key: 'chip', label: 'Chip' },
			{ key: 'violet', label: 'Violet' },
			{ key: 'green', label: 'Green' },
			{ key: 'cyan', label: 'Cyan' },
		],
	},
	{
		id: 'models',
		title: 'Models',
		hint: 'Wire is the hologram line. Hull, facet, and node are the dark fills.',
		colors: [
			{ key: 'wire', label: 'Wire' },
			{ key: 'blue', label: 'Blue' },
			{ key: 'violet', label: 'Violet' },
			{ key: 'green', label: 'Green' },
			{ key: 'gold', label: 'Gold' },
			{ key: 'glass', label: 'Glass' },
			{ key: 'hull', label: 'Hull' },
			{ key: 'facet', label: 'Facet' },
			{ key: 'node', label: 'Node' },
		],
	},
];

const GROUPS = ['bloom', 'system', 'pcb', 'models'];

let current = cloneLook(DEFAULT_LOOK);

export function cloneLook(look) {
	return {
		bloom: { ...look.bloom },
		system: { ...look.system },
		pcb: { ...look.pcb },
		models: { ...look.models },
	};
}

export function toHex(value) {
	if (typeof value === 'number' && Number.isFinite(value)) {
		const n = value >>> 0;
		if (n > 0xffffff) return null;
		return '#' + n.toString(16).padStart(6, '0');
	}
	if (typeof value !== 'string') return null;
	let text = value.trim().toLowerCase();
	if (text.startsWith('0x')) text = text.slice(2);
	else if (text.startsWith('#')) text = text.slice(1);
	if (/^[0-9a-f]{3}$/.test(text)) {
		text = text[0] + text[0] + text[1] + text[1] + text[2] + text[2];
	}
	if (!/^[0-9a-f]{6}$/.test(text)) return null;
	return '#' + text;
}

function readNumber(value, min, max, fallback) {
	const n = typeof value === 'number' ? value : Number(value);
	if (!Number.isFinite(n)) return fallback;
	const clamped = Math.min(max, Math.max(min, n));
	return Math.round(clamped * 10000) / 10000;
}

export function normalizeLook(input, base = DEFAULT_LOOK) {
	const look = cloneLook(base);
	if (!input || typeof input !== 'object' || Array.isArray(input)) return look;
	const bloom = input.bloom;
	if (bloom && typeof bloom === 'object') {
		for (const key of Object.keys(BLOOM_LIMITS)) {
			const limit = BLOOM_LIMITS[key];
			look.bloom[key] = readNumber(bloom[key], limit.min, limit.max, look.bloom[key]);
		}
	}
	for (const group of ['system', 'pcb', 'models']) {
		const source = input[group];
		if (!source || typeof source !== 'object') continue;
		for (const key of Object.keys(look[group])) {
			const hex = toHex(source[key]);
			if (hex) look[group][key] = hex;
		}
	}
	return look;
}

/** Background from the mount option wins only when the look did not set one. */
export function seedLook(input, background) {
	const look = normalizeLook(input);
	const explicit = input && typeof input === 'object' && input.system && input.system.background != null;
	if (explicit || background == null || background === 'transparent') return look;
	const hex = toHex(background);
	if (hex) look.system.background = hex;
	return look;
}

export function installLook(look) {
	current = cloneLook(look);
	return current;
}

export function colorOf(ink) {
	const dot = ink.indexOf('.');
	if (dot < 1) return '#ffffff';
	const group = current[ink.slice(0, dot)];
	const hex = group && group[ink.slice(dot + 1)];
	return hex || '#ffffff';
}

export function mark(material, ink) {
	material.userData.look = ink;
	paint(material);
	return material;
}

export function paint(material) {
	const ink = material.userData && material.userData.look;
	if (!ink) return;
	const hex = colorOf(ink);
	const uniform = material.uniforms && material.uniforms.uColor && material.uniforms.uColor.value;
	if (uniform && uniform.isColor) uniform.set(hex);
	if (material.color && material.color.isColor) material.color.set(hex);
}

export function paintRoot(root) {
	root.traverse((obj) => {
		if (!obj.material) return;
		const list = Array.isArray(obj.material) ? obj.material : [obj.material];
		for (let i = 0; i < list.length; i++) paint(list[i]);
	});
}

export function serializeLook(look) {
	return JSON.stringify(normalizeLook(look), null, 2) + '\n';
}

export function parseLook(text) {
	let data;
	try {
		data = JSON.parse(text);
	} catch (err) {
		throw new Error('That file is not a look.');
	}
	if (!data || typeof data !== 'object' || Array.isArray(data)) {
		throw new Error('That file is not a look.');
	}
	const known = GROUPS.some((key) => data[key] && typeof data[key] === 'object' && !Array.isArray(data[key]));
	if (!known) throw new Error('That file is not a look.');
	return normalizeLook(data);
}

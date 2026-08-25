(function (root) {
	const SKIP_PARAMS = {
		savedPalettes: true,
		deviceId: true,
		dirty: true
	};

	function clone(value) {
		return JSON.parse(JSON.stringify(value));
	}

	function compactParams(parameters) {
		const src = parameters || {};
		const out = {};
		Object.keys(src).forEach(function (key) {
			if (SKIP_PARAMS[key]) return;
			out[key] = clone(src[key]);
		});
		return out;
	}

	function compactOperators(operators) {
		return (operators || []).map(function (op) {
			if (!op || !op.type) return null;
			const item = {
				type: String(op.type),
				parameters: compactParams(op.parameters)
			};
			if (op.bypassed) item.bypassed = true;
			if (op.modulations && Object.keys(op.modulations).length) {
				item.modulations = clone(op.modulations);
			}
			return item;
		}).filter(Boolean);
	}

	function fromOperators(name, operators) {
		return {
			v: 1,
			kind: 'elos',
			name: String(name || 'ELOS').slice(0, 32),
			operators: compactOperators(operators)
		};
	}

	function fromTemplate(template) {
		const payload = fromOperators(template && template.name, template && template.operators);
		payload.kind = 'elos';
		return payload;
	}

	function fromPreset(preset) {
		if (!preset || !preset.type || !preset.parameters) return null;
		return {
			v: 1,
			kind: 'preset',
			type: String(preset.type),
			name: String(preset.name || preset.type).slice(0, 32),
			parameters: compactParams(preset.parameters)
		};
	}

	function toDocument(item) {
		if (!item) return null;
		if (item.operators) {
			const doc = {
				id: item.id || undefined,
				name: String(item.name || 'TEMPLATE').slice(0, 32),
				operators: compactOperators(item.operators)
			};
			if (!doc.id) delete doc.id;
			return doc;
		}
		if (item.type && item.parameters) {
			return {
				id: item.id || undefined,
				type: String(item.type),
				name: String(item.name || item.type).slice(0, 32),
				parameters: compactParams(item.parameters)
			};
		}
		return null;
	}

	function bytesToB64Url(bytes) {
		let bin = '';
		const chunk = 0x8000;
		for (let i = 0; i < bytes.length; i += chunk) {
			bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
		}
		return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
	}

	function b64UrlToBytes(text) {
		const pad = text.length % 4 === 0 ? '' : '===='.slice(text.length % 4);
		const raw = atob(text.replace(/-/g, '+').replace(/_/g, '/') + pad);
		const out = new Uint8Array(raw.length);
		for (let i = 0; i < raw.length; i += 1) out[i] = raw.charCodeAt(i);
		return out;
	}

	function textToBytes(text) {
		if (typeof TextEncoder === 'function') return new TextEncoder().encode(text);
		const out = new Uint8Array(text.length);
		for (let i = 0; i < text.length; i += 1) out[i] = text.charCodeAt(i) & 255;
		return out;
	}

	function bytesToText(bytes) {
		if (typeof TextDecoder === 'function') return new TextDecoder().decode(bytes);
		let out = '';
		for (let i = 0; i < bytes.length; i += 1) out += String.fromCharCode(bytes[i]);
		return out;
	}

	function gzipAvailable() {
		return typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
	}

	function encodeJson(payload) {
		return 'j' + bytesToB64Url(textToBytes(JSON.stringify(payload)));
	}

	function encode(payload) {
		if (!payload) return Promise.resolve('');
		return Promise.resolve(encodeJson(payload));
	}

	function parseObject(raw) {
		if (!raw || typeof raw !== 'object') return null;
		if (Array.isArray(raw.operators) && raw.operators.length) {
			const name = String(raw.name || 'ELOS').trim().slice(0, 32) || 'ELOS';
			return {
				v: 1,
				kind: raw.kind === 'template' ? 'template' : 'elos',
				name: name,
				operators: compactOperators(raw.operators)
			};
		}
		if (raw.kind === 'preset' || (raw.type && raw.parameters && !raw.operators)) {
			const type = String(raw.type || '');
			if (!type) return null;
			return {
				v: 1,
				kind: 'preset',
				type: type,
				name: String(raw.name || type).trim().slice(0, 32) || type,
				parameters: compactParams(raw.parameters)
			};
		}
		return null;
	}

	function decodeToken(token) {
		const text = String(token || '').trim();
		if (!text) return Promise.resolve(null);
		const mark = text.charAt(0);
		const body = text.slice(1);
		if (mark !== 'j' && mark !== 'z') {
			try {
				return Promise.resolve(parseObject(JSON.parse(decodeURIComponent(text))));
			} catch (err) {
				return Promise.resolve(null);
			}
		}
		let bytes;
		try {
			bytes = b64UrlToBytes(body);
		} catch (err) {
			return Promise.resolve(null);
		}
		if (mark === 'j') {
			try {
				return Promise.resolve(parseObject(JSON.parse(bytesToText(bytes))));
			} catch (err) {
				return Promise.resolve(null);
			}
		}
		if (!gzipAvailable()) return Promise.resolve(null);
		const blob = new Blob([bytes]);
		return new Response(blob.stream().pipeThrough(new DecompressionStream('gzip'))).text()
			.then(function (json) {
				return parseObject(JSON.parse(json));
			})
			.catch(function () {
				try {
					return parseObject(JSON.parse(bytesToText(bytes)));
				} catch (err) {
					return null;
				}
			});
	}

	function tokenFromHash(hash) {
		const raw = String(hash || '')
			.replace(/%23/gi, '#')
			.replace(/^#/, '')
			.trim();
		if (!raw) return '';
		const amp = raw.indexOf('&');
		const head = amp >= 0 ? raw.slice(0, amp) : raw;
		if (head.indexOf('e=') === 0) return head.slice(2);
		if (head.indexOf('elo=') === 0) return head.slice(4);
		if (/^[jz]/.test(raw) && raw.length > 8) return raw.split('&')[0];
		return '';
	}

	function parseHash(hash) {
		const token = tokenFromHash(hash);
		if (!token) return Promise.resolve(null);
		return decodeToken(token);
	}

	function parseText(text) {
		const src = String(text || '').trim();
		if (!src) return Promise.resolve(null);
		const hashIdx = src.indexOf('#');
		if (hashIdx >= 0) {
			const fromUrl = tokenFromHash(src.slice(hashIdx));
			if (fromUrl) return decodeToken(fromUrl);
		}
		if (/^[jzA-Za-z0-9\-_]{12,}$/.test(src) && (src.charAt(0) === 'j' || src.charAt(0) === 'z')) {
			return decodeToken(src);
		}
		try {
			return Promise.resolve(parseObject(JSON.parse(src)));
		} catch (err) {
			return Promise.resolve(null);
		}
	}

	function pageUrl() {
		return location.origin + location.pathname + location.search;
	}

	function shareUrl(token) {
		return pageUrl().replace(/#.*$/, '') + '#e=' + token;
	}

	function clearHash() {
		if (!location.hash) return;
		try {
			history.replaceState(null, '', pageUrl());
		} catch (err) {
			location.hash = '';
		}
	}

	function copyText(text) {
		function fallback() {
			const area = document.createElement('textarea');
			area.value = text;
			area.setAttribute('readonly', '');
			area.style.position = 'fixed';
			area.style.left = '-9999px';
			document.body.appendChild(area);
			area.select();
			let ok = false;
			try {
				ok = document.execCommand('copy');
			} catch (err) {
				ok = false;
			}
			document.body.removeChild(area);
			return ok ? Promise.resolve() : Promise.reject(new Error('copy failed'));
		}
		if (navigator.clipboard && navigator.clipboard.writeText) {
			return navigator.clipboard.writeText(text).catch(fallback);
		}
		return fallback();
	}

	function downloadJson(filename, value) {
		const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.href = url;
		link.download = filename;
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
		window.setTimeout(function () {
			URL.revokeObjectURL(url);
		}, 1000);
	}

	function fileName(name, fallback) {
		const base = String(name || fallback || 'elo')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '-')
			.replace(/^-+|-+$/g, '')
			.slice(0, 40);
		return (base || fallback || 'elo') + '.json';
	}

	function apply(payload, state) {
		if (!payload) return null;
		if (payload.kind === 'preset') {
			if (!root.SynthPresets) return null;
			const created = root.SynthPresets.create(
				payload.type,
				payload.name,
				payload.parameters,
				true
			);
			return {
				patch: {
					presets: root.SynthPresets.upsert((state && state.presets) || [], created)
				},
				message: 'Preset loaded from link'
			};
		}
		if (!payload.operators || !payload.operators.length) return null;
		if (payload.kind === 'template' && root.SynthTemplates) {
			const templates = (state && state.templates) || [];
			const item = root.SynthTemplates.fromShare(payload, templates);
			return {
				patch: {
					templates: root.SynthTemplates.upsert(templates, item),
					templatesSeeded: true,
					previewTemplateId: item.id
				},
				message: 'Template loaded from link'
			};
		}
		if (!root.SynthPipes) return null;
		const pipes = (state && state.pipes) || [];
		const name = root.SynthTemplates
			? root.SynthTemplates.uniqueName(payload.name, pipes)
			: payload.name;
		const operators = root.SynthTemplates
			? root.SynthTemplates.hydrateOperators(payload.operators)
			: payload.operators;
		const pipe = root.SynthPipes.create(operators, name);
		pipe.shareKey = fingerprint(payload);
		return {
			patch: {
				pipes: pipes.concat([pipe]),
				activePipeId: pipe.id,
				previewTemplateId: ''
			},
			message: 'Visual loaded from link'
		};
	}

	function fingerprint(payload) {
		if (!payload) return '';
		if (payload.kind === 'preset') {
			return 'preset:' + String(payload.type || '') + ':' + JSON.stringify(payload.parameters || {});
		}
		return 'elos:' + JSON.stringify(compactOperators(payload.operators || []));
	}

	function alreadyLoaded(state, payload) {
		if (!payload || !state) return false;
		const key = fingerprint(payload);
		if (!key) return false;
		if (payload.kind === 'preset') {
			return (state.presets || []).some(function (item) {
				return item && fingerprint({
					kind: 'preset',
					type: item.type,
					parameters: item.parameters
				}) === key;
			});
		}
		return (state.pipes || []).some(function (pipe) {
			return pipe && (pipe.shareKey === key || fingerprint({
				kind: 'elos',
				operators: pipe.operators
			}) === key);
		});
	}

	const bootHash = typeof location !== 'undefined' ? String(location.hash || '') : '';
	let shareToken = '';
	let decoded = null;
	let decodedReady = false;
	let notified = false;
	let inflight = null;
	let captured = false;

	function ensureDecoded() {
		if (!shareToken) return Promise.resolve(null);
		if (decodedReady) return Promise.resolve(decoded);
		return decodeToken(shareToken).then(function (payload) {
			decoded = payload;
			decodedReady = true;
			return payload;
		});
	}

	function captureLocation() {
		if (captured) return ensureDecoded();
		captured = true;
		shareToken = tokenFromHash(bootHash) || tokenFromHash(location.hash);
		if (shareToken) clearHash();
		decodedReady = !shareToken;
		decoded = null;
		if (!shareToken) return Promise.resolve(null);
		return ensureDecoded();
	}

	function consume(applyPatch) {
		captureLocation();
		if (!shareToken) return Promise.resolve(false);
		if (inflight) return inflight;
		inflight = ensureDecoded().then(function (payload) {
			inflight = null;
			if (!payload) return false;
			const state = root.SynthState ? root.SynthState.get() : null;
			if (alreadyLoaded(state, payload)) {
				notified = true;
				return true;
			}
			const result = apply(payload, state);
			if (!result || !result.patch) return false;
			applyPatch(result.patch);
			if (!notified && result.message && root.SynthNotify) {
				notified = true;
				root.SynthNotify.show('success', result.message);
			}
			return true;
		}).catch(function () {
			inflight = null;
			return false;
		});
		return inflight;
	}

	captureLocation();

	root.SynthShare = {
		fromOperators: fromOperators,
		fromTemplate: fromTemplate,
		fromPreset: fromPreset,
		toDocument: toDocument,
		parseObject: parseObject,
		parseText: parseText,
		encode: encode,
		shareUrl: shareUrl,
		pageUrl: pageUrl,
		clearHash: clearHash,
		copyText: copyText,
		downloadJson: downloadJson,
		fileName: fileName,
		apply: apply,
		captureLocation: captureLocation,
		consume: consume
	};
})(window);

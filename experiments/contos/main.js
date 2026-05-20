/* CONTOS — Mapa de Composição Coreográfica */

let choreographies = [
	{
		id: 'ch1',
		title: '1. Pega-pega',
		concept: 'Brincadeira universal de perseguição. As performers correm umas atrás das outras num jogo que acontece de forma real, não rigidamente coreografada. A espontaneidade faz parte da cena.',
		temas: ['infância', 'instinto', 'perseguição', 'energia animal', 'jogo', 'movimento coletivo'],
		imaginario: ['playground', 'parque', 'crianças brincando', 'matilha', 'perseguição orgânica'],
		direcao_visual: ['movimento rápido', 'rastros', 'deslocamento', 'energia viva', 'espaço aberto'],
		eixo: 'infância'
	},
	{
		id: 'ch2',
		title: '2. Solo infância',
		concept: 'Cena individual conectada à memória da infância e à brincadeira num registro mais íntimo.',
		temas: ['memória', 'subjetividade', 'nostalgia', 'imaginação'],
		imaginario: ['quarto infantil', 'lembrança', 'sonho pessoal', 'brinquedos abstratos'],
		direcao_visual: ['delicadeza', 'menor escala', 'atmosfera difusa', 'elementos flutuantes'],
		eixo: 'infância'
	},
	{
		id: 'ch3',
		title: '3. Carrossel',
		concept: 'Referência ao carrossel como objeto histórico e simbólico. Movimento coletivo circular e lento.',
		temas: ['repetição', 'tempo', 'nostalgia', 'fantasia', 'infância'],
		imaginario: ['parque de diversões antigo', 'caixa de música', 'ornamentos', 'carrossel vintage'],
		direcao_visual: ['loops circulares', 'movimento lento', 'atmosfera encantada', 'melancolia lúdica'],
		eixo: 'tempo'
	},
	{
		id: 'ch4',
		title: '4. Amarelinha',
		concept: 'Brincadeira tradicional brasileira como estrutura simbólica.',
		temas: ['regras', 'progressão', 'jogo', 'passagem', 'infância'],
		imaginario: ['números', 'grafismos no chão', 'geometria simples'],
		direcao_visual: ['grids', 'elementos gráficos', 'linguagem geométrica', 'espacialidade de chão'],
		eixo: 'infância'
	},
	{
		id: 'ch5',
		title: '5. Cavalo',
		concept: 'Dois corpos formando uma criatura híbrida semelhante a um cavalo. Imagem associada ao imaginário dos contos.',
		temas: ['metamorfose', 'fantasia', 'criatura simbólica', 'contos de fadas'],
		imaginario: ['cavalo', 'criatura mítica', 'medieval', 'brinquedo imaginário'],
		direcao_visual: ['silhuetas', 'sombras', 'presença simbólica', 'imagem evocativa'],
		eixo: 'sonho'
	},
	{
		id: 'ch6',
		title: '6. Janelas',
		concept: 'Cena sobre observar o outro. A janela funciona como metáfora para curiosidade, voyeurismo, julgamento e encontro.',
		temas: ['alteridade', 'curiosidade', 'desejo', 'moral', 'conflito', 'observação'],
		imaginario: ['janelas', 'frestas', 'molduras', 'enquadramentos'],
		direcao_visual: ['fragmentação', 'recortes', 'revelação', 'ocultação', 'estrutura arquitetônica'],
		eixo: 'sonho'
	},
	{
		id: 'ch7',
		title: '7. Marco Polo',
		concept: 'Uma pessoa no centro cercada por outras. Mistura jogo, captura, julgamento e vigilância.',
		temas: ['exposição', 'julgamento', 'captura', 'proteção', 'ameaça', 'grupo vs indivíduo'],
		imaginario: ['tabuleiro de xadrez', 'ritual', 'arena', 'harry potter camara secreta'],
		direcao_visual: ['grids', 'cercamento', 'órbitas', 'tensão crescente'],
		eixo: 'sombra'
	},
	{
		id: 'ch8',
		title: '8. Deus',
		concept: "Inspirado na frase: 'Deus, dá-me paciência, porque se me der forças, eu mato um.' Uma performer inicia movimentos repetitivos que se propagam até queda coletiva.",
		temas: ['repressão', 'agressividade', 'saturação', 'repetição', 'colapso'],
		imaginario: ['pesadelo', 'ritual distorcido', 'histeria coletiva', 'opressão'],
		direcao_visual: ['dark', 'alto contraste', 'repetição progressiva', 'acúmulo', 'ruptura'],
		eixo: 'sombra'
	},
	{
		id: 'ch9',
		title: '9. Mulheres Mortas',
		concept: 'Corpos no chão que gradualmente sugerem terra, sementes e brotamento. Morte como transformação.',
		temas: ['morte', 'renascimento', 'resistência', 'terra', 'crescimento'],
		imaginario: ['raízes', 'germinação', 'decomposição', 'matéria orgânica'],
		direcao_visual: ['texturas orgânicas', 'crescimento lento', 'transformação corporal'],
		eixo: 'sombra'
	},
	{
		id: 'ch10',
		title: '10. Travessia',
		concept: 'Uma figura conduz outras em processo ritual de passagem (anjo, morte, entidade condutora).',
		temas: ['passagem', 'transição', 'morte', 'rito', 'limiar'],
		imaginario: ['rio', 'névoa', 'portal', 'barqueiro'],
		direcao_visual: ['suspensão', 'movimento lento', 'espacialidade rarefeita', 'atmosfera ritual'],
		eixo: 'sombra'
	},
	{
		id: 'ch11',
		title: '11. Sol',
		concept: 'Ainda indefinido. Provavelmente funciona como eixo simbólico de luz, centralidade ou transformação.',
		temas: ['luz', 'centralidade', 'transformação', 'eixo simbólico'],
		imaginario: ['sol', 'fogo', 'renascimento luminoso'],
		direcao_visual: ['luminosidade extrema', 'brilho dourado', 'calor', 'energia'],
		eixo: 'sonho'
	},
	{
		id: 'ch12',
		title: '12. Atropelamento',
		concept: 'Compressão extrema do cotidiano em velocidade acelerada. Vida íntima transformada em vertigem temporal.',
		temas: ['tempo', 'aceleração', 'solidão', 'repetição', 'cotidiano'],
		imaginario: ['time-lapse', 'casa', 'rotina comprimida', 'relógios'],
		direcao_visual: ['aceleração', 'motion blur', 'acúmulo', 'vertigem'],
		eixo: 'tempo'
	},
	{
		id: 'ch13',
		title: '13. Valsa',
		concept: "Cena debochada a partir da frase: 'Cala a boca já morreu, quem manda na minha boca sou eu.' Brincadeira com fala, boca e irreverência.",
		temas: ['autonomia', 'repressão', 'infância', 'voz', 'humor'],
		imaginario: ['bocas', 'caricatura', 'exagero', 'teatralidade'],
		direcao_visual: ['foco facial', 'repetição', 'humor estranho', 'teatralidade'],
		eixo: 'tempo'
	},
	{
		id: 'ch14',
		title: '14. Bonecas',
		concept: 'Duas performers como bonecas manipuladas por outras. Parte do universo Barbie, infância e feminilidade construída.',
		temas: ['manipulação', 'feminilidade', 'performance social', 'identidade', 'infância', 'adolescência'],
		imaginario: ['barbie', 'brinquedo', 'quarto infantil', 'boneca viva', 'manequim'],
		direcao_visual: ['artificialidade', 'mecânica', 'estética plástica', 'inquietante'],
		eixo: 'infância'
	},
	{
		id: 'ch15',
		title: '15. Jabuticabas',
		concept: "Inspirado na frase: 'Meus olhos parecem jabuticabas.' Cena sobre olhar, mãos e metáfora corporal.",
		temas: ['olhar', 'identidade', 'percepção', 'ludicidade'],
		imaginario: ['olhos', 'esferas brilhantes', 'fruta', 'reflexo'],
		direcao_visual: ['macroformas', 'repetição circular', 'brilho orgânico', 'proximidade visual'],
		eixo: 'sonho'
	},
	{
		id: 'ch16',
		title: '16. Casinha',
		concept: 'Brincadeira infantil de casinha reinterpretada com movimentos repetitivos e mecânicos.',
		temas: ['infância', 'domesticidade', 'repetição', 'condicionamento', 'rotina'],
		imaginario: ['casa', 'brinquedo', 'miniaturas', 'metrônomo', 'automatismo'],
		direcao_visual: ['repetição rítmica', 'precisão mecânica', 'nostalgia estranhada'],
		eixo: 'tempo'
	}
];
let selectedNode = null;

let svg;
let width;
let height;
let simulation;
let gContainer;
let zoom;

const EIXO_FROM_BTN = {
	infancia: 'infância',
	sonho: 'sonho',
	sombra: 'sombra',
	tempo: 'tempo',
	corpo: 'corpo'
};

function initGraphSurface() {
	svg = d3.select('#graphSvg');
	if (svg.empty()) {
		console.error('[CONTOS] #graphSvg não encontrado no DOM.');
		return false;
	}

	const rect = svg.node().getBoundingClientRect();
	width = rect.width || window.innerWidth;
	height = rect.height || window.innerHeight;

	svg.selectAll('*').remove();
	gContainer = svg.append('g');

	zoom = d3
		.zoom()
		.scaleExtent([0.15, 4])
		.on('zoom', (event) => {
			gContainer.attr('transform', event.transform);
		});
	svg.call(zoom);
	return true;
}

function generateGraphData() {
	const nodes = [];
	const links = [];
	const temasSet = new Set();
	const imaginarioSet = new Set();
	const visSet = new Set();

	choreographies.forEach((ch) => {
		nodes.push({
			id: ch.id,
			name: ch.title,
			category: 'choreography',
			val: 14,
			eixo: ch.eixo,
			originalData: ch
		});

		ch.temas.forEach((t) => temasSet.add(t.trim().toLowerCase()));
		ch.imaginario.forEach((i) => imaginarioSet.add(i.trim().toLowerCase()));
		ch.direcao_visual.forEach((v) => visSet.add(v.trim().toLowerCase()));
	});

	temasSet.forEach((tema) => {
		if (tema) nodes.push({ id: `t_${tema}`, name: tema, category: 'tema', val: 6 });
	});
	imaginarioSet.forEach((img) => {
		if (img) nodes.push({ id: `i_${img}`, name: img, category: 'imaginario', val: 5 });
	});
	visSet.forEach((v) => {
		if (v) nodes.push({ id: `v_${v}`, name: v, category: 'visual', val: 5 });
	});

	choreographies.forEach((ch) => {
		ch.temas.forEach((t) => {
			const cleanT = t.trim().toLowerCase();
			if (cleanT) links.push({ source: ch.id, target: `t_${cleanT}` });
		});
		ch.imaginario.forEach((i) => {
			const cleanI = i.trim().toLowerCase();
			if (cleanI) links.push({ source: ch.id, target: `i_${cleanI}` });
		});
		ch.direcao_visual.forEach((v) => {
			const cleanV = v.trim().toLowerCase();
			if (cleanV) links.push({ source: ch.id, target: `v_${cleanV}` });
		});
	});

	const degrees = {};
	links.forEach((l) => {
		degrees[l.source] = (degrees[l.source] || 0) + 1;
		degrees[l.target] = (degrees[l.target] || 0) + 1;
	});

	nodes.forEach((n) => {
		if (degrees[n.id]) {
			n.val = n.category === 'choreography' ? 12 + degrees[n.id] * 0.8 : 5 + degrees[n.id] * 1.2;
		}
	});

	return { nodes, links };
}

function updateGraphDimensions() {
	if (!svg || svg.empty()) return;
	width = svg.node().getBoundingClientRect().width;
	height = svg.node().getBoundingClientRect().height;
	if (simulation) {
		const centerForce = simulation.force('center');
		if (centerForce) {
			centerForce.x(width / 2).y(height / 2).strength(graphSettings.centerStrength);
		}
		simulation.alpha(0.3).restart();
	}
}
window.addEventListener('resize', updateGraphDimensions);

function renderGraph() {
	if (!gContainer) return;
	document.getElementById('graphLoader').style.opacity = '1';
	gContainer.selectAll('*').remove();

	const { nodes, links } = generateGraphData();
	const filteredNodes = nodes.filter(nodePassesFilters);
	const filteredNodeIds = new Set(filteredNodes.map((n) => n.id));
	const filteredLinks = links.filter((l) => {
		const sourceId = typeof l.source === 'object' ? l.source.id : l.source;
		const targetId = typeof l.target === 'object' ? l.target.id : l.target;
		return filteredNodeIds.has(sourceId) && filteredNodeIds.has(targetId);
	});

	const showLabels = graphSettings.showLabels;
	const showLinks = graphSettings.showLinks;

	simulation = d3
		.forceSimulation(filteredNodes)
		.force(
			'link',
			d3
				.forceLink(filteredLinks)
				.id((d) => d.id)
				.distance(graphSettings.linkDistance)
				.strength(graphSettings.linkStrength)
		)
		.force('charge', d3.forceManyBody().strength(graphSettings.chargeStrength))
		.force('center', d3.forceCenter(width / 2, height / 2).strength(graphSettings.centerStrength))
		.force('collision', d3.forceCollide().radius((d) => d.val + graphSettings.collisionPadding));

	const linkElement = gContainer
		.append('g')
		.selectAll('line')
		.data(filteredLinks)
		.enter()
		.append('line')
		.attr('class', 'link')
		.attr('stroke', '#334155')
		.attr('stroke-width', 1.2);
	if (!showLinks) linkElement.style('display', 'none');

	const nodeElement = gContainer
		.append('g')
		.selectAll('circle')
		.data(filteredNodes)
		.enter()
		.append('circle')
		.attr('class', 'node')
		.attr('r', (d) => d.val)
		.attr('fill', (d) => {
			if (d.category === 'choreography') return '#8b5cf6';
			if (d.category === 'tema') return '#10b981';
			if (d.category === 'imaginario') return '#0ea5e9';
			return '#f43f5e';
		})
		.attr('stroke', (d) => (d.category === 'choreography' ? '#a78bfa' : '#0f172a'))
		.attr('stroke-width', (d) => (d.category === 'choreography' ? 2.5 : 1))
		.call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended))
		.on('click', (event, d) => {
			event.stopPropagation();
			selectNode(d);
		});

	let labelElement;
	if (showLabels) {
		labelElement = gContainer
			.append('g')
			.selectAll('text')
			.data(filteredNodes)
			.enter()
			.append('text')
			.attr('class', 'node-label')
			.attr('dy', (d) => d.val + 12)
			.text((d) => d.name)
			.attr('fill', (d) => (d.category === 'choreography' ? '#e2e8f0' : '#94a3b8'))
			.style('font-size', (d) => (d.category === 'choreography' ? '11px' : '9px'))
			.style('font-weight', (d) => (d.category === 'choreography' ? 'bold' : 'normal'));
	}

	nodeElement
		.on('mouseover', function (event, d) {
			if (!graphSettings.highlightNeighbors) return;
			nodeElement.style('opacity', 0.15);
			linkElement.style('opacity', 0.05);
			if (labelElement) labelElement.style('opacity', 0.15);

			d3.select(this).style('opacity', 1).attr('r', d.val + 4);

			const connectedNodeIds = new Set([d.id]);
			linkElement.each(function (l) {
				if (l.source.id === d.id || l.target.id === d.id) {
					d3.select(this).style('opacity', 1).attr('stroke', '#818cf8').attr('stroke-width', 2);
					connectedNodeIds.add(l.source.id);
					connectedNodeIds.add(l.target.id);
				}
			});

			nodeElement.filter((n) => connectedNodeIds.has(n.id)).style('opacity', 1);
			if (labelElement) {
				labelElement
					.filter((n) => connectedNodeIds.has(n.id))
					.style('opacity', 1)
					.style('fill', '#ffffff')
					.style('font-size', (n) => (n.category === 'choreography' ? '12px' : '10px'));
			}
		})
		.on('mouseout', function () {
			if (!graphSettings.highlightNeighbors) return;
			nodeElement.style('opacity', 1).attr('r', (d) => d.val);
			linkElement.style('opacity', 0.25).attr('stroke', '#334155').attr('stroke-width', 1.2);
			if (labelElement) {
				labelElement
					.style('opacity', 1)
					.style('fill', (n) => (n.category === 'choreography' ? '#e2e8f0' : '#94a3b8'))
					.style('font-size', (n) => (n.category === 'choreography' ? '11px' : '9px'));
			}
		});

	simulation.on('tick', () => {
		linkElement
			.attr('x1', (d) => d.source.x)
			.attr('y1', (d) => d.source.y)
			.attr('x2', (d) => d.target.x)
			.attr('y2', (d) => d.target.y);
		nodeElement.attr('cx', (d) => d.x).attr('cy', (d) => d.y);
		if (showLabels && labelElement) {
			labelElement.attr('x', (d) => d.x).attr('y', (d) => d.y);
		}
	});

	setTimeout(() => {
		document.getElementById('graphLoader').style.opacity = '0';
	}, 500);

	function dragstarted(event, d) {
		if (!event.active) simulation.alphaTarget(0.3).restart();
		d.fx = d.x;
		d.fy = d.y;
	}

	function dragged(event, d) {
		d.fx = event.x;
		d.fy = event.y;
	}

	function dragended(event, d) {
		if (!event.active) simulation.alphaTarget(0);
		d.fx = null;
		d.fy = null;
	}
}

function highlightGroup(groupType) {
	const eixo = EIXO_FROM_BTN[groupType] || groupType;
	gContainer.selectAll('.node').style('opacity', 0.1);
	gContainer.selectAll('.link').style('opacity', 0.05);
	gContainer.selectAll('.node-label').style('opacity', 0.1);

	gContainer
		.selectAll('.node')
		.filter((d) => d.category === 'choreography' && d.eixo === eixo)
		.style('opacity', 1)
		.attr('r', (d) => d.val + 5)
		.attr('stroke', '#fbbf24')
		.style('filter', 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))');

	showNotification(`Exibindo eixo: ${eixo.toUpperCase()}`);

	setTimeout(() => {
		gContainer
			.selectAll('.node')
			.style('opacity', 1)
			.attr('r', (d) => d.val)
			.attr('stroke', (d) => (d.category === 'choreography' ? '#a78bfa' : '#0f172a'))
			.style('filter', 'none');
		gContainer.selectAll('.link').style('opacity', 0.25);
		gContainer.selectAll('.node-label').style('opacity', 1);
	}, 5000);
}
window.highlightGroup = highlightGroup;

function selectNode(node) {
	selectedNode = node;

	document.getElementById('panelWelcomeState').classList.add('hidden');
	document.getElementById('panelDetailState').classList.remove('hidden');

	const badge = document.getElementById('nodeCategoryBadge');
	const titleEl = document.getElementById('nodeTitle');
	titleEl.textContent = node.name;

	document.getElementById('sceneThemes').innerHTML = '';
	document.getElementById('sceneImagery').innerHTML = '';
	document.getElementById('sceneVisual').innerHTML = '';
	document.getElementById('connectedScenesList').innerHTML = '';

	if (node.category === 'choreography') {
		badge.className = 'text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider badge-ch';
		badge.textContent = 'CENA / COREOGRAFIA';
		document.getElementById('choreographyMetadata').classList.remove('hidden');
		document.getElementById('generalNodeMetadata').classList.add('hidden');

		const chData = node.originalData;
		document.getElementById('sceneConcept').textContent = chData.concept;
		chData.temas.forEach((t) => createClickableBadge('sceneThemes', t, 'badge-tema', 't_'));
		chData.imaginario.forEach((i) => createClickableBadge('sceneImagery', i, 'badge-imag', 'i_'));
		chData.direcao_visual.forEach((v) => createClickableBadge('sceneVisual', v, 'badge-vis', 'v_'));
	} else {
		let badgeClass = 'badge-tema';
		if (node.category === 'imaginario') badgeClass = 'badge-imag';
		if (node.category === 'visual') badgeClass = 'badge-vis';

		badge.className = `text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${badgeClass}`;
		badge.textContent = node.category.toUpperCase();
		document.getElementById('choreographyMetadata').classList.add('hidden');
		document.getElementById('generalNodeMetadata').classList.remove('hidden');

		const connectedScenes = choreographies.filter((ch) => {
			const fields = [...ch.temas, ...ch.imaginario, ...ch.direcao_visual].map((f) => f.trim().toLowerCase());
			return fields.includes(node.name.toLowerCase());
		});

		connectedScenes.forEach((sc) => {
			const sceneBadge = document.createElement('button');
			sceneBadge.type = 'button';
			sceneBadge.className = 'text-[10px] px-2 py-1 rounded badge-ch hover:scale-105 transition font-medium text-left';
			sceneBadge.innerHTML = `<i class="fa-solid fa-film mr-1"></i> ${sc.title}`;
			sceneBadge.onclick = () => {
				const targetNode = gContainer.selectAll('.node').filter((d) => d.id === sc.id).datum();
				if (targetNode) selectNode(targetNode);
			};
			document.getElementById('connectedScenesList').appendChild(sceneBadge);
		});
	}
}

function createClickableBadge(containerId, label, badgeClass, prefix) {
	const btn = document.createElement('button');
	btn.type = 'button';
	btn.className = `text-[10px] px-2 py-0.5 rounded font-medium hover:scale-105 transition ${badgeClass}`;
	btn.textContent = label;
	btn.onclick = () => {
		const cleanLabel = label.trim().toLowerCase();
		const targetId = `${prefix}${cleanLabel}`;
		const targetNode = gContainer.selectAll('.node').filter((d) => d.id === targetId).datum();
		if (targetNode) selectNode(targetNode);
	};
	document.getElementById(containerId).appendChild(btn);
}

const STORAGE_KEYS = {
	choreographies: 'contos_choreographies_v1',
	graphSettings: 'contos_graph_settings_v1'
};

const DEFAULT_GRAPH_SETTINGS = {
	linkDistance: 50,
	linkStrength: 0.85,
	chargeStrength: -140,
	collisionPadding: 8,
	centerStrength: 0.08,
	showLabels: true,
	showLinks: true,
	showChoreography: true,
	showTema: true,
	showImaginario: true,
	showVisual: true,
	eixoInfancia: true,
	eixoSonho: true,
	eixoSombra: true,
	eixoTempo: true,
	eixoCorpo: true,
	highlightNeighbors: true
};

let graphSettings = { ...DEFAULT_GRAPH_SETTINGS };

function loadJson(key, fallback) {
	try {
		const raw = localStorage.getItem(key);
		if (!raw) return fallback;
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}

function saveJson(key, value) {
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (e) {
		console.warn('[CONTOS] localStorage:', e);
	}
}

function loadAllState() {
	const savedCh = loadJson(STORAGE_KEYS.choreographies, null);
	if (Array.isArray(savedCh) && savedCh.length > 0) {
		choreographies = savedCh;
	}
	const savedGs = loadJson(STORAGE_KEYS.graphSettings, null);
	if (savedGs && typeof savedGs === 'object') {
		graphSettings = { ...DEFAULT_GRAPH_SETTINGS, ...savedGs };
	}
}

function saveChoreographies() {
	saveJson(STORAGE_KEYS.choreographies, choreographies);
}

function saveGraphSettings() {
	saveJson(STORAGE_KEYS.graphSettings, graphSettings);
}

function nodePassesFilters(n) {
	if (n.category === 'choreography') {
		if (!graphSettings.showChoreography) return false;
		const eixo = n.eixo || '';
		if (eixo === 'infância' && !graphSettings.eixoInfancia) return false;
		if (eixo === 'sonho' && !graphSettings.eixoSonho) return false;
		if (eixo === 'sombra' && !graphSettings.eixoSombra) return false;
		if (eixo === 'tempo' && !graphSettings.eixoTempo) return false;
		if (eixo === 'corpo' && !graphSettings.eixoCorpo) return false;
		return true;
	}
	if (n.category === 'tema') return graphSettings.showTema;
	if (n.category === 'imaginario') return graphSettings.showImaginario;
	if (n.category === 'visual') return graphSettings.showVisual;
	return true;
}

function applySimulationForces() {
	if (!simulation) return;
	const linkForce = simulation.force('link');
	if (linkForce) {
		linkForce.distance(graphSettings.linkDistance).strength(graphSettings.linkStrength);
	}
	const chargeForce = simulation.force('charge');
	if (chargeForce) chargeForce.strength(graphSettings.chargeStrength);
	const centerForce = simulation.force('center');
	if (centerForce) {
		centerForce.x(width / 2).y(height / 2).strength(graphSettings.centerStrength);
	}
	const collisionForce = simulation.force('collision');
	if (collisionForce) collisionForce.radius((d) => d.val + graphSettings.collisionPadding);
	simulation.alpha(0.35).restart();
}

function syncGraphControlsUI() {
	const sliders = {
		gcLinkDistance: 'linkDistance',
		gcLinkStrength: 'linkStrength',
		gcChargeStrength: 'chargeStrength',
		gcCollisionPadding: 'collisionPadding',
		gcCenterStrength: 'centerStrength'
	};
	Object.entries(sliders).forEach(([id, key]) => {
		const el = document.getElementById(id);
		if (el) el.value = graphSettings[key];
	});
	const checks = [
		['gcShowLabels', 'showLabels'],
		['gcShowLinks', 'showLinks'],
		['gcShowChoreography', 'showChoreography'],
		['gcShowTema', 'showTema'],
		['gcShowImaginario', 'showImaginario'],
		['gcShowVisual', 'showVisual'],
		['gcEixoInfancia', 'eixoInfancia'],
		['gcEixoSonho', 'eixoSonho'],
		['gcEixoSombra', 'eixoSombra'],
		['gcEixoTempo', 'eixoTempo'],
		['gcEixoCorpo', 'eixoCorpo'],
		['gcHighlightNeighbors', 'highlightNeighbors']
	];
	checks.forEach(([id, key]) => {
		const el = document.getElementById(id);
		if (el) el.checked = graphSettings[key];
	});
	updateGraphControlLabels();
}

function updateGraphControlLabels() {
	const set = (id, val) => {
		const el = document.getElementById(id);
		if (el) el.textContent = String(val);
	};
	set('gcLinkDistanceVal', graphSettings.linkDistance);
	set('gcLinkStrengthVal', graphSettings.linkStrength.toFixed(2));
	set('gcChargeStrengthVal', graphSettings.chargeStrength);
	set('gcCollisionPaddingVal', graphSettings.collisionPadding);
	set('gcCenterStrengthVal', graphSettings.centerStrength.toFixed(2));
}

function setupGraphControlsUI() {
	syncGraphControlsUI();

	const sliderMap = [
		['gcLinkDistance', 'linkDistance', true],
		['gcLinkStrength', 'linkStrength', false],
		['gcChargeStrength', 'chargeStrength', true],
		['gcCollisionPadding', 'collisionPadding', true],
		['gcCenterStrength', 'centerStrength', false]
	];
	sliderMap.forEach(([id, key, isInt]) => {
		document.getElementById(id)?.addEventListener('input', (e) => {
			graphSettings[key] = isInt ? Number(e.target.value) : Number(e.target.value);
			updateGraphControlLabels();
			saveGraphSettings();
			applySimulationForces();
		});
	});

	const checkKeyMap = {
		gcShowLabels: 'showLabels',
		gcShowLinks: 'showLinks',
		gcShowChoreography: 'showChoreography',
		gcShowTema: 'showTema',
		gcShowImaginario: 'showImaginario',
		gcShowVisual: 'showVisual',
		gcEixoInfancia: 'eixoInfancia',
		gcEixoSonho: 'eixoSonho',
		gcEixoSombra: 'eixoSombra',
		gcEixoTempo: 'eixoTempo',
		gcEixoCorpo: 'eixoCorpo',
		gcHighlightNeighbors: 'highlightNeighbors'
	};
	Object.entries(checkKeyMap).forEach(([id, key]) => {
		document.getElementById(id)?.addEventListener('change', (e) => {
			graphSettings[key] = e.target.checked;
			saveGraphSettings();
			if (key === 'highlightNeighbors') return;
			renderGraph();
		});
	});

	document.getElementById('gcResetGraph')?.addEventListener('click', () => {
		renderGraph();
		showNotification('Posições do grafo reiniciadas.');
	});

	document.getElementById('gcResetSettings')?.addEventListener('click', () => {
		graphSettings = { ...DEFAULT_GRAPH_SETTINGS };
		syncGraphControlsUI();
		saveGraphSettings();
		renderGraph();
		showNotification('Controles restaurados ao padrão.');
	});

	document.getElementById('graphControlsToggle')?.addEventListener('click', () => {
		document.getElementById('graphControlsBody')?.classList.toggle('hidden');
		const icon = document.querySelector('#graphControlsToggle i.fa-chevron-up, #graphControlsToggle i.fa-chevron-down');
		if (icon) {
			icon.classList.toggle('fa-chevron-up');
			icon.classList.toggle('fa-chevron-down');
		}
	});
}

function renderScenesList() {
	const listContainer = document.getElementById('scenesList');
	listContainer.innerHTML = '';

	choreographies.forEach((ch) => {
		const item = document.createElement('button');
		item.type = 'button';
		item.className =
			'w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-slate-900 border border-transparent hover:border-slate-800 transition flex items-center justify-between group';

		let icon = 'fa-circle-dot text-purple-500';
		if (ch.eixo === 'infância') icon = 'fa-face-laugh-beam text-amber-500';
		if (ch.eixo === 'sonho') icon = 'fa-moon text-indigo-400';
		if (ch.eixo === 'sombra') icon = 'fa-skull text-red-400';
		if (ch.eixo === 'tempo') icon = 'fa-hourglass text-blue-400';

		item.innerHTML = `
			<div class="flex items-center gap-2">
				<i class="fa-solid ${icon} text-[10px] shrink-0"></i>
				<span class="font-medium text-slate-300 truncate">${ch.title}</span>
			</div>
			<i class="fa-solid fa-chevron-right text-[10px] text-slate-600 group-hover:text-slate-400 transition"></i>
		`;

		item.onclick = () => {
			const node = gContainer.selectAll('.node').filter((d) => d.id === ch.id).datum();
			if (node) {
				selectNode(node);
				const transform = d3.zoomIdentity.translate(width / 2 - node.x * 1.5, height / 2 - node.y * 1.5).scale(1.5);
				svg.transition().duration(750).call(zoom.transform, transform);
			}
		};

		listContainer.appendChild(item);
	});
}

function toggleModal(modalId, show) {
	const modal = document.getElementById(modalId);
	if (show) {
		modal.classList.remove('pointer-events-none');
		modal.classList.add('opacity-100');
	} else {
		modal.classList.add('pointer-events-none');
		modal.classList.remove('opacity-100');
	}
}

function showNotification(msg) {
	const toast = document.createElement('div');
	toast.className =
		'fixed bottom-6 right-6 bg-slate-900 border border-slate-700 text-xs px-4 py-3 rounded-lg text-slate-200 shadow-2xl z-50 flex items-center gap-2 glow-purple transition-all duration-300 transform translate-y-10 opacity-0';
	toast.innerHTML = `<i class="fa-solid fa-circle-check text-purple-400"></i> <span>${msg}</span>`;
	document.body.appendChild(toast);

	setTimeout(() => toast.classList.remove('translate-y-10', 'opacity-0'), 50);
	setTimeout(() => {
		toast.classList.add('translate-y-10', 'opacity-0');
		setTimeout(() => toast.remove(), 300);
	}, 4000);
}

function initContos() {
	if (typeof d3 === 'undefined') {
		console.error('[CONTOS] D3.js não carregou. Verifique a conexão ou o bloqueio de scripts.');
		return;
	}

	loadAllState();

	if (!initGraphSurface()) return;

	const graphPanel = document.getElementById('graphControlsPanel');
	if (graphPanel) {
		graphPanel.addEventListener('mousedown', (e) => e.stopPropagation());
		graphPanel.addEventListener('wheel', (e) => e.stopPropagation(), { passive: true });
	}

	setupGraphControlsUI();
	renderScenesList();
	renderGraph();
	updateGraphDimensions();

	document.querySelectorAll('.axis-btn').forEach((btn) => {
		btn.addEventListener('click', () => highlightGroup(btn.dataset.group));
	});

	document.getElementById('searchInput').addEventListener('input', (e) => {
		const query = e.target.value.toLowerCase().trim();
		if (!query) {
			gContainer.selectAll('.node').style('opacity', 1);
			gContainer.selectAll('.node-label').style('opacity', 1);
			return;
		}

		gContainer.selectAll('.node').style('opacity', (d) => {
			const match =
				d.name.toLowerCase().includes(query) ||
				(d.category === 'choreography' && d.originalData.concept.toLowerCase().includes(query));
			return match ? 1 : 0.15;
		});
		gContainer.selectAll('.node-label').style('opacity', (d) => (d.name.toLowerCase().includes(query) ? 1 : 0.15));
	});

	document.getElementById('btnInfoGeral').addEventListener('click', () => toggleModal('generalInfoModal', true));
	document.getElementById('btnCloseGeneralInfo').addEventListener('click', () => toggleModal('generalInfoModal', false));

	document.getElementById('btnAddScene').addEventListener('click', () => toggleModal('addSceneModal', true));
	document.getElementById('btnCancelAdd').addEventListener('click', () => toggleModal('addSceneModal', false));
	document.getElementById('btnDiscardAdd').addEventListener('click', () => toggleModal('addSceneModal', false));

	document.getElementById('addSceneForm').addEventListener('submit', (e) => {
		e.preventDefault();

		const title = document.getElementById('newSceneTitle').value;
		const concept = document.getElementById('newSceneConcept').value;
		const temas = document.getElementById('newSceneThemes').value.split(',').map((t) => t.trim()).filter(Boolean);
		const imagery = document.getElementById('newSceneImagery').value.split(',').map((t) => t.trim()).filter(Boolean);
		const visual = document.getElementById('newSceneVisual').value.split(',').map((t) => t.trim()).filter(Boolean);

		choreographies.push({
			id: `ch_${Date.now()}`,
			title: `${choreographies.length + 1}. ${title}`,
			concept,
			temas,
			imaginario: imagery,
			direcao_visual: visual,
			eixo: 'sonho'
		});

		saveChoreographies();
		renderScenesList();
		renderGraph();
		toggleModal('addSceneModal', false);
		showNotification(`Cena "${title}" adicionada e conectada ao mapa!`);
		document.getElementById('addSceneForm').reset();
	});

	document.getElementById('btnClosePanel').addEventListener('click', () => {
		document.getElementById('panelWelcomeState').classList.remove('hidden');
		document.getElementById('panelDetailState').classList.add('hidden');
		selectedNode = null;
	});
}

if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', initContos);
} else {
	initContos();
}

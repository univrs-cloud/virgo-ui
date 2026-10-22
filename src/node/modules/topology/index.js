import modulePartial from 'node/modules/topology/partials/index.html';
import topologyPartial from 'node/modules/topology/partials/topology.html';
import stackPartial from 'node/modules/topology/partials/stack.html';
import sharePartial from 'node/modules/topology/partials/share.html';
import shortcutPartial from 'node/modules/topology/partials/shortcut.html';
import trafficPartial from 'node/modules/topology/partials/traffic.html';
import sharingPartial from 'node/modules/topology/partials/sharing.html';
import proxyPartial from 'node/modules/topology/partials/proxy.html';
import clientPartial from 'node/modules/topology/partials/client.html';
import * as topologyService from 'node/modules/topology/services/topology';

const MIN_SCALE = 0.2;
const MAX_SCALE = 2;
const BUTTON_ZOOM_FACTOR = 1.25;
const WHEEL_ZOOM_SPEED = 0.002;
const FIT_PADDING = 48;
const DASH_PATTERNS = { dashed: '6 4', dotted: '0.1 4' };
const CURVE_STEPS = 24;
const CURVE_STEM = 16;
const FLOW_FLOOR_RATE = 10_240;
const FLOW_LEVEL_CURVE = 120;
const FLOW_IDLE_WIDTH = 2;
const FLOW_STATUS_WIDTH = 4;
const FLOW_MIN_WIDTH = 6;
const FLOW_MAX_WIDTH = 24;
const FLOW_MIN_DOT_RATE = 40;
const FLOW_MAX_DOT_RATE = 360;
const FLOW_ROUTE_DOT_RATE = 1;
const FLOW_MAX_DOTS = 6000;
const FLOW_DOT_RADIUS = 0.9;
const FLOW_DRIFT = 0.8;
const FLOW_HOP_SECONDS = 6;
const FLOW_MIN_SPEED = 40;
const FLOW_FRAME_MS = 1000 / 30;

const moduleTemplate = _.template(modulePartial);
const topologyTemplate = _.template(topologyPartial);
const stackTemplate = _.template(stackPartial);
const shareTemplate = _.template(sharePartial);
const shortcutTemplate = _.template(shortcutPartial);
const trafficTemplate = _.template(trafficPartial);
const sharingTemplate = _.template(sharingPartial);
const proxyTemplate = _.template(proxyPartial);
const clientTemplate = _.template(clientPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#topology');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const viewport = container.querySelector('.topology-viewport');
const canvas = viewport.querySelector('.topology-tree');
const edges = canvas.querySelector('.topology-edges');
const content = canvas.querySelector('.topology-content');
const particles = canvas.querySelector('.topology-particles');
const particlesContext = particles.getContext('2d');
const trafficSwitch = container.querySelector('.traffic-switch');
const expanded = new Set(['node', 'proxy', 'shares']);
const view = { x: 0, y: 0, scale: 1 };
const pointers = new Map();
let gesture = null;
let hasFitted = false;
let isViewChanged = false;
let isVisible = false;
let unsubscribers = [];
let lastState = null;
let lastMarkup = null;
let traffic = {};
let isTrafficShown = topologyService.isTrafficShown();
let flows = [];
let routes = [];
let dotColors = { rx: '', tx: '' };
let frame = null;
let lastFrame = null;

const render = (state) => {
	if (_.isNil(state.system) || _.isNil(state.configuration) || _.isNil(state.topology)) {
		return;
	}
	
	lastState = state;
	const markup = topologyTemplate({
		system: state.system,
		networkInterface: _.find(state.system?.networkInterfaces, { default: true }),
		fleet: state.configuration?.fleet || null,
		topology: state.topology,
		expanded,
		stackTemplate,
		shareTemplate,
		shortcutTemplate,
		proxyTemplate,
		sharingTemplate,
		clientTemplate
	});
	if (markup === lastMarkup) {
		return;
	}

	lastMarkup = markup;
	morphdom(content, `<div>${markup}</div>`, { childrenOnly: true });

	loading.classList.add('d-none');
	container.classList.remove('d-none');
	fillTraffic();
	drawEdges();
	if (!hasFitted) {
		fit();
	}
};

const renderTraffic = (state) => {
	const isSameKeys = _.isEqual(_.keys(traffic).sort(), _.keys(state || {}).sort());
	traffic = state || {};
	fillTraffic();
	if (isSameKeys) {
		applyFlows();
	} else {
		drawEdges();
	}
};

const applyView = () => {
	canvas.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
	particles.style.left = `${-view.x / view.scale}px`;
	particles.style.top = `${-view.y / view.scale}px`;
	particles.style.width = `${viewport.clientWidth / view.scale}px`;
	particles.style.height = `${viewport.clientHeight / view.scale}px`;
	isViewChanged = true;
};

const sizeParticles = () => {
	const ratio = window.devicePixelRatio || 1;
	particles.width = Math.round(viewport.clientWidth * ratio);
	particles.height = Math.round(viewport.clientHeight * ratio);
	particlesContext.setTransform(ratio, 0, 0, ratio, 0, 0);
	applyView();
};

const fit = () => {
	const bounds = treeBounds();
	const viewportWidth = viewport.clientWidth;
	const viewportHeight = viewport.clientHeight;
	if (_.isNull(bounds) || !viewportWidth || !viewportHeight) {
		return;
	}

	const width = bounds.right - bounds.left;
	const height = bounds.bottom - bounds.top;
	view.scale = _.clamp(Math.min((viewportWidth - FIT_PADDING * 2) / width, (viewportHeight - FIT_PADDING * 2) / height, 1), MIN_SCALE, MAX_SCALE);
	view.x = (viewportWidth - width * view.scale) / 2 - bounds.left * view.scale;
	view.y = (viewportHeight - height * view.scale) / 2 - bounds.top * view.scale;
	hasFitted = true;
	applyView();
};

const treeBounds = () => {
	const origin = canvas.getBoundingClientRect();
	const rects = _.filter(_.map(content.querySelectorAll('.topology-node, .topology-toggle'), (element) => { return element.getBoundingClientRect(); }), (rect) => { return rect.width > 0 && rect.height > 0; });
	if (_.isEmpty(rects)) {
		return null;
	}

	return {
		left: (_.min(_.map(rects, 'left')) - origin.left) / view.scale,
		top: (_.min(_.map(rects, 'top')) - origin.top) / view.scale,
		right: (_.max(_.map(rects, 'right')) - origin.left) / view.scale,
		bottom: (_.max(_.map(rects, 'bottom')) - origin.top) / view.scale
	};
};

const zoomAt = (factor, originX, originY) => {
	const scale = _.clamp(view.scale * factor, MIN_SCALE, MAX_SCALE);
	view.x = originX - (originX - view.x) * (scale / view.scale);
	view.y = originY - (originY - view.y) * (scale / view.scale);
	view.scale = scale;
	applyView();
};

const drawEdges = () => {
	compactLeaves();
	const paths = [];
	const links = [];
	const chains = new Map();
	const linkByItem = new Map();
	_.each(content.querySelectorAll('ul ul:not(.topology-clients)'), (list) => {
		const anchor = list.previousElementSibling;
		const children = _.filter(list.children, (child) => { return child.matches('li') && child.getClientRects().length > 0; });
		if (_.isNull(anchor) || _.isEmpty(children)) {
			return;
		}

		const anchorOffset = offsetWithin(anchor);
		const parentX = anchorOffset.x + anchor.offsetWidth / 2;
		const parentY = anchorOffset.y + anchor.offsetHeight;
		const parentNode = list.parentElement.querySelector(':scope > .topology-node');
		const parentIcon = (parentNode ? parentNode.querySelector(':scope > .topology-icon') : null);
		const flowY = (parentIcon ? offsetWithin(parentIcon).y + parentIcon.offsetHeight : parentY);
		const hasTraffic = !('noTraffic' in list.dataset);
		const parentChain = (hasTraffic ? (chains.get(list.parentElement) || []) : null);
		const arms = _.reject(children, (child) => { return 'clientShares' in child.dataset; });
		_.each(arms, (child) => {
			const node = child.querySelector(':scope > .topology-node');
			const nodeOffset = offsetWithin(node);
			const x = nodeOffset.x + node.offsetWidth / 2;
			const y = nodeOffset.y;
			const throughY = (_.isNull(child.querySelector(':scope > ul')) ? y : nodeOffset.y + node.offsetHeight);
			const link = { d: `${curveOf(parentX, parentY, x, y, flowY)}${(throughY > y ? `L${x} ${throughY}` : '')}`, items: (hasTraffic ? [child] : []), statusColor: (hasTraffic ? '' : readEdge(child).color), half: 0 };
			paths.push(toPath(curveOf(parentX, parentY, x, y), readEdge(child)));
			const points = [...curvePoints(parentX, parentY, x, y, flowY), ...(throughY > y ? [{ x, y: throughY }] : [])];
			link.pieces = piecesOf(points, link);
			links.push(link);
			linkByItem.set(child, link);
			if (parentChain) {
				chains.set(child, [...parentChain, link.pieces]);
			}
		});
	});
	clientLinks(paths, links, linkByItem);
	edges.setAttribute('width', content.offsetWidth);
	edges.setAttribute('height', content.offsetHeight);
	edges.innerHTML = [
		'<defs><filter id="topology-flow-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"></feGaussianBlur></filter></defs>',
		'<g class="topology-flows topology-flow-bands topology-flow-idle" filter="url(#topology-flow-glow)"></g>',
		`<g class="topology-flows topology-flow-bands topology-flow-busy" filter="url(#topology-flow-glow)">${_.map(links, (link) => { return `<path class="topology-flow-band" d="${link.d}"></path>`; }).join('')}</g>`,
		paths.join('')
	].join('');
	const bands = edges.querySelectorAll('.topology-flow-band');
	const style = getComputedStyle(particles);
	dotColors = { rx: _.trim(style.getPropertyValue('--blue-500')), tx: _.trim(style.getPropertyValue('--purple-500')) };
	_.each(links, (link, index) => {
		link.band = bands[index];
	});
	flows = links;
	routes = _.concat(
		_.map([...chains], ([item, hopPieces]) => {
			return routeOf(item, hopPieces, { children: _.filter(item.querySelectorAll(':scope > ul > li'), (child) => { return chains.has(child); }) });
		}),
		clientRoutes(chains, linkByItem)
	);
	applyFlows();
	fillRoutes();
	stopFlows();
	startFlows();
};

const compactLeaves = () => {
	_.each(content.querySelectorAll('li[style]'), (item) => { item.style.left = ''; });
	_.each(content.querySelectorAll('ul'), (list) => {
		const items = _.filter(list.children, (child) => { return child.matches('li') && child.getClientRects().length > 0; });
		let run = [];
		let previousBranch = null;
		const flush = (nextBranch) => {
			if (!_.isEmpty(run)) {
				if (previousBranch) {
					packLeaves(run, previousBranch, 'left');
				} else if (nextBranch) {
					packLeaves(run, nextBranch, 'right');
				}
			}
			run = [];
		};
		_.each(items, (item) => {
			if (isBranch(item)) {
				flush(item);
				previousBranch = item;
				return;
			}

			run.push(item);
		});
		flush(null);
	});
};

const packLeaves = (leaves, branch, toward) => {
	const gap = parseFloat(getComputedStyle(_.head(leaves)).paddingLeft) || 0;
	const bounds = nodeBounds(branch);
	if (toward === 'right') {
		let edge = bounds.left - gap;
		_.eachRight(leaves, (item) => {
			const shift = edge - (item.offsetLeft + item.offsetWidth);
			if (shift > 0) {
				item.style.left = `${shift}px`;
			}
			edge = item.offsetLeft;
		});
		return;
	}

	let edge = bounds.right + gap;
	_.each(leaves, (item) => {
		const shift = edge - item.offsetLeft;
		if (shift < 0) {
			item.style.left = `${shift}px`;
		}
		edge = item.offsetLeft + item.offsetWidth;
	});
};

const isBranch = (item) => {
	return !_.isNull(item.querySelector(':scope > ul'));
};

const nodeBounds = (item) => {
	const node = item.querySelector(':scope > .topology-node');
	const left = item.offsetLeft + node.offsetLeft;
	return { left, right: left + node.offsetWidth };
};

const offsetWithin = (element) => {
	let x = 0;
	let y = 0;
	let current = element;
	while (current && current !== content) {
		x += current.offsetLeft;
		y += current.offsetTop;
		current = current.offsetParent;
	}
	return { x, y };
};

const readEdge = (element) => {
	const style = getComputedStyle(element);
	return {
		color: _.trim(style.getPropertyValue('--topology-edge-color')),
		style: _.trim(style.getPropertyValue('--topology-edge-style'))
	};
};

const toPath = (d, edge) => {
	const dash = DASH_PATTERNS[edge.style];
	const linecap = (edge.style === 'dotted' ? 'round' : 'butt');
	return `<path class="topology-edge-line" d="${d}" style="stroke: ${edge.color};${(dash ? ` stroke-dasharray: ${dash}; stroke-linecap: ${linecap};` : '')}"></path>`;
};

const routeOf = (item, hopPieces, extra) => {
	let end = 0;
	const hops = _.map(hopPieces, (pieces) => {
		const length = _.sumBy(pieces, 'length');
		end += length;
		return { length, end };
	});
	const segments = _.flatten(hopPieces);
	return {
		item,
		children: [],
		segments,
		hops,
		length: _.sumBy(segments, 'length'),
		dotRates: { rx: 0, tx: 0 },
		dots: { rx: [], tx: [] },
		pending: { rx: 0, tx: 0 },
		...extra
	};
};

const clientLinks = (paths, links, linkByItem) => {
	const router = content.querySelector('li[data-router]');
	const internet = content.querySelector('li[data-internet]');
	const remotes = [];
	_.each(content.querySelectorAll('li[data-client-shares]'), (client) => {
		const isRemote = ('clientRemote' in client.dataset);
		const target = (isRemote ? internet : router);
		if (!target || client.getClientRects().length === 0) {
			return;
		}

		const from = client.querySelector(':scope > .topology-node');
		const to = target.querySelector(':scope > .topology-node');
		const fromOffset = offsetWithin(from);
		const toOffset = offsetWithin(to);
		const x1 = fromOffset.x + from.offsetWidth / 2;
		const y1 = fromOffset.y + from.offsetHeight;
		const x2 = toOffset.x + to.offsetWidth / 2;
		const y2 = toOffset.y;
		const throughY = toOffset.y + to.offsetHeight;
		paths.push(toPath(curveOf(x1, y1, x2, y2), readEdge(client)));
		const icon = from.querySelector(':scope > .topology-icon');
		const fromY = (icon ? offsetWithin(icon).y + icon.offsetHeight : y1);
		const link = { d: `${curveOf(x1, y1, x2, y2, fromY)}L${x2} ${throughY}`, items: [client], half: 0 };
		link.pieces = piecesOf([...curvePoints(x1, y1, x2, y2, fromY), { x: x2, y: throughY }], link);
		links.push(link);
		linkByItem.set(client, link);
		if (isRemote) {
			remotes.push(client);
		}
	});
	if (router && linkByItem.has(router) && !_.isEmpty(remotes)) {
		linkByItem.get(router).items = remotes;
	}
};

const clientRoutes = (chains, linkByItem) => {
	const node = content.querySelector('li[data-traffic="node"]');
	const sharing = content.querySelector('li[data-sharing]');
	return _.flatMap(content.querySelectorAll('li[data-client-shares]'), (client) => {
		const link = linkByItem.get(client);
		if (!link || !node) {
			return [];
		}

		const router = content.querySelector('li[data-router]');
		const entry = [link.pieces, ...(('clientRemote' in client.dataset) && linkByItem.has(router) ? [linkByItem.get(router).pieces] : [])];
		const shares = _.split(client.dataset.clientShares, ' ');
		const targets = new Map();
		_.each(_.uniq([...shares, '']), (share) => {
			const shareItem = (share ? content.querySelector(`li[data-share="${CSS.escape(share)}"]`) : null);
			const target = _.find([shareItem, sharing, node], (candidate) => { return candidate && chains.has(candidate); }) || null;
			if (target) {
				targets.set(target, [...(targets.get(target) || []), `smbroute:${client.dataset.client}:${share}`]);
			}
		});
		return _.map([...targets], ([target, keys]) => {
			return routeOf(client, [...entry, ...chains.get(target)], { source: { key: keys.join(' '), share: 1 } });
		});
	});
};

const curveOf = (x1, y1, x2, y2, fromY = y1) => {
	const endY = y2 - Math.min(CURVE_STEM, (y2 - y1) / 4);
	const height = endY - y1;
	return `M${x1} ${fromY}L${x1} ${y1}C${x1} ${y1 + height * 0.75} ${x2} ${y1 + height * 0.25} ${x2} ${endY}L${x2} ${y2}`;
};

const curvePoints = (x1, y1, x2, y2, fromY = y1) => {
	const endY = y2 - Math.min(CURVE_STEM, (y2 - y1) / 4);
	const height = endY - y1;
	return [
		{ x: x1, y: fromY },
		..._.map(_.range(CURVE_STEPS + 1), (step) => {
			const t = step / CURVE_STEPS;
			const u = 1 - t;
			return {
				x: u * u * u * x1 + 3 * u * u * t * x1 + 3 * u * t * t * x2 + t * t * t * x2,
				y: u * u * u * y1 + 3 * u * u * t * (y1 + height * 0.75) + 3 * u * t * t * (y1 + height * 0.25) + t * t * t * endY
			};
		}),
		{ x: x2, y: y2 }
	];
};

const piecesOf = (points, link) => {
	return _.compact(_.map(_.range(points.length - 1), (index) => {
		const from = points[index];
		const to = points[index + 1];
		const length = Math.hypot(to.x - from.x, to.y - from.y);
		if (length === 0) {
			return null;
		}

		const ux = (to.x - from.x) / length;
		const uy = (to.y - from.y) / length;
		return { x1: from.x, y1: from.y, length, ux, uy, px: -uy, py: ux, link };
	}));
};

const fillTraffic = () => {
	_.each(content.querySelectorAll('[data-traffic-label]'), (label) => {
		const rates = trafficOf(label.dataset.trafficLabel);
		label.innerHTML = (isTrafficShown && rates ? trafficTemplate({ ...rates, prettyBytes }) : '');
	});
};

const trafficOf = (keys) => {
	const entries = _.compact(_.map(_.split(keys, ' '), (key) => { return traffic[key]; }));
	if (_.isEmpty(entries)) {
		return null;
	}

	return { rx: _.sumBy(entries, 'rx'), tx: _.sumBy(entries, 'tx') };
};

const applyFlows = () => {
	const cache = new Map();
	const totals = _.map(flows, (flow) => {
		const rates = _.map(flow.items, (item) => { return subtreeTraffic(item, cache); });
		return { rx: _.sumBy(rates, 'rx'), tx: _.sumBy(rates, 'tx') };
	});
	const capacity = topologyService.getDefaultNetworkInterfaceSpeed();
	const idleBands = edges.querySelector('.topology-flow-idle');
	const busyBands = edges.querySelector('.topology-flow-busy');
	const busiest = _.max(_.map(totals, (total) => { return Math.max(total.rx, total.tx); })) || 0;
	_.each(flows, (flow, index) => {
		const rate = Math.max(totals[index].rx, totals[index].tx);
		const width = (rate > 0 ? FLOW_MIN_WIDTH + (FLOW_MAX_WIDTH - FLOW_MIN_WIDTH) * Math.sqrt(rate / busiest) : (flow.statusColor ? FLOW_STATUS_WIDTH : FLOW_IDLE_WIDTH));
		flow.band.style.strokeWidth = `${width}px`;
		flow.band.style.opacity = 1;
		flow.band.classList.toggle('topology-flow-band-idle', rate === 0);
		flow.band.style.stroke = (rate === 0 && flow.statusColor ? flow.statusColor : '');
		const group = (rate > 0 ? busyBands : idleBands);
		if (flow.band.parentNode !== group) {
			group.appendChild(flow.band);
		}
		flow.half = Math.max(0, width / 2 - 2);
	});
	const excesses = _.map(routes, (route) => {
		if (route.source) {
			const rates = trafficOf(route.source.key) || { rx: 0, tx: 0 };
			return { rx: rates.rx * route.source.share, tx: rates.tx * route.source.share };
		}

		if ('trafficRelay' in route.item.dataset) {
			return { rx: 0, tx: 0 };
		}

		const own = subtreeTraffic(route.item, cache);
		const children = _.map(route.children, (child) => { return subtreeTraffic(child, cache); });
		return { rx: Math.max(0, own.rx - _.sumBy(children, 'rx')), tx: Math.max(0, own.tx - _.sumBy(children, 'tx')) };
	});
	const sums = { rx: _.sumBy(excesses, 'rx'), tx: _.sumBy(excesses, 'tx') };
	const spares = _.mapValues(sums, (sum, direction) => {
		const floors = _.size(_.filter(excesses, (excess) => { return excess[direction] > 0; })) * FLOW_ROUTE_DOT_RATE;
		return Math.max(0, dotBudgetOf(sum, capacity) - floors);
	});
	_.each(routes, (route, index) => {
		route.dotRates = _.mapValues(sums, (sum, direction) => {
			const excess = excesses[index][direction];
			return (excess > 0 ? FLOW_ROUTE_DOT_RATE + spares[direction] * excess / sum : 0);
		});
	});
};

const subtreeTraffic = (item, cache) => {
	if (cache.has(item)) {
		return cache.get(item);
	}

	const own = trafficOf(item.dataset.traffic) || { rx: 0, tx: 0 };
	const rendered = item.querySelectorAll(':scope > ul > li');
	const hidden = trafficOf(item.dataset.trafficSubtree);
	const children = (rendered.length > 0 ? _.map(rendered, (child) => { return subtreeTraffic(child, cache); }) : _.compact([hidden]));
	const rates = { rx: Math.max(own.rx, _.sumBy(children, 'rx')), tx: Math.max(own.tx, _.sumBy(children, 'tx')) };
	cache.set(item, rates);
	return rates;
};

const levelOf = (rate, capacity) => {
	const position = _.clamp(Math.log(rate / FLOW_FLOOR_RATE) / Math.log(Math.max(capacity, FLOW_FLOOR_RATE * 2) / FLOW_FLOOR_RATE), 0, 1);
	return (Math.pow(FLOW_LEVEL_CURVE, position) - 1) / (FLOW_LEVEL_CURVE - 1);
};

const dotBudgetOf = (rate, capacity) => {
	return (rate > 0 ? FLOW_MIN_DOT_RATE + (FLOW_MAX_DOT_RATE - FLOW_MIN_DOT_RATE) * levelOf(rate, capacity) : 0);
};

const startFlows = () => {
	if (!isVisible || !isTrafficShown || !_.isNull(frame) || _.isEmpty(flows)) {
		return;
	}

	lastFrame = null;
	frame = requestAnimationFrame(animate);
};

const stopFlows = () => {
	if (_.isNull(frame)) {
		return;
	}

	cancelAnimationFrame(frame);
	frame = null;
	particlesContext.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
};

const animate = (time) => {
	frame = requestAnimationFrame(animate);
	if (!isViewChanged && !_.isNull(lastFrame) && time - lastFrame < FLOW_FRAME_MS - 2) {
		return;
	}

	isViewChanged = false;

	const elapsed = Math.min((_.isNull(lastFrame) ? 0 : (time - lastFrame) / 1000), 0.1);
	lastFrame = time;
	if (!_.isNull(container.offsetParent)) {
		const radius = Math.max(0.6, FLOW_DOT_RADIUS * view.scale);
		const budget = { remaining: FLOW_MAX_DOTS };
		particlesContext.clearRect(0, 0, viewport.clientWidth, viewport.clientHeight);
		_.each(['rx', 'tx'], (direction) => {
			particlesContext.beginPath();
			_.each(routes, (route) => {
				advanceRoute(route, direction, elapsed, budget);
				traceRoute(route, route.dots[direction], radius);
			});
			particlesContext.fillStyle = dotColors[direction];
			particlesContext.fill();
		});
	}
};

const fillRoutes = () => {
	_.each(routes, (route) => {
		_.each(['rx', 'tx'], (direction) => {
			const count = Math.round(route.dotRates[direction] * _.sumBy(route.hops, (hop) => { return hop.length / hopSpeed(hop); }));
			route.dots[direction] = _.times(count, () => { return newDot(route, Math.random() * route.length); });
			route.pending[direction] = Math.random();
		});
	});
};

const advanceRoute = (route, direction, elapsed, budget) => {
	if (route.dotRates[direction] === 0) {
		route.dots[direction] = [];
		route.pending[direction] = 0;
		return;
	}

	const dots = route.dots[direction];
	const sign = (direction === 'rx' ? 1 : -1);
	route.pending[direction] += route.dotRates[direction] * elapsed;
	while (route.pending[direction] >= 1) {
		route.pending[direction] -= 1;
		if (budget.remaining > 0) {
			const hop = (direction === 'rx' ? _.head(route.hops) : _.last(route.hops));
			const lead = hopSpeed(hop) * elapsed * Math.random();
			dots.push(newDot(route, (direction === 'rx' ? lead : route.length - lead)));
		}
	}
	route.dots[direction] = _.filter(dots, (dot) => {
		const hop = _.find(route.hops, (candidate) => { return dot.position <= candidate.end; }) || _.last(route.hops);
		dot.position += sign * hopSpeed(hop) * elapsed;
		dot.lateral += dot.drift * elapsed;
		if (Math.abs(dot.lateral) > 1) {
			dot.lateral = Math.sign(dot.lateral) * 2 - dot.lateral;
			dot.drift = -dot.drift;
		}
		return dot.position >= 0 && dot.position <= route.length;
	});
	budget.remaining -= route.dots[direction].length;
};

const traceRoute = (route, dots, radius) => {
	const width = viewport.clientWidth;
	const height = viewport.clientHeight;
	_.each(dots, (dot) => {
		let distance = dot.position;
		let segment = _.last(route.segments);
		for (const candidate of route.segments) {
			if (distance <= candidate.length) {
				segment = candidate;
				break;
			}
			distance -= candidate.length;
		}

		const x = view.x + (segment.x1 + segment.ux * distance + segment.px * dot.lateral * segment.link.half) * view.scale;
		const y = view.y + (segment.y1 + segment.uy * distance + segment.py * dot.lateral * segment.link.half) * view.scale;
		if (x < -radius || y < -radius || x > width + radius || y > height + radius) {
			return;
		}

		particlesContext.moveTo(x + radius, y);
		particlesContext.arc(x, y, radius, 0, Math.PI * 2);
	});
};

const newDot = (route, position) => {
	return { position, lateral: Math.random() * 2 - 1, drift: (Math.random() * 2 - 1) * FLOW_DRIFT };
};

const hopSpeed = (hop) => {
	return Math.max(FLOW_MIN_SPEED, hop.length / FLOW_HOP_SECONDS);
};

const toggleTraffic = (event) => {
	isTrafficShown = event.target.checked;
	topologyService.setTrafficShown(isTrafficShown);
	viewport.classList.toggle('topology-traffic-hidden', !isTrafficShown);
	fillTraffic();
	drawEdges();
	if (!isTrafficShown) {
		stopFlows();
	}
};

const toggle = (event) => {
	const button = event.target.closest('button[data-action="toggle"]');
	if (_.isNull(button) || _.isNull(lastState)) {
		return;
	}

	const key = button.dataset.key;
	const before = button.getBoundingClientRect();
	if (expanded.has(key)) {
		expanded.delete(key);
	} else {
		expanded.add(key);
	}
	render(lastState);
	const after = content.querySelector(`button[data-action="toggle"][data-key="${key}"]`)?.getBoundingClientRect();
	if (after) {
		view.x += before.left - after.left;
		view.y += before.top - after.top;
		applyView();
	}
};

const control = (event) => {
	const action = event.target.closest('button[data-action]')?.dataset.action;
	if (action === 'fit') {
		fit();
	} else if (action === 'zoom-in' || action === 'zoom-out') {
		zoomAt((action === 'zoom-in' ? BUTTON_ZOOM_FACTOR : 1 / BUTTON_ZOOM_FACTOR), viewport.clientWidth / 2, viewport.clientHeight / 2);
	}
};

const zoom = (event) => {
	event.preventDefault();
	const bounds = viewport.getBoundingClientRect();
	zoomAt(Math.exp(-event.deltaY * WHEEL_ZOOM_SPEED), event.clientX - bounds.left, event.clientY - bounds.top);
};

const startPointer = (event) => {
	if (event.button !== 0 || event.target.closest('button, a, .topology-controls')) {
		return;
	}

	pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
	viewport.setPointerCapture(event.pointerId);
	viewport.classList.add('dragging');
	gesture = readGesture();
};

const movePointer = (event) => {
	if (!pointers.has(event.pointerId)) {
		return;
	}

	pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
	const next = readGesture();
	view.x += next.x - gesture.x;
	view.y += next.y - gesture.y;
	if (next.distance && gesture.distance) {
		zoomAt(next.distance / gesture.distance, next.x, next.y);
	} else {
		applyView();
	}
	gesture = next;
};

const endPointer = (event) => {
	if (!pointers.delete(event.pointerId)) {
		return;
	}

	if (pointers.size > 0) {
		gesture = readGesture();
		return;
	}

	gesture = null;
	viewport.classList.remove('dragging');
};

const readGesture = () => {
	const bounds = viewport.getBoundingClientRect();
	const [first, second] = [...pointers.values()];
	if (!second) {
		return { x: first.x - bounds.left, y: first.y - bounds.top, distance: 0 };
	}

	return {
		x: (first.x + second.x) / 2 - bounds.left,
		y: (first.y + second.y) / 2 - bounds.top,
		distance: Math.hypot(first.x - second.x, first.y - second.y)
	};
};

const syncVisibility = () => {
	const isShown = !module.classList.contains('d-none');
	if (isShown === isVisible) {
		return;
	}

	isVisible = isShown;
	if (isVisible) {
		unsubscribers = [topologyService.subscribe([render]), topologyService.subscribeToTraffic([renderTraffic])];
		return;
	}

	_.each(unsubscribers, (unsubscribe) => { unsubscribe(); });
	unsubscribers = [];
	stopFlows();
};

module.addEventListener('click', toggle);
module.addEventListener('click', control);
viewport.addEventListener('wheel', zoom, { passive: false });
viewport.addEventListener('pointerdown', startPointer);
viewport.addEventListener('pointermove', movePointer);
viewport.addEventListener('pointerup', endPointer);
viewport.addEventListener('pointercancel', endPointer);
trafficSwitch.addEventListener('switch-changed', toggleTraffic);
trafficSwitch.checked = isTrafficShown;
viewport.classList.toggle('topology-traffic-hidden', !isTrafficShown);

const resizeObserver = new ResizeObserver(() => {
	if (!isVisible) {
		return;
	}

	sizeParticles();
	drawEdges();
	if (!hasFitted) {
		fit();
	}
});
resizeObserver.observe(viewport);
resizeObserver.observe(content);

new MutationObserver(syncVisibility).observe(module, { attributes: true, attributeFilter: ['class'] });
syncVisibility();

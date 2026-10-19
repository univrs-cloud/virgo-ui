import modulePartial from 'node/modules/topology/partials/index.html';
import topologyPartial from 'node/modules/topology/partials/topology.html';
import stackPartial from 'node/modules/topology/partials/stack.html';
import sharePartial from 'node/modules/topology/partials/share.html';
import shortcutPartial from 'node/modules/topology/partials/shortcut.html';
import trafficPartial from 'node/modules/topology/partials/traffic.html';
import * as topologyService from 'node/modules/topology/services/topology';

const MIN_SCALE = 0.2;
const MAX_SCALE = 2;
const BUTTON_ZOOM_FACTOR = 1.25;
const WHEEL_ZOOM_SPEED = 0.002;
const FIT_PADDING = 48;
const DASH_PATTERNS = { dashed: '6 4', dotted: '0.1 4' };
const FLOW_REFERENCE_RATE = 1_048_576;
const FLOW_HOP_SECONDS = 6;
const FLOW_MIN_SPEED = 40;
const FLOW_IDLE_WIDTH = 8;
const FLOW_MIN_WIDTH = 9;
const FLOW_MAX_WIDTH = 32;
const FLOW_MIN_DOT_RATE = 1;
const FLOW_MAX_DOT_RATE = 60;
const FLOW_DOT_RADIUS = 0.9;
const FLOW_DRIFT = 0.8;
const FLOW_MAX_DOTS = 6000;
const FLOW_FRAME_MS = 1000 / 30;

const moduleTemplate = _.template(modulePartial);
const topologyTemplate = _.template(topologyPartial);
const stackTemplate = _.template(stackPartial);
const shareTemplate = _.template(sharePartial);
const shortcutTemplate = _.template(shortcutPartial);
const trafficTemplate = _.template(trafficPartial);
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
const expanded = new Set(['proxy', 'shares']);
const view = { x: 0, y: 0, scale: 1 };
let lastState = null;
let traffic = {};
let isTrafficShown = topologyService.isTrafficShown();
let flows = [];
let routes = [];
let dotColors = { rx: '', tx: '' };
let frame = null;
let lastFrame = null;
let isViewChanged = false;
let hasFitted = false;
const pointers = new Map();
let gesture = null;

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
	const width = canvas.offsetWidth;
	const height = canvas.offsetHeight;
	const viewportWidth = viewport.clientWidth;
	const viewportHeight = viewport.clientHeight;
	if (!width || !height || !viewportWidth || !viewportHeight) {
		return;
	}

	view.scale = _.clamp(Math.min((viewportWidth - FIT_PADDING * 2) / width, (viewportHeight - FIT_PADDING * 2) / height, 1), MIN_SCALE, MAX_SCALE);
	view.x = (viewportWidth - width * view.scale) / 2;
	view.y = Math.max(FIT_PADDING, (viewportHeight - height * view.scale) / 2);
	hasFitted = true;
	applyView();
};

const zoomAt = (factor, originX, originY) => {
	const scale = _.clamp(view.scale * factor, MIN_SCALE, MAX_SCALE);
	view.x = originX - (originX - view.x) * (scale / view.scale);
	view.y = originY - (originY - view.y) * (scale / view.scale);
	view.scale = scale;
	applyView();
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

const trafficOf = (keys) => {
	const entries = _.compact(_.map(_.split(keys, ' '), (key) => { return traffic[key]; }));
	if (_.isEmpty(entries)) {
		return null;
	}

	return { rx: _.sumBy(entries, 'rx'), tx: _.sumBy(entries, 'tx') };
};

const fillTraffic = () => {
	_.each(content.querySelectorAll('[data-traffic-label]'), (label) => {
		const rates = trafficOf(label.dataset.trafficLabel);
		label.innerHTML = (isTrafficShown && rates ? trafficTemplate({ ...rates, prettyBytes }) : '');
	});
};

const shareOf = (rate, reference) => {
	return (rate > 0 ? Math.sqrt(Math.min(rate / reference, 1)) : 0);
};

const subtreeTraffic = (item, cache) => {
	if (cache.has(item)) {
		return cache.get(item);
	}

	const own = trafficOf(item.dataset.traffic) || { rx: 0, tx: 0 };
	const children = _.map(item.querySelectorAll(':scope > ul > li'), (child) => { return subtreeTraffic(child, cache); });
	const rates = { rx: Math.max(own.rx, _.sumBy(children, 'rx')), tx: Math.max(own.tx, _.sumBy(children, 'tx')) };
	cache.set(item, rates);
	return rates;
};

const dotRateOf = (rate, reference) => {
	return (rate > 0 ? Math.max(FLOW_MIN_DOT_RATE, FLOW_MAX_DOT_RATE * Math.min(rate / reference, 1)) : 0);
};

const applyFlows = () => {
	const cache = new Map();
	const totals = _.map(flows, (flow) => {
		const rates = _.map(flow.items, (item) => { return subtreeTraffic(item, cache); });
		return { rx: _.sumBy(rates, 'rx'), tx: _.sumBy(rates, 'tx') };
	});
	const reference = Math.max(FLOW_REFERENCE_RATE, ..._.map(totals, (total) => { return total.rx + total.tx; }));
	_.each(flows, (flow, index) => {
		const share = shareOf(totals[index].rx + totals[index].tx, reference);
		const width = (share > 0 ? FLOW_MIN_WIDTH + (FLOW_MAX_WIDTH - FLOW_MIN_WIDTH) * share : FLOW_IDLE_WIDTH);
		flow.band.style.strokeWidth = `${width}px`;
		flow.band.style.opacity = 1;
		flow.half = Math.max(0, width / 2 - 2);
	});
	_.each(routes, (route) => {
		const own = subtreeTraffic(route.item, cache);
		const children = _.map(route.children, (child) => { return subtreeTraffic(child, cache); });
		route.dotRates = {
			rx: dotRateOf(Math.max(0, own.rx - _.sumBy(children, 'rx')), reference),
			tx: dotRateOf(Math.max(0, own.tx - _.sumBy(children, 'tx')), reference)
		};
	});
};

const newDot = (route, position) => {
	return { position, lateral: Math.random() * 2 - 1, drift: (Math.random() * 2 - 1) * FLOW_DRIFT };
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

const hopSpeed = (hop) => {
	return Math.max(FLOW_MIN_SPEED, hop.length / FLOW_HOP_SECONDS);
};

const advanceRoute = (route, direction, elapsed, budget) => {
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

		const x = view.x + (segment.x1 + segment.ux * distance + segment.px * dot.lateral * segment.half) * view.scale;
		const y = view.y + (segment.y1 + segment.uy * distance + segment.py * dot.lateral * segment.half) * view.scale;
		if (x < -radius || y < -radius || x > width + radius || y > height + radius) {
			return;
		}

		particlesContext.moveTo(x + radius, y);
		particlesContext.arc(x, y, radius, 0, Math.PI * 2);
	});
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

const startFlows = () => {
	if (!isTrafficShown || !_.isNull(frame) || _.isEmpty(flows)) {
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

const drawEdges = () => {
	const paths = [];
	const segments = [];
	const chains = new Map();
	_.each(content.querySelectorAll('ul ul'), (list) => {
		const anchor = list.previousElementSibling;
		const children = _.filter(list.children, (child) => { return child.matches('li') && child.getClientRects().length > 0; });
		if (_.isNull(anchor) || _.isEmpty(children)) {
			return;
		}

		const anchorOffset = offsetWithin(anchor);
		const parentX = anchorOffset.x + anchor.offsetWidth / 2;
		const parentY = anchorOffset.y + anchor.offsetHeight;
		const parentNode = list.parentElement.querySelector(':scope > .topology-node');
		const flowY = (parentNode ? offsetWithin(parentNode).y + parentNode.offsetHeight : parentY);
		const targets = _.map(children, (child) => {
			const node = child.querySelector(':scope > .topology-node');
			const nodeOffset = offsetWithin(node);
			const isPassedThrough = !_.isNull(child.querySelector(':scope > ul'));
			return { x: nodeOffset.x + node.offsetWidth / 2, y: nodeOffset.y, flowY: (isPassedThrough ? nodeOffset.y + node.offsetHeight : nodeOffset.y), top: offsetWithin(child).y, edge: readEdge(child) };
		});
		const barY = _.head(targets).top;
		const isUniform = _.every(targets, (target) => { return _.isEqual(target.edge, _.head(targets).edge); });
		paths.push(toPath(`M${parentX} ${parentY}V${barY}`, (isUniform ? _.head(targets).edge : readEdge(list))));
		const hasTraffic = !('noTraffic' in list.dataset);
		const stem = { x1: parentX, y1: flowY, x2: parentX, y2: barY, items: (hasTraffic ? children : []) };
		const parentChain = (hasTraffic ? (chains.get(list.parentElement) || []) : null);
		segments.push(stem);
		_.each(_.partition(_.map(targets, (target, index) => { return { ...target, item: children[index] }; }), (target) => { return target.x < parentX; }), (side) => {
			let startX = parentX;
			const ordered = _.sortBy(side, (target) => { return Math.abs(target.x - parentX); });
			const bus = [];
			_.each(ordered, (target, index) => {
				paths.push(toPath(`M${startX} ${barY}H${target.x}V${target.y}`, target.edge));
				const piece = { x1: startX, y1: barY, x2: target.x, y2: barY, items: (hasTraffic ? _.map(_.slice(ordered, index), 'item') : []) };
				const drop = { x1: target.x, y1: barY, x2: target.x, y2: target.flowY, items: (hasTraffic ? [target.item] : []) };
				segments.push(piece, drop);
				bus.push(piece);
				if (parentChain) {
					chains.set(target.item, [...parentChain, [stem, ...bus, drop]]);
				}
				startX = target.x;
			});
		});
	});
	edges.setAttribute('width', content.offsetWidth);
	edges.setAttribute('height', content.offsetHeight);
	edges.innerHTML = [
		'<defs><filter id="topology-flow-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"></feGaussianBlur></filter></defs>',
		`<g class="topology-flows topology-flow-bands" filter="url(#topology-flow-glow)">${_.map(segments, (segment) => { return `<path class="topology-flow-band" d="M${segment.x1} ${segment.y1}L${segment.x2} ${segment.y2}"></path>`; }).join('')}</g>`,
		paths.join('')
	].join('');
	const bands = edges.querySelectorAll('.topology-flow-band');
	const style = getComputedStyle(particles);
	dotColors = { rx: _.trim(style.getPropertyValue('--blue-500')), tx: _.trim(style.getPropertyValue('--purple-500')) };
	_.each(segments, (segment, index) => {
		const length = Math.abs(segment.x2 - segment.x1) + Math.abs(segment.y2 - segment.y1);
		Object.assign(segment, {
			length,
			ux: (length > 0 ? (segment.x2 - segment.x1) / length : 0),
			uy: (length > 0 ? (segment.y2 - segment.y1) / length : 0),
			half: 0,
			band: bands[index]
		});
		segment.px = Math.abs(segment.uy);
		segment.py = Math.abs(segment.ux);
	});
	flows = segments;
	routes = _.map([...chains], ([item, links]) => {
		let end = 0;
		const hops = _.map(links, (link) => {
			const length = _.sumBy(link, 'length');
			end += length;
			return { length, end };
		});
		const chain = _.flatten(links);
		return {
			item,
			children: _.filter(item.querySelectorAll(':scope > ul > li'), (child) => { return chains.has(child); }),
			segments: chain,
			hops,
			length: _.sumBy(chain, 'length'),
			dotRates: { rx: 0, tx: 0 },
			dots: { rx: [], tx: [] },
			pending: { rx: 0, tx: 0 }
		};
	});
	applyFlows();
	fillRoutes();
	stopFlows();
	startFlows();
};

const render = (state) => {
	if (_.isNil(state.system) || _.isNil(state.configuration) || _.isNil(state.topology)) {
		return;
	}

	lastState = state;
	morphdom(
		content,
		`<div>${topologyTemplate({
			system: state.system,
			networkInterface: _.find(state.system?.networkInterfaces, { default: true }),
			fleet: state.configuration?.fleet || null,
			topology: state.topology,
			expanded,
			stackTemplate,
			shareTemplate,
			shortcutTemplate
		})}</div>`,
		{ childrenOnly: true }
	);

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
	if (expanded.has(key)) {
		expanded.delete(key);
	} else {
		expanded.add(key);
	}
	render(lastState);
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

module.addEventListener('click', toggle);
module.addEventListener('click', control);
viewport.addEventListener('wheel', zoom, { passive: false });
viewport.addEventListener('pointerdown', startPointer);
viewport.addEventListener('pointermove', movePointer);
viewport.addEventListener('pointerup', endPointer);
viewport.addEventListener('pointercancel', endPointer);
const resizeObserver = new ResizeObserver(() => {
	sizeParticles();
	drawEdges();
	if (!hasFitted) {
		fit();
	}
});
resizeObserver.observe(viewport);
resizeObserver.observe(content);

trafficSwitch.checked = isTrafficShown;
viewport.classList.toggle('topology-traffic-hidden', !isTrafficShown);
trafficSwitch.addEventListener('switch-changed', toggleTraffic);

topologyService.subscribe([render]);
topologyService.subscribeToTraffic([renderTraffic]);

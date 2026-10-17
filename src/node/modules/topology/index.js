import modulePartial from 'node/modules/topology/partials/index.html';
import topologyPartial from 'node/modules/topology/partials/topology.html';
import stackPartial from 'node/modules/topology/partials/stack.html';
import sharePartial from 'node/modules/topology/partials/share.html';
import shortcutPartial from 'node/modules/topology/partials/shortcut.html';
import * as topologyService from 'node/modules/topology/services/topology';

const MIN_SCALE = 0.2;
const MAX_SCALE = 2;
const BUTTON_ZOOM_FACTOR = 1.25;
const WHEEL_ZOOM_SPEED = 0.002;
const FIT_PADDING = 48;
const DASH_PATTERNS = { dashed: '6 4', dotted: '0.1 4' };

const moduleTemplate = _.template(modulePartial);
const topologyTemplate = _.template(topologyPartial);
const stackTemplate = _.template(stackPartial);
const shareTemplate = _.template(sharePartial);
const shortcutTemplate = _.template(shortcutPartial);
document.querySelector('main .modules').insertAdjacentHTML('beforeend', moduleTemplate());
const module = document.querySelector('#topology');
const loading = module.querySelector('.loading');
const container = module.querySelector('.container-fluid');
const viewport = container.querySelector('.topology-viewport');
const canvas = viewport.querySelector('.topology-tree');
const edges = canvas.querySelector('.topology-edges');
const content = canvas.querySelector('.topology-content');
const expanded = new Set(['proxy', 'auth', 'shares']);
const view = { x: 0, y: 0, scale: 1 };
let lastState = null;
let hasFitted = false;
const pointers = new Map();
let gesture = null;

const applyView = () => {
	canvas.style.transform = `translate(${view.x}px, ${view.y}px) scale(${view.scale})`;
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
	return `<path d="${d}" style="stroke: ${edge.color};${(dash ? ` stroke-dasharray: ${dash}; stroke-linecap: ${linecap};` : '')}"></path>`;
};

const drawEdges = () => {
	const paths = [];
	_.each(content.querySelectorAll('ul ul'), (list) => {
		const anchor = list.previousElementSibling;
		const children = _.filter(list.children, (child) => { return child.matches('li'); });
		if (_.isNull(anchor) || _.isEmpty(children)) {
			return;
		}

		const anchorOffset = offsetWithin(anchor);
		const parentX = anchorOffset.x + anchor.offsetWidth / 2;
		const parentY = anchorOffset.y + anchor.offsetHeight;
		const targets = _.map(children, (child) => {
			const node = child.querySelector(':scope > .topology-node');
			const nodeOffset = offsetWithin(node);
			return { x: nodeOffset.x + node.offsetWidth / 2, y: nodeOffset.y, top: offsetWithin(child).y, edge: readEdge(child) };
		});
		const barY = _.head(targets).top;
		const isUniform = _.every(targets, (target) => { return _.isEqual(target.edge, _.head(targets).edge); });
		paths.push(toPath(`M${parentX} ${parentY}V${barY}`, (isUniform ? _.head(targets).edge : readEdge(list))));
		_.each(_.partition(targets, (target) => { return target.x < parentX; }), (side) => {
			let startX = parentX;
			_.each(_.sortBy(side, (target) => { return Math.abs(target.x - parentX); }), (target) => {
				paths.push(toPath(`M${startX} ${barY}H${target.x}V${target.y}`, target.edge));
				startX = target.x;
			});
		});
	});
	edges.setAttribute('width', content.offsetWidth);
	edges.setAttribute('height', content.offsetHeight);
	edges.innerHTML = paths.join('');
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
	drawEdges();
	if (!hasFitted) {
		fit();
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
	if (event.button !== 0 || event.target.closest('button, a, .btn-group')) {
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
	drawEdges();
	if (!hasFitted) {
		fit();
	}
});
resizeObserver.observe(viewport);
resizeObserver.observe(content);

topologyService.subscribe([render]);

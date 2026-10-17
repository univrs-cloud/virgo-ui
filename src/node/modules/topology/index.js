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
const expanded = new Set(['proxy', 'auth', 'shares']);
const view = { x: 0, y: 0, scale: 1 };
let lastState = null;
let hasFitted = false;
let drag = null;

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

const render = (state) => {
	if (_.isNil(state.system) || _.isNil(state.configuration) || _.isNil(state.topology)) {
		return;
	}

	lastState = state;
	morphdom(
		canvas,
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

const startDrag = (event) => {
	if (event.button !== 0 || event.target.closest('button, a, .btn-group')) {
		return;
	}

	drag = { pointerId: event.pointerId, x: event.clientX - view.x, y: event.clientY - view.y };
	viewport.setPointerCapture(event.pointerId);
	viewport.classList.add('dragging');
};

const moveDrag = (event) => {
	if (drag?.pointerId !== event.pointerId) {
		return;
	}

	view.x = event.clientX - drag.x;
	view.y = event.clientY - drag.y;
	applyView();
};

const endDrag = (event) => {
	if (drag?.pointerId !== event.pointerId) {
		return;
	}

	drag = null;
	viewport.classList.remove('dragging');
};

module.addEventListener('click', toggle);
module.addEventListener('click', control);
viewport.addEventListener('wheel', zoom, { passive: false });
viewport.addEventListener('pointerdown', startDrag);
viewport.addEventListener('pointermove', moveDrag);
viewport.addEventListener('pointerup', endDrag);
viewport.addEventListener('pointercancel', endDrag);
new ResizeObserver(() => {
	if (!hasFitted) {
		fit();
	}
}).observe(viewport);

topologyService.subscribe([render]);

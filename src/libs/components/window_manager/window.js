import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from '../styles.js';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;
const EDGES = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];
const SNAP_EDGE = 16;
const SNAP_CORNER_SHARE = 0.25;
const SPRING = (CSS.supports('transition-timing-function', 'linear(0, 1)') ? 'linear(0, 0.07, 0.226, 0.408, 0.581, 0.727, 0.839, 0.92, 0.974, 1.006, 1.022, 1.028, 1.028, 1.024, 1.019, 1.014, 1.009, 1.006, 1.003, 1.001, 1, 1, 0.999, 0.999, 1)' : 'cubic-bezier(0.2, 0, 0, 1)');
const ENTER = { duration: 240, easing: SPRING };
const EXIT = { duration: 150, easing: 'cubic-bezier(0.3, 0, 0.8, 0.15)', fill: 'forwards' };
const REVEAL = { duration: 150, easing: 'ease-out' };
const MOVE_MIN_DURATION = 240;
const MOVE_MAX_DURATION = 420;
const MOVE_DURATION_PER_PIXEL = 0.12;
const SHOWN = { opacity: 1, transform: 'none' };
const HIDDEN = { opacity: 0, transform: 'scale(0.95)' };

const getMoveDuration = (from, to) => {
	const distance = Math.max(Math.hypot(to.x - from.x, to.y - from.y), Math.hypot(to.x + to.width - from.x - from.width, to.y + to.height - from.y - from.height));
	return Math.min(MOVE_MAX_DURATION, MOVE_MIN_DURATION + distance * MOVE_DURATION_PER_PIXEL);
};

const getSnapRect = (zone, bounds) => {
	const halfWidth = Math.round(bounds.clientWidth / 2);
	const halfHeight = Math.round(bounds.clientHeight / 2);
	return {
		x: (zone.includes('e') ? halfWidth : 0),
		y: (zone.includes('s') ? halfHeight : 0),
		width: (zone.includes('e') ? bounds.clientWidth - halfWidth : (zone.includes('w') ? halfWidth : bounds.clientWidth)),
		height: (zone.includes('s') ? bounds.clientHeight - halfHeight : (zone.includes('n') ? halfHeight : bounds.clientHeight))
	};
};

const getSnapZone = (event, bounds) => {
	const rect = bounds.getBoundingClientRect();
	const x = event.clientX - rect.left;
	const y = event.clientY - rect.top;
	const isNear = (distance) => { return x <= distance || x >= rect.width - distance || y <= distance || y >= rect.height - distance; };
	if (!isNear(SNAP_EDGE)) {
		return '';
	}

	const cornerWidth = rect.width * SNAP_CORNER_SHARE;
	const cornerHeight = rect.height * SNAP_CORNER_SHARE;
	const vertical = (y <= cornerHeight ? 'n' : (y >= rect.height - cornerHeight ? 's' : ''));
	const horizontal = (x <= cornerWidth ? 'w' : (x >= rect.width - cornerWidth ? 'e' : ''));
	return `${vertical}${horizontal}`;
};

export class FloatingWindow extends LitElement {
	static styles = [sheet, css`
		:host { position: absolute; top: 0; left: 0; display: block; pointer-events: auto; }
		:host([minimized]:not([hiding])) { display: none; }
		:host([hiding]), :host([closing]) { pointer-events: none; }
		:host([interacting]) ::slotted(*) { pointer-events: none; }
		:host([dragging]) .card { background-color: transparent; }
		:host([dragging]) .titlebar { background: linear-gradient(var(--card-cap-bg), var(--card-cap-bg)), var(--card-bg); }
		:host([dragging]) .card-body { opacity: 0.75; }
		:host(:not([maximized])) ::slotted(iframe) { border-radius: 0 0 var(--card-inner-border-radius) var(--card-inner-border-radius); }
		.card-body { min-height: 0; }
		.titlebar, .handle { touch-action: none; }
		.titlebar { cursor: move; }
		.snap-preview { z-index: -1; }
		.loading { background-color: var(--app-bg); }
		.loading-icon { width: calc(30px + 0.5rem); height: calc(30px + 0.5rem); }
		.loading-icon img { width: 30px; height: 30px; object-fit: contain; }
		@supports (corner-shape: squircle) { .loading-icon { border-radius: 50% !important; corner-shape: squircle; } }
		.handle { position: absolute; }
		.handle[data-edge="n"], .handle[data-edge="s"] { left: 10px; right: 10px; height: 8px; cursor: ns-resize; }
		.handle[data-edge="e"], .handle[data-edge="w"] { top: 10px; bottom: 10px; width: 8px; cursor: ew-resize; }
		.handle[data-edge="n"] { top: -4px; }
		.handle[data-edge="s"] { bottom: -4px; }
		.handle[data-edge="e"] { right: -4px; }
		.handle[data-edge="w"] { left: -4px; }
		.handle[data-edge="ne"], .handle[data-edge="se"], .handle[data-edge="sw"], .handle[data-edge="nw"] { width: 14px; height: 14px; }
		.handle[data-edge="ne"] { top: -4px; right: -4px; cursor: nesw-resize; }
		.handle[data-edge="se"] { bottom: -4px; right: -4px; cursor: nwse-resize; }
		.handle[data-edge="sw"] { bottom: -4px; left: -4px; cursor: nesw-resize; }
		.handle[data-edge="nw"] { top: -4px; left: -4px; cursor: nwse-resize; }
	`];

	static properties = {
		label: { type: String },
		icon: { type: String },
		type: { type: String },
		x: { type: Number },
		y: { type: Number },
		width: { type: Number },
		height: { type: Number },
		snap: { type: String },
		snapZone: { state: true },
		maximized: { type: Boolean, reflect: true },
		minimized: { type: Boolean, reflect: true },
		active: { type: Boolean, reflect: true },
		loading: { type: Boolean }
	};

	static #stack = [];

	#unsnapped = null;
	#from = null;
	#move = null;
	#fade = null;

	static #restack() {
		const top = [...FloatingWindow.#stack].reverse().find((item) => { return !item.minimized; });
		FloatingWindow.#stack.forEach((item, index) => {
			item.style.zIndex = index + 1;
			item.active = (item === top);
		});
	}

	static #setInteracting(isInteracting) {
		FloatingWindow.#stack.forEach((item) => { item.toggleAttribute('interacting', isInteracting); });
	}

	constructor() {
		super();
		this.label = '';
		this.icon = '';
		this.type = '';
		this.x = 0;
		this.y = 0;
		this.width = 800;
		this.height = 600;
		this.snap = '';
		this.snapZone = '';
		this.maximized = false;
		this.minimized = false;
		this.active = false;
		this.loading = false;
		this.origin = null;
		this.addEventListener('pointerdown', () => { this.raise(); }, { capture: true });
	}

	connectedCallback() {
		super.connectedCallback();
		this.raise();
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		FloatingWindow.#stack = FloatingWindow.#stack.filter((item) => { return item !== this; });
		FloatingWindow.#restack();
	}

	willUpdate(changed) {
		const wasMinimized = (changed.has('minimized') ? changed.get('minimized') : this.minimized);
		this.#from = (this.hasUpdated && changed.has('maximized') && !wasMinimized && !this.minimized ? this.#getBox() : null);
	}

	firstUpdated() {
		if (this.minimized) {
			return;
		}

		if (this.origin) {
			this.#playMove(this.#getBox(this.origin));
			this.#fade = this.renderRoot.querySelector('.card').animate([{ opacity: 0 }, { opacity: 1 }], REVEAL);
			this.origin = null;
			return;
		}

		this.#fadeIn();
	}

	updated(changed) {
		this.style.transform = (this.maximized ? '' : `translate(${this.x}px, ${this.y}px)`);
		this.style.width = (this.maximized ? '100%' : `${this.width}px`);
		this.style.height = (this.maximized ? '100%' : `${this.height}px`);
		if (this.#from) {
			this.#playMove(this.#from);
		}
		if (changed.has('minimized')) {
			FloatingWindow.#restack();
		}
		if (changed.has('minimized') && changed.get('minimized') !== undefined) {
			if (this.minimized) {
				this.toggleAttribute('hiding', true);
				this.#fadeOut(() => { this.toggleAttribute('hiding', false); });
			} else {
				this.toggleAttribute('hiding', false);
				this.#fadeIn();
			}
		}
		if (changed.has('minimized') || changed.has('maximized') || changed.has('snap') || changed.has('label') || changed.has('active')) {
			this.dispatchEvent(new CustomEvent('window-change', { bubbles: true, composed: true }));
		}
	}

	raise() {
		if (this.hasAttribute('closing')) {
			return;
		}

		if (FloatingWindow.#stack.at(-1) !== this) {
			FloatingWindow.#stack = FloatingWindow.#stack.filter((item) => { return item !== this; });
			FloatingWindow.#stack.push(this);
		}
		if (this.maximized) {
			FloatingWindow.#stack.forEach((item) => {
				if (item !== this && item.maximized) {
					item.minimized = true;
				}
			});
		}
		FloatingWindow.#restack();
	}

	fit() {
		const bounds = this.parentElement;
		if (!bounds) {
			return;
		}

		if (this.snap) {
			Object.assign(this, getSnapRect(this.snap, bounds));
			return;
		}

		this.width = Math.max(MIN_WIDTH, Math.min(this.width, bounds.clientWidth));
		this.height = Math.max(MIN_HEIGHT, Math.min(this.height, bounds.clientHeight));
		this.x = Math.max(0, Math.min(this.x, bounds.clientWidth - this.width));
		this.y = Math.max(0, Math.min(this.y, bounds.clientHeight - this.height));
	}

	minimize() {
		this.minimized = true;
	}

	restore() {
		this.minimized = false;
		this.raise();
	}

	toggleMaximize() {
		this.maximized = !this.maximized;
		this.raise();
	}

	close() {
		if (this.hasAttribute('closing')) {
			return;
		}

		this.toggleAttribute('closing', true);
		FloatingWindow.#stack = FloatingWindow.#stack.filter((item) => { return item !== this; });
		FloatingWindow.#restack();
		this.dispatchEvent(new CustomEvent('window-close', { bubbles: true, composed: true }));
		this.dispatchEvent(new CustomEvent('window-change', { bubbles: true, composed: true }));
		if (this.minimized) {
			this.remove();
			return;
		}

		this.#fadeOut(() => { this.remove(); });
	}

	render() {
		return html`
			<div class="card h-100 overflow-hidden ${classMap({ 'rounded-0': this.maximized, 'border-0': this.maximized, 'shadow': this.active && !this.maximized, 'shadow-opacity-100': this.active && !this.maximized, 'shadow-sm': !this.active && !this.maximized })}">
				${this.maximized ? '' : html`
					<div class="titlebar card-header flex-row align-items-center border-0 py-1 ps-5 pe-1 user-select-none" @pointerdown=${this.#onTitlePointerDown} @dblclick=${this.#onTitleDoubleClick}>
						<small class="fw-bold text-truncate me-auto ${classMap({ 'fg-body': !this.active, 'fg-50': !this.active })}">${this.label}</small>
						<div class="btn-group btn-group-sm">
							<button type="button" class="btn-text theme-secondary border-0" @click=${() => { this.minimize(); }}><i class="icon-solid icon-minus icon-fw"></i></button>
							<button type="button" class="btn-text theme-secondary border-0" @click=${() => { this.toggleMaximize(); }}><i class="icon-regular icon-square icon-fw"></i></button>
							<button type="button" class="btn-text theme-secondary border-0" @click=${() => { this.close(); }}><i class="icon-solid icon-times icon-fw"></i></button>
						</div>
					</div>
				`}
				<div class="card-body position-relative d-flex flex-column overflow-auto p-0">
					<slot></slot>
					${this.loading ? html`
						<div class="loading position-absolute top-0 start-0 d-flex flex-column justify-content-center align-items-center w-100 h-100">
							<div class="loading-icon d-flex justify-content-center align-items-center flex-shrink-0 rounded-5 bg-white fg-body shadow-sm mb-6">
								${this.icon ? html`<img src=${this.icon.includes('/') ? this.icon : `assets/img/${this.type}s/${this.icon}`}>` : html`<i class="icon-light icon-layer-group icon-xl"></i>`}
							</div>
							<div class="spinner-border spinner-sm"></div>
						</div>
					` : ''}
				</div>
			</div>
			${this.snapZone ? this.#renderSnapPreview() : ''}
			${this.maximized ? '' : EDGES.map((edge) => { return html`<div class="handle" data-edge=${edge} @pointerdown=${this.#onHandlePointerDown}></div>`; })}
		`;
	}

	#getBox(rect = this.getBoundingClientRect()) {
		const bounds = this.parentElement.getBoundingClientRect();
		return { x: rect.left - bounds.left, y: rect.top - bounds.top, width: rect.width, height: rect.height };
	}

	#playMove(from) {
		const bounds = this.parentElement;
		const to = (this.maximized ? { x: 0, y: 0, width: bounds.clientWidth, height: bounds.clientHeight } : { x: this.x, y: this.y, width: this.width, height: this.height });
		this.#move?.cancel();
		this.#move = this.animate([
			{ transformOrigin: '0 0', transform: `translate(${from.x}px, ${from.y}px) scale(${from.width / to.width}, ${from.height / to.height})` },
			{ transformOrigin: '0 0', transform: `translate(${to.x}px, ${to.y}px)` }
		], { duration: getMoveDuration(from, to), easing: SPRING });
	}

	#fadeIn() {
		this.#fade?.cancel();
		this.#fade = this.renderRoot.querySelector('.card').animate([HIDDEN, SHOWN], ENTER);
	}

	#fadeOut(onFinish) {
		this.#fade?.cancel();
		this.#fade = this.renderRoot.querySelector('.card').animate([SHOWN, HIDDEN], EXIT);
		this.#fade.onfinish = onFinish;
	}

	#renderSnapPreview() {
		const rect = getSnapRect(this.snapZone, this.parentElement);
		return html`<div class="snap-preview position-absolute pe-none rounded-9 border border-primary bg-primary bg-10" style="left: ${rect.x - this.x}px; top: ${rect.y - this.y}px; width: ${rect.width}px; height: ${rect.height}px;"></div>`;
	}

	#unsnap(start) {
		const size = this.#unsnapped ?? { width: start.width, height: start.height };
		const left = this.parentElement.getBoundingClientRect().left;
		const ratio = (start.pointerX - left - start.x) / start.width;
		start.x = Math.round(start.pointerX - left - ratio * size.width);
		this.width = size.width;
		this.height = size.height;
		this.snap = '';
	}

	#track(event, onMove, onStop) {
		const target = event.currentTarget;
		const start = { pointerX: event.clientX, pointerY: event.clientY, x: this.x, y: this.y, width: this.width, height: this.height };
		const controller = new AbortController();
		const { signal } = controller;
		const stop = (end) => {
			controller.abort();
			FloatingWindow.#setInteracting(false);
			onStop?.(end);
		};
		event.preventDefault();
		target.setPointerCapture(event.pointerId);
		FloatingWindow.#setInteracting(true);
		target.addEventListener('pointermove', (move) => { onMove(move.clientX - start.pointerX, move.clientY - start.pointerY, start, move); }, { signal });
		target.addEventListener('pointerup', stop, { signal });
		target.addEventListener('pointercancel', stop, { signal });
		target.addEventListener('lostpointercapture', stop, { signal });
	}

	#onTitlePointerDown = (event) => {
		if (event.button !== 0 || this.maximized || event.target.closest('button')) {
			return;
		}

		const bounds = this.parentElement;
		this.#track(event, (dx, dy, start, move) => {
			if (this.snap) {
				this.#unsnap(start);
			}
			this.toggleAttribute('dragging', true);
			this.x = start.x + dx;
			this.y = start.y + dy;
			this.snapZone = getSnapZone(move, bounds);
		}, (end) => {
			const zone = this.snapZone;
			this.snapZone = '';
			this.toggleAttribute('dragging', false);
			if (zone !== '' && end.type === 'pointerup') {
				this.#unsnapped = { width: this.width, height: this.height };
				this.snap = zone;
			}
			this.fit();
		});
	};

	#onTitleDoubleClick = (event) => {
		if (event.target.closest('button')) {
			return;
		}

		this.toggleMaximize();
	};

	#onHandlePointerDown = (event) => {
		if (event.button !== 0) {
			return;
		}

		const edge = event.currentTarget.dataset.edge;
		const bounds = this.parentElement;
		this.#track(event, (dx, dy, start) => {
			this.snap = '';
			if (edge.includes('e')) {
				this.width = Math.max(MIN_WIDTH, Math.min(start.width + dx, bounds.clientWidth - start.x));
			}
			if (edge.includes('s')) {
				this.height = Math.max(MIN_HEIGHT, Math.min(start.height + dy, bounds.clientHeight - start.y));
			}
			if (edge.includes('w')) {
				this.x = Math.min(Math.max(start.x + dx, 0), start.x + start.width - MIN_WIDTH);
				this.width = start.x + start.width - this.x;
			}
			if (edge.includes('n')) {
				this.y = Math.min(Math.max(start.y + dy, 0), start.y + start.height - MIN_HEIGHT);
				this.height = start.y + start.height - this.y;
			}
		});
	};
}

customElements.define('u-window', FloatingWindow);

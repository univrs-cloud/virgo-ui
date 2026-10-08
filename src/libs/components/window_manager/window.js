import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from '../styles.js';

const MIN_WIDTH = 320;
const MIN_HEIGHT = 200;
const EDGES = ['n', 'e', 's', 'w', 'ne', 'se', 'sw', 'nw'];
const SNAP_EDGE = 16;
const SNAP_CORNER_SHARE = 0.25;

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
		:host([minimized]) { display: none; }
		:host([interacting]) ::slotted(*) { pointer-events: none; }
		:host([dragging]) .card { background-color: transparent; }
		:host([dragging]) .titlebar { background: linear-gradient(var(--bs-card-cap-bg), var(--bs-card-cap-bg)), var(--bs-card-bg); }
		:host([dragging]) .card-body { opacity: 0.75; }
		:host(:not([maximized])) ::slotted(iframe) { border-radius: 0 0 calc(var(--bs-border-radius-xl) - var(--bs-border-width)) calc(var(--bs-border-radius-xl) - var(--bs-border-width)); }
		.card-body { min-height: 0; }
		.titlebar, .handle { touch-action: none; }
		.titlebar { cursor: move; }
		.snap-preview { z-index: -1; }
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

	updated(changed) {
		this.style.transform = (this.maximized ? '' : `translate(${this.x}px, ${this.y}px)`);
		this.style.width = (this.maximized ? '100%' : `${this.width}px`);
		this.style.height = (this.maximized ? '100%' : `${this.height}px`);
		if (changed.has('minimized')) {
			FloatingWindow.#restack();
		}
		if (changed.has('minimized') || changed.has('maximized') || changed.has('snap') || changed.has('label') || changed.has('active')) {
			this.dispatchEvent(new CustomEvent('window-change', { bubbles: true, composed: true }));
		}
	}

	raise() {
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
		this.dispatchEvent(new CustomEvent('window-close', { bubbles: true, composed: true }));
		this.remove();
	}

	render() {
		return html`
			<div class="card h-100 overflow-hidden ${classMap({ 'rounded-4': !this.maximized, 'rounded-0': this.maximized, 'border-0': this.maximized, 'shadow': this.active && !this.maximized, 'shadow-sm': !this.active && !this.maximized })}">
				${this.maximized ? '' : html`
					<div class="titlebar card-header d-flex align-items-center border-0 py-1 ps-3 pe-1 user-select-none" @pointerdown=${this.#onTitlePointerDown} @dblclick=${this.#onTitleDoubleClick}>
						<small class="fw-bold text-truncate me-auto ${classMap({ 'text-dark': !this.active, 'text-opacity-50': !this.active })}">${this.label}</small>
						<div class="btn-group btn-group-sm">
							<button type="button" class="btn border-0" @click=${() => { this.minimize(); }}><i class="icon-solid icon-minus icon-fw"></i></button>
							<button type="button" class="btn border-0" @click=${() => { this.toggleMaximize(); }}><i class="icon-regular icon-square icon-fw"></i></button>
							<button type="button" class="btn border-0" @click=${() => { this.close(); }}><i class="icon-solid icon-times icon-fw"></i></button>
						</div>
					</div>
				`}
				<div class="card-body position-relative d-flex flex-column overflow-auto p-0">
					<slot></slot>
					${this.loading ? html`
						<div class="position-absolute top-0 start-0 d-flex justify-content-center align-items-center w-100 h-100 bg-body">
							<div class="spinner-border spinner-border-sm me-1"></div>
							Loading...
						</div>
					` : ''}
				</div>
			</div>
			${this.snapZone ? this.#renderSnapPreview() : ''}
			${this.maximized ? '' : EDGES.map((edge) => { return html`<div class="handle" data-edge=${edge} @pointerdown=${this.#onHandlePointerDown}></div>`; })}
		`;
	}

	#renderSnapPreview() {
		const rect = getSnapRect(this.snapZone, this.parentElement);
		return html`<div class="snap-preview position-absolute pe-none rounded-4 border border-primary bg-primary bg-opacity-10" style="left: ${rect.x - this.x}px; top: ${rect.y - this.y}px; width: ${rect.width}px; height: ${rect.height}px;"></div>`;
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

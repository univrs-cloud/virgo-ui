import { LitElement, html, css } from 'lit';

const CASCADE_STEP = 24;
const CASCADE_COUNT = 8;
const FLOATING_SHARE = 0.85;
const LOADING_TIMEOUT = 20000;

export class WindowManager extends LitElement {
	static styles = [css`
		:host { position: fixed; inset: 0; z-index: 1040; display: block; pointer-events: none; }
		@media (max-width: 991.98px) { :host { display: none; } }
	`];

	#counter = 0;

	constructor() {
		super();
		this.addEventListener('window-change', this.#onWindowChange);

		window.windowManager = this;
	}

	connectedCallback() {
		super.connectedCallback();
		window.addEventListener('resize', this.#layout);
		window.addEventListener('blur', this.#onBlur);
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener('resize', this.#layout);
		window.removeEventListener('blur', this.#onBlur);
	}

	get available() {
		return window.matchMedia('(min-width: 992px)').matches;
	}

	get windows() {
		return [...this.querySelectorAll(':scope > u-window')];
	}

	open(options = {}) {
		if (!this.available) {
			return null;
		}

		const url = String(options.url ?? '').toLowerCase();
		const existing = this.windows.find((item) => { return url !== '' && item.dataset.url === url; });
		if (existing) {
			existing.restore();
			return existing;
		}

		this.#layout();
		const item = document.createElement('u-window');
		const width = Math.min(options.width ?? 800, Math.round(this.clientWidth * FLOATING_SHARE));
		const height = Math.min(options.height ?? 600, Math.round(this.clientHeight * FLOATING_SHARE));
		const offset = (this.windows.length % CASCADE_COUNT) * CASCADE_STEP;
		item.id = `window-${++this.#counter}`;
		item.label = options.label ?? '';
		item.icon = options.icon ?? '';
		item.type = options.type ?? '';
		item.maximized = options.maximized ?? true;
		item.minimized = options.minimized ?? false;
		item.width = width;
		item.height = height;
		item.x = Math.max(0, Math.round((this.clientWidth - width) / 2)) + offset;
		item.y = Math.max(0, Math.round((this.clientHeight - height) / 2)) + offset;
		if (options.url) {
			item.dataset.url = url;
			item.dataset.src = options.url;
		}
		this.append(item);
		this.#load(item);
		item.fit();
		return item;
	}

	background() {
		this.windows.forEach((item) => {
			if (item.maximized && !item.minimized) {
				item.minimize();
			}
		});
	}

	closeAll() {
		this.windows.forEach((item) => { item.close(); });
	}

	render() {
		return html`<slot @slotchange=${this.#notify}></slot>`;
	}

	#load(item) {
		if (item.minimized || !item.dataset.src || item.querySelector(':scope > iframe')) {
			return;
		}

		const frame = document.createElement('iframe');
		frame.className = 'flex-grow-1 w-100 border-0';
		frame.allow = 'clipboard-read; clipboard-write; fullscreen';
		frame.src = item.dataset.src;
		frame.addEventListener('load', () => { item.loading = false; }, { once: true });
		setTimeout(() => { item.loading = false; }, LOADING_TIMEOUT);
		item.loading = true;
		item.append(frame);
	}

	#layout = () => {
		this.style.left = `${document.querySelector('main')?.getBoundingClientRect().left ?? 0}px`;
		if (this.available) {
			this.windows.forEach((item) => { item.fit(); });
		}
	};

	#onBlur = () => {
		setTimeout(() => { document.activeElement?.closest?.('u-window')?.raise(); });
	};

	#onWindowChange = (event) => {
		this.#layout();
		this.#load(event.target);
		this.#notify();
	};

	#notify = () => {
		this.dispatchEvent(new CustomEvent('windows-change'));
	};
}

customElements.define('u-window-manager', WindowManager);

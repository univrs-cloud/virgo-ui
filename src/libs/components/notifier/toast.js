import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { sheet } from '../styles.js';

export class Toast extends LitElement {
	static styles = [sheet];

	static properties = {
		toastId: { type: String, reflect: true },
		type: { type: String },
		title: { type: String },
		message: { type: String },
		dismissible: { type: Boolean },
		duration: { type: Number }
	};

	#bsToast = null;
	#hideTimeout = null;
	#abortController = null;

	constructor() {
		super();
		this.type = 'info';
		this.title = '';
		this.message = '';
		this.dismissible = true;
		this.duration = 5000;
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#clearAutoHide();
		// Abort all event listeners
		this.#abortController?.abort();
		this.#bsToast?.dispose();
	}

	firstUpdated() {
		this.#initBootstrapToast();
	}

	updateOptions(options = {}) {
		const durationChanged = options.duration !== undefined && options.duration !== this.duration;
		
		// Update properties
		if (options.type !== undefined) this.type = options.type;
		if (options.title !== undefined) this.title = options.title;
		if (options.message !== undefined) this.message = options.message;
		if (options.dismissible !== undefined) this.dismissible = options.dismissible;
		if (options.duration !== undefined) this.duration = options.duration;
		
		// Only restart auto-hide if duration changed
		if (durationChanged) {
			this.#clearAutoHide();
			if (this.duration > 0) {
				this.#startAutoHide();
			}
		}
		this.requestUpdate();
	}

	hide() {
		this.#bsToast?.hide();
	}

	render() {
		return html`
			<div class="toast ${classMap({ [`bd-${this.#getColorClass()}-500`]: true })} border-0 position-relative overflow-hidden">
				<div class="d-flex">
					<div class="toast-body w-100">
						<strong>${unsafeHTML(this.title)}</strong>
						${unsafeHTML(this.message)}
					</div>
					${this.dismissible ? html`<button type="button" class="btn-close btn-close-white me-2 m-auto" @click=${() => { this.hide(); }}></button>` : ''}
				</div>
			</div>
		`;
	}

	#initBootstrapToast(retryCount = 0) {
		const toastEl = this.renderRoot.querySelector('.toast');
		if (!toastEl) {
			// Element not ready, try again (max 5 retries)
			if (retryCount < 5) {
				setTimeout(() => this.#initBootstrapToast(retryCount + 1), 10);
			}
			return;
		}
		
		// Abort previous event listeners
		this.#abortController?.abort();
		this.#abortController = new AbortController();
		const { signal } = this.#abortController;
		
		// Remove Bootstrap's show class to ensure fresh state
		toastEl.classList.remove('show', 'showing', 'hide');
		
		// Get existing Bootstrap Toast instance if any and dispose it
		const existingInstance = bootstrap.Toast.getInstance(toastEl);
		if (existingInstance) {
			existingInstance.dispose();
		}
		
		// Create Bootstrap Toast WITHOUT autohide - we'll handle it manually
		this.#bsToast = new bootstrap.Toast(toastEl, { autohide: false });
		
		// Attach event listeners with abort signal
		toastEl.addEventListener('hidden.bs.toast', this.#onHidden, { signal });
		toastEl.addEventListener('mouseenter', this.#onMouseEnter, { signal });
		toastEl.addEventListener('mouseleave', this.#onMouseLeave, { signal });
		
		// Show the toast
		this.#bsToast.show();
		
		// Start our own timer if has duration
		if (this.duration > 0) {
			this.#startAutoHide();
		}
	}

	#getColorClass() {
		const colors = {
			success: 'green',
			error: 'red',
			warning: 'orange',
			info: 'blue',
		};
		return colors[this.type] || 'blue';
	}

	#startAutoHide() {
		this.#clearAutoHide();
		// Set hide timeout
		this.#hideTimeout = setTimeout(() => {
			this.#bsToast?.hide();
		}, this.duration);
	}
		
	#clearAutoHide() {
		if (this.#hideTimeout) {
			clearTimeout(this.#hideTimeout);
			this.#hideTimeout = null;
		}
	}

	// Arrow functions for event handlers (auto-bound)
	#onHidden = () => {
		this.dispatchEvent(new CustomEvent('toast-hidden', {
			detail: { id: this.toastId },
			bubbles: true,
			composed: true
		}));
	};
		
	#onMouseEnter = () => {
		this.#clearAutoHide();
	};
		
	#onMouseLeave = () => {
		if (this.duration > 0) {
			this.#startAutoHide();
		}
	};
}

customElements.define('u-toast', Toast);
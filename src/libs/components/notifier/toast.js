import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import { sheet } from "../styles.js";

export class Toast extends LitElement {
	static styles = [sheet];

	static properties = {
		toastId: { type: String, reflect: true },
		type: { type: String },
		title: { type: String },
		message: { type: String },
		dismissible: { type: Boolean },
		duration: { type: Number },
		progress: { state: true },
	};

	#bsToast = null;
	#progressInterval = null;
	#hideTimeout = null;
	#noTransition = false;
	#isPaused = false;
	#remainingTime = 0;
	#startTime = 0;
	#abortController = null;

	constructor() {
		super();
		this.type = 'info';
		this.title = '';
		this.message = '';
		this.dismissible = true;
		this.duration = 5000;
		this.progress = 100;
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#clearAutoHide();
		// Abort all event listeners
		this.#abortController?.abort();
		if (this.#bsToast) {
			this.#bsToast.dispose();
		}
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
		
		const hasDuration = this.duration > 0;
		
		// Only restart auto-hide if duration changed
		if (durationChanged) {
			this.#clearAutoHide();
			if (hasDuration) {
				// Reset progress without transition
				this.#noTransition = true;
				this.progress = 100;
				this.#remainingTime = this.duration;
				
				// Start auto-hide after render
				this.requestUpdate();
				this.updateComplete.then(() => {
					this.#noTransition = false;
					this.#startAutoHide();
				});
			} else {
				// Duration is now 0, just update
				this.requestUpdate();
			}
		} else {
			// No duration change, just update the display
			this.requestUpdate();
		}
	}

	hide() {
		if (this.#bsToast) {
			this.#bsToast.hide();
		}
	}

	render() {
		const colorClass = this.#getColorClass();
		const toastClass = `bd-${colorClass}-500`;
		const progressClass = `bg-${colorClass}-100`;
		const showProgress = this.duration > 0;
		
		return html`
			<div class="toast ${classMap({ [toastClass]: true })} border-0 position-relative overflow-hidden">
				<div class="d-flex">
					<div class="toast-body w-100">
						<strong>${unsafeHTML(this.title)}</strong>
						${unsafeHTML(this.message)}
					</div>
					${this.dismissible ? html`<button type="button" class="btn-close btn-close-white me-2 m-auto" @click=${() => { this.hide(); }}></button>` : ''}
				</div>
				${showProgress ? html` <div class="position-absolute bottom-0 end-0 ${classMap({ [progressClass]: true })}" style="height: 3px; width: ${this.progress}%; ${this.#noTransition ? '' : 'transition: width 0.1s linear;'} border-radius: 0 0 var(--bs-toast-border-radius) var(--bs-toast-border-radius);"></div>` : ''}
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
		this.#bsToast = new bootstrap.Toast(toastEl, {
			autohide: false,
		});
		
		// Attach event listeners with abort signal
		toastEl.addEventListener('hidden.bs.toast', this.#onHidden, { signal });
		toastEl.addEventListener('mouseenter', this.#onMouseEnter, { signal });
		toastEl.addEventListener('mouseleave', this.#onMouseLeave, { signal });
		
		// Show the toast
		this.#bsToast.show();
		
		// Start our own timer and progress if has duration
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
		this.#isPaused = false;
		this.#remainingTime = this.duration;
		this.#startTime = Date.now();
		
		// Start progress animation
		this.#startProgress();
		
		// Set hide timeout
		this.#hideTimeout = setTimeout(() => {
			if (this.#bsToast) {
				this.#bsToast.hide();
			}
		}, this.duration);
		}
		
	#clearAutoHide() {
		if (this.#hideTimeout) {
			clearTimeout(this.#hideTimeout);
			this.#hideTimeout = null;
		}
		this.#stopProgress();
		}
		
	#pauseAutoHide() {
		if (this.#isPaused || !this.#hideTimeout) {
			return;
		}

		this.#isPaused = true;
		
		// Calculate remaining time
		const elapsed = Date.now() - this.#startTime;
		this.#remainingTime = Math.max(0, this.duration - elapsed);
		
		// Clear the timeout
		clearTimeout(this.#hideTimeout);
		this.#hideTimeout = null;
		this.#stopProgress();
	}
		
	#resumeAutoHide() {
		if (!this.#isPaused || this.#remainingTime <= 0) {
			return;
		}

		this.#isPaused = false;
		this.#startTime = Date.now();
		
		// Restart progress from current position
		this.#startProgress();
		
		// Set new timeout with remaining time
		this.#hideTimeout = setTimeout(() => {
			if (this.#bsToast) {
			this.#bsToast.hide();
			}
		}, this.#remainingTime);
	}

	#startProgress() {
		this.#stopProgress();
		const duration = this.#remainingTime || this.duration;
		const startTime = Date.now();
		const endTime = startTime + duration;
		
		this.#progressInterval = setInterval(() => {
			const now = Date.now();
			const remaining = endTime - now;
			this.progress = Math.max(0, (remaining / this.duration) * 100);
			
			if (this.progress <= 0) {
				this.#stopProgress();
			}
		}, 16); // ~60fps for smoother animation
	}
		
	#stopProgress() {
		if (this.#progressInterval) {
			clearInterval(this.#progressInterval);
			this.#progressInterval = null;
		}
	}
		
	#resetProgressInstant() {
		this.#stopProgress();
		// Disable transition temporarily for instant reset
		this.#noTransition = true;
		this.progress = 100;
		this.#remainingTime = this.duration;
		
		// Force synchronous update
		this.requestUpdate();
		
		// Re-enable transition after DOM updates
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				this.#noTransition = false;
			});
		});
	}

	#resetAndStartAutoHide() {
		this.#clearAutoHide();
		this.#startAutoHide();
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
		if (this.duration > 0) {
			this.#resetProgressInstant();
			this.#pauseAutoHide();
		}
	};
		
	#onMouseLeave = () => {
		if (this.duration > 0) {
			this.#resetAndStartAutoHide();
		}
	};
}

customElements.define('u-toast', Toast);